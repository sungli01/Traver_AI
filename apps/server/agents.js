const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Knowledge DB integration
let retriever = null;
try { retriever = require('./retriever'); } catch (e) { /* DB not available */ }

/**
 * Concierge Agent: 사용자의 요청을 분석하고 적절한 에이전트에게 전달
 */
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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: `당신은 VoyageSafe AI의 전문 여행 컨시어지입니다.

## 핵심 규칙
사용자가 여행 계획을 요청하면, 반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트를 포함하지 마세요.
일반 대화(인사, 질문 등)에는 자연스러운 한국어로 답변하세요.

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

## 필수 사항
1. 각 활동에 예상 비용(cost) 반드시 포함 (한국 원화 기준)
8. 각 활동에 lat, lng (위도, 경도) 반드시 포함 — 지도 표시용. 정확한 좌표를 사용하라.
2. 식당은 signature 필드에 시그니처 메뉴 / 추천 메뉴 필수
3. 가능한 한 실제 존재하는 장소의 공식 링크(link) 포함
4. 숙소 정보는 각 day의 accommodation에 포함 (link 포함)
5. 각 day의 dailyCost에 해당 일 총 예상 비용 기록
6. summary에 여행 전체 핵심 요약 포함
7. 현실적이고 실현 가능한 일정으로 구성

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
- \`\`\`json 블록 없이 순수 JSON만 출력하라. 앞뒤 설명 텍스트 없이 { 로 시작하고 } 로 끝나라.`,
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
  };
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(cityMap)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

// Enhanced version that injects DB context
async function processAgentRequestWithKnowledge(message, context = [], options = {}) {
  if (!retriever) return processAgentRequest(message, context, options);

  try {
    const cityInfo = extractCityFromMessage(message);
    if (cityInfo) {
      const dbContext = await retriever.buildContext(cityInfo.city, cityInfo.country);
      if (dbContext) {
        const enrichedMessage = message + dbContext;
        return processAgentRequest(enrichedMessage, context, options);
      }
    }
  } catch (err) {
    console.error('[Knowledge] Context injection error:', err.message);
  }
  return processAgentRequest(message, context, options);
}

module.exports = { processAgentRequest, processAgentRequestWithKnowledge };
