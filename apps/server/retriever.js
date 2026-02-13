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

async function buildContext(city, country, budget, days) {
  const places = await getPlacesForCity(city, { country });
  const restaurants = places.filter(p => p.category === 'restaurant');
  const attractions = places.filter(p => p.category === 'attraction');
  const hotels = places.filter(p => p.category === 'hotel');

  if (places.length === 0) return '';

  let ctx = `\n\n## 📊 ${city} Knowledge DB 데이터 (${places.length}개 장소)\n\n`;

  if (restaurants.length > 0) {
    ctx += `### 🍽️ 맛집 (${restaurants.length}개)\n`;
    for (const r of restaurants.slice(0, 10)) {
      ctx += `- **${r.name}**${r.name_local ? ` (${r.name_local})` : ''}: ${r.description || ''}`;
      if (r.signature?.length) ctx += ` | 시그니처: ${r.signature.join(', ')}`;
      if (r.avg_cost) ctx += ` | ~${r.avg_cost}원`;
      if (r.rating) ctx += ` | ⭐${r.rating}`;
      if (r.lat && r.lng) ctx += ` | 📍${r.lat},${r.lng}`;
      ctx += '\n';
    }
  }

  if (attractions.length > 0) {
    ctx += `\n### 🏛️ 관광지 (${attractions.length}개)\n`;
    for (const a of attractions.slice(0, 10)) {
      ctx += `- **${a.name}**: ${a.description || ''}`;
      if (a.avg_cost) ctx += ` | ~${a.avg_cost}원`;
      if (a.lat && a.lng) ctx += ` | 📍${a.lat},${a.lng}`;
      ctx += '\n';
    }
  }

  if (hotels.length > 0) {
    ctx += `\n### 🏨 숙소 (${hotels.length}개)\n`;
    for (const h of hotels.slice(0, 5)) {
      ctx += `- **${h.name}**: ${h.description || ''}`;
      if (h.avg_cost) ctx += ` | ~${h.avg_cost}원/박`;
      if (h.rating) ctx += ` | ⭐${h.rating}`;
      ctx += '\n';
    }
  }

  // 환율 정보 추가
  try {
    const ratesResult = await db.query('SELECT currency, rate_per_krw, updated_at FROM exchange_rates');
    if (ratesResult.rows.length > 0) {
      ctx += `\n### 💱 현재 환율\n`;
      for (const r of ratesResult.rows) {
        const krwPerUnit = r.rate_per_krw > 0 ? (1 / r.rate_per_krw).toFixed(2) : '?';
        ctx += `- 1 ${r.currency} = ${krwPerUnit} KRW\n`;
      }
      const updated = ratesResult.rows[0].updated_at;
      if (updated) ctx += `> 환율 기준: ${new Date(updated).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n`;
    }
  } catch (err) {
    // exchange_rates 테이블 없어도 무시
  }

  ctx += `\n> 위 데이터는 Knowledge DB에서 조회한 실제 검증된 정보입니다. 이 데이터를 우선적으로 활용하여 일정을 구성하세요.\n`;
  return ctx;
}

module.exports = { getPlacesForCity, getRoutesForCities, getEventsForCity, buildContext };
