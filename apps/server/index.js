const express = require('express');
const cors = require('cors');
const { processAgentRequest, processAgentRequestWithKnowledge } = require('./agents');
const db = require('./db');
const retriever = require('./retriever');
const collector = require('./collector');
const scheduler = require('./scheduler');
require('dotenv').config();

const app = express();
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight 요청 허용

app.use(express.json());

// Session-based travel goals tracking
const sessionGoals = new Map(); // Map<sessionId, string[]>

const GOAL_KEYWORDS = [
  '골프', '액티비티', '맛집', '쇼핑', '관광', '힐링', '비즈니스', '자연',
  '문화체험', '역사탐방', '스노클링', '다이빙', '서핑', '트레킹', '하이킹',
  '온천', '스키', '와인', '미식', '사진', '럭셔리', '가성비', '배낭여행',
  '커플', '가족', '효도', '신혼', '모험', '휴양', '축제', '공연', '뮤지컬',
  '카페', '바다', '산', '섬', '사찰', '유적지', '박물관', '미술관', '테마파크',
];

function extractGoals(text) {
  const found = [];
  const lower = text.toLowerCase();
  for (const kw of GOAL_KEYWORDS) {
    if (lower.includes(kw)) found.push(kw);
  }
  return found;
}

function mergeGoals(existing, newGoals) {
  const set = new Set(existing);
  for (const g of newGoals) set.add(g);
  return [...set];
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: 'concierge' });
});

app.post('/api/chat', async (req, res) => {
  const { message, context, sessionId, goals: clientGoals } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Manage session goals
  const sid = sessionId || 'default';
  let goals = sessionGoals.get(sid) || [];

  // Merge client-provided goals
  if (clientGoals && Array.isArray(clientGoals)) {
    goals = mergeGoals(goals, clientGoals);
  }

  // Extract goals from user message
  const newGoals = extractGoals(message);
  if (newGoals.length > 0) {
    goals = mergeGoals(goals, newGoals);
  }
  sessionGoals.set(sid, goals);

  const response = await processAgentRequestWithKnowledge(message, context, { goals });
  
  // Extract any new goals from AI response
  const responseGoals = extractGoals(response);
  if (responseGoals.length > 0) {
    const updatedGoals = mergeGoals(goals, responseGoals);
    sessionGoals.set(sid, updatedGoals);
  }

  res.json({ reply: response, goals: sessionGoals.get(sid) });
});

// Knowledge DB API endpoints
app.get('/api/knowledge/places', async (req, res) => {
  try {
    const { city, category, minTrust, country } = req.query;
    if (!city) return res.status(400).json({ error: 'city parameter required' });
    const places = await retriever.getPlacesForCity(city, { category, minTrust: minTrust ? parseInt(minTrust) : undefined, country });
    res.json({ city, count: places.length, places });
  } catch (err) {
    console.error('[API] places error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/knowledge/stats', async (req, res) => {
  try {
    const [places, routes, events, logs] = await Promise.all([
      db.query('SELECT COUNT(*) as count, COUNT(DISTINCT city) as cities FROM places'),
      db.query('SELECT COUNT(*) as count FROM routes'),
      db.query('SELECT COUNT(*) as count FROM events'),
      db.query('SELECT COUNT(*) as count FROM collection_log'),
    ]);
    res.json({
      places: { total: parseInt(places.rows[0].count), cities: parseInt(places.rows[0].cities) },
      routes: parseInt(routes.rows[0].count),
      events: parseInt(events.rows[0].count),
      collections: parseInt(logs.rows[0].count),
    });
  } catch (err) {
    console.error('[API] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/knowledge/collect', async (req, res) => {
  try {
    const { city, country, fromCity, toCity } = req.body;
    let result = {};
    if (city && country) {
      const saved = await collector.collectPlacesForCity(city, country);
      result.places = saved;
    }
    if (fromCity && toCity) {
      const saved = await collector.collectRoutes(fromCity, toCity);
      result.routes = saved;
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[API] collect error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;

// Test DB connection on startup
db.testConnection().then(ok => {
  if (ok) console.log('[DB] Knowledge DB ready');
  else console.warn('[DB] Knowledge DB not available — running without DB');
});

app.listen(PORT, () => {
  console.log(`SVI Backend running on port ${PORT}`);
  scheduler.start();
});
