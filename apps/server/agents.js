const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Knowledge DB integration
let retriever = null;
let priceVerifier = null;
let db = null;
try { retriever = require('./retriever'); } catch (e) { /* DB not available */ }
try { priceVerifier = require('./price-verifier'); } catch (e) { /* price verifier not available */ }
try { db = require('./db'); } catch (e) { /* DB not available */ }

// City name cache for DB-based matching
let _cityNameCache = null;
let _cityNameCacheTime = 0;
const CITY_CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getCityNameCache() {
  if (_cityNameCache && Date.now() - _cityNameCacheTime < CITY_CACHE_TTL) return _cityNameCache;
  if (!db) return [];
  try {
    const res = await db.query('SELECT city, country FROM city_info');
    _cityNameCache = res.rows;
    _cityNameCacheTime = Date.now();
    return _cityNameCache;
  } catch (e) { return []; }
}

function matchCitiesFromDB(message, cityList) {
  const lower = message.toLowerCase();
  const matched = [];
  for (const row of cityList) {
    if (lower.includes(row.city.toLowerCase())) {
      matched.push(row);
    }
  }
  return matched;
}

async function buildCityInfoContext(cityName) {
  if (!db) return '';
  try {
    const res = await db.query('SELECT * FROM city_info WHERE city = $1', [cityName]);
    if (res.rows.length === 0) return '';
    const c = res.rows[0];
    
    const now = new Date();
    const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    const curMonth = monthNames[now.getMonth()];
    
    let weatherLine = '';
    if (c.weather_summary) {
      const ws = typeof c.weather_summary === 'string' ? JSON.parse(c.weather_summary) : c.weather_summary;
      const monthKey = Object.keys(ws).find(k => k.includes(curMonth) || k.includes(String(now.getMonth()+1)));
      if (monthKey && ws[monthKey]) {
        const w = ws[monthKey];
        weatherLine = `날씨(${curMonth}): 최고 ${w.high || w.max || '?'}°C, 최저 ${w.low || w.min || '?'}°C`;
      }
    }
    
    let priceLine = '';
    if (c.price_index) {
      const pi = typeof c.price_index === 'string' ? JSON.parse(c.price_index) : c.price_index;
      const parts = [];
      if (pi.meal) parts.push(`식사 ${pi.meal}`);
      if (pi.coffee) parts.push(`커피 ${pi.coffee}`);
      if (pi.beer) parts.push(`맥주 ${pi.beer}`);
      priceLine = parts.length > 0 ? `물가: ${parts.join(', ')}` : '';
    }
    
    let transportLine = '';
    if (c.transport_info) {
      const ti = typeof c.transport_info === 'string' ? JSON.parse(c.transport_info) : c.transport_info;
      if (ti.airport) transportLine = `교통: ${ti.airport}`;
      else if (ti.summary) transportLine = `교통: ${ti.summary}`;
    }

    // Get top places
    let placesLine = '';
    if (retriever) {
      try {
        const places = await retriever.getPlacesForCity(cityName, { country: c.country, limit: 10 });
        if (places.length > 0) {
          placesLine = `주요 관광지: ${places.map(p => p.name).join(', ')}`;
        }
      } catch (e) { /* ignore */ }
    }

    let ctx = `\n\n[도시 데이터: ${cityName}]\n`;
    ctx += `개요: ${c.overview || ''}\n`;
    if (weatherLine) ctx += `${weatherLine}\n`;
    if (priceLine) ctx += `${priceLine}\n`;
    if (transportLine) ctx += `${transportLine}\n`;
    if (c.visa_info) ctx += `비자: ${c.visa_info}\n`;
    if (c.best_season) ctx += `추천 시기: ${c.best_season}\n`;
    if (c.currency) ctx += `통화: ${c.currency}\n`;
    if (c.language) ctx += `언어: ${c.language}\n`;
    if (c.local_tips && c.local_tips.length > 0) ctx += `현지 팁: ${c.local_tips.join(' / ')}\n`;
    if (placesLine) ctx += `${placesLine}\n`;
    
    return ctx;
  } catch (e) {
    console.error('[CityInfo] Error:', e.message);
    return '';
  }
}

/**
 * Concierge Agent: 사용자의 요청을 분석하고 적절한 에이전트에게 전달
 */
// Plan-based system prompt prefixes
const PLAN_PROMPTS = {
  free: '[Free 플랜 사용자] 기본 수준의 여행 정보를 제공하세요. 주요 관광지 위주로 간략하게 안내합니다.',
  pro: '[Pro 프리미엄 회원] 이 사용자는 Pro 회원입니다. 현지인만 아는 숨겨진 맛집, 구체적인 가격 정보(메뉴별 가격대), 최적 이동 경로와 소요시간, 시간대별 추천(아침/점심/저녁 골든타임), 날씨 맞춤 옷차림 제안, 현지 할인 팁, 줄 안 서는 시간대, 사진 명소 등 프리미엄 수준의 상세하고 실용적인 정보를 제공하세요. 매 장소마다 "💡 Pro Tip"을 추가하세요.',
  business: '[Business VIP 회원] 이 사용자는 VIP 비즈니스 회원입니다. 비즈니스 출장/럭셔리 여행에 특화된 추천을 제공하세요. 비즈니스 호텔(미팅룸/라운지 유무), 공항 라운지 접근성, 비즈니스석 항공편, 미팅에 적합한 레스토랑(프라이빗 룸), 고급 교통수단(리무진/전용차량), 비즈니스 센터가 있는 카페, VIP 전용 투어, 컨시어지 서비스 정보를 포함하세요. 매 장소마다 "👑 VIP Note"를 추가하세요.',
};

async function processAgentRequest(message, context = [], options = {}) {
  try {
    // Auto-detect message type from content if not explicitly provided
    let msgType = options.type || 'generate';
    if (!options.type) {
      if (message.includes('[기존 일정 컨텍스트]')) {
        msgType = 'modify';
      } else if (!/여행|계획|일정|코스|추천/.test(message) && message.length < 100) {
        msgType = 'chat';
      }
    }
    const maxTokensMap = { chat: 1024, generate: 8192, modify: 4096 };
    const maxTokens = maxTokensMap[msgType] || 8192;

    // Build goals section for system prompt
    const goals = options.goals || [];
    const goalsSection = goals.length > 0
      ? `\n\n## 현재 여행 목표 (절대 무시하지 마라 — 모든 일정에 반드시 반영할 것)\n${goals.map(g => `- ${g}`).join('\n')}\n`
      : '';

    // Plan-based prompt injection
    const userPlan = options.plan || 'free';
    const planPrompt = PLAN_PROMPTS[userPlan] || PLAN_PROMPTS.free;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: `당신은 TravelAgent AI의 전문 여행 컨시어지입니다.

${planPrompt}${goalsSection}

## 핵심 규칙
사용자가 여행 계획을 요청하거나, "설계해줘", "계획해줘", "일정", "[기존 일정 컨텍스트]" 등의 키워드가 포함되면, 반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트를 절대 포함하지 마세요. 텍스트 요약 금지.
일반 대화(인사, 질문 등)에는 자연스러운 한국어로 답변하세요.
일정을 수정할 때는 반드시 JSON 앞에 '📝 변경 요약:' 섹션을 추가하여 어떤 부분이 어떻게 바뀌었는지 간단히 설명한 후 수정된 전체 JSON을 제공하세요.

## 여행 계획 JSON 형식
\`\`\`json
{
  "type": "itinerary",
  "title": "여행 제목",
  "destination": "목적지",
  "period": "3월 15일 ~ 3월 18일",
  "totalBudget": "1,500,000원",
  "summary": "이 여행의 핵심 포인트를 2-3문장으로 요약",
  "days": [
    {
      "day": 1,
      "date": "3월 15일 (토)",
      "theme": "도착 & 시내 탐방",
      "activities": [
        {
          "time": "09:00",
          "title": "인천공항 출발",
          "lat": 37.4602,
          "lng": 126.4407,
          "description": "대한항공 KE713편",
          "category": "transport",
          "cost": "350,000원",
          "link": "https://www.koreanair.com",
          "linkLabel": "대한항공 예약"
        },
        {
          "time": "12:00",
          "title": "이치란 라멘 본점",
          "lat": 33.5902,
          "lng": 130.4017,
          "description": "하카타 톤코츠 라멘의 원조",
          "category": "restaurant",
          "cost": "15,000원",
          "signature": "천연 톤코츠 라멘, 반숙 계란 토핑",
          "link": "https://ichiran.com",
          "linkLabel": "이치란 공식사이트"
        },
        {
          "time": "14:00",
          "title": "센소지 (浅草寺)",
          "lat": 35.7148,
          "lng": 139.7967,
          "description": "도쿄에서 가장 오래된 사찰. 나카미세 거리 쇼핑도 함께.",
          "category": "attraction",
          "cost": "무료",
          "link": "https://www.senso-ji.jp",
          "linkLabel": "센소지 안내"
        },
        {
          "time": "18:00",
          "title": "시부야 스카이",
          "lat": 35.6580,
          "lng": 139.7016,
          "description": "시부야 스크램블 스퀘어 전망대에서 도쿄 야경",
          "category": "attraction",
          "cost": "25,000원",
          "link": "https://www.shibuya-scramble-square.com",
          "linkLabel": "시부야 스카이 예약"
        },
        {
          "time": "20:00",
          "title": "신주쿠 오모이데 요코초",
          "lat": 35.6938,
          "lng": 139.6989,
          "description": "현지 분위기 가득한 골목 이자카야",
          "category": "restaurant",
          "cost": "30,000원",
          "signature": "야키토리, 모츠나베, 생맥주"
        }
      ],
      "accommodation": {
        "name": "호텔 그레이서리 신주쿠",
        "cost": "120,000원/박",
        "lat": 35.6940,
        "lng": 139.7013,
        "link": "https://gracery.com/shinjuku",
        "linkLabel": "호텔 예약"
      },
      "dailyCost": "540,000원"
    }
  ]
}
\`\`\`

## category 종류
- transport: 교통 (항공, 기차, 버스, 택시)
- restaurant: 식당 (signature 필드 필수 - 시그니처 메뉴/추천 메뉴)
- attraction: 관광지/명소
- shopping: 쇼핑
- activity: 액티비티/체험
- rest: 휴식/자유시간

## 검증된 데이터 사용 규칙 (최우선)
- 메시지에 [검증된 장소 데이터]가 포함되어 있으면, 해당 데이터의 **입장료, 가격, 좌표, 주소, 운영시간을 반드시 그대로 사용**하라.
- 검증된 데이터에 없는 가격을 절대 만들어내지 마라. 데이터에 "₩8,000"이라고 되어 있으면 cost에 "8,000원"을 사용하라.
- 검증된 데이터의 좌표(lat, lng)를 그대로 사용하라.
- 매 요청마다 **다른 조합과 순서**의 코스를 추천하라. 동일한 도시라도 매번 새로운 일정을 구성하라.
- 검증 데이터에 있는 장소를 우선 활용하되, 필요시 추가 장소를 포함할 수 있다. 단 추가 장소의 가격은 "미확인"으로 표기하라.

## 필수 사항
1. 각 활동에 예상 비용(cost) 반드시 포함 (한국 원화 기준)
8. 각 활동에 lat, lng (위도, 경도) 반드시 포함 — 지도 표시용. 정확한 좌표를 사용하라.
2. 식당은 signature 필드에 시그니처 메뉴 / 추천 메뉴 필수
3. 가능한 한 실제 존재하는 장소의 공식 링크(link) 포함
4. 숙소 정보는 각 day의 accommodation에 포함 (link 포함)
5. 각 day의 dailyCost에 해당 일 총 예상 비용 기록
6. summary에 여행 전체 핵심 요약 포함
7. 현실적이고 실현 가능한 일정으로 구성

## 장소 정보 규칙 — JSON 경량화 필수
- activity에 detail 객체를 넣지 마라. JSON이 너무 커지면 잘린다.
- 대신 각 activity에 다음 필드만 포함하라:
  - signature: "대표 메뉴 또는 핵심 특징" (한 줄)
  - hours: "운영시간" (예: "09:00-18:00")
  - admission: "입장료" (예: "₩8,000" 또는 "무료")
- 숙소(accommodation)에도 간결하게: name, cost, lat, lng만 필수.

## 예산 및 가격 규칙 (최우선 — 절대 위반 금지)

### 현실 가격 원칙
- **절대로 예산에 맞추기 위해 가격을 조작하지 마라.** 실제 시장 가격을 기반으로 작성하라.
- 항공권 가격 기준 (편도 아닌 왕복):
  - 한국↔일본: 30~60만원
  - 한국↔동남아: 40~80만원
  - 한국↔유럽: 100~180만원
  - 한국↔미주: 120~200만원
  - 한국↔라오스/캄보디아: 50~90만원
  - 한국↔중국/대만: 25~50만원
- 숙소 가격 기준 (1박):
  - 게스트하우스: 2~5만원 (동남아), 5~10만원 (일본/유럽)
  - 비즈니스호텔: 7~15만원 (동남아), 10~25만원 (일본), 15~30만원 (유럽)
  - 4~5성급: 15~40만원 (동남아), 25~60만원 (일본), 40~100만원 (유럽)
- 식사 가격 기준:
  - 동남아 로컬식: 3,000~8,000원
  - 일본 라멘/정식: 10,000~20,000원
  - 유럽 레스토랑: 20,000~50,000원

### 예산 초과 처리
- 현실적 가격으로 계산했을 때 예산을 초과하면, JSON을 생성하되 totalBudget에 실제 예상 비용을 적고, summary에 "제시된 예산(XX원)을 초과합니다. 현실적 최소 예상 비용은 약 XX원입니다." 라고 명시하라.
- 예산이 극단적으로 부족한 경우 (예: 해외여행 10만원): JSON 대신 일반 텍스트로 안내하라.

## 스타일별 가이드
- 럭셔리: 5성급 호텔, 미슐랭 레스토랑, 프리미엄 체험 위주
- 가성비: 게스트하우스/비즈니스호텔, 현지 맛집, 무료 관광지 활용
- 모험: 액티비티/야외활동 중심, 로컬 체험
- 비즈니스: 접근성 좋은 호텔, 효율적 동선, 비즈니스 미팅 고려

## 토큰 절약 규칙
- 일반 대화(인사, 질문 답변)는 간결하게 응답하라. 최대 200토큰.
- 일정 생성은 필요한 만큼만 작성하라.
- 부분 수정 요청 시: 변경된 Day만 JSON으로 반환하고, 나머지 Day는 포함하지 마라. 단, 전체 구조는 유지하되 변경 안 된 Day는 activities를 비워서 "기존 유지"로 표기하라.

## 부분 수정 규칙
- "[기존 일정 컨텍스트]"가 메시지에 포함되어 있으면, 이는 이미 생성된 일정이 있다는 뜻이다.
- 이 경우 전체 일정을 처음부터 재작성하지 말고, 사용자가 요청한 부분만 수정하라.
- 수정된 부분을 포함한 전체 JSON을 반환하되, 변경되지 않은 Day의 activities는 기존과 동일하게 유지하라.

## 출력 주의
- JSON 출력 시 반드시 완전한 JSON을 출력하라. 중간에 잘리지 않도록 간결하게 작성하라.
- 일정이 길면 (5일 이상) 각 day의 activities를 핵심 4-5개로 제한하라.
- \`\`\`json 블록 없이 순수 JSON만 출력하라. 앞뒤 설명 텍스트 없이 { 로 시작하고 } 로 끝나라.
- **lat, lng 좌표는 반드시 실제 위치의 정확한 위도/경도를 포함하라. 0이나 null 금지. 지도에 표시되므로 정확해야 한다.**
- accommodation(숙소)에도 lat, lng를 포함하라.`,
      messages: [
        ...context,
        { role: "user", content: message }
      ],
    });
    return response.content[0].text;
  } catch (error) {
    console.error("Agent Error:", error);
    return "Agent Error: " + error.message;
  }
}

// Extract city names from user message for DB context injection
function extractCityFromMessage(message) {
  // Common travel cities (Korean + English)
  const cityPatterns = [
    /(?:도쿄|tokyo)/i, /(?:오사카|osaka)/i, /(?:교토|kyoto)/i, /(?:후쿠오카|fukuoka)/i,
    /(?:방콕|bangkok)/i, /(?:파리|paris)/i, /(?:런던|london)/i, /(?:뉴욕|new\s?york)/i,
    /(?:하노이|hanoi)/i, /(?:호치민|ho\s?chi\s?minh)/i, /(?:다낭|danang)/i,
    /(?:발리|bali)/i, /(?:싱가포르|singapore)/i, /(?:홍콩|hong\s?kong)/i,
    /(?:타이베이|taipei)/i, /(?:세부|cebu)/i, /(?:치앙마이|chiang\s?mai)/i,
    /(?:바르셀로나|barcelona)/i, /(?:로마|rome|roma)/i, /(?:프라하|prague)/i,
    /(?:비엔나|vienna)/i, /(?:암스테르담|amsterdam)/i, /(?:라오스|luang\s?prabang)/i,
    /(?:시드니|sydney)/i, /(?:멜버른|melbourne)/i, /(?:제주|jeju)/i,
    /(?:부산|busan)/i, /(?:강릉|gangneung)/i, /(?:여수|yeosu)/i,
    /(?:순천|suncheon)/i, /(?:경주|gyeongju)/i, /(?:전주|jeonju)/i,
    /(?:속초|sokcho)/i, /(?:담양)/i, /(?:보성)/i, /(?:광주|gwangju)/i,
  ];
  const cityMap = {
    '도쿄': { city: '도쿄', country: '일본' }, 'tokyo': { city: '도쿄', country: '일본' },
    '오사카': { city: '오사카', country: '일본' }, 'osaka': { city: '오사카', country: '일본' },
    '교토': { city: '교토', country: '일본' }, 'kyoto': { city: '교토', country: '일본' },
    '후쿠오카': { city: '후쿠오카', country: '일본' }, 'fukuoka': { city: '후쿠오카', country: '일본' },
    '방콕': { city: '방콕', country: '태국' }, 'bangkok': { city: '방콕', country: '태국' },
    '파리': { city: '파리', country: '프랑스' }, 'paris': { city: '파리', country: '프랑스' },
    '런던': { city: '런던', country: '영국' }, 'london': { city: '런던', country: '영국' },
    '뉴욕': { city: '뉴욕', country: '미국' }, 'new york': { city: '뉴욕', country: '미국' },
    '하노이': { city: '하노이', country: '베트남' }, 'hanoi': { city: '하노이', country: '베트남' },
    '호치민': { city: '호치민', country: '베트남' }, 'ho chi minh': { city: '호치민', country: '베트남' },
    '다낭': { city: '다낭', country: '베트남' }, 'danang': { city: '다낭', country: '베트남' },
    '발리': { city: '발리', country: '인도네시아' }, 'bali': { city: '발리', country: '인도네시아' },
    '싱가포르': { city: '싱가포르', country: '싱가포르' }, 'singapore': { city: '싱가포르', country: '싱가포르' },
    '홍콩': { city: '홍콩', country: '홍콩' }, 'hong kong': { city: '홍콩', country: '홍콩' },
    '타이베이': { city: '타이베이', country: '대만' }, 'taipei': { city: '타이베이', country: '대만' },
    '세부': { city: '세부', country: '필리핀' }, 'cebu': { city: '세부', country: '필리핀' },
    '치앙마이': { city: '치앙마이', country: '태국' }, 'chiang mai': { city: '치앙마이', country: '태국' },
    '바르셀로나': { city: '바르셀로나', country: '스페인' }, 'barcelona': { city: '바르셀로나', country: '스페인' },
    '로마': { city: '로마', country: '이탈리아' }, 'rome': { city: '로마', country: '이탈리아' },
    '프라하': { city: '프라하', country: '체코' }, 'prague': { city: '프라하', country: '체코' },
    '시드니': { city: '시드니', country: '호주' }, 'sydney': { city: '시드니', country: '호주' },
    '제주': { city: '제주', country: '한국' }, 'jeju': { city: '제주', country: '한국' },
    '부산': { city: '부산', country: '한국' }, 'busan': { city: '부산', country: '한국' },
    '순천': { city: '순천', country: '한국' }, 'suncheon': { city: '순천', country: '한국' },
    '여수': { city: '여수', country: '한국' }, 'yeosu': { city: '여수', country: '한국' },
    '강릉': { city: '강릉', country: '한국' }, 'gangneung': { city: '강릉', country: '한국' },
    '경주': { city: '경주', country: '한국' }, 'gyeongju': { city: '경주', country: '한국' },
    '전주': { city: '전주', country: '한국' }, 'jeonju': { city: '전주', country: '한국' },
    '속초': { city: '속초', country: '한국' }, 'sokcho': { city: '속초', country: '한국' },
    '담양': { city: '담양', country: '한국' }, '보성': { city: '보성', country: '한국' },
    '광주': { city: '광주', country: '한국' }, 'gwangju': { city: '광주', country: '한국' },
  };
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(cityMap)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

// Enhanced version that injects DB context
async function processAgentRequestWithKnowledge(message, context = [], options = {}) {
  let enrichedMessage = message;

  try {
    // 1. Try DB-based city matching first (covers 300+ cities)
    const cityList = await getCityNameCache();
    const dbMatches = matchCitiesFromDB(message, cityList);
    
    // 2. Fall back to hardcoded patterns if no DB match
    const cityInfo = dbMatches.length > 0 ? dbMatches[0] : extractCityFromMessage(message);
    
    if (cityInfo) {
      const cityName = cityInfo.city;
      const countryName = cityInfo.country;

      // Inject city_info context
      const cityCtx = await buildCityInfoContext(cityName);
      if (cityCtx) enrichedMessage += cityCtx;

      // Inject verified places context (retriever)
      if (retriever) {
        try {
          const placesCtx = await retriever.buildContext(cityName, countryName);
          if (placesCtx) enrichedMessage += placesCtx;
        } catch (e) { /* ignore */ }

        // Background price verification (non-blocking)
        if (priceVerifier) {
          retriever.getPlacesForCity(cityName, { country: countryName }).then(places => {
            priceVerifier.verifyPrices(cityName, places).catch(e => 
              console.error('[PriceVerifier] Background verify error:', e.message));
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('[Knowledge] Context injection error:', err.message);
  }
  return processAgentRequest(enrichedMessage, context, options);
}

// Streaming version — yields text deltas via callback
async function processAgentRequestStream(message, context = [], options = {}, onDelta) {
  try {
    let msgType = options.type || 'generate';
    if (!options.type) {
      if (message.includes('[기존 일정 컨텍스트]')) {
        msgType = 'modify';
      } else if (!/여행|계획|일정|코스|추천/.test(message) && message.length < 100) {
        msgType = 'chat';
      }
    }
    const maxTokensMap = { chat: 1024, generate: 8192, modify: 4096 };
    const maxTokens = maxTokensMap[msgType] || 8192;

    const goals = options.goals || [];
    const goalsSection = goals.length > 0
      ? `\n\n## 현재 여행 목표 (절대 무시하지 마라 — 모든 일정에 반드시 반영할 것)\n${goals.map(g => `- ${g}`).join('\n')}\n`
      : '';

    // Plan-based prompt injection  
    const userPlan = options.plan || 'free';
    const planPrompt = PLAN_PROMPTS[userPlan] || PLAN_PROMPTS.free;

    // Use the same system prompt as processAgentRequest
    const systemPrompt = `당신은 TravelAgent AI의 전문 여행 컨시어지입니다.

${planPrompt}${goalsSection}

## 핵심 규칙
사용자가 여행 계획을 요청하거나, "설계해줘", "계획해줘", "일정", "[기존 일정 컨텍스트]" 등의 키워드가 포함되면, 반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트를 절대 포함하지 마세요. 텍스트 요약 금지.
일반 대화(인사, 질문 등)에는 자연스러운 한국어로 답변하세요.
일정을 수정할 때는 반드시 JSON 앞에 '📝 변경 요약:' 섹션을 추가하여 어떤 부분이 어떻게 바뀌었는지 간단히 설명한 후 수정된 전체 JSON을 제공하세요.

## 필수 JSON 형식
\`\`\`json
{
  "type": "itinerary",
  "title": "여행 제목",
  "destination": "목적지",
  "period": "기간",
  "totalBudget": "예산",
  "summary": "한줄 요약",
  "days": [
    {
      "day": 1,
      "date": "날짜",
      "theme": "테마",
      "activities": [
        {
          "time": "10:00",
          "title": "활동명",
          "description": "설명",
          "category": "transport|restaurant|attraction|shopping|activity|rest",
          "cost": "비용",
          "lat": 34.9500,
          "lng": 127.4900
        }
      ]
    }
  ]
}
\`\`\`

## 검증된 데이터 사용 규칙 (최우선)
- 메시지에 [검증된 장소 데이터]가 포함되어 있으면, 해당 데이터의 **입장료, 가격, 좌표, 주소, 운영시간을 반드시 그대로 사용**하라.
- 검증된 데이터에 없는 가격을 절대 만들어내지 마라.
- 매 요청마다 **다른 조합과 순서**의 코스를 추천하라.
- 검증 데이터에 있는 장소를 우선 활용하되, 추가 장소의 가격은 "미확인"으로 표기하라.

## 출력 주의
- JSON 출력 시 반드시 완전한 JSON을 출력하라. 중간에 잘리지 않도록 간결하게 작성하라.
- 일정이 길면 (5일 이상) 각 day의 activities를 핵심 4-5개로 제한하라.
- 절대로 텍스트 요약만 하지 마라. 반드시 위 JSON 형식으로 출력하라.
- **lat, lng 좌표는 반드시 실제 위치의 정확한 위도/경도를 포함하라. 0이나 null 금지. 지도에 표시되므로 정확해야 한다.**
- accommodation(숙소)에도 lat, lng를 포함하라.`;

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        ...context,
        { role: "user", content: message }
      ],
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const text = event.delta.text;
        fullText += text;
        onDelta(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Agent Stream Error:", error);
    throw error;
  }
}

async function processAgentRequestWithKnowledgeStream(message, context = [], options = {}, onDelta) {
  let enrichedMessage = message;

  try {
    const cityList = await getCityNameCache();
    const dbMatches = matchCitiesFromDB(message, cityList);
    const cityInfo = dbMatches.length > 0 ? dbMatches[0] : extractCityFromMessage(message);

    if (cityInfo) {
      const cityName = cityInfo.city;
      const countryName = cityInfo.country;

      const cityCtx = await buildCityInfoContext(cityName);
      if (cityCtx) enrichedMessage += cityCtx;

      if (retriever) {
        try {
          const placesCtx = await retriever.buildContext(cityName, countryName);
          if (placesCtx) enrichedMessage += placesCtx;
        } catch (e) { /* ignore */ }

        if (priceVerifier) {
          retriever.getPlacesForCity(cityName, { country: countryName }).then(places => {
            priceVerifier.verifyPrices(cityName, places).catch(e =>
              console.error('[PriceVerifier] Background verify error:', e.message));
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('[Knowledge] Context injection error:', err.message);
  }
  return processAgentRequestStream(enrichedMessage, context, options, onDelta);
}

// ─── 컨텍스트 압축: 5턴 이상이면 오래된 대화를 요약 ───
function compressContext(context) {
  if (!context || context.length <= 6) return context; // 3턴(6메시지) 이하 그대로
  const recent = context.slice(-6); // 최근 3턴 원문 유지
  const older = context.slice(0, -6);
  // AI 호출 없이 키워드 추출로 요약
  const summary = older.map(m => {
    const role = m.role === 'user' ? '사용자' : 'AI';
    // 각 메시지에서 핵심만 추출 (처음 80자)
    const content = (m.content || '').substring(0, 80).replace(/\n/g, ' ');
    return `${role}: ${content}`;
  }).join(' | ').substring(0, 300);
  return [{ role: 'system', content: `[이전 대화 요약] ${summary}` }, ...recent];
}

// ─── 질문 유형별 최소 컨텍스트 빌드 ───
function detectQueryType(message) {
  const q = message.toLowerCase();
  if (/맛집|음식|먹거리|뭐\s*먹|식당|레스토랑/.test(q)) return 'food';
  if (/날씨|기온|기후|온도/.test(q)) return 'weather';
  if (/교통|공항|이동|택시|지하철/.test(q)) return 'transport';
  if (/비자|입국|여권/.test(q)) return 'visa';
  if (/물가|가격|비용|얼마|환율/.test(q)) return 'price';
  if (/관광지|볼거리|명소|어디\s*가/.test(q)) return 'attractions';
  if (/여행|계획|일정|코스|설계/.test(q)) return 'itinerary';
  return 'general';
}

async function buildMinimalCityContext(cityName, queryType) {
  if (!db) return '';
  try {
    const res = await db.query('SELECT * FROM city_info WHERE city = $1', [cityName]);
    if (res.rows.length === 0) return '';
    const c = res.rows[0];

    // 쿼리 유형별 필요 필드만 선택
    const fieldMap = {
      food: ['price_index'],
      weather: ['weather_summary', 'best_season'],
      transport: ['transport_info'],
      visa: ['visa_info'],
      price: ['price_index', 'currency'],
      attractions: [],
      general: ['overview', 'best_season', 'currency'],
      itinerary: ['overview', 'weather_summary', 'best_season', 'price_index', 'currency', 'transport_info', 'visa_info'],
    };

    const fields = fieldMap[queryType] || fieldMap.general;
    let ctx = `\n\n[도시 데이터: ${cityName} (${c.country})]\n`;

    if (fields.includes('overview') && c.overview) ctx += `개요: ${c.overview}\n`;
    if (fields.includes('weather_summary') && c.weather_summary) {
      const ws = typeof c.weather_summary === 'string' ? JSON.parse(c.weather_summary) : c.weather_summary;
      const now = new Date();
      const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
      const curMonth = monthNames[now.getMonth()];
      const monthKey = Object.keys(ws).find(k => k.includes(curMonth) || k.includes(String(now.getMonth()+1)));
      if (monthKey && ws[monthKey]) {
        const w = ws[monthKey];
        ctx += `날씨(${curMonth}): 최고 ${w.high || w.max || '?'}°C, 최저 ${w.low || w.min || '?'}°C\n`;
      }
    }
    if (fields.includes('best_season') && c.best_season) ctx += `추천 시기: ${c.best_season}\n`;
    if (fields.includes('currency') && c.currency) ctx += `통화: ${c.currency}\n`;
    if (fields.includes('visa_info') && c.visa_info) ctx += `비자: ${c.visa_info}\n`;
    if (fields.includes('price_index') && c.price_index) {
      const pi = typeof c.price_index === 'string' ? JSON.parse(c.price_index) : c.price_index;
      const parts = [];
      if (pi.meal) parts.push(`식사 ${pi.meal}`);
      if (pi.coffee) parts.push(`커피 ${pi.coffee}`);
      if (parts.length > 0) ctx += `물가: ${parts.join(', ')}\n`;
    }
    if (fields.includes('transport_info') && c.transport_info) {
      const ti = typeof c.transport_info === 'string' ? JSON.parse(c.transport_info) : c.transport_info;
      if (ti.airport) ctx += `교통: ${ti.airport}\n`;
      else if (ti.summary) ctx += `교통: ${ti.summary}\n`;
    }

    // 관련 장소만 주입
    if (retriever) {
      try {
        const categoryFilter = queryType === 'food' ? 'restaurant' : queryType === 'attractions' ? 'attraction' : undefined;
        const limit = queryType === 'itinerary' ? 10 : 6;
        const places = await retriever.getPlacesForCity(cityName, { country: c.country, category: categoryFilter, limit });
        if (places.length > 0) {
          ctx += `주요 장소: ${places.map(p => p.name).join(', ')}\n`;
        }
      } catch (e) {}
    }

    return ctx;
  } catch (e) {
    return '';
  }
}

module.exports = { 
  processAgentRequest, processAgentRequestWithKnowledge, 
  processAgentRequestStream, processAgentRequestWithKnowledgeStream,
  compressContext, detectQueryType, buildMinimalCityContext
};
