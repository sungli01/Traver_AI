const db = require('./db');

const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/KRW';
const TARGET_CURRENCIES = ['JPY', 'THB', 'VND', 'SGD', 'TWD', 'USD'];
const SIX_HOURS = 6 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

async function refreshExchangeRates() {
  try {
    console.log('[Scheduler] Fetching exchange rates...');
    const res = await fetch(EXCHANGE_API_URL);
    const data = await res.json();
    if (data.result !== 'success') {
      console.error('[Scheduler] Exchange API error:', data);
      return;
    }
    const rates = data.rates;
    for (const cur of TARGET_CURRENCIES) {
      if (rates[cur] !== undefined) {
        await db.query(
          `INSERT INTO exchange_rates (currency, rate_per_krw, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (currency) DO UPDATE SET rate_per_krw = $2, updated_at = NOW()`,
          [cur, rates[cur]]
        );
      }
    }
    console.log('[Scheduler] Exchange rates updated:', TARGET_CURRENCIES.join(', '));
  } catch (err) {
    console.error('[Scheduler] Exchange rate refresh failed:', err.message);
  }
}

async function checkExpiredData() {
  try {
    console.log('[Scheduler] Checking expired data...');
    const result = await db.query(
      `SELECT id, name, city, country, source_urls FROM places WHERE expires_at < NOW() AND (is_stale IS NOT TRUE)`
    );
    const expired = result.rows;
    if (expired.length === 0) {
      console.log('[Scheduler] No expired places found');
      return;
    }
    console.log(`[Scheduler] Found ${expired.length} expired places`);

    // Mark all as stale
    await db.query(`UPDATE places SET is_stale = true WHERE expires_at < NOW() AND (is_stale IS NOT TRUE)`);
    console.log(`[Scheduler] Marked ${expired.length} places as stale`);

    // If Brave key available, try to refresh by city
    const braveKey = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_API_KEY;
    if (braveKey) {
      const cities = [...new Set(expired.map(p => JSON.stringify({ city: p.city, country: p.country })))];
      for (const raw of cities) {
        const { city, country } = JSON.parse(raw);
        try {
          const collector = require('./collector');
          console.log(`[Scheduler] Re-collecting data for ${city}, ${country}...`);
          await collector.collectPlacesForCity(city, country);
          console.log(`[Scheduler] Re-collection complete for ${city}`);
        } catch (err) {
          console.error(`[Scheduler] Re-collection failed for ${city}:`, err.message);
        }
      }
    } else {
      console.log('[Scheduler] No BRAVE_SEARCH_API_KEY — skipping re-collection');
    }
  } catch (err) {
    console.error('[Scheduler] Expiry check failed:', err.message);
  }
}

async function checkTrackedPrices() {
  try {
    const priceTracker = require('./price-tracker');
    await priceTracker.checkAllTrackedPrices();
  } catch (err) {
    console.error('[Scheduler] Price check failed:', err.message);
  }
}

function start() {
  console.log('[Scheduler] Starting...');

  // Exchange rates: immediately + every 6 hours
  refreshExchangeRates();
  setInterval(refreshExchangeRates, SIX_HOURS);

  // Expiry check: 1 minute after start + every 24 hours
  setTimeout(() => {
    checkExpiredData();
    setInterval(checkExpiredData, ONE_DAY);
  }, 60 * 1000);

  // Price tracking: 2 minutes after start + every 6 hours
  setTimeout(() => {
    checkTrackedPrices();
    setInterval(checkTrackedPrices, SIX_HOURS);
  }, 2 * 60 * 1000);

  console.log('[Scheduler] Scheduled: exchange rates (6h), expiry check (24h), price tracking (6h)');
}

module.exports = { start, refreshExchangeRates, checkExpiredData, checkTrackedPrices };
