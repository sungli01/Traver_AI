/**
 * 데이터 리셋 스크립트
 * 
 * ⚠️ 실행 전 반드시 확인:
 * - users, price_history, purchase_requests 테이블이 초기화됩니다
 * - Knowledge DB (places, routes, events, collection_log)는 유지됩니다
 * 
 * 실행: DATABASE_URL=<db_url> node reset-data.js
 */
require('dotenv').config();
const db = require('./db');

async function resetData() {
  console.log('🔄 데이터 리셋 시작...\n');

  const tables = [
    { name: 'purchase_requests', desc: '구매 요청' },
    { name: 'price_history', desc: '가격 히스토리' },
    { name: 'users', desc: '사용자 (OAuth 포함)' },
  ];

  for (const { name, desc } of tables) {
    try {
      const countResult = await db.query(`SELECT COUNT(*) as count FROM ${name}`);
      const count = parseInt(countResult.rows[0].count);
      console.log(`  📋 ${name} (${desc}): ${count}건`);
      await db.query(`TRUNCATE TABLE ${name} RESTART IDENTITY CASCADE`);
      console.log(`  ✅ ${name} 초기화 완료\n`);
    } catch (err) {
      console.log(`  ⚠️  ${name} 스킵 (${err.message})\n`);
    }
  }

  // 유지되는 테이블 확인
  const preserved = ['places', 'routes', 'events', 'collection_log'];
  console.log('📚 Knowledge DB (유지):');
  for (const name of preserved) {
    try {
      const r = await db.query(`SELECT COUNT(*) as count FROM ${name}`);
      console.log(`  ✅ ${name}: ${r.rows[0].count}건 유지`);
    } catch {
      console.log(`  - ${name}: 테이블 없음`);
    }
  }

  console.log('\n🎉 리셋 완료!');
  process.exit(0);
}

resetData().catch(err => {
  console.error('❌ 리셋 실패:', err.message);
  process.exit(1);
});
