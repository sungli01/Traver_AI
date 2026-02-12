const db = require('./db');
const { Anthropic } = require('@anthropic-ai/sdk');

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_API_KEY;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Trust scores by domain
function getTrustScore(url) {
  if (!url) return 2;
  const domain = url.toLowerCase();
  if (domain.includes('tripadvisor') || domain.includes('google.com/maps')) return 4;
  if (domain.includes('naver.com') || domain.includes('kakao')) return 3;
  if (domain.includes('lonely') || domain.includes('michelin')) return 4;
  return 2;
}

// TTL by category
function getExpiresAt(category) {
  const now = new Date();
  const days = { restaurant: 90, attraction: 180, hotel: 60, shopping: 90 };
  const d = days[category] || 120;
  return new Date(now.getTime() + d * 86400000).toISOString();
}

async function braveSearch(query) {
  if (!BRAVE_API_KEY) {
    console.warn('[Collector] No Brave Search API key — skipping search');
    return [];
  }
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': BRAVE_API_KEY }
    });
    const data = await resp.json();
    return (data.web?.results || []).map(r => ({
      title: r.title, url: r.url, description: r.description
    }));
  } catch (err) {
    console.error('[Collector] Brave search error:', err.message);
    return [];
  }
}

async function extractPlacesWithAI(searchResults, city, country, category) {
  if (!searchResults.length) return [];
  const prompt = `다음 검색 결과에서 ${city}(${country})의 ${category} 정보를 추출해주세요.
각 장소에 대해 JSON 배열로 반환:
[{ "name": "장소명", "name_local": "현지어명(있으면)", "category": "${category}", "lat": 위도, "lng": 경도, "description": "설명(2-3문장)", "signature": ["시그니처 메뉴/특징"], "avg_cost": 예상비용(원화), "rating": 평점(1-5), "tags": ["태그"], "best_season": ["추천시즌"] }]

검색 결과:
${searchResults.map(r => `- ${r.title}: ${r.description}`).join('\n')}

JSON 배열만 출력 (코드블록 없이):`;

  try {
    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });
    const text = resp.content[0].text.trim();
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (err) {
    console.error('[Collector] AI extraction error:', err.message);
    return [];
  }
}

async function savePlaces(places, city, country, sourceUrls) {
  let saved = 0;
  for (const p of places) {
    try {
      // Duplicate check by name + city
      const existing = await db.query(
        'SELECT id FROM places WHERE name = $1 AND city = $2', [p.name, city]
      );
      if (existing.rows.length > 0) continue;

      await db.query(`
        INSERT INTO places (name, name_local, city, country, category, lat, lng, description, 
          signature, avg_cost, rating, tags, best_season, source_urls, trust_score, expires_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [p.name, p.name_local || null, city, country, p.category || 'attraction',
         p.lat || null, p.lng || null, p.description || null,
         p.signature || [], p.avg_cost || null, p.rating || null,
         p.tags || [], p.best_season || [],
         sourceUrls || [], getTrustScore(sourceUrls?.[0]),
         getExpiresAt(p.category || 'attraction')]
      );
      saved++;
    } catch (err) {
      console.error('[Collector] Save error for', p.name, ':', err.message);
    }
  }
  return saved;
}

async function collectPlacesForCity(city, country) {
  const categories = [
    { cat: 'restaurant', queries: [`${city} 맛집 추천 2024`, `${city} best restaurants`] },
    { cat: 'attraction', queries: [`${city} 관광지 best`, `${city} top attractions`] },
    { cat: 'hotel', queries: [`${city} 호텔 추천`, `${city} best hotels`] },
  ];

  let totalSaved = 0;
  for (const { cat, queries } of categories) {
    for (const q of queries) {
      const results = await braveSearch(q);
      if (!results.length) continue;

      const places = await extractPlacesWithAI(results, city, country, cat);
      const sourceUrls = results.map(r => r.url);
      const saved = await savePlaces(places, city, country, sourceUrls);
      totalSaved += saved;

      // Log collection
      await db.query(
        'INSERT INTO collection_log (query, source, results_count) VALUES ($1, $2, $3)',
        [q, 'brave', saved]
      );
    }
  }
  return totalSaved;
}

async function collectRoutes(fromCity, toCity) {
  const queries = [`${fromCity} to ${toCity} transport`, `${fromCity} ${toCity} 교통편`];
  let totalSaved = 0;

  for (const q of queries) {
    const results = await braveSearch(q);
    if (!results.length) continue;

    try {
      const prompt = `다음 검색 결과에서 ${fromCity}→${toCity} 교통편 정보를 추출해주세요.
JSON 배열로 반환: [{ "transport": "비행기/기차/버스", "carrier": "운항사", "duration_min": 소요시간(분), "cost_krw": 원화비용, "frequency": "운행빈도", "tips": "팁" }]

검색 결과:
${results.map(r => `- ${r.title}: ${r.description}`).join('\n')}

JSON 배열만 출력:`;

      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });
      const text = resp.content[0].text.trim();
      const match = text.match(/\[[\s\S]*\]/);
      const routes = match ? JSON.parse(match[0]) : [];

      for (const r of routes) {
        const existing = await db.query(
          'SELECT id FROM routes WHERE from_city=$1 AND to_city=$2 AND transport=$3 AND carrier=$4',
          [fromCity, toCity, r.transport, r.carrier]
        );
        if (existing.rows.length > 0) continue;

        await db.query(`INSERT INTO routes (from_city, to_city, transport, carrier, duration_min, cost_krw, frequency, tips, source_url, expires_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [fromCity, toCity, r.transport, r.carrier || null, r.duration_min || null,
           r.cost_krw || null, r.frequency || null, r.tips || null,
           results[0]?.url || null, new Date(Date.now() + 60 * 86400000).toISOString()]
        );
        totalSaved++;
      }

      await db.query('INSERT INTO collection_log (query, source, results_count) VALUES ($1,$2,$3)', [q, 'brave', totalSaved]);
    } catch (err) {
      console.error('[Collector] Route extraction error:', err.message);
    }
  }
  return totalSaved;
}

async function searchAndCollect(query) {
  const results = await braveSearch(query);
  await db.query('INSERT INTO collection_log (query, source, results_count) VALUES ($1,$2,$3)', [query, 'brave', results.length]);
  return results;
}

module.exports = { collectPlacesForCity, collectRoutes, searchAndCollect };
