const db = require('./db');
const { handlers } = require('./direct-answer');

const CATEGORIES = ['weather', 'visa', 'transport', 'food', 'attractions', 'price', 'timezone', 'bestSeason', 'tips'];

// 상위 인기 도시 가져오기 (chat_logs 기반 + 폴백)
async function getTopCities(limit = 30) {
  try {
    // chat_logs에서 인기 도시
    const popular = await db.query(`
      SELECT destination_city as city, COUNT(*) as cnt
      FROM chat_logs
      WHERE destination_city IS NOT NULL AND destination_city != ''
      GROUP BY destination_city
      ORDER BY cnt DESC
      LIMIT $1
    `, [limit]);

    if (popular.rows.length >= 10) {
      return popular.rows.map(r => r.city);
    }

    // 폴백: city_info에서 주요 도시
    const fallback = await db.query(`
      SELECT city FROM city_info 
      WHERE city IN ('도쿄','오사카','방콕','파리','런던','뉴욕','하노이','다낭','발리','싱가포르',
                     '홍콩','타이베이','세부','교토','후쿠오카','호치민','치앙마이','바르셀로나','로마','프라하',
                     '제주','부산','경주','전주','여수','강릉','시드니','암스테르담','비엔나','멜버른')
      ORDER BY city
    `);
    return fallback.rows.map(r => r.city);
  } catch (e) {
    console.error('[Precompile] getTopCities error:', e.message);
    return [];
  }
}

async function precompileForCity(cityName) {
  try {
    const cityRes = await db.query('SELECT * FROM city_info WHERE city ILIKE $1', [cityName]);
    if (cityRes.rows.length === 0) return 0;
    const cityData = cityRes.rows[0];
    let count = 0;

    for (const category of CATEGORIES) {
      const handler = handlers[category];
      if (!handler) continue;

      try {
        const answer = await handler(cityData);
        if (!answer) continue;

        await db.query(`
          INSERT INTO precompiled_answers (city, category, answer, created_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (city, category) DO UPDATE SET answer = EXCLUDED.answer, created_at = NOW()
        `, [cityData.city, category, answer]);
        count++;
      } catch (e) {
        // 개별 카테고리 실패는 무시
      }
    }

    // overview 카테고리 추가
    if (cityData.overview) {
      await db.query(`
        INSERT INTO precompiled_answers (city, category, answer, created_at)
        VALUES ($1, 'overview', $2, NOW())
        ON CONFLICT (city, category) DO UPDATE SET answer = EXCLUDED.answer, created_at = NOW()
      `, [cityData.city, cityData.overview]);
      count++;
    }

    return count;
  } catch (e) {
    console.error(`[Precompile] Error for ${cityName}:`, e.message);
    return 0;
  }
}

async function precompileAll() {
  console.log('[Precompile] Starting precompilation...');
  const cities = await getTopCities(30);
  let total = 0;

  for (const city of cities) {
    const count = await precompileForCity(city);
    total += count;
  }

  console.log(`[Precompile] Done. ${total} answers for ${cities.length} cities.`);
  return total;
}

module.exports = { precompileAll, precompileForCity, getTopCities };
