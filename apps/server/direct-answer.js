const db = require('./db');

const PATTERNS = [
  { regex: /(.+?)\s*(날씨|기온|기후|온도|우기|건기)/, handler: 'weather', extract: 'city' },
  { regex: /(.+?)\s*(비자|입국|여권)/, handler: 'visa', extract: 'city' },
  { regex: /(.+?)\s*(환율|통화|화폐|돈)/, handler: 'currency', extract: 'city' },
  { regex: /(.+?)\s*(교통|공항|이동|택시|지하철|버스)/, handler: 'transport', extract: 'city' },
  { regex: /(.+?)\s*(물가|가격|비용|얼마)/, handler: 'price', extract: 'city' },
  { regex: /(.+?)\s*(시차|시간대|몇\s*시)/, handler: 'timezone', extract: 'city' },
  { regex: /(.+?)\s*(추천\s*시기|언제\s*가|베스트\s*시즌|여행\s*시기)/, handler: 'bestSeason', extract: 'city' },
  { regex: /(.+?)\s*(맛집|음식|먹거리|뭐\s*먹|식당|레스토랑)/, handler: 'food', extract: 'city' },
  { regex: /(.+?)\s*(관광지|볼거리|명소|어디\s*가|가볼\s*곳)/, handler: 'attractions', extract: 'city' },
  { regex: /(.+?)\s*(팁|주의|조심|알아둘|주의사항)/, handler: 'tips', extract: 'city' },
];

// 도시명 정리
function cleanCityName(raw) {
  return raw.replace(/[은는이가을를에서의로도만까지와과]\s*$/g, '').trim();
}

// DB에서 도시 매칭
async function findCity(rawCity) {
  const city = cleanCityName(rawCity);
  if (!city) return null;
  try {
    const res = await db.query(
      'SELECT * FROM city_info WHERE city ILIKE $1 OR city ILIKE $2',
      [city, `%${city}%`]
    );
    return res.rows[0] || null;
  } catch (e) {
    return null;
  }
}

// 프리컴파일된 응답 확인
async function checkPrecompiled(cityName, category) {
  try {
    const res = await db.query(
      'SELECT answer FROM precompiled_answers WHERE city ILIKE $1 AND category = $2',
      [cityName, category]
    );
    return res.rows[0]?.answer || null;
  } catch (e) {
    return null;
  }
}

const handlers = {
  async weather(cityData) {
    const c = cityData;
    const now = new Date();
    const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    const curMonth = monthNames[now.getMonth()];
    
    let weatherText = '';
    if (c.weather_summary) {
      const ws = typeof c.weather_summary === 'string' ? JSON.parse(c.weather_summary) : c.weather_summary;
      const monthKey = Object.keys(ws).find(k => k.includes(curMonth) || k.includes(String(now.getMonth()+1)));
      if (monthKey && ws[monthKey]) {
        const w = ws[monthKey];
        weatherText = `${c.city}의 ${curMonth} 날씨는 최고 ${w.high || w.max || '?'}°C, 최저 ${w.low || w.min || '?'}°C`;
        if (w.description) weatherText += `로 ${w.description}`;
        weatherText += '예요.';
      }
    }
    if (!weatherText) weatherText = `${c.city}의 현재 날씨 정보가 상세하지 않아요.`;
    
    if (c.best_season) {
      weatherText += ` 추천 방문 시기는 ${c.best_season}입니다.`;
    }
    return weatherText;
  },

  async visa(cityData) {
    const c = cityData;
    if (!c.visa_info) return null;
    return `${c.city}(${c.country}) 입국 정보: ${c.visa_info}`;
  },

  async currency(cityData) {
    const c = cityData;
    let text = `${c.city}(${c.country})에서는 ${c.currency || '현지 통화'}를 사용해요.`;
    try {
      const rates = await db.query('SELECT * FROM exchange_rates WHERE $1 ILIKE \'%\' || currency || \'%\'', [c.currency || '']);
      if (rates.rows[0]) {
        text += ` 현재 환율은 1${rates.rows[0].currency} = ${rates.rows[0].rate_per_krw}원이에요.`;
      }
    } catch (e) {}
    return text;
  },

  async transport(cityData) {
    const c = cityData;
    if (!c.transport_info) return null;
    const ti = typeof c.transport_info === 'string' ? JSON.parse(c.transport_info) : c.transport_info;
    let text = `${c.city} 교통 정보:\n`;
    if (ti.airport) text += `✈️ 공항: ${ti.airport}\n`;
    if (ti.metro) text += `🚇 지하철: ${ti.metro}\n`;
    if (ti.bus) text += `🚌 버스: ${ti.bus}\n`;
    if (ti.taxi) text += `🚕 택시: ${ti.taxi}\n`;
    if (ti.summary) text += ti.summary;
    return text.trim();
  },

  async price(cityData) {
    const c = cityData;
    if (!c.price_index) return null;
    const pi = typeof c.price_index === 'string' ? JSON.parse(c.price_index) : c.price_index;
    let text = `${c.city} 물가 정보 💰\n`;
    if (pi.meal) text += `🍽️ 한 끼 식사: ${pi.meal}\n`;
    if (pi.coffee) text += `☕ 커피: ${pi.coffee}\n`;
    if (pi.beer) text += `🍺 맥주: ${pi.beer}\n`;
    if (pi.transport) text += `🚕 교통: ${pi.transport}\n`;
    if (pi.hotel) text += `🏨 숙소: ${pi.hotel}\n`;
    return text.trim();
  },

  async timezone(cityData) {
    const c = cityData;
    if (!c.timezone) return null;
    return `${c.city}의 시간대는 ${c.timezone}이에요. 한국(KST, UTC+9)과의 시차를 참고하세요!`;
  },

  async bestSeason(cityData) {
    const c = cityData;
    if (!c.best_season) return null;
    return `${c.city} 여행 추천 시기는 ${c.best_season}이에요! ${c.overview ? c.overview.substring(0, 100) + '...' : ''}`;
  },

  async food(cityData) {
    const c = cityData;
    try {
      const places = await db.query(
        `SELECT name, description, rating, trust_score FROM places 
         WHERE city ILIKE $1 AND (category ILIKE '%restaurant%' OR category ILIKE '%food%' OR category ILIKE '%cafe%')
         ORDER BY trust_score DESC, rating DESC LIMIT 8`,
        [c.city]
      );
      if (places.rows.length === 0) return null;
      let text = `${c.city} 맛집 추천 🍽️\n\n`;
      places.rows.forEach((p, i) => {
        text += `${i+1}. **${p.name}**`;
        if (p.rating) text += ` ⭐${p.rating}`;
        if (p.description) text += `\n   ${p.description}`;
        text += '\n';
      });
      return text.trim();
    } catch (e) {
      return null;
    }
  },

  async attractions(cityData) {
    const c = cityData;
    try {
      const places = await db.query(
        `SELECT name, description, rating, trust_score FROM places 
         WHERE city ILIKE $1 AND (category ILIKE '%attraction%' OR category ILIKE '%landmark%' OR category ILIKE '%temple%' OR category ILIKE '%museum%')
         ORDER BY trust_score DESC, rating DESC LIMIT 8`,
        [c.city]
      );
      if (places.rows.length === 0) return null;
      let text = `${c.city} 관광 명소 🏛️\n\n`;
      places.rows.forEach((p, i) => {
        text += `${i+1}. **${p.name}**`;
        if (p.rating) text += ` ⭐${p.rating}`;
        if (p.description) text += `\n   ${p.description}`;
        text += '\n';
      });
      return text.trim();
    } catch (e) {
      return null;
    }
  },

  async tips(cityData) {
    const c = cityData;
    if (!c.local_tips || c.local_tips.length === 0) return null;
    let text = `${c.city} 여행 팁 💡\n\n`;
    c.local_tips.forEach((tip, i) => {
      text += `${i+1}. ${tip}\n`;
    });
    return text.trim();
  },
};

// Quick greeting/small-talk patterns — no AI call needed
const QUICK_PATTERNS = [
  { regex: /^(안녕|하이|헬로|hello|hi)\s*[!?.]?\s*$/i, response: '안녕하세요! 🌍 여행 계획이 있으시면 도시와 일정을 알려주세요. 무엇을 도와드릴까요?' },
  { regex: /^(고마워|감사|땡큐|thanks|thank you)/i, response: '천만에요! 😊 더 궁금한 게 있으면 언제든 물어보세요!' },
  { regex: /^(뭐\s*할\s*수\s*있어|뭐\s*도와|기능|할\s*수\s*있는\s*것|help)/i, response: '저는 여행 전문 AI에요! 🧳\n\n✈️ 맞춤 여행 일정 생성\n🏛️ 도시별 관광지·맛집 추천\n🌤️ 날씨·비자·물가 정보\n💰 예산별 여행 설계\n\n"도쿄 3박4일 여행 계획 세워줘" 처럼 말해보세요!' },
  { regex: /^(ㅎㅇ|ㅎㅎ|ㅋㅋ)\s*$/i, response: '안녕하세요! ✌️ 여행 관련 질문이 있으시면 편하게 말씀해주세요~' },
  { regex: /^(잘\s*가|바이|bye)\s*[!?.]?\s*$/i, response: '좋은 여행 되세요! 🛫 언제든 다시 찾아주세요~' },
];

async function handle(message) {
  // Quick pattern match first (no DB call)
  const trimmed = message.trim();
  for (const p of QUICK_PATTERNS) {
    if (p.regex.test(trimmed)) {
      return { directAnswer: true, response: p.response, source: 'quick', city: null, category: 'greeting' };
    }
  }

  // 여행 계획/일정 생성 요청은 직접 응답 대상이 아님
  if (/여행|계획|일정|코스|설계|짜줘/.test(message)) return null;

  for (const pattern of PATTERNS) {
    const match = message.match(pattern.regex);
    if (!match) continue;

    const rawCity = match[1];
    const cityData = await findCity(rawCity);
    if (!cityData) continue;

    // 프리컴파일 확인
    const precompiled = await checkPrecompiled(cityData.city, pattern.handler);
    if (precompiled) {
      return { directAnswer: true, response: precompiled, source: 'knowledge_db', city: cityData.city, category: pattern.handler };
    }

    // 핸들러 실행
    const handler = handlers[pattern.handler];
    if (!handler) continue;

    const response = await handler(cityData);
    if (!response) continue;

    return { directAnswer: true, response, source: 'knowledge_db', city: cityData.city, category: pattern.handler };
  }

  return null;
}

module.exports = { handle, handlers, findCity, PATTERNS };
