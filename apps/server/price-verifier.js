/**
 * price-verifier.js — Brave Search 기반 실시간 가격 검증
 * 
 * DB의 장소 가격이 없거나 3개월 이상 오래된 경우 Brave Search로 최신 가격을 수집하여 DB에 저장.
 */
const db = require('./db');

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const PRICE_FRESHNESS_MS = 90 * 24 * 60 * 60 * 1000; // 3 months

async function searchBrave(query) {
  if (!BRAVE_API_KEY) {
    console.warn('[PriceVerifier] BRAVE_SEARCH_API_KEY not set');
    return null;
  }
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&search_lang=ko`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': BRAVE_API_KEY }
    });
    if (!res.ok) {
      console.error(`[PriceVerifier] Brave API ${res.status}: ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('[PriceVerifier] Brave search error:', err.message);
    return null;
  }
}

function extractPrice(searchResults) {
  if (!searchResults?.web?.results) return null;
  
  const pricePatterns = [
    /입장료[:\s]*(?:성인[:\s]*)?([₩\d,]+원?)/,
    /(?:성인|어른)[:\s]*([₩\d,]+원?)/,
    /([₩\d,]+)\s*원/,
    /(\d{1,3}(?:,\d{3})*)\s*원/,
    /무료/,
  ];

  for (const result of searchResults.web.results) {
    const text = (result.title || '') + ' ' + (result.description || '');
    
    if (/무료|free/i.test(text) && /입장/i.test(text)) {
      return '무료';
    }
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[0] === '무료') return '무료';
        const price = match[1] || match[0];
        return price.replace(/[^\d,₩원]/g, '') || price;
      }
    }
  }
  return null;
}

/**
 * Verify and update prices for places in a city
 * @param {string} city 
 * @param {Array} places - array of place rows from DB
 * @returns {Object} map of place_id -> verified price string
 */
async function verifyPrices(city, places) {
  if (!BRAVE_API_KEY) {
    console.log('[PriceVerifier] No API key, skipping price verification');
    return {};
  }

  const now = Date.now();
  const stale = places.filter(p => {
    if (p.admission_fee && p.last_price_verified) {
      return (now - new Date(p.last_price_verified).getTime()) > PRICE_FRESHNESS_MS;
    }
    // Attractions without admission_fee need verification
    return p.category === 'attraction' && !p.admission_fee;
  });

  if (stale.length === 0) {
    console.log(`[PriceVerifier] All ${city} prices are fresh`);
    return {};
  }

  console.log(`[PriceVerifier] Verifying ${stale.length} stale prices for ${city}`);
  const verified = {};

  for (const place of stale.slice(0, 10)) { // Max 10 searches per call
    try {
      const query = `${place.name} ${city} 입장료 가격 2025`;
      const results = await searchBrave(query);
      const price = extractPrice(results);

      if (price) {
        verified[place.id] = price;
        // Update DB
        await db.query(
          'UPDATE places SET admission_fee = $1, last_price_verified = NOW() WHERE id = $2',
          [price, place.id]
        );
        // Save snapshot
        const costKrw = price === '무료' ? 0 : parseInt(price.replace(/[^\d]/g, '')) || null;
        if (costKrw !== null) {
          await db.query(
            'INSERT INTO cost_snapshots (place_id, item, cost_krw, recorded_at) VALUES ($1, $2, $3, NOW())',
            [place.id, 'admission', costKrw]
          );
        }
        console.log(`  ✓ ${place.name}: ${price}`);
      }

      // Rate limit: 1 req per second
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ✗ ${place.name}: ${err.message}`);
    }
  }

  return verified;
}

module.exports = { verifyPrices, searchBrave, extractPrice };
