const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { processAgentRequest, processAgentRequestWithKnowledge, processAgentRequestWithKnowledgeStream, compressContext, detectQueryType } = require('./agents');
const db = require('./db');
const retriever = require('./retriever');
const collector = require('./collector');
const scheduler = require('./scheduler');
const cache = require('./cache');
const directAnswer = require('./direct-answer');
require('dotenv').config();

const priceTracker = require('./price-tracker');
const purchaseApproval = require('./purchase-approval');

const JWT_SECRET = process.env.JWT_SECRET || 'travelagent-ai-secret-key-2026';

// OAuth config
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
  const { message, context, sessionId, goals: clientGoals, type: clientType } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Plan limit check for authenticated users
  let userPlan = 'free';
  const authHeader = req.headers.authorization;
  let authUserId = null;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
      authUserId = decoded.userId;
      const userRes = await db.query('SELECT plan FROM users WHERE id = $1', [authUserId]);
      userPlan = userRes.rows[0]?.plan || 'free';
      const limit = PLAN_LIMITS[userPlan]?.chat;
      if (limit !== undefined && limit !== Infinity) {
        const month = new Date().toISOString().slice(0, 7);
        const usageRes = await db.query(
          'SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = $1 AND action = $2 AND month = $3',
          [authUserId, 'chat', month]
        );
        const used = parseInt(usageRes.rows[0].cnt);
        if (used >= limit) {
          return res.status(403).json({
            error: 'plan_limit',
            message: `이번 달 무료 상담 횟수(${limit}회)를 모두 사용했습니다.`,
            limit, used, plan: userPlan, upgrade: true
          });
        }
      }
    } catch (authErr) {
      // Token verification failed — treat as unauthenticated
      console.warn('[Chat] Auth check failed:', authErr.message);
    }
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

  // Priority context for Pro/Business — pass plan to agent for prompt differentiation
  const extraContext = { plan: userPlan, priority: userPlan !== 'free', planLevel: userPlan, ...(clientType ? { type: clientType } : {}) };

  // ─── 토큰 절약 파이프라인 (비스트리밍 일반 질문에만 적용) ───
  const wantStream = (req.headers.accept || '').includes('text/event-stream');
  const queryType = detectQueryType(message);
  const isSimpleQuery = !wantStream && !/여행|계획|일정|코스|설계|짜줘/.test(message);

  if (isSimpleQuery) {
    // 1. 캐시 확인
    const cached = await cache.get(message, userPlan);
    if (cached) {
      if (authUserId) logUsage(authUserId, 'chat', { source: 'cache', tokens: 0 }).catch(() => {});
      return res.json({ reply: cached, goals: sessionGoals.get(sid), plan: userPlan, source: 'cache' });
    }

    // 2. 정형 질문 직접 응답
    const direct = await directAnswer.handle(message);
    if (direct) {
      await cache.set(message, direct.response, { plan: userPlan, city: direct.city, category: direct.category });
      if (authUserId) logUsage(authUserId, 'chat', { source: 'db', tokens: 0 }).catch(() => {});
      let finalResponse = direct.response;
      if (userPlan === 'free' && finalResponse.length > 100) {
        finalResponse += '\n\n---\n💡 *Pro로 업그레이드하면 더 상세한 정보를 받을 수 있어요!*';
      }
      return res.json({ reply: finalResponse, goals: sessionGoals.get(sid), plan: userPlan, source: 'knowledge_db' });
    }
  }

  // 3. 대화 컨텍스트 압축
  const compressedCtx = compressContext(context);

  if (wantStream) {
    // SSE streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const fullText = await processAgentRequestWithKnowledgeStream(message, compressedCtx, { goals, ...extraContext }, (delta) => {
        res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
      });

      // Extract goals from full response
      const responseGoals = extractGoals(fullText);
      if (responseGoals.length > 0) {
        const updatedGoals = mergeGoals(goals, responseGoals);
        sessionGoals.set(sid, updatedGoals);
      }

      // Log usage
      if (authUserId) logUsage(authUserId, 'chat').catch(() => {});

      res.write(`data: ${JSON.stringify({ type: 'done', reply: fullText, goals: sessionGoals.get(sid) })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('[Chat SSE] error:', err.message);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  } else {
    // Non-streaming (legacy)
    try {
      const response = await processAgentRequestWithKnowledge(message, compressedCtx, { goals, ...extraContext });

      const responseGoals = extractGoals(response);
      if (responseGoals.length > 0) {
        const updatedGoals = mergeGoals(goals, responseGoals);
        sessionGoals.set(sid, updatedGoals);
      }

      // Log usage & cache AI response
      if (authUserId) logUsage(authUserId, 'chat', { source: 'ai' }).catch(() => {});
      // 일정 JSON이 아닌 일반 응답만 캐싱
      if (!response.trim().startsWith('{')) {
        cache.set(message, response, { plan: userPlan }).catch(() => {});
      }

      let finalResponse = response;
      if (userPlan === 'free' && response.length > 100) {
        finalResponse += '

---
💡 *Pro로 업그레이드하면 현지인만 아는 숨겨진 맛집, 구체적인 가격 정보, 시간대별 추천 등 더 상세한 정보를 받을 수 있어요!*';
      }

      res.json({ reply: finalResponse, goals: sessionGoals.get(sid), plan: userPlan });
    } catch (err) {
      console.error('[Chat] error:', err.message);
      res.status(500).json({ error: 'AI 응답 생성 중 오류가 발생했습니다.' });
    }
  }
});

// ─── Exchange Rates ───
app.get('/api/exchange-rates', async (req, res) => {
  try {
    const result = await db.query('SELECT currency, rate_per_krw, updated_at FROM exchange_rates ORDER BY currency');
    res.json({ rates: result.rows });
  } catch (err) {
    console.error('[API] exchange-rates error:', err.message);
    res.json({ rates: [], error: 'Exchange rates not available' });
  }
});

// ── City Guide API ──────────────────────────────────────────
app.get('/api/cities', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM city_info ORDER BY city');
    res.json(result.rows);
  } catch (err) {
    console.error('[API] cities error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/city/:cityName', async (req, res) => {
  try {
    const { cityName } = req.params;
    const [cityInfo, places, routes, rates] = await Promise.all([
      db.query('SELECT * FROM city_info WHERE city ILIKE $1', [cityName]),
      db.query('SELECT * FROM places WHERE city ILIKE $1 ORDER BY trust_score DESC, rating DESC', [cityName]),
      db.query('SELECT * FROM routes WHERE from_city ILIKE $1 OR to_city ILIKE $1 ORDER BY cost_krw ASC NULLS LAST', [cityName]),
      db.query('SELECT * FROM exchange_rates'),
    ]);

    // Events query with fallback (start_date column may not exist)
    let events = { rows: [] };
    try {
      // Try to detect actual columns
      const colRes = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('start_date','event_date','date','created_at')");
      const cols = colRes.rows.map(r => r.column_name);
      const orderCol = cols.includes('start_date') ? 'start_date' : cols.includes('event_date') ? 'event_date' : cols.includes('date') ? 'date' : 'created_at';
      events = await db.query(`SELECT * FROM events WHERE city ILIKE $1 ORDER BY ${orderCol} ASC NULLS LAST`, [cityName]);
    } catch (e) {
      console.warn('[API] events query fallback:', e.message);
      try { events = await db.query('SELECT * FROM events WHERE city ILIKE $1', [cityName]); } catch (_) {}
    }

    const info = cityInfo.rows[0] || null;
    const country = info?.country || (places.rows[0]?.country) || null;

    // find matching exchange rate
    let exchangeRate = null;
    if (info?.currency && rates.rows.length) {
      exchangeRate = rates.rows.find(r => info.currency.includes(r.currency)) || null;
    }

    res.json({
      info,
      places: places.rows,
      routes: routes.rows,
      events: events.rows,
      exchangeRate,
      country,
    });
  } catch (err) {
    console.error('[API] city detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
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
  const COLLECT_TIMEOUT_MS = 60000;
  try {
    const { city, country, fromCity, toCity } = req.body;
    let result = {};

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Collection timed out after 60s')), COLLECT_TIMEOUT_MS)
    );

    const collectWork = async () => {
      if (city && country) {
        const saved = await collector.collectPlacesForCity(city, country);
        result.places = saved;
      }
      if (fromCity && toCity) {
        const saved = await collector.collectRoutes(fromCity, toCity);
        result.routes = saved;
      }
      return result;
    };

    await Promise.race([collectWork(), timeoutPromise]);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[API] collect error:', err.message);
    const status = err.message.includes('timed out') ? 504 : 500;
    res.status(status).json({ error: err.message });
  }
});

// ─── Plan Limits Config ───
const PLAN_LIMITS = {
  free: { chat: 5, itinerary_create: 2, price_track: 0 },
  pro: { chat: Infinity, itinerary_create: Infinity, price_track: 10 },
  business: { chat: Infinity, itinerary_create: Infinity, price_track: Infinity },
};

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

// ─── Admin Middleware ───
function adminMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: '인증이 필요합니다' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    // Check admin role
    db.query('SELECT role FROM users WHERE id = $1', [decoded.userId]).then(result => {
      const role = result.rows[0]?.role || 'user';
      if (role !== 'admin') return res.status(403).json({ error: '관리자 권한이 필요합니다' });
      next();
    }).catch(() => res.status(500).json({ error: '서버 오류' }));
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
}

// ─── Plan Limit Middleware ───
function planLimitMiddleware(action) {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      const userRes = await db.query('SELECT plan FROM users WHERE id = $1', [userId]);
      const plan = userRes.rows[0]?.plan || 'free';
      req.userPlan = plan;

      const limit = PLAN_LIMITS[plan]?.[action];
      if (limit === undefined || limit === Infinity) return next();

      const month = new Date().toISOString().slice(0, 7);
      const usageRes = await db.query(
        'SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = $1 AND action = $2 AND month = $3',
        [userId, action, month]
      );
      const used = parseInt(usageRes.rows[0].cnt);

      if (used >= limit) {
        return res.status(403).json({
          error: 'plan_limit',
          limit,
          used,
          plan,
          upgrade: true,
          message: `${plan} 플랜의 ${action} 월간 한도(${limit}회)를 초과했습니다.`,
        });
      }
      req.usageUsed = used;
      return next();
    } catch (err) {
      console.error('[PlanLimit] error:', err.message);
      return next(); // fail open
    }
  };
}

async function logUsage(userId, action, meta = {}) {
  const month = new Date().toISOString().slice(0, 7);
  const source = meta.source || 'ai';
  const tokens = meta.tokens || 0;
  await db.query(
    'INSERT INTO usage_logs (user_id, action, month, source, tokens_used) VALUES ($1, $2, $3, $4, $5)',
    [userId, action, month, source, tokens]
  );
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
    if (!user.password_hash) return res.status(401).json({ error: '소셜 로그인으로 가입된 계정입니다' });
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
    const result = await db.query('SELECT id, email, name, plan, plan_expires_at, created_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    const user = result.rows[0];
    user.plan = user.plan || 'free';
    res.json({ user });
  } catch (err) {
    console.error('[Auth] me error:', err.message);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── OAuth Config (tells frontend which providers are available) ───
app.get('/api/auth/oauth-config', (req, res) => {
  res.json({
    google: !!GOOGLE_CLIENT_ID,
    kakao: !!KAKAO_CLIENT_ID,
  });
});

// ─── Google OAuth ───
app.get('/api/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(501).json({ error: 'Google OAuth not configured' });
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/#/login?error=no_code`);

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.redirect(`${FRONTEND_URL}/#/login?error=token_failed`);

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json();

    // Find or create user
    const { token } = await findOrCreateOAuthUser('google', profile.id, profile.email, profile.name);
    res.redirect(`${FRONTEND_URL}/#/oauth-callback?token=${token}`);
  } catch (err) {
    console.error('[OAuth] Google callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/#/login?error=oauth_failed`);
  }
});

// ─── 카카오 OAuth ───
app.get('/api/auth/kakao', (req, res) => {
  if (!KAKAO_CLIENT_ID) return res.status(501).json({ error: 'Kakao OAuth not configured' });
  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/kakao/callback`,
    response_type: 'code',
  });
  res.redirect(`https://kauth.kakao.com/oauth/authorize?${params}`);
});

app.get('/api/auth/kakao/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/#/login?error=no_code`);

    // Exchange code for tokens
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        client_secret: KAKAO_CLIENT_SECRET || '',
        redirect_uri: `${BACKEND_URL}/api/auth/kakao/callback`,
        code,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.redirect(`${FRONTEND_URL}/#/login?error=token_failed`);

    // Get user info
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json();
    const kakaoEmail = profile.kakao_account?.email || `kakao_${profile.id}@kakao.local`;
    const kakaoName = profile.kakao_account?.profile?.nickname || profile.properties?.nickname || '카카오 사용자';

    const { token } = await findOrCreateOAuthUser('kakao', String(profile.id), kakaoEmail, kakaoName);
    res.redirect(`${FRONTEND_URL}/#/oauth-callback?token=${token}`);
  } catch (err) {
    console.error('[OAuth] Kakao callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/#/login?error=oauth_failed`);
  }
});

// ─── OAuth Helper ───
async function findOrCreateOAuthUser(provider, oauthId, email, name) {
  // Check if OAuth account already linked
  let result = await db.query(
    'SELECT id, email, name FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
    [provider, oauthId]
  );
  let user;
  if (result.rows.length > 0) {
    user = result.rows[0];
  } else {
    // Check if email already exists (link account)
    result = await db.query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      user = result.rows[0];
      await db.query('UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3', [provider, oauthId, user.id]);
    } else {
      // Create new user (no password for OAuth users)
      result = await db.query(
        'INSERT INTO users (email, password_hash, name, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, created_at',
        [email, '', name, provider, oauthId]
      );
      user = result.rows[0];
    }
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { user, token };
}

// ─── Usage & Plan Endpoints ───
app.get('/api/user/usage', authMiddleware, async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const userRes = await db.query('SELECT plan FROM users WHERE id = $1', [req.userId]);
    const plan = userRes.rows[0]?.plan || 'free';
    const usageRes = await db.query(
      'SELECT action, COUNT(*) as count FROM usage_logs WHERE user_id = $1 AND month = $2 GROUP BY action',
      [req.userId, month]
    );
    const usage = {};
    for (const row of usageRes.rows) {
      usage[row.action] = parseInt(row.count);
    }
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    res.json({ plan, month, usage, limits });
  } catch (err) {
    console.error('[Usage] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/plan', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'business'].includes(plan)) {
      return res.status(400).json({ error: '유효하지 않은 플랜입니다' });
    }
    const expiresAt = plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.query('UPDATE users SET plan = $1, plan_expires_at = $2 WHERE id = $3', [plan, expiresAt, req.userId]);
    res.json({ success: true, plan, plan_expires_at: expiresAt });
  } catch (err) {
    console.error('[Plan] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Endpoints ───
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('[Admin] users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/sessions', adminMiddleware, (req, res) => {
  res.json({ activeSessions: sessionGoals.size });
});

// ─── Admin Stats Endpoints ───
app.get('/api/admin/stats/daily', adminMiddleware, async (req, res) => {
  try {
    const signups = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date
    `);
    const chats = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM chat_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date
    `);
    res.json({ signups: signups.rows, chats: chats.rows });
  } catch (err) {
    console.error('[Admin] daily stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats/destinations', adminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT destination_city as city, COUNT(*) as count
      FROM chat_logs
      WHERE destination_city IS NOT NULL AND destination_city != ''
      GROUP BY destination_city ORDER BY count DESC LIMIT 10
    `);
    res.json({ destinations: result.rows });
  } catch (err) {
    console.error('[Admin] destinations error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats/revenue', adminMiddleware, async (req, res) => {
  try {
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const total = parseInt(userCount.rows[0].count) || 0;
    // Mock revenue data based on user count
    const proSubscribers = Math.floor(total * 0.12);
    const bizSubscribers = Math.floor(total * 0.03);
    const mrr = proSubscribers * 9900 + bizSubscribers * 29900;
    const conversionRate = total > 0 ? ((proSubscribers + bizSubscribers) / total * 100).toFixed(1) : 0;
    res.json({ totalUsers: total, proSubscribers, bizSubscribers, mrr, conversionRate });
  } catch (err) {
    console.error('[Admin] revenue error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats/funnel', adminMiddleware, async (req, res) => {
  try {
    const [signups, firstChat, itinerary, confirmed, revisit] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM users"),
      db.query("SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE action = 'first_chat'"),
      db.query("SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE action = 'itinerary_created'"),
      db.query("SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE action = 'trip_confirmed'"),
      db.query("SELECT COUNT(DISTINCT user_id) as count FROM user_activity WHERE action = 'revisit'"),
    ]);
    res.json({
      funnel: [
        { stage: '가입', count: parseInt(signups.rows[0].count) },
        { stage: '첫 상담', count: parseInt(firstChat.rows[0].count) },
        { stage: '일정 생성', count: parseInt(itinerary.rows[0].count) },
        { stage: '확정', count: parseInt(confirmed.rows[0].count) },
        { stage: '재방문', count: parseInt(revisit.rows[0].count) },
      ]
    });
  } catch (err) {
    console.error('[Admin] funnel error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Token Usage Stats ───
app.get('/api/admin/stats/token-usage', adminMiddleware, async (req, res) => {
  try {
    const [bySource, daily, totalTokens] = await Promise.all([
      db.query(`
        SELECT source, COUNT(*) as count, SUM(tokens_used) as total_tokens
        FROM usage_logs WHERE action = 'chat' AND month = $1
        GROUP BY source
      `, [new Date().toISOString().slice(0, 7)]),
      db.query(`
        SELECT DATE(created_at) as date, source, COUNT(*) as count
        FROM usage_logs WHERE action = 'chat' AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), source ORDER BY date
      `),
      db.query(`SELECT SUM(tokens_used) as total FROM usage_logs WHERE action = 'chat' AND month = $1`, [new Date().toISOString().slice(0, 7)]),
    ]);
    const cacheHitRate = bySource.rows.reduce((acc, r) => {
      acc[r.source || 'ai'] = parseInt(r.count);
      return acc;
    }, {});
    const totalReqs = Object.values(cacheHitRate).reduce((a, b) => a + b, 0);
    const aiReqs = cacheHitRate.ai || 0;
    const savedPct = totalReqs > 0 ? (((totalReqs - aiReqs) / totalReqs) * 100).toFixed(1) : 0;

    res.json({
      month: new Date().toISOString().slice(0, 7),
      bySource: bySource.rows,
      daily: daily.rows,
      totalTokens: parseInt(totalTokens.rows[0]?.total || 0),
      totalRequests: totalReqs,
      aiRequests: aiReqs,
      savedPercentage: parseFloat(savedPct),
    });
  } catch (err) {
    console.error('[Admin] token-usage error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats/activity', adminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT EXTRACT(HOUR FROM created_at)::int as hour, EXTRACT(DOW FROM created_at)::int as dow, COUNT(*) as count
      FROM user_activity
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY hour, dow ORDER BY dow, hour
    `);
    res.json({ activity: result.rows });
  } catch (err) {
    console.error('[Admin] activity error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Event Tracking ───
app.post('/api/track-event', async (req, res) => {
  try {
    const { userId, action } = req.body;
    if (!action) return res.status(400).json({ error: 'action required' });
    await db.query('INSERT INTO user_activity (user_id, action, created_at) VALUES ($1, $2, NOW())', [userId || null, action]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Track] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Price Tracking Endpoints ───
app.post('/api/price-track/extract-items', async (req, res) => {
  try {
    const { tripData } = req.body;
    if (!tripData) return res.status(400).json({ error: 'tripData required' });
    const items = priceTracker.extractTrackableItems(tripData);
    res.json({ success: true, items });
  } catch (err) {
    console.error('[API] price-track extract-items error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/price-track/start', async (req, res) => {
  try {
    const { tripId, tripData, selectedItems, notificationChannels } = req.body;
    if (!tripId || !tripData) return res.status(400).json({ error: 'tripId and tripData required' });
    // Save notification channels preference (stored in memory for now)
    if (notificationChannels) {
      console.log(`[PriceTracker] Notification channels for trip ${tripId}:`, notificationChannels);
    }
    const results = await priceTracker.trackPrices(tripId, tripData, selectedItems);
    res.json({ success: true, items: results });
  } catch (err) {
    console.error('[API] price-track start error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/price-track/:tripId', async (req, res) => {
  try {
    const prices = await priceTracker.getLatestPrices(req.params.tripId);
    res.json({ tripId: req.params.tripId, prices });
  } catch (err) {
    console.error('[API] price-track status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/price-track/:tripId/history', async (req, res) => {
  try {
    const history = await priceTracker.getPriceHistory(req.params.tripId);
    res.json({ tripId: req.params.tripId, history });
  } catch (err) {
    console.error('[API] price-track history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Purchase Approval Endpoints ───
app.post('/api/purchase/approve/:requestId', async (req, res) => {
  try {
    const result = await purchaseApproval.approvePurchase(parseInt(req.params.requestId));
    res.json({ success: true, request: result });
  } catch (err) {
    console.error('[API] purchase approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchase/reject/:requestId', async (req, res) => {
  try {
    const result = await purchaseApproval.rejectPurchase(parseInt(req.params.requestId));
    res.json({ success: true, request: result });
  } catch (err) {
    console.error('[API] purchase reject error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/purchase/pending', async (req, res) => {
  try {
    const requests = await purchaseApproval.getPendingRequests();
    res.json({ requests });
  } catch (err) {
    console.error('[API] purchase pending error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/purchase/history', async (req, res) => {
  try {
    const history = await purchaseApproval.getPurchaseHistory();
    res.json({ history });
  } catch (err) {
    console.error('[API] purchase history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ─── API Key Endpoints (Business only) ───
app.post('/api/apikeys', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT plan FROM users WHERE id = ', [req.userId]);
    const plan = userRes.rows[0]?.plan || 'free';
    if (plan !== 'business') return res.status(403).json({ error: 'Business 플랜 전용 기능입니다' });
    
    const { name } = req.body;
    const crypto = require('crypto');
    const apiKey = 'ta_' + crypto.randomUUID().replace(/-/g, '');
    await db.query('INSERT INTO api_keys (user_id, api_key, name) VALUES (, , )', [req.userId, apiKey, name || 'Default']);
    res.json({ success: true, apiKey, name: name || 'Default' });
  } catch (err) {
    console.error('[APIKey] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/apikeys', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, api_key, name, created_at, last_used_at, is_active FROM api_keys WHERE user_id =  ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ keys: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/apikeys/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM api_keys WHERE id =  AND user_id = ', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Team Endpoints (Business / Pro) ───
app.get('/api/team', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tm.id, tm.member_email, tm.role, tm.invited_at, tm.accepted_at, u.name as member_name
       FROM team_members tm LEFT JOIN users u ON tm.member_id = u.id
       WHERE tm.owner_id =  ORDER BY tm.invited_at DESC`,
      [req.userId]
    );
    res.json({ members: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/team/invite', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT plan FROM users WHERE id = ', [req.userId]);
    const plan = userRes.rows[0]?.plan || 'free';
    
    const maxMembers = plan === 'business' ? 999 : plan === 'pro' ? 3 : 0;
    if (maxMembers === 0) return res.status(403).json({ error: '팀 기능은 Pro 이상 플랜에서 사용 가능합니다' });
    
    const countRes = await db.query('SELECT COUNT(*) as cnt FROM team_members WHERE owner_id = ', [req.userId]);
    if (parseInt(countRes.rows[0].cnt) >= maxMembers) {
      return res.status(403).json({ error: `${plan} 플랜의 팀원 한도(${maxMembers}명)에 도달했습니다` });
    }
    
    const { email } = req.body;
    const memberRes = await db.query('SELECT id FROM users WHERE email = ', [email]);
    const memberId = memberRes.rows[0]?.id || null;
    
    await db.query(
      'INSERT INTO team_members (owner_id, member_email, member_id) VALUES (, , ) ON CONFLICT (owner_id, member_email) DO NOTHING',
      [req.userId, email, memberId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Trip Sharing Endpoints ───
app.post('/api/trips/:tripId/share', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { email, permission } = req.body;
    if (!email) return res.status(400).json({ error: '공유할 이메일을 입력해주세요' });

    const userRes = await db.query('SELECT plan FROM users WHERE id = $1', [req.userId]);
    const plan = userRes.rows[0]?.plan || 'free';
    const maxShares = plan === 'business' ? Infinity : plan === 'pro' ? 3 : 0;
    if (maxShares === 0) return res.status(403).json({ error: '팀 공유는 Pro 이상 플랜에서 사용 가능합니다' });

    const countRes = await db.query('SELECT COUNT(*) as cnt FROM team_shares WHERE trip_id = $1 AND owner_id = $2', [tripId, req.userId]);
    if (parseInt(countRes.rows[0].cnt) >= maxShares) {
      return res.status(403).json({ error: `${plan} 플랜의 공유 인원 한도(${maxShares}명)에 도달했습니다` });
    }

    const memberRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    const sharedWithId = memberRes.rows[0]?.id || null;

    await db.query(
      'INSERT INTO team_shares (trip_id, owner_id, shared_with_email, shared_with_id, permission) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      [tripId, req.userId, email, sharedWithId, permission || 'view']
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Share] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trips/:tripId/shared', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ts.id, ts.shared_with_email, ts.shared_with_id, ts.permission, ts.created_at, u.name as shared_with_name
       FROM team_shares ts LEFT JOIN users u ON ts.shared_with_id = u.id
       WHERE ts.trip_id = $1 AND ts.owner_id = $2 ORDER BY ts.created_at DESC`,
      [req.params.tripId, req.userId]
    );
    res.json({ members: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trips/:tripId/share/:shareId', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM team_shares WHERE id = $1 AND owner_id = $2', [req.params.shareId, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shared-trips', authMiddleware, async (req, res) => {
  try {
    const userEmail = await db.query('SELECT email FROM users WHERE id = $1', [req.userId]);
    const email = userEmail.rows[0]?.email;
    if (!email) return res.json({ trips: [] });

    const result = await db.query(
      `SELECT ts.trip_id, ts.permission, ts.created_at, u.name as owner_name, u.email as owner_email
       FROM team_shares ts JOIN users u ON ts.owner_id = u.id
       WHERE ts.shared_with_email = $1 OR ts.shared_with_id = $2
       ORDER BY ts.created_at DESC`,
      [email, req.userId]
    );
    res.json({ trips: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/team/:id', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM team_members WHERE id =  AND owner_id = ', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      // Add OAuth columns if not exist
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50)`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255)`);
      // Allow null password for OAuth users
      await db.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`).catch(() => {});
      // Role column for admin access
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
      // Set first user as admin
      await db.query(`UPDATE users SET role = 'admin' WHERE id = 1 AND role = 'user'`).catch(() => {});
      // Plan & usage columns
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free'`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP`);
      await db.query(`
        CREATE TABLE IF NOT EXISTS usage_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action VARCHAR(50) NOT NULL,
          month VARCHAR(7) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      // API keys table for Business plan
      await db.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          api_key VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(100) DEFAULT 'Default',
          created_at TIMESTAMP DEFAULT NOW(),
          last_used_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true
        )
      `);
      // Team members table for Business plan
      await db.query(`
        CREATE TABLE IF NOT EXISTS team_members (
          id SERIAL PRIMARY KEY,
          owner_id INTEGER REFERENCES users(id),
          member_email VARCHAR(255) NOT NULL,
          member_id INTEGER REFERENCES users(id),
          role VARCHAR(20) DEFAULT 'member',
          invited_at TIMESTAMP DEFAULT NOW(),
          accepted_at TIMESTAMP,
          UNIQUE(owner_id, member_email)
        )
      `);
      // Team shares table for trip sharing
      await db.query(`
        CREATE TABLE IF NOT EXISTS team_shares (
          id SERIAL PRIMARY KEY,
          trip_id TEXT NOT NULL,
          owner_id INTEGER REFERENCES users(id),
          shared_with_email VARCHAR(255),
          shared_with_id INTEGER REFERENCES users(id),
          permission VARCHAR(20) DEFAULT 'view',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('[DB] plan & usage_logs & api_keys & team_members & team_shares ready');
      console.log('[DB] users table ready (with OAuth columns)');

      // Price tracking tables
      await db.query(`
        CREATE TABLE IF NOT EXISTS price_history (
          id SERIAL PRIMARY KEY,
          trip_id TEXT NOT NULL,
          item_type TEXT NOT NULL,
          item_name TEXT NOT NULL,
          price INTEGER NOT NULL,
          currency TEXT DEFAULT 'KRW',
          source TEXT DEFAULT 'simulation',
          checked_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS purchase_requests (
          id SERIAL PRIMARY KEY,
          trip_id TEXT NOT NULL,
          item_type TEXT NOT NULL,
          item_name TEXT NOT NULL,
          destination TEXT,
          travel_date TEXT,
          current_price INTEGER NOT NULL,
          predicted_low INTEGER,
          recommendation TEXT,
          status TEXT DEFAULT 'pending_approval',
          user_response TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP,
          purchased_at TIMESTAMP
        )
      `);
      console.log('[DB] price_history & purchase_requests tables ready');

      // chat_logs & user_activity tables
      await db.query(`
        CREATE TABLE IF NOT EXISTS chat_logs (
          id SERIAL PRIMARY KEY,
          session_id TEXT,
          user_id INTEGER REFERENCES users(id),
          message TEXT,
          destination_city TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_activity (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          action TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('[DB] chat_logs & user_activity tables ready');

      // city_info table for city guide feature
      await db.query(`
        CREATE TABLE IF NOT EXISTS city_info (
          id SERIAL PRIMARY KEY,
          city VARCHAR(100) UNIQUE NOT NULL,
          country VARCHAR(100) NOT NULL,
          overview TEXT,
          population VARCHAR(50),
          area VARCHAR(50),
          language VARCHAR(100),
          timezone VARCHAR(50),
          currency VARCHAR(50),
          visa_info TEXT,
          best_season TEXT,
          weather_summary JSONB,
          transport_info JSONB,
          local_tips TEXT[],
          price_index JSONB,
          image_url TEXT,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('[DB] city_info table ready');

      // Response cache table
      await db.query(`
        CREATE TABLE IF NOT EXISTS response_cache (
          id SERIAL PRIMARY KEY,
          query_hash VARCHAR(64) UNIQUE,
          query_normalized TEXT,
          response TEXT,
          city TEXT,
          category VARCHAR(50),
          hits INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP
        )
      `);
      // Precompiled answers table
      await db.query(`
        CREATE TABLE IF NOT EXISTS precompiled_answers (
          id SERIAL PRIMARY KEY,
          city VARCHAR(100),
          category VARCHAR(50),
          answer TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(city, category)
        )
      `);
      // Add token tracking columns to usage_logs
      await db.query(`ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0`);
      await db.query(`ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'ai'`);
      console.log('[DB] response_cache & precompiled_answers & usage tracking ready');

      // Seed city_info if empty
      const cityCount = await db.query('SELECT COUNT(*) as c FROM city_info');
      if (parseInt(cityCount.rows[0].c) === 0) {
        try {
          const { seed: seedCityInfo } = require('./seed-city-info');
          await seedCityInfo();
        } catch(e) { console.error('[DB] city_info seed error:', e.message); }
      }

      // Seed demo data if tables are empty
      const chatCount = await db.query('SELECT COUNT(*) as c FROM chat_logs');
      if (parseInt(chatCount.rows[0].c) === 0) {
        console.log('[DB] Seeding demo data...');
        const cities = ['도쿄', '오사카', '방콕', '다낭', '파리', '런던', '제주', '서울', '타이베이', '싱가포르', '하노이', '발리'];
        const actions = ['first_chat', 'itinerary_created', 'trip_confirmed', 'share_used', 'revisit'];
        const inserts = [];
        for (let d = 29; d >= 0; d--) {
          const numChats = Math.floor(Math.random() * 8) + 2;
          for (let i = 0; i < numChats; i++) {
            const hour = Math.floor(Math.random() * 24);
            const city = cities[Math.floor(Math.random() * cities.length)];
            inserts.push(db.query(
              `INSERT INTO chat_logs (session_id, message, destination_city, created_at) VALUES ($1, $2, $3, NOW() - INTERVAL '${d} days' + INTERVAL '${hour} hours')`,
              ['sess_' + Math.random().toString(36).slice(2, 8), city + ' 여행 추천해주세요', city]
            ));
          }
          const numActs = Math.floor(Math.random() * 6) + 1;
          for (let i = 0; i < numActs; i++) {
            const hour = Math.floor(Math.random() * 24);
            const action = actions[Math.floor(Math.random() * actions.length)];
            inserts.push(db.query(
              `INSERT INTO user_activity (action, created_at) VALUES ($1, NOW() - INTERVAL '${d} days' + INTERVAL '${hour} hours')`,
              [action]
            ));
          }
        }
        await Promise.all(inserts);
        console.log('[DB] Demo data seeded');
      }
    } catch (err) {
      console.error('[DB] table creation error:', err.message);
    }
  } else {
    console.warn('[DB] Knowledge DB not available — running without DB');
  }
}
initDB();

app.listen(PORT, () => {
  console.log(`SVI Backend running on port ${PORT}`);
  scheduler.start();

  // Precompile popular city answers (non-blocking)
  setTimeout(async () => {
    try {
      const { precompileAll } = require('./precompile');
      await precompileAll();
    } catch (e) {
      console.error('[Precompile] Startup error:', e.message);
    }
  }, 5000);

  // Cache cleanup every 6 hours
  setInterval(() => {
    cache.cleanup().catch(() => {});
  }, 6 * 60 * 60 * 1000);
});
