const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('[DB] DATABASE_URL not set — database features disabled');
      return null;
    }
    const isSSL = false; // Railway TCP proxy doesn't support SSL
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ...(isSSL ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) return { rows: [], rowCount: 0 };
  return p.query(text, params);
}

async function testConnection() {
  try {
    const p = getPool();
    if (!p) return false;
    await p.query('SELECT 1');
    console.log('[DB] Connected to PostgreSQL');
    return true;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    return false;
  }
}

module.exports = { getPool, query, testConnection };
