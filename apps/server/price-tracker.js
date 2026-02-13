const { Anthropic } = require('@anthropic-ai/sdk');
const db = require('./db');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * AI 기반 가격 예측 요청
 */
async function getAIPricePrediction(itemType, itemName, destination, travelDate) {
  try {
    const prompt = `You are a travel price prediction AI. Given the following travel item, provide a realistic price estimate in KRW.

Item Type: ${itemType} (${itemType === 'flight' ? '항공권' : '호텔'})
Item Name: ${itemName}
Destination: ${destination}
Travel Date: ${travelDate}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "currentPrice": <integer, current realistic price in KRW>,
  "predictedLow": <integer, predicted lowest price in KRW within next 2 weeks>,
  "confidence": <float 0-1, confidence level>,
  "recommendation": "<string, Korean recommendation message>",
  "buyNow": <boolean, true if current price is near predicted low>
}

Base your estimates on realistic Korean travel market prices. For flights from Korea (Incheon), consider typical airline pricing. For hotels, consider the destination and typical nightly rates. Add ±15% natural variation.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in AI response');
  } catch (err) {
    console.error('[PriceTracker] AI prediction failed:', err.message);
    // Fallback: generate simulated prices
    const basePrice = itemType === 'flight' ? 350000 : 120000;
    const variation = Math.random() * 0.3 - 0.15; // ±15%
    const currentPrice = Math.round(basePrice * (1 + variation));
    const predictedLow = Math.round(currentPrice * (0.8 + Math.random() * 0.1));
    return {
      currentPrice,
      predictedLow,
      confidence: 0.6,
      recommendation: '시뮬레이션 데이터입니다. AI 예측을 사용할 수 없어 기본값을 제공합니다.',
      buyNow: currentPrice <= predictedLow * 1.05,
    };
  }
}

/**
 * 여행 데이터에서 항공/호텔 항목 추출
 */
function extractTrackableItems(tripData) {
  const items = [];
  const destination = tripData.destination || '';
  const period = tripData.period || '';

  // Extract flights from activities with category 'transport' containing flight-related keywords
  if (tripData.days) {
    for (const day of tripData.days) {
      for (const activity of (day.activities || [])) {
        if (activity.category === 'transport' && /항공|비행|flight|인천|공항/.test(activity.title)) {
          items.push({
            type: 'flight',
            name: activity.title,
            destination,
            travelDate: day.date || period,
          });
        }
      }
      // Extract hotel from accommodation
      if (day.accommodation && day.accommodation.name) {
        items.push({
          type: 'hotel',
          name: day.accommodation.name,
          destination,
          travelDate: day.date || period,
        });
      }
    }
  }

  // If no items found, create generic ones based on destination
  if (items.length === 0 && destination) {
    items.push({
      type: 'flight',
      name: `인천 → ${destination} 항공편`,
      destination,
      travelDate: period,
    });
    items.push({
      type: 'hotel',
      name: `${destination} 호텔`,
      destination,
      travelDate: period,
    });
  }

  // Deduplicate by name
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

/**
 * 가격 추적 시작 — 즉시 1회 체크 수행
 */
async function trackPrices(tripId, tripData) {
  const items = extractTrackableItems(tripData);
  const results = [];

  for (const item of items) {
    const prediction = await getAIPricePrediction(
      item.type, item.name, item.destination, item.travelDate
    );

    // Save to price_history
    try {
      await db.query(
        `INSERT INTO price_history (trip_id, item_type, item_name, price, currency, source, checked_at)
         VALUES ($1, $2, $3, $4, 'KRW', 'ai_simulation', NOW())`,
        [tripId, item.type, item.name, prediction.currentPrice]
      );
    } catch (err) {
      console.error('[PriceTracker] DB save failed:', err.message);
    }

    // If buyNow, create purchase request
    if (prediction.buyNow) {
      try {
        const { createPurchaseRequest } = require('./purchase-approval');
        await createPurchaseRequest(tripId, {
          type: item.type,
          name: item.name,
          destination: item.destination,
          travelDate: item.travelDate,
          currentPrice: prediction.currentPrice,
          predictedLow: prediction.predictedLow,
          recommendation: prediction.recommendation,
        });
      } catch (err) {
        console.error('[PriceTracker] Purchase request creation failed:', err.message);
      }
    }

    results.push({
      ...item,
      ...prediction,
    });
  }

  return results;
}

/**
 * 특정 여행의 최신 가격 조회
 */
async function getLatestPrices(tripId) {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (item_type, item_name) 
        item_type, item_name, price, currency, source, checked_at
       FROM price_history 
       WHERE trip_id = $1 
       ORDER BY item_type, item_name, checked_at DESC`,
      [tripId]
    );
    return result.rows;
  } catch (err) {
    console.error('[PriceTracker] getLatestPrices error:', err.message);
    return [];
  }
}

/**
 * 가격 이력 조회
 */
async function getPriceHistory(tripId) {
  try {
    const result = await db.query(
      `SELECT item_type, item_name, price, currency, source, checked_at
       FROM price_history 
       WHERE trip_id = $1 
       ORDER BY checked_at DESC
       LIMIT 100`,
      [tripId]
    );
    return result.rows;
  } catch (err) {
    console.error('[PriceTracker] getPriceHistory error:', err.message);
    return [];
  }
}

/**
 * 스케줄러에서 호출: 모든 추적 중인 여행의 가격 체크
 */
async function checkAllTrackedPrices() {
  try {
    console.log('[PriceTracker] Running scheduled price check...');
    // Get distinct trip_ids from price_history (= actively tracked trips)
    const result = await db.query(
      `SELECT DISTINCT trip_id FROM price_history`
    );
    
    for (const row of result.rows) {
      // We don't have full trip data in DB, so do a simulated re-check
      // Get the items we've tracked before
      const items = await db.query(
        `SELECT DISTINCT ON (item_type, item_name) item_type, item_name
         FROM price_history WHERE trip_id = $1
         ORDER BY item_type, item_name, checked_at DESC`,
        [row.trip_id]
      );

      for (const item of items.rows) {
        const prediction = await getAIPricePrediction(
          item.item_type, item.item_name, '', ''
        );

        await db.query(
          `INSERT INTO price_history (trip_id, item_type, item_name, price, currency, source, checked_at)
           VALUES ($1, $2, $3, $4, 'KRW', 'ai_simulation', NOW())`,
          [row.trip_id, item.item_type, item.item_name, prediction.currentPrice]
        );

        if (prediction.buyNow) {
          // Check if there's already a pending request for this item
          const existing = await db.query(
            `SELECT id FROM purchase_requests 
             WHERE trip_id = $1 AND item_name = $2 AND status = 'pending_approval'`,
            [row.trip_id, item.item_name]
          );
          if (existing.rows.length === 0) {
            const { createPurchaseRequest } = require('./purchase-approval');
            await createPurchaseRequest(row.trip_id, {
              type: item.item_type,
              name: item.item_name,
              destination: '',
              travelDate: '',
              currentPrice: prediction.currentPrice,
              predictedLow: prediction.predictedLow,
              recommendation: prediction.recommendation,
            });
          }
        }
      }
    }
    console.log('[PriceTracker] Scheduled price check complete');
  } catch (err) {
    console.error('[PriceTracker] Scheduled check failed:', err.message);
  }
}

module.exports = {
  trackPrices,
  getLatestPrices,
  getPriceHistory,
  checkAllTrackedPrices,
  extractTrackableItems,
};
