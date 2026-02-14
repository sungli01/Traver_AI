/**
 * Seed city_info table with comprehensive city data (10 cities)
 * Run: node seed-city-info.js
 */
require('dotenv').config();
const db = require('./db');

const cities = [
  {
    city: 'Tokyo', country: 'Japan',
    overview: '일본의 수도이자 세계 최대 도시권. 전통과 초현대가 공존하는 메가시티로, 미슐랭 레스토랑 수 세계 1위, 시부야·아키하바라·아사쿠사 등 개성 넘치는 거리가 매력적입니다.',
    population: '약 1,400만 명 (도시권 3,700만)', area: '2,194 km²', language: '일본어',
    timezone: 'UTC+9 (한국과 동일)', currency: 'JPY (엔)',
    visa_info: '한국 여권 소지자 90일 무비자 입국 가능. 왕복 항공권 및 체류지 정보 필요.',
    best_season: '봄(3-5월) 벚꽃 시즌과 가을(10-11월) 단풍 시즌이 최고. 여름은 무덥고 습하며, 겨울은 건조하고 맑음.',
    weather_summary: JSON.stringify({"1":{"high":10,"low":1,"rain":50},"2":{"high":11,"low":2,"rain":60},"3":{"high":15,"low":5,"rain":120},"4":{"high":20,"low":10,"rain":130},"5":{"high":25,"low":15,"rain":140},"6":{"high":27,"low":19,"rain":170},"7":{"high":31,"low":23,"rain":150},"8":{"high":33,"low":24,"rain":170},"9":{"high":29,"low":21,"rain":210},"10":{"high":23,"low":15,"rain":200},"11":{"high":17,"low":9,"rain":100},"12":{"high":12,"low":3,"rain":50}}),
    transport_info: JSON.stringify({airport:"나리타공항: 스카이라이너 41분(¥2,520), 리무진버스 85분(¥3,200). 하네다공항: 모노레일 13분(¥500)", local:["JR야마노테선","도쿄메트로(9개 노선)","도에이 지하철(4개 노선)","버스"], card:"Suica / PASMO (교통+편의점 결제)", tips:"도쿄 서브웨이 티켓(24h ¥800/48h ¥1,200/72h ¥1,500) 추천"}),
    local_tips: [
      '스이카 카드 하나면 전철·버스·편의점 결제 모두 가능',
      '라멘집은 보통 식권 자판기로 주문 — 현금 준비 필수',
      '에스컬레이터는 왼쪽 서기 (오사카와 반대)',
      '팁 문화 없음 — 오히려 무례할 수 있음',
      '쓰레기통이 거의 없으므로 봉투를 휴대',
      '지하철 막차는 약 24시 — 종전 시간 확인',
      '100엔 숍(다이소, 세리아)에서 여행용품 저렴하게 구매',
      '무료 Wi-Fi: Japan Wi-Fi auto-connect 앱 추천'
    ],
    price_index: JSON.stringify({meal:12000,coffee:5000,beer:6000,taxi_1km:800,subway:2000,hotel_avg:130000}),
    image_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200'
  },
  {
    city: 'Osaka', country: 'Japan',
    overview: '일본 제2의 도시이자 "천하의 부엌". 타코야키, 오코노미야키 등 서민 먹거리 천국이며, 도톤보리의 화려한 네온과 오사카 사람들의 유쾌한 성격이 매력입니다.',
    population: '약 275만 명 (도시권 1,900만)', area: '225 km²', language: '일본어 (오사카 사투리)',
    timezone: 'UTC+9 (한국과 동일)', currency: 'JPY (엔)',
    visa_info: '한국 여권 소지자 90일 무비자 입국 가능.',
    best_season: '봄(3-5월) 벚꽃, 가을(10-11월) 단풍. 여름은 고온다습.',
    weather_summary: JSON.stringify({"1":{"high":9,"low":3,"rain":45},"2":{"high":10,"low":3,"rain":60},"3":{"high":14,"low":6,"rain":105},"4":{"high":20,"low":11,"rain":105},"5":{"high":25,"low":16,"rain":145},"6":{"high":28,"low":21,"rain":185},"7":{"high":32,"low":25,"rain":155},"8":{"high":34,"low":26,"rain":90},"9":{"high":29,"low":22,"rain":160},"10":{"high":23,"low":16,"rain":120},"11":{"high":17,"low":10,"rain":70},"12":{"high":11,"low":5,"rain":45}}),
    transport_info: JSON.stringify({airport:"간사이공항: 라피트 34분(¥1,450), 리무진버스 50분(¥1,600)", local:["오사카메트로(9개 노선)","JR","한큐·한신·난카이 사철"], card:"ICOCA", tips:"오사카 주유패스(1일 ¥2,800) — 관광지 무료입장 포함"}),
    local_tips: [
      '에스컬레이터는 오른쪽 서기 (도쿄와 반대)',
      '도톤보리 글리코 간판 앞은 필수 포토스팟',
      '구로몬시장은 오전 중 방문이 가장 신선',
      '오사카 주유패스로 교통+관광지 무료입장 가능',
      '현지인처럼 "맛있다" 대신 "모우카리마っか" 인사',
      '야간에 신세카이 지역은 주의'
    ],
    price_index: JSON.stringify({meal:10000,coffee:4500,beer:5500,taxi_1km:750,subway:1800,hotel_avg:100000}),
    image_url: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1200'
  },
  {
    city: 'Kyoto', country: 'Japan',
    overview: '794년부터 천년간 일본의 수도였던 고도(古都). 17개 유네스코 세계문화유산, 2,000여 개의 사찰과 신사, 게이샤 문화의 본고장으로 일본 전통문화의 정수를 경험할 수 있습니다.',
    population: '약 146만 명', area: '828 km²', language: '일본어',
    timezone: 'UTC+9 (한국과 동일)', currency: 'JPY (엔)',
    visa_info: '한국 여권 소지자 90일 무비자 입국 가능.',
    best_season: '봄(3-4월) 벚꽃과 가을(11월) 단풍이 절정. 특히 11월 교토 단풍은 세계적 명소.',
    weather_summary: JSON.stringify({"1":{"high":9,"low":1,"rain":50},"2":{"high":10,"low":2,"rain":65},"3":{"high":14,"low":5,"rain":115},"4":{"high":20,"low":10,"rain":120},"5":{"high":26,"low":15,"rain":160},"6":{"high":29,"low":20,"rain":215},"7":{"high":33,"low":24,"rain":220},"8":{"high":35,"low":25,"rain":130},"9":{"high":29,"low":21,"rain":175},"10":{"high":23,"low":14,"rain":120},"11":{"high":17,"low":8,"rain":70},"12":{"high":11,"low":3,"rain":50}}),
    transport_info: JSON.stringify({airport:"간사이공항: 하루카 특급 75분(¥3,640). 이타미공항: 리무진버스 55분(¥1,340)", local:["시버스(230엔 균일)","지하철(2개 노선)","JR","게이한·한큐 사철"], card:"ICOCA", tips:"시버스 1일 승차권(¥700) 필수 — 주요 관광지 커버"}),
    local_tips: [
      '사찰 방문은 오전 일찍(8-9시) — 관광객 적고 빛이 좋음',
      '기온·하나미코지 거리에서 게이코(게이샤) 촬영은 실례',
      '버스 1일권(¥700)이 가성비 최고',
      '니시키시장은 "교토의 부엌" — 꼭 방문',
      '신발은 벗기 편한 것으로 (사찰 내부 관람)',
      '교토역 지하 포르타에서 먹거리 쇼핑 추천',
      '인력거 체험은 아라시야마에서 (2인 30분 ¥9,000~)'
    ],
    price_index: JSON.stringify({meal:11000,coffee:5000,beer:6000,taxi_1km:800,subway:1700,hotel_avg:120000}),
    image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200'
  },
  {
    city: 'Bangkok', country: 'Thailand',
    overview: '태국의 수도이자 동남아 최대 도시. 화려한 왕궁과 사원, 세계적 수준의 길거리 음식, 합리적인 물가로 전 세계 배낭여행자와 럭셔리 여행자 모두에게 사랑받는 도시입니다.',
    population: '약 1,050만 명', area: '1,569 km²', language: '태국어',
    timezone: 'UTC+7 (한국보다 2시간 느림)', currency: 'THB (바트)',
    visa_info: '한국 여권 소지자 90일 무비자 입국 가능 (2024년 확대).',
    best_season: '건기(11-2월)가 최적. 3-5월은 극도로 무덥고, 6-10월은 우기(스콜).',
    weather_summary: JSON.stringify({"1":{"high":33,"low":21,"rain":10},"2":{"high":34,"low":23,"rain":20},"3":{"high":35,"low":25,"rain":30},"4":{"high":36,"low":26,"rain":65},"5":{"high":35,"low":26,"rain":190},"6":{"high":34,"low":25,"rain":150},"7":{"high":33,"low":25,"rain":155},"8":{"high":33,"low":25,"rain":195},"9":{"high":33,"low":25,"rain":320},"10":{"high":33,"low":24,"rain":240},"11":{"high":32,"low":23,"rain":50},"12":{"high":32,"low":21,"rain":10}}),
    transport_info: JSON.stringify({airport:"수완나품공항: ARL 시티라인 30분(฿45), 택시 40분(฿300~400). 돈므앙공항: 택시 30분(฿200~300)", local:["BTS 스카이트레인","MRT 지하철","수상보트(짜오프라야)","택시/그랩","툭툭"], card:"Rabbit Card (BTS)", tips:"그랩(Grab) 앱 필수 — 택시보다 안전하고 바가지 방지"}),
    local_tips: [
      '그랩(Grab) 앱 필수 설치 — 택시 바가지 방지',
      '왕궁/사원 방문 시 긴바지+어깨 가린 옷 필수 (반바지 입장 불가)',
      '길거리 음식은 현지인이 줄 선 곳이 맛집',
      '왕실에 대한 불경죄(Lèse-majesté)는 중범죄 — 주의',
      '쏨땀(파파야 샐러드) 주문 시 "맵기 조절" 꼭 요청',
      '야시장은 짜뚜짝(주말), 아시아티크(매일) 추천',
      '팁 문화: 식당 20-50바트, 마사지 50-100바트'
    ],
    price_index: JSON.stringify({meal:4000,coffee:3000,beer:2500,taxi_1km:300,subway:1000,hotel_avg:60000}),
    image_url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200'
  },
  {
    city: 'Danang', country: 'Vietnam',
    overview: '베트남 중부의 해양 도시. 미케비치의 아름다운 해변, 바나힐 골든브릿지, 호이안·후에 등 유네스코 유산 도시 접근성이 뛰어나 리조트 휴양과 문화체험을 동시에 즐길 수 있습니다.',
    population: '약 130만 명', area: '1,285 km²', language: '베트남어',
    timezone: 'UTC+7 (한국보다 2시간 느림)', currency: 'VND (동)',
    visa_info: '한국 여권 소지자 45일 무비자 입국 가능 (2023년 연장).',
    best_season: '건기(2-8월)가 최적. 특히 5-8월 해변 시즌. 9-12월은 우기로 태풍 가능성.',
    weather_summary: JSON.stringify({"1":{"high":25,"low":19,"rain":95},"2":{"high":26,"low":20,"rain":30},"3":{"high":29,"low":22,"rain":25},"4":{"high":32,"low":24,"rain":25},"5":{"high":34,"low":25,"rain":60},"6":{"high":34,"low":26,"rain":85},"7":{"high":34,"low":26,"rain":85},"8":{"high":34,"low":25,"rain":115},"9":{"high":32,"low":24,"rain":300},"10":{"high":29,"low":23,"rain":600},"11":{"high":27,"low":22,"rain":350},"12":{"high":25,"low":20,"rain":200}}),
    transport_info: JSON.stringify({airport:"다낭공항: 시내까지 택시 10분(50,000~80,000동)", local:["택시(비나선/마이린)","그랩","오토바이 렌트","시내버스"], card:"없음 (현금 위주)", tips:"그랩 바이크가 가장 저렴하고 편리"}),
    local_tips: [
      '호이안 올드타운은 다낭에서 택시 30분 — 반드시 방문',
      '미케비치는 해변 바로 앞 해산물 레스토랑 이용',
      '바나힐(골든브릿지)은 오전 일찍 가야 안개 없음',
      '한시장(Han Market)에서 기념품 쇼핑 — 흥정 필수',
      '베트남 커피(쓰어다)는 연유 아이스커피 — 꼭 맛보기',
      '용다리(Dragon Bridge)는 주말 밤 불쇼 (21시)'
    ],
    price_index: JSON.stringify({meal:3000,coffee:1500,beer:1200,taxi_1km:200,subway:0,hotel_avg:50000}),
    image_url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200'
  },
  {
    city: 'Paris', country: 'France',
    overview: '예술, 패션, 미식의 도시. 에펠탑, 루브르 박물관, 노트르담 대성당 등 세계적 랜드마크가 밀집해 있으며, 센강을 따라 펼쳐지는 로맨틱한 풍경은 영원한 "빛의 도시"입니다.',
    population: '약 215만 명 (도시권 1,200만)', area: '105 km²', language: '프랑스어',
    timezone: 'UTC+1 (한국보다 8시간 느림, 서머타임 시 7시간)', currency: 'EUR (유로)',
    visa_info: '한국 여권 소지자 쉥겐 지역 90일 무비자 입국 가능.',
    best_season: '봄(4-6월)과 가을(9-10월)이 최적. 여름(7-8월)은 관광 성수기이나 무더울 수 있음.',
    weather_summary: JSON.stringify({"1":{"high":7,"low":2,"rain":50},"2":{"high":8,"low":2,"rain":45},"3":{"high":12,"low":5,"rain":50},"4":{"high":16,"low":7,"rain":50},"5":{"high":20,"low":11,"rain":65},"6":{"high":23,"low":14,"rain":55},"7":{"high":25,"low":16,"rain":60},"8":{"high":25,"low":16,"rain":50},"9":{"high":22,"low":13,"rain":50},"10":{"high":17,"low":10,"rain":60},"11":{"high":11,"low":5,"rain":55},"12":{"high":8,"low":3,"rain":55}}),
    transport_info: JSON.stringify({airport:"샤를드골공항: RER B 35분(€11.80), 루아시버스 70분(€16.20). 오를리공항: 오를리발+RER B 35분(€14.10)", local:["메트로(16개 노선)","RER(5개 노선)","버스","트램"], card:"Navigo Easy (충전식)", tips:"카르네 10장 묶음 구매 또는 Navigo Jour 1일권(€8.45)"}),
    local_tips: [
      '메트로에서 소매치기 주의 — 가방은 앞으로',
      '루브르는 수·금 야간개장(21:45까지) 활용 — 인파 적음',
      '레스토랑 점심 코스(formule)가 저녁보다 훨씬 저렴',
      '일요일은 많은 상점이 문을 닫으므로 주의',
      '"봉주르" 인사 없이 가게 입장은 무례한 행동',
      '에펠탑은 온라인 사전 예약 필수 (현장 2시간+ 대기)',
      '뮤지엄패스(2일 €62) — 60여 곳 무제한 입장'
    ],
    price_index: JSON.stringify({meal:18000,coffee:5500,beer:8000,taxi_1km:2500,subway:2800,hotel_avg:180000}),
    image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200'
  },
  {
    city: 'London', country: 'United Kingdom',
    overview: '영국의 수도이자 세계 금융·문화의 중심지. 빅벤, 타워브릿지, 대영박물관 등 역사적 명소와 웨스트엔드 뮤지컬, 다문화 미식이 어우러진 도시입니다.',
    population: '약 900만 명', area: '1,572 km²', language: '영어',
    timezone: 'UTC+0 (한국보다 9시간 느림, 서머타임 시 8시간)', currency: 'GBP (파운드)',
    visa_info: '한국 여권 소지자 6개월 무비자 입국 가능. ETA 도입 예정(2025~).',
    best_season: '봄~초여름(4-6월) 최적. 일조시간 길고 기온 쾌적. 겨울(11-2월)은 어둡고 습함.',
    weather_summary: JSON.stringify({"1":{"high":8,"low":2,"rain":55},"2":{"high":9,"low":2,"rain":40},"3":{"high":12,"low":4,"rain":40},"4":{"high":15,"low":6,"rain":45},"5":{"high":18,"low":9,"rain":50},"6":{"high":22,"low":12,"rain":45},"7":{"high":25,"low":14,"rain":45},"8":{"high":24,"low":14,"rain":50},"9":{"high":21,"low":11,"rain":50},"10":{"high":16,"low":8,"rain":60},"11":{"high":11,"low":5,"rain":60},"12":{"high":8,"low":3,"rain":55}}),
    transport_info: JSON.stringify({airport:"히드로공항: 히드로 익스프레스 15분(£25), 튜브 피카딜리선 60분(£5.50). 개트윅공항: 개트윅 익스프레스 30분(£19.90)", local:["튜브(지하철 11개 노선)","버스","DLR","오버그라운드","엘리자베스 라인"], card:"Oyster Card / 컨택트리스 결제", tips:"존1-2 기준 Oyster 일일 상한 £8.10 — 자동 캡핑"}),
    local_tips: [
      '대영박물관, 내셔널갤러리 등 주요 박물관 무료',
      '우버보다 튜브가 빠르고 저렴 — 러시아워 주의',
      '뮤지컬 할인 티켓: TKTS 부스(레스터스퀘어) 또는 TodayTix 앱',
      '일요일 브런치 문화 — 풀 잉글리시 브렉퍼스트 추천',
      '오이스터 카드 대신 컨택트리스 카드(비자/마스터) 가능',
      '팁: 레스토랑 10-15%, 택시 10%, 펍은 불필요',
      '날씨 변덕 — 접이식 우산 필수'
    ],
    price_index: JSON.stringify({meal:20000,coffee:6500,beer:9000,taxi_1km:3500,subway:3500,hotel_avg:200000}),
    image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200'
  },
  {
    city: 'Jeju', country: 'South Korea',
    overview: '한국의 대표 휴양 섬. 유네스코 세계자연유산 한라산, 독특한 용암 지형, 해녀 문화, 감귤밭 등 자연과 문화가 어우러진 섬으로 국내 여행 1순위 목적지입니다.',
    population: '약 68만 명', area: '1,849 km²', language: '한국어',
    timezone: 'UTC+9', currency: 'KRW (원)',
    visa_info: '내국인 별도 비자 불필요. 외국인은 제주도 무비자 30일 입국 가능.',
    best_season: '봄(4-5월) 유채꽃·벚꽃, 여름(7-8월) 해변, 가을(10-11월) 억새·단풍. 겨울은 바람 강하나 동백꽃 아름다움.',
    weather_summary: JSON.stringify({"1":{"high":8,"low":3,"rain":60},"2":{"high":9,"low":3,"rain":60},"3":{"high":13,"low":7,"rain":95},"4":{"high":18,"low":11,"rain":90},"5":{"high":22,"low":15,"rain":95},"6":{"high":26,"low":20,"rain":175},"7":{"high":30,"low":24,"rain":210},"8":{"high":31,"low":25,"rain":250},"9":{"high":27,"low":21,"rain":180},"10":{"high":22,"low":16,"rain":80},"11":{"high":16,"low":10,"rain":70},"12":{"high":10,"low":5,"rain":50}}),
    transport_info: JSON.stringify({airport:"제주공항: 시내까지 버스 20분(₩1,200), 택시 15분(₩5,000~8,000)", local:["시내버스","시외버스(급행·일반)","렌터카(가장 추천)","전기 자전거"], card:"티머니/캐시비", tips:"렌터카가 거의 필수 — 대중교통은 배차간격 길음"}),
    local_tips: [
      '렌터카가 사실상 필수 — 대중교통 불편',
      '한라산 등반은 사전 예약 필수 (성판악/관음사 코스)',
      '흑돼지 거리는 제주시 탑동, 성산일출봉 근처도 맛집 다수',
      '해녀의 집에서 갓 잡은 해산물 맛보기',
      '올레길 걷기 — 26개 코스 중 7코스(외돌개~월평) 인기',
      '바람이 강하므로 방풍 자켓 준비'
    ],
    price_index: JSON.stringify({meal:10000,coffee:4500,beer:4000,taxi_1km:800,subway:0,hotel_avg:100000}),
    image_url: 'https://images.unsplash.com/photo-1579169326371-fa6a5c546a62?w=1200'
  },
  {
    city: 'Seoul', country: 'South Korea',
    overview: '대한민국의 수도. 600년 역사의 고궁과 K-pop·K-뷰티의 현대 문화가 공존하는 도시. 명동, 홍대, 강남, 북촌한옥마을 등 다양한 매력을 갖추고 있습니다.',
    population: '약 950만 명', area: '605 km²', language: '한국어',
    timezone: 'UTC+9', currency: 'KRW (원)',
    visa_info: '내국인 해당 없음. 외국인은 국적별 상이 (일본·미국 등 90일 무비자).',
    best_season: '봄(4-5월) 벚꽃, 가을(9-11월) 단풍이 최고. 여름은 장마+무더위, 겨울은 영하권 한파.',
    weather_summary: JSON.stringify({"1":{"high":1,"low":-6,"rain":20},"2":{"high":4,"low":-4,"rain":25},"3":{"high":11,"low":2,"rain":45},"4":{"high":18,"low":8,"rain":75},"5":{"high":24,"low":14,"rain":100},"6":{"high":28,"low":20,"rain":135},"7":{"high":30,"low":23,"rain":395},"8":{"high":31,"low":24,"rain":350},"9":{"high":27,"low":18,"rain":170},"10":{"high":20,"low":11,"rain":50},"11":{"high":12,"low":3,"rain":55},"12":{"high":3,"low":-4,"rain":25}}),
    transport_info: JSON.stringify({airport:"인천공항: 공항철도 직통 43분(₩9,500), 리무진버스 70분(₩16,000). 김포공항: 지하철 9호선/공항철도", local:["지하철(1-9호선+수인분당 등)","버스(시내·마을)","따릉이(공유자전거)","택시"], card:"티머니/캐시비", tips:"기후동행카드(월 ₩65,000) — 지하철·버스·따릉이 무제한"}),
    local_tips: [
      '한복 입고 궁궐(경복궁·창덕궁) 방문하면 무료 입장',
      '교통카드(티머니) 하나면 지하철·버스·편의점 결제 가능',
      '명동 길거리 음식: 달걀빵, 호떡, 닭꼬치 필수 체험',
      '한강공원 치맥(치킨+맥주)은 서울 필수 경험',
      '북촌한옥마을 방문은 주민 배려 — 조용히 관람',
      '밤 문화는 홍대/이태원/강남 중 취향대로'
    ],
    price_index: JSON.stringify({meal:9000,coffee:4500,beer:4000,taxi_1km:800,subway:1400,hotel_avg:100000}),
    image_url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200'
  },
  {
    city: 'Singapore', country: 'Singapore',
    overview: '동남아의 도시국가. 마리나베이샌즈, 가든스바이더베이 등 미래적 스카이라인과 다민족 문화(중국·말레이·인도)가 만들어낸 독특한 미식 문화, 깨끗하고 안전한 환경이 매력입니다.',
    population: '약 560만 명', area: '733 km²', language: '영어, 중국어, 말레이어, 타밀어 (4개 공용어)',
    timezone: 'UTC+8 (한국보다 1시간 느림)', currency: 'SGD (싱가포르 달러)',
    visa_info: '한국 여권 소지자 90일 무비자 입국 가능. SG 입국카드 온라인 사전 제출.',
    best_season: '연중 열대 기후로 큰 차이 없으나, 건기(2-4월)가 상대적으로 쾌적. 11-1월은 우기.',
    weather_summary: JSON.stringify({"1":{"high":31,"low":24,"rain":250},"2":{"high":32,"low":24,"rain":160},"3":{"high":32,"low":25,"rain":185},"4":{"high":32,"low":25,"rain":175},"5":{"high":32,"low":25,"rain":170},"6":{"high":32,"low":25,"rain":130},"7":{"high":31,"low":25,"rain":150},"8":{"high":31,"low":25,"rain":175},"9":{"high":31,"low":24,"rain":170},"10":{"high":32,"low":24,"rain":195},"11":{"high":31,"low":24,"rain":255},"12":{"high":31,"low":24,"rain":270}}),
    transport_info: JSON.stringify({airport:"창이공항: MRT 30분(S$2.20), 택시 25분(S$20~40)", local:["MRT(6개 노선)","버스","택시/그랩"], card:"EZ-Link Card / SimplyGo 컨택트리스", tips:"투어리스트 패스(1일 S$22/2일 S$29/3일 S$34) 무제한 MRT·버스"}),
    local_tips: [
      '호커센터(hawker centre)에서 미슐랭 맛집을 S$5에 — 맥스웰, 라우파삿 추천',
      '껌 반입·흡연·무단횡단 등 벌금 엄격 — 규칙 준수',
      '가든스바이더베이 수퍼트리 쇼(19:45, 20:45) 무료',
      '마리나베이샌즈 인피니티풀은 숙박객 전용',
      '센토사섬은 반나절~1일 투어로 (유니버설 스튜디오 포함)',
      '에어컨이 매우 강함 — 실내용 긴팔 준비',
      'Grab 앱이 택시/배달 통합 — 필수 설치'
    ],
    price_index: JSON.stringify({meal:8000,coffee:6000,beer:10000,taxi_1km:1500,subway:1800,hotel_avg:180000}),
    image_url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200'
  }
];

async function seed() {
  console.log('[Seed] Starting city_info seeding...');

  for (const c of cities) {
    await db.query(`
      INSERT INTO city_info (city, country, overview, population, area, language, timezone, currency, visa_info, best_season, weather_summary, transport_info, local_tips, price_index, image_url, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW())
      ON CONFLICT (city) DO UPDATE SET
        country=EXCLUDED.country, overview=EXCLUDED.overview, population=EXCLUDED.population,
        area=EXCLUDED.area, language=EXCLUDED.language, timezone=EXCLUDED.timezone,
        currency=EXCLUDED.currency, visa_info=EXCLUDED.visa_info, best_season=EXCLUDED.best_season,
        weather_summary=EXCLUDED.weather_summary, transport_info=EXCLUDED.transport_info,
        local_tips=EXCLUDED.local_tips, price_index=EXCLUDED.price_index,
        image_url=EXCLUDED.image_url, updated_at=NOW()
    `, [c.city, c.country, c.overview, c.population, c.area, c.language, c.timezone, c.currency, c.visa_info, c.best_season, c.weather_summary, c.transport_info, c.local_tips, c.price_index, c.image_url]);
    console.log(`  ✓ ${c.city}`);
  }
  
  console.log(`[Seed] Done — ${cities.length} cities seeded.`);
}

module.exports = { seed, cities };

// Run standalone: node seed-city-info.js
if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
