const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { processAgentRequest, processAgentRequestWithKnowledge } = require('./agents');
const db = require('./db');
const retriever = require('./retriever');
const collector = require('./collector');
const scheduler = require('./scheduler');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'travelagent-ai-secret-key-2026';

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

// ─── Auth Middleware ───
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: '인증이 필요합니다' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
}

// ─── Auth Endpoints ───
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: '모든 필드를 입력해주세요' });
    if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다' });
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: '이미 등록된 이메일입니다' });
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, password_hash, name]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error('[Auth] register error:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at }, token });
  } catch (err) {
    console.error('[Auth] login error:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[Auth] me error:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── Admin Endpoints ───
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('[Admin] users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/sessions', (req, res) => {
  res.json({ activeSessions: sessionGoals.size });
});

const PORT = process.env.PORT || 4000;

// Create users table & test DB connection on startup
async function initDB() {
  const ok = await db.testConnection();
  if (ok) {
    console.log('[DB] Knowledge DB ready');
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('[DB] users table ready');
    } catch (err) {
      console.error('[DB] users table creation error:', err.message);
    }
  } else {
    console.warn('[DB] Knowledge DB not available — running without DB');
  }
}
initDB();

app.listen(PORT, () => {
  console.log(`SVI Backend running on port ${PORT}`);
  scheduler.start();
});
