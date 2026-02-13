const db = require('./db');
const collector = require('./collector');

const MIN_PLACES_THRESHOLD = 20;

async function getPlacesForCity(city, options = {}) {
  const { category, minTrust, limit = 50 } = options;
  let sql = 'SELECT * FROM places WHERE city = $1';
  const params = [city];
  let idx = 2;

  if (category) {
    sql += ` AND category = $${idx++}`;
    params.push(category);
  }
  if (minTrust) {
    sql += ` AND trust_score >= $${idx++}`;
    params.push(minTrust);
  }
  sql += ` AND (expires_at IS NULL OR expires_at > NOW())`;
  sql += ` ORDER BY trust_score DESC NULLS LAST, rating DESC NULLS LAST LIMIT $${idx}`;
  params.push(limit);

  const result = await db.query(sql, params);

  // If insufficient data, try collecting
  if (result.rows.length < MIN_PLACES_THRESHOLD) {
    // Extract country from existing data or default
    const countryResult = await db.query('SELECT DISTINCT country FROM places WHERE city = $1 LIMIT 1', [city]);
    const country = countryResult.rows[0]?.country || '';
    
    if (country || options.country) {
      try {
        await collector.collectPlacesForCity(city, country || options.country);
        // Re-query after collection
        return (await db.query(sql, params)).rows;
      } catch (err) {
        console.error('[Retriever] Collection failed:', err.message);
      }
    }
  }
  return result.rows;
}

async function getRoutesForCities(from, to) {
  const result = await db.query(
    'SELECT * FROM routes WHERE from_city = $1 AND to_city = $2 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY cost_krw ASC NULLS LAST',
    [from, to]
  );

  if (result.rows.length === 0) {
    try {
      await collector.collectRoutes(from, to);
      return (await db.query(
        'SELECT * FROM routes WHERE from_city = $1 AND to_city = $2 ORDER BY cost_krw ASC NULLS LAST',
        [from, to]
      )).rows;
    } catch (err) {
      console.error('[Retriever] Route collection failed:', err.message);
    }
  }
  return result.rows;
}

async function getEventsForCity(city, month) {
  let sql = 'SELECT * FROM events WHERE city = $1';
  const params = [city];
  if (month) {
    sql += ' AND start_month <= $2 AND end_month >= $2';
    params.push(month);
  }
  sql += ' AND (expires_at IS NULL OR expires_at > NOW())';
  return (await db.query(sql, params)).rows;
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatPlaceLine(p, idx) {
  let line = `${idx}. ${p.name}`;
  if (p.name_local) line += ` (${p.name_local})`;
  if (p.admission_fee) line += ` | 입장료: ${p.admission_fee}`;
  else if (p.avg_cost) line += ` | 비용: ₩${Number(p.avg_cost).toLocaleString()}`;
  if (p.address) line += ` | 주소: ${p.address}`;
  // Format hours
  if (p.hours) {
    const h = typeof p.hours === 'string' ? JSON.parse(p.hours) : p.hours;
    const sample = h.mon || h.tue || h.checkin;
    if (sample) {
      if (h.checkin) line += ` | 체크인: ${h.checkin} / 체크아웃: ${h.checkout || ''}`;
      else line += ` | 운영: ${sample}`;
    }
  }
  if (p.phone) line += ` | ☎ ${p.phone}`;
  if (p.lat && p.lng) line += ` | lat:${p.lat} lng:${p.lng}`;
  if (p.rating) line += ` | ⭐${p.rating}`;
  if (p.signature?.length) line += ` | 시그니처: ${p.signature.join(', ')}`;
  if (p.description) line += `\n   → ${p.description}`;
  return line;
}

async function buildContext(city, country, budget, days) {
  const places = await getPlacesForCity(city, { country });

  if (places.length === 0) return '';

  // Shuffle within categories for diversity
  const attractions = shuffle(places.filter(p => p.category === 'attraction'));
  const restaurants = shuffle(places.filter(p => p.category === 'restaurant'));
  const hotels = shuffle(places.filter(p => p.category === 'hotel'));
  const activities = shuffle(places.filter(p => p.category === 'activity'));
  const shopping = shuffle(places.filter(p => p.category === 'shopping'));

  let ctx = `\n\n[검증된 장소 데이터 — 반드시 이 가격과 정보를 그대로 사용하라. 데이터에 없는 가격을 만들어내지 마라.]\n`;
  ctx += `## ${city} 검증 데이터 (${places.length}개 장소)\n\n`;

  let idx = 1;

  if (attractions.length > 0) {
    ctx += `### 관광지/명소\n`;
    for (const a of attractions.slice(0, 10)) {
      ctx += formatPlaceLine(a, idx++) + '\n';
    }
  }

  if (activities.length > 0) {
    ctx += `\n### 액티비티/체험\n`;
    for (const a of activities.slice(0, 5)) {
      ctx += formatPlaceLine(a, idx++) + '\n';
    }
  }

  if (restaurants.length > 0) {
    ctx += `\n### 맛집/식당\n`;
    for (const r of restaurants.slice(0, 8)) {
      ctx += formatPlaceLine(r, idx++) + '\n';
    }
  }

  if (hotels.length > 0) {
    ctx += `\n### 숙소\n`;
    for (const h of hotels.slice(0, 5)) {
      ctx += formatPlaceLine(h, idx++) + '\n';
    }
  }

  if (shopping.length > 0) {
    ctx += `\n### 쇼핑/시장\n`;
    for (const s of shopping.slice(0, 4)) {
      ctx += formatPlaceLine(s, idx++) + '\n';
    }
  }

  // 환율 정보 추가
  try {
    const ratesResult = await db.query('SELECT currency, rate_per_krw, updated_at FROM exchange_rates');
    if (ratesResult.rows.length > 0) {
      ctx += `\n### 환율\n`;
      for (const r of ratesResult.rows) {
        const krwPerUnit = r.rate_per_krw > 0 ? (1 / r.rate_per_krw).toFixed(2) : '?';
        ctx += `- 1 ${r.currency} = ${krwPerUnit} KRW\n`;
      }
    }
  } catch (err) { /* ignore */ }

  ctx += `\n⚠️ 위 데이터의 입장료, 가격, 좌표, 주소는 실제 검증된 정보이다. 반드시 그대로 사용하고, 임의로 변경하거나 만들어내지 마라.\n`;
  return ctx;
}

module.exports = { getPlacesForCity, getRoutesForCities, getEventsForCity, buildContext };
