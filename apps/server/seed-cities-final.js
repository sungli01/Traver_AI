/**
 * 250+ Cities Seed Script for city_info table
 * Usage: node seed-cities-final.js
 * Idempotent: safe to run multiple times (UPSERT)
 */
const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://travel:tr4vel_kn0wledge_2024@caboose.proxy.rlwy.net:53741/travel_knowledge';
const pool = new Pool({ connectionString: DATABASE_URL, connectionTimeoutMillis: 10000 });

function w(jan,apr,jul,oct){return JSON.stringify({"1월":jan,"4월":apr,"7월":jul,"10월":oct})}
function t(airport,local){return JSON.stringify({airport,local:JSON.parse(local)})}
function p(meal,coffee,hotel_avg){return JSON.stringify({meal,coffee,hotel_avg})}

// Load city data from separate file
const mainCities = require('./seed-cities-300-data.js');
const restCities = require('./seed-cities-rest.js');
const allCities = [...mainCities, ...restCities];

// Deduplicate by city name & normalize transport_info
const seen = new Set();
const cities = allCities.filter(c => {
  if (seen.has(c.city)) return false;
  seen.add(c.city);
  return true;
}).map(c => {
  // Normalize transport_info: ensure local is array not string
  if (c.transport_info) {
    try {
      const ti = JSON.parse(c.transport_info);
      if (typeof ti.local === 'string') {
        ti.local = JSON.parse(ti.local);
      }
      c.transport_info = JSON.stringify(ti);
    } catch(e) {}
  }
  return c;
});

async function seed() {
  console.log(`Seeding ${cities.length} cities...`);
  
  // Ensure table exists
  await pool.query(`
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

  let success = 0, fail = 0;
  
  for (let i = 0; i < cities.length; i += 10) {
    const batch = cities.slice(i, i + 10);
    const promises = batch.map(c => 
      pool.query(`
        INSERT INTO city_info (city, country, overview, population, area, language, timezone, currency, visa_info, best_season, weather_summary, transport_info, local_tips, price_index, image_url, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
        ON CONFLICT (city) DO UPDATE SET
          country=EXCLUDED.country, overview=EXCLUDED.overview, population=EXCLUDED.population,
          area=EXCLUDED.area, language=EXCLUDED.language, timezone=EXCLUDED.timezone,
          currency=EXCLUDED.currency, visa_info=EXCLUDED.visa_info, best_season=EXCLUDED.best_season,
          weather_summary=EXCLUDED.weather_summary, transport_info=EXCLUDED.transport_info,
          local_tips=EXCLUDED.local_tips, price_index=EXCLUDED.price_index, updated_at=NOW()
      `, [
        c.city, c.country, c.overview, c.population, c.area, c.language, c.timezone, c.currency,
        c.visa_info, c.best_season, c.weather_summary, c.transport_info, c.local_tips, c.price_index, c.image_url
      ]).then(() => { success++; }).catch(e => { fail++; console.error(`  ✗ ${c.city}: ${e.message}`); })
    );
    await Promise.all(promises);
    process.stdout.write(`\r  Progress: ${Math.min(i+10, cities.length)}/${cities.length}`);
  }
  
  console.log(`\n✅ Done! Success: ${success}, Failed: ${fail}, Total unique: ${cities.length}`);
  
  // Verify
  const count = await pool.query('SELECT COUNT(*) as c FROM city_info');
  console.log(`📊 city_info table now has ${count.rows[0].c} cities`);
  
  await pool.end();
}

seed().catch(e => { console.error('Seed error:', e); process.exit(1); });
