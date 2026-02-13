/**
 * Batch seed script — uses multi-row INSERT for speed over remote TCP proxy
 */
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://travel:tr4vel_kn0wledge_2024@caboose.proxy.rlwy.net:53741/travel_knowledge';

const pool = new Pool({ connectionString: DATABASE_URL, connectionTimeoutMillis: 10000 });

const files = [
  require('./seed-data'),
  require('./seed-data-kyoto'),
  require('./seed-data-bangkok'),
  require('./seed-data-danang'),
  require('./seed-data-hanoi'),
  require('./seed-data-singapore'),
  require('./seed-data-taipei'),
  require('./seed-data-jeju'),
];

function normalize(data) {
  if (Array.isArray(data)) return { places: data, routes: [], events: [] };
  return { places: data.places || [], routes: data.routes || [], events: data.events || [] };
}

async function batchInsertPlaces(places) {
  // Batch 50 at a time
  const batchSize = 20;
  let total = 0;
  for (let i = 0; i < places.length; i += batchSize) {
    const batch = places.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let idx = 1;
    for (const p of batch) {
      values.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},$${idx+4},$${idx+5},$${idx+6},$${idx+7},$${idx+8},$${idx+9},$${idx+10},$${idx+11},$${idx+12},$${idx+13},$${idx+14},$${idx+15},$${idx+16},NOW(),NOW()+'6 months'::interval,false)`);
      params.push(
        p.name, p.name_local||null, p.city, p.country, p.category||'restaurant',
        p.lat||null, p.lng||null, p.description||null,
        p.signature||null, p.avg_cost||null, p.currency_local||null, p.cost_local||null,
        p.rating||null, p.review_count||null,
        p.tags||null, p.best_season||null, p.trust_score||3
      );
      idx += 17;
    }
    try {
      const res = await pool.query(`
        INSERT INTO places (name,name_local,city,country,category,lat,lng,description,
          signature,avg_cost,currency_local,cost_local,rating,review_count,
          tags,best_season,trust_score,collected_at,expires_at,is_verified)
        VALUES ${values.join(',')}
        ON CONFLICT DO NOTHING`, params);
      total += res.rowCount;
      process.stdout.write(`\rPlaces: ${total}/${places.length}`);
    } catch(e) {
      console.error(`\nBatch error at ${i}:`, e.message);
    }
  }
  console.log(`\nPlaces done: ${total} inserted`);
}

async function batchInsertRoutes(routes) {
  if (!routes.length) return;
  const values = [];
  const params = [];
  let idx = 1;
  for (const r of routes) {
    values.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},$${idx+4},$${idx+5},$${idx+6},$${idx+7},NOW(),NOW()+'3 months'::interval)`);
    params.push(r.from_city, r.to_city, r.transport, r.carrier||null, r.duration_min||null, r.cost_krw||null, r.frequency||null, r.tips||null);
    idx += 8;
  }
  try {
    const res = await pool.query(`
      INSERT INTO routes (from_city,to_city,transport,carrier,duration_min,cost_krw,frequency,tips,collected_at,expires_at)
      VALUES ${values.join(',')}
      ON CONFLICT DO NOTHING`, params);
    console.log(`Routes: ${res.rowCount} inserted`);
  } catch(e) {
    console.error('Routes error:', e.message);
  }
}

async function batchInsertEvents(events) {
  if (!events.length) return;
  const values = [];
  const params = [];
  let idx = 1;
  for (const ev of events) {
    values.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},$${idx+4},$${idx+5},$${idx+6},$${idx+7},NOW(),NOW()+'12 months'::interval)`);
    params.push(ev.city, ev.country, ev.name, ev.description||null, ev.start_month||null, ev.end_month||null, ev.category||null, ev.tips||null);
    idx += 8;
  }
  try {
    const res = await pool.query(`
      INSERT INTO events (city,country,name,description,start_month,end_month,category,tips,collected_at,expires_at)
      VALUES ${values.join(',')}
      ON CONFLICT DO NOTHING`, params);
    console.log(`Events: ${res.rowCount} inserted`);
  } catch(e) {
    console.error('Events error:', e.message);
  }
}

async function main() {
  console.log('=== Batch Seeding ===');
  let allPlaces=[], allRoutes=[], allEvents=[];
  for (const f of files) {
    const d = normalize(f);
    allPlaces.push(...d.places);
    allRoutes.push(...d.routes);
    allEvents.push(...d.events);
  }
  console.log(`Loaded: ${allPlaces.length} places, ${allRoutes.length} routes, ${allEvents.length} events`);
  
  await batchInsertPlaces(allPlaces);
  await batchInsertRoutes(allRoutes);
  await batchInsertEvents(allEvents);
  
  // Verify
  const p = await pool.query('SELECT COUNT(*)::int as c FROM places');
  const r = await pool.query('SELECT COUNT(*)::int as c FROM routes');
  const e = await pool.query('SELECT COUNT(*)::int as c FROM events');
  console.log(`\nDB: ${p.rows[0].c} places, ${r.rows[0].c} routes, ${e.rows[0].c} events`);
  
  const byCity = await pool.query('SELECT city, COUNT(*)::int as c FROM places GROUP BY city ORDER BY c DESC');
  byCity.rows.forEach(r => console.log(`  ${r.city}: ${r.c}`));
  
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
