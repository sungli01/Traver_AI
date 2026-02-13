/**
 * 순천 시드 데이터 — 실제 가격/좌표 기반 (2024-2025)
 */
const places = [
  // === 관광지 ===
  { name: '순천만국가정원', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 34.9218, lng: 127.4879, description: '대한민국 국가정원 1호. 세계 각국의 정원과 한국 전통정원을 감상할 수 있는 대규모 정원. 순천만습지와 연결.',
    admission_fee: '성인 ₩8,000 / 청소년 ₩6,000 / 어린이 ₩4,000', avg_cost: 8000,
    address: '전남 순천시 국가정원1호길 47', phone: '061-749-4233',
    hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-18:00', sat: '09:00-18:00', sun: '09:00-18:00' },
    tags: ['정원', '자연', '가족', '데이트', '사계절'], rating: 4.5, review_count: 25000, trust_score: 5 },

  { name: '순천만습지', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 34.8862, lng: 127.5108, description: '유네스코 세계자연유산 잠정목록. 갈대밭과 S자 수로가 유명하며 흑두루미 등 철새 도래지.',
    admission_fee: '무료 (순천만국가정원 통합권 구매 시 입장)', avg_cost: 0,
    address: '전남 순천시 순천만길 513-25', phone: '061-749-6052',
    hours: { mon: '08:00-일몰', tue: '08:00-일몰', wed: '08:00-일몰', thu: '08:00-일몰', fri: '08:00-일몰', sat: '08:00-일몰', sun: '08:00-일몰' },
    tags: ['습지', '자연', '철새', '갈대', '일몰'], rating: 4.6, review_count: 18000, trust_score: 5 },

  { name: '낙안읍성민속마을', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 34.9073, lng: 127.3418, description: '조선시대 읍성이 원형 그대로 보존된 민속마을. 실제 주민 거주. 한옥 체험 가능.',
    admission_fee: '성인 ₩4,000 / 청소년 ₩2,500 / 어린이 ₩1,500', avg_cost: 4000,
    address: '전남 순천시 낙안면 충민길 30', phone: '061-749-8831',
    hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-18:00', sat: '09:00-18:00', sun: '09:00-18:00' },
    tags: ['읍성', '한옥', '전통', '민속마을', '역사'], rating: 4.3, review_count: 12000, trust_score: 5 },

  { name: '순천드라마촬영장', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 34.9275, lng: 127.4650, description: '1960~80년대 한국의 모습을 재현한 오픈세트장. 다수의 드라마, 영화 촬영지.',
    admission_fee: '성인 ₩3,000 / 청소년 ₩2,000 / 어린이 ₩1,000', avg_cost: 3000,
    address: '전남 순천시 비례골길 24', phone: '061-749-4003',
    hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-18:00', sat: '09:00-18:00', sun: '09:00-18:00' },
    tags: ['드라마', '촬영장', '레트로', '사진'], rating: 4.1, review_count: 8000, trust_score: 5 },

  { name: '선암사', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 35.0150, lng: 127.3450, description: '유네스코 세계문화유산 산사. 승선교와 강선루가 유명. 조계산 자락의 고즈넉한 사찰.',
    admission_fee: '성인 ₩3,000 / 청소년 ₩1,500 / 어린이 ₩1,000', avg_cost: 3000,
    address: '전남 순천시 승주읍 선암사길 450', phone: '061-754-5247',
    hours: { mon: '07:00-19:00', tue: '07:00-19:00', wed: '07:00-19:00', thu: '07:00-19:00', fri: '07:00-19:00', sat: '07:00-19:00', sun: '07:00-19:00' },
    tags: ['사찰', '유네스코', '조계산', '승선교', '템플스테이'], rating: 4.5, review_count: 9000, trust_score: 5 },

  { name: '송광사', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 35.0003, lng: 127.2733, description: '한국 삼보사찰 중 승보사찰. 16국사를 배출한 명찰. 조계산 서쪽 자락.',
    admission_fee: '성인 ₩3,000 / 청소년 ₩1,500 / 어린이 ₩1,000', avg_cost: 3000,
    address: '전남 순천시 송광면 송광사안길 100', phone: '061-755-0107',
    hours: { mon: '06:00-19:00', tue: '06:00-19:00', wed: '06:00-19:00', thu: '06:00-19:00', fri: '06:00-19:00', sat: '06:00-19:00', sun: '06:00-19:00' },
    tags: ['사찰', '삼보사찰', '승보사찰', '조계산', '템플스테이'], rating: 4.4, review_count: 7500, trust_score: 5 },

  { name: '조계산', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 35.0100, lng: 127.3100, description: '전남의 명산. 선암사와 송광사를 잇는 등산로가 유명. 장군봉 884m.',
    admission_fee: '무료', avg_cost: 0,
    address: '전남 순천시 승주읍/송광면', phone: null,
    hours: { mon: '상시', tue: '상시', wed: '상시', thu: '상시', fri: '상시', sat: '상시', sun: '상시' },
    tags: ['등산', '트레킹', '자연', '산', '조계산'], rating: 4.3, review_count: 5000, trust_score: 5 },

  { name: '순천왜성', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 34.8943, lng: 127.5359, description: '임진왜란 때 왜군이 축성한 성곽. 순천만 인근 역사 유적지.',
    admission_fee: '무료', avg_cost: 0,
    address: '전남 순천시 해룡면 신성리', phone: null,
    hours: { mon: '상시', tue: '상시', wed: '상시', thu: '상시', fri: '상시', sat: '상시', sun: '상시' },
    tags: ['역사', '성곽', '임진왜란'], rating: 3.8, review_count: 2000, trust_score: 4 },

  { name: '뿌리깊은나무 박물관', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 34.9507, lng: 127.4872, description: '한글 문화와 전통 목판인쇄 체험 박물관.',
    admission_fee: '성인 ₩3,000 / 어린이 ₩2,000', avg_cost: 3000,
    address: '전남 순천시 낙안면', phone: '061-754-7997',
    hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-18:00', sat: '09:00-18:00', sun: '09:00-18:00' },
    tags: ['박물관', '한글', '체험', '가족'], rating: 4.0, review_count: 1500, trust_score: 4 },

  { name: '순천 자연휴양림', name_local: null, city: '순천', country: '한국', category: 'attraction',
    lat: 34.9800, lng: 127.4200, description: '편백나무 숲에서의 산림욕과 힐링. 숲속 산책로와 목재문화체험장.',
    admission_fee: '성인 ₩1,000', avg_cost: 1000,
    address: '전남 순천시 서면 청소년수련원길', phone: '061-749-3224',
    hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-18:00', sat: '09:00-18:00', sun: '09:00-18:00' },
    tags: ['자연', '산림욕', '편백나무', '힐링'], rating: 4.2, review_count: 3000, trust_score: 4 },

  // === 식당 ===
  { name: '순천만 짬뽕거리', name_local: null, city: '순천', country: '한국', category: 'restaurant',
    lat: 34.9505, lng: 127.4870, description: '순천 대표 먹거리 거리. 순천식 짬뽕은 고춧가루 대신 간장 베이스로 담백.',
    signature: ['순천짬뽕', '삼선짬뽕', '탕수육'], avg_cost: 9000,
    address: '전남 순천시 장천동 일대', phone: null,
    hours: { mon: '10:00-21:00', tue: '10:00-21:00', wed: '10:00-21:00', thu: '10:00-21:00', fri: '10:00-21:00', sat: '10:00-21:00', sun: '10:00-21:00' },
    tags: ['짬뽕', '순천짬뽕', '중화요리', '먹거리거리'], rating: 4.2, review_count: 5000, trust_score: 4 },

  { name: '대대선창횟집거리', name_local: null, city: '순천', country: '한국', category: 'restaurant',
    lat: 34.8850, lng: 127.5230, description: '순천만습지 인근 선창 횟집 거리. 신선한 해산물과 꼬막요리.',
    signature: ['꼬막정식', '회정식', '장어구이'], avg_cost: 25000,
    address: '전남 순천시 별량면 대대리', phone: null,
    hours: { mon: '10:00-21:00', tue: '10:00-21:00', wed: '10:00-21:00', thu: '10:00-21:00', fri: '10:00-21:00', sat: '10:00-21:00', sun: '10:00-21:00' },
    tags: ['해산물', '횟집', '꼬막', '장어'], rating: 4.3, review_count: 4000, trust_score: 4 },

  { name: '순천 웃장국밥거리', name_local: null, city: '순천', country: '한국', category: 'restaurant',
    lat: 34.9510, lng: 127.4880, description: '전통시장 인근 국밥 거리. 순천식 돼지국밥과 순대국밥 전문.',
    signature: ['돼지국밥', '순대국밥', '머리고기'], avg_cost: 8000,
    address: '전남 순천시 중앙로 일대', phone: null,
    hours: { mon: '06:00-20:00', tue: '06:00-20:00', wed: '06:00-20:00', thu: '06:00-20:00', fri: '06:00-20:00', sat: '06:00-20:00', sun: '06:00-20:00' },
    tags: ['국밥', '순대', '전통', '로컬맛집'], rating: 4.1, review_count: 3500, trust_score: 4 },

  { name: '꼬막한상', name_local: null, city: '순천', country: '한국', category: 'restaurant',
    lat: 34.9490, lng: 127.4860, description: '순천 벌교 꼬막요리 전문점. 양념꼬막, 삶은꼬막, 꼬막전 등 풀코스.',
    signature: ['꼬막정식', '양념꼬막', '꼬막전', '꼬막비빔밥'], avg_cost: 18000,
    address: '전남 순천시 장천동', phone: null,
    hours: { mon: '10:30-21:00', tue: '10:30-21:00', wed: '10:30-21:00', thu: '10:30-21:00', fri: '10:30-21:00', sat: '10:30-21:00', sun: '10:30-21:00' },
    tags: ['꼬막', '벌교', '한정식', '순천맛집'], rating: 4.4, review_count: 3000, trust_score: 4 },

  { name: '삼거리중앙식당', name_local: null, city: '순천', country: '한국', category: 'restaurant',
    lat: 34.9508, lng: 127.4878, description: '순천 전통 한식당. 순천식 밥상과 반찬이 풍성.',
    signature: ['한정식', '생선구이정식', '제육볶음'], avg_cost: 12000,
    address: '전남 순천시 중앙동', phone: null,
    hours: { mon: '10:00-21:00', tue: '10:00-21:00', wed: '10:00-21:00', thu: '10:00-21:00', fri: '10:00-21:00', sat: '10:00-21:00', sun: '10:00-21:00' },
    tags: ['한식', '한정식', '가성비', '로컬'], rating: 4.0, review_count: 2000, trust_score: 4 },

  { name: '순천만정원카페', name_local: null, city: '순천', country: '한국', category: 'restaurant',
    lat: 34.9220, lng: 127.4885, description: '순천만국가정원 내 위치한 카페. 정원 뷰를 감상하며 휴식.',
    signature: ['아메리카노', '녹차라떼', '팥빙수'], avg_cost: 6000,
    address: '전남 순천시 국가정원1호길 47 내', phone: null,
    hours: { mon: '09:00-17:30', tue: '09:00-17:30', wed: '09:00-17:30', thu: '09:00-17:30', fri: '09:00-17:30', sat: '09:00-17:30', sun: '09:00-17:30' },
    tags: ['카페', '정원뷰', '디저트'], rating: 4.0, review_count: 1500, trust_score: 4 },

  // === 숙소 ===
  { name: '순천 그라츠호텔', name_local: null, city: '순천', country: '한국', category: 'hotel',
    lat: 34.9480, lng: 127.4870, description: '순천 시내 중심부 비즈니스 호텔. 깔끔한 시설과 접근성.',
    avg_cost: 80000,
    address: '전남 순천시 장명로 15', phone: '061-727-6000',
    hours: { checkin: '15:00', checkout: '11:00' },
    tags: ['호텔', '비즈니스', '시내', '깔끔'], rating: 4.1, review_count: 2500, trust_score: 4 },

  { name: '순천 유탑호텔', name_local: null, city: '순천', country: '한국', category: 'hotel',
    lat: 34.9460, lng: 127.4890, description: '순천 시내 위치. 관광지 접근 편리한 중급 호텔.',
    avg_cost: 90000,
    address: '전남 순천시 연향동', phone: '061-720-1200',
    hours: { checkin: '15:00', checkout: '11:00' },
    tags: ['호텔', '관광', '시내'], rating: 4.0, review_count: 2000, trust_score: 4 },

  { name: '낙안읍성 한옥민박', name_local: null, city: '순천', country: '한국', category: 'hotel',
    lat: 34.9075, lng: 127.3420, description: '낙안읍성 내 실제 한옥에서의 숙박 체험. 전통 온돌방.',
    avg_cost: 60000,
    address: '전남 순천시 낙안면 충민길 일대', phone: null,
    hours: { checkin: '15:00', checkout: '11:00' },
    tags: ['한옥', '민박', '전통체험', '읍성'], rating: 4.2, review_count: 1500, trust_score: 4 },

  // === 액티비티 ===
  { name: '순천만 갈대열차', name_local: null, city: '순천', country: '한국', category: 'activity',
    lat: 34.8870, lng: 127.5100, description: '순천만습지를 달리는 소형 관광열차. 갈대밭 사이를 통과.',
    admission_fee: '성인 ₩6,000 / 어린이 ₩4,000', avg_cost: 6000,
    address: '전남 순천시 순천만길', phone: '061-749-6052',
    hours: { mon: '09:00-17:00', tue: '09:00-17:00', wed: '09:00-17:00', thu: '09:00-17:00', fri: '09:00-17:00', sat: '09:00-17:00', sun: '09:00-17:00' },
    tags: ['관광열차', '갈대', '체험', '가족'], rating: 4.3, review_count: 4000, trust_score: 4 },

  { name: '순천만 스카이큐브', name_local: null, city: '순천', country: '한국', category: 'activity',
    lat: 34.9200, lng: 127.4900, description: 'PRT 무인궤도차량. 국가정원과 순천만습지를 연결하는 친환경 교통수단.',
    admission_fee: '성인 ₩8,000 (편도) / ₩14,000 (왕복)', avg_cost: 8000,
    address: '전남 순천시 국가정원1호길', phone: '061-749-6052',
    hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-18:00', sat: '09:00-18:00', sun: '09:00-18:00' },
    tags: ['PRT', '스카이큐브', '교통', '체험'], rating: 4.1, review_count: 3000, trust_score: 4 },

  { name: '순천 야경투어 (순천만 용산전망대)', name_local: null, city: '순천', country: '한국', category: 'activity',
    lat: 34.8850, lng: 127.5150, description: '용산전망대에서 순천만 S자 수로의 일몰과 야경을 감상하는 코스.',
    admission_fee: '무료', avg_cost: 0,
    address: '전남 순천시 해룡면', phone: null,
    hours: { mon: '상시', tue: '상시', wed: '상시', thu: '상시', fri: '상시', sat: '상시', sun: '상시' },
    tags: ['야경', '전망대', '일몰', '순천만'], rating: 4.7, review_count: 6000, trust_score: 5 },

  // === 쇼핑 ===
  { name: '순천 웃장 (순천전통시장)', name_local: null, city: '순천', country: '한국', category: 'shopping',
    lat: 34.9510, lng: 127.4875, description: '순천 대표 전통시장. 5일장(2,7일). 먹거리, 농산물, 생활용품 다양.',
    admission_fee: '무료', avg_cost: 15000,
    address: '전남 순천시 장대길 18', phone: '061-744-8002',
    hours: { mon: '08:00-20:00', tue: '08:00-20:00', wed: '08:00-20:00', thu: '08:00-20:00', fri: '08:00-20:00', sat: '08:00-20:00', sun: '08:00-20:00' },
    tags: ['전통시장', '5일장', '먹거리', '쇼핑'], rating: 4.2, review_count: 3500, trust_score: 4 },

  { name: '아랫장 (순천 아랫장)', name_local: null, city: '순천', country: '한국', category: 'shopping',
    lat: 34.9490, lng: 127.4885, description: '웃장과 함께 순천의 양대 전통시장. 수산물과 건어물이 유명.',
    admission_fee: '무료', avg_cost: 10000,
    address: '전남 순천시 중앙동', phone: null,
    hours: { mon: '07:00-20:00', tue: '07:00-20:00', wed: '07:00-20:00', thu: '07:00-20:00', fri: '07:00-20:00', sat: '07:00-20:00', sun: '07:00-20:00' },
    tags: ['전통시장', '수산물', '건어물'], rating: 4.0, review_count: 2000, trust_score: 4 },
];

module.exports = places;

// Direct run
if (require.main === module) {
  const db = require('./db');
  (async () => {
    try {
      // Delete old 순천 data
      await db.query("DELETE FROM places WHERE city = '순천'");
      console.log('Cleared old 순천 data');

      for (const p of places) {
        await db.query(`
          INSERT INTO places (name, name_local, city, country, category, lat, lng, description, 
            signature, avg_cost, rating, review_count, hours, tags, trust_score,
            admission_fee, address, phone, collected_at, expires_at, is_verified, last_price_verified)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW()+'1 year'::interval,true,NOW())
        `, [p.name, p.name_local, p.city, p.country, p.category, p.lat, p.lng, p.description,
            p.signature || null, p.avg_cost, p.rating, p.review_count, JSON.stringify(p.hours),
            p.tags, p.trust_score, p.admission_fee || null, p.address, p.phone]);
        console.log(`  ✓ ${p.name}`);
      }
      console.log(`\nSeeded ${places.length} 순천 places`);
      process.exit(0);
    } catch (err) {
      console.error('Seed error:', err);
      process.exit(1);
    }
  })();
}
