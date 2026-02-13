/**
 * Seed script for Travel Knowledge DB
 * Loads all seed-data files and inserts into PostgreSQL
 * Usage: node seed.js
 */
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://travel:tr4vel_kn0wledge_2024@caboose.proxy.rlwy.net:53741/travel_knowledge';

const pool = new Pool({ connectionString: DATABASE_URL });

// Load all seed data files
const files = [
  require('./seed-data'),          // Tokyo, Osaka, Fukuoka
  require('./seed-data-kyoto'),    // Kyoto
  require('./seed-data-bangkok'),  // Bangkok
  require('./seed-data-danang'),   // Da Nang
  require('./seed-data-hanoi'),    // Hanoi
  require('./seed-data-singapore'),// Singapore
  require('./seed-data-taipei'),   // Taipei
  require('./seed-data-jeju'),     // Jeju
];

// Normalize: seed-data.js might export { places, routes, events } or just an array
function normalize(data) {
  if (Array.isArray(data)) return { places: data, routes: [], events: [] };
  return { places: data.places || [], routes: data.routes || [], events: data.events || [] };
}

async function seedPlaces(allPlaces) {
  let inserted = 0, skipped = 0;
  for (const p of allPlaces) {
    try {
      const existing = await pool.query(
        'SELECT id FROM places WHERE name = $1 AND city = $2', [p.name, p.city]
      );
      if (existing.rows.length > 0) { skipped++; continue; }

      await pool.query(`
        INSERT INTO places (name, name_local, city, country, category, lat, lng, description,
          signature, avg_cost, currency_local, cost_local, rating, review_count, hours, closed_days,
          reservation, tags, best_season, source_urls, trust_score, collected_at, expires_at, is_verified)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW(),NOW() + INTERVAL '6 months',false)`,
        [
          p.name, p.name_local || null, p.city, p.country, p.category || 'restaurant',
          p.lat || null, p.lng || null, p.description || null,
          p.signature || null, p.avg_cost || null, p.currency_local || null, p.cost_local || null,
          p.rating || null, p.review_count || null, p.hours ? JSON.stringify(p.hours) : null,
          p.closed_days || null, p.reservation || false,
          p.tags || null, p.best_season || null, p.source_urls || null, p.trust_score || 3
        ]
      );
      inserted++;
    } catch (e) {
      console.error(`  Error inserting place "${p.name}":`, e.message);
    }
  }
  console.log(`Places: ${inserted} inserted, ${skipped} skipped`);
}

async function seedRoutes(allRoutes) {
  let inserted = 0, skipped = 0;
  for (const r of allRoutes) {
    try {
      const existing = await pool.query(
        'SELECT id FROM routes WHERE from_city = $1 AND to_city = $2 AND transport = $3 AND carrier = $4',
        [r.from_city, r.to_city, r.transport, r.carrier]
      );
      if (existing.rows.length > 0) { skipped++; continue; }

      await pool.query(`
        INSERT INTO routes (from_city, to_city, transport, carrier, duration_min, cost_krw, cost_local, currency, frequency, tips, source_url, collected_at, expires_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW() + INTERVAL '3 months')`,
        [
          r.from_city, r.to_city, r.transport, r.carrier || null,
          r.duration_min || null, r.cost_krw || null, r.cost_local || null, r.currency || null,
          r.frequency || null, r.tips || null, r.source_url || null
        ]
      );
      inserted++;
    } catch (e) {
      console.error(`  Error inserting route "${r.from_city}→${r.to_city}":`, e.message);
    }
  }
  console.log(`Routes: ${inserted} inserted, ${skipped} skipped`);
}

async function seedEvents(allEvents) {
  let inserted = 0, skipped = 0;
  for (const ev of allEvents) {
    try {
      const existing = await pool.query(
        'SELECT id FROM events WHERE city = $1 AND name = $2',
        [ev.city, ev.name]
      );
      if (existing.rows.length > 0) { skipped++; continue; }

      await pool.query(`
        INSERT INTO events (city, country, name, description, start_month, end_month, category, tips, collected_at, expires_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW() + INTERVAL '12 months')`,
        [
          ev.city, ev.country, ev.name, ev.description || null,
          ev.start_month || null, ev.end_month || null, ev.category || null, ev.tips || null
        ]
      );
      inserted++;
    } catch (e) {
      console.error(`  Error inserting event "${ev.name}":`, e.message);
    }
  }
  console.log(`Events: ${inserted} inserted, ${skipped} skipped`);
}

async function main() {
  console.log('=== Travel Knowledge DB Seeding ===\n');
  
  let allPlaces = [], allRoutes = [], allEvents = [];
  for (const f of files) {
    const d = normalize(f);
    allPlaces.push(...d.places);
    allRoutes.push(...d.routes);
    allEvents.push(...d.events);
  }
  
  console.log(`Data loaded: ${allPlaces.length} places, ${allRoutes.length} routes, ${allEvents.length} events\n`);
  
  await seedPlaces(allPlaces);
  await seedRoutes(allRoutes);
  await seedEvents(allEvents);
  
  // Verify
  console.log('\n=== Verification ===');
  const pCount = await pool.query('SELECT COUNT(*)::int as c FROM places');
  const rCount = await pool.query('SELECT COUNT(*)::int as c FROM routes');
  const eCount = await pool.query('SELECT COUNT(*)::int as c FROM events');
  console.log(`DB totals: ${pCount.rows[0].c} places, ${rCount.rows[0].c} routes, ${eCount.rows[0].c} events`);
  
  const byCity = await pool.query('SELECT city, COUNT(*)::int as c FROM places GROUP BY city ORDER BY c DESC');
  console.log('\nPlaces by city:');
  byCity.rows.forEach(r => console.log(`  ${r.city}: ${r.c}`));
  
  await pool.end();
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
