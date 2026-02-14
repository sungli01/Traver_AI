const crypto = require('crypto');
const db = require('./db');

class ResponseCache {
  constructor() {
    this.memCache = new Map(); // key -> {response, timestamp, hits, plan}
    this.MAX_MEM = 500;
    this.MEM_TTL = 30 * 60 * 1000; // 30분
  }

  // 질문 정규화: 공백/조사 제거 → 핵심 키워드 추출
  normalizeQuery(query) {
    return query
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      // 한국어 조사 제거
      .replace(/[은는이가을를에서의로도만까지부터와과]([\s]|$)/g, '$1')
      .replace(/[?!.~]+$/g, '')
      .trim();
  }

  // 카테고리 감지
  detectCategory(query) {
    const q = query.toLowerCase();
    if (/날씨|기온|기후|온도|우기|건기/.test(q)) return 'weather';
    if (/비자|입국|여권|visa/.test(q)) return 'visa';
    if (/환율|통화|화폐|돈/.test(q)) return 'currency';
    if (/교통|공항|이동|택시|지하철|버스|기차/.test(q)) return 'transport';
    if (/물가|가격|비용|얼마/.test(q)) return 'price';
    if (/맛집|음식|먹거리|뭐\s*먹|식당|레스토랑/.test(q)) return 'food';
    if (/관광지|볼거리|명소|어디\s*가|관광/.test(q)) return 'attraction';
    if (/시차|시간|몇시/.test(q)) return 'timezone';
    if (/추천\s*시기|언제\s*가|베스트\s*시즌/.test(q)) return 'bestseason';
    if (/팁|주의|조심|알아둘/.test(q)) return 'tips';
    return 'general';
  }

  // TTL 결정 (ms)
  getTTL(category) {
    const ttls = {
      weather: 6 * 60 * 60 * 1000,      // 6시간
      price: 12 * 60 * 60 * 1000,        // 12시간
      currency: 6 * 60 * 60 * 1000,      // 6시간
      general: 24 * 60 * 60 * 1000,      // 24시간
    };
    return ttls[category] || 24 * 60 * 60 * 1000;
  }

  // 캐시 키 생성 (plan 포함)
  makeKey(query, plan = 'free') {
    const normalized = this.normalizeQuery(query);
    return crypto.createHash('sha256').update(`${plan}:${normalized}`).digest('hex');
  }

  // 캐시 조회: 메모리 → DB
  async get(query, plan = 'free') {
    const key = this.makeKey(query, plan);

    // 1. 메모리 캐시
    const mem = this.memCache.get(key);
    if (mem && Date.now() - mem.timestamp < this.MEM_TTL) {
      mem.hits++;
      return mem.response;
    }

    // 2. DB 캐시
    try {
      const res = await db.query(
        'SELECT response FROM response_cache WHERE query_hash = $1 AND expires_at > NOW()',
        [key]
      );
      if (res.rows.length > 0) {
        const response = res.rows[0].response;
        // 메모리에도 올리기
        this._setMem(key, response);
        // hits 증가
        db.query('UPDATE response_cache SET hits = hits + 1 WHERE query_hash = $1', [key]).catch(() => {});
        return response;
      }
    } catch (e) {
      // DB 실패해도 계속
    }

    return null;
  }

  // 캐시 저장: 메모리 + DB
  async set(query, response, metadata = {}) {
    const plan = metadata.plan || 'free';
    const key = this.makeKey(query, plan);
    const category = metadata.category || this.detectCategory(query);
    const city = metadata.city || null;
    const ttl = this.getTTL(category);

    // 메모리
    this._setMem(key, response);

    // DB
    try {
      const expiresAt = new Date(Date.now() + ttl);
      await db.query(
        `INSERT INTO response_cache (query_hash, query_normalized, response, city, category, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (query_hash) DO UPDATE SET
           response = EXCLUDED.response,
           hits = response_cache.hits + 1,
           expires_at = EXCLUDED.expires_at`,
        [key, this.normalizeQuery(query), response, city, category, expiresAt]
      );
    } catch (e) {
      console.error('[Cache] DB save error:', e.message);
    }
  }

  _setMem(key, response) {
    // LRU: 최대 크기 초과 시 가장 오래된 항목 제거
    if (this.memCache.size >= this.MAX_MEM) {
      const oldest = this.memCache.keys().next().value;
      this.memCache.delete(oldest);
    }
    this.memCache.set(key, { response, timestamp: Date.now(), hits: 1 });
  }

  // 특정 도시 캐시 무효화
  async invalidateCity(city) {
    // 메모리 캐시는 전체 스캔 필요 (비효율적이지만 500개 이하)
    // DB 캐시에서 도시별 삭제
    try {
      await db.query('DELETE FROM response_cache WHERE city ILIKE $1', [city]);
    } catch (e) {
      console.error('[Cache] Invalidate error:', e.message);
    }
    // 메모리 캐시 전체 클리어 (심플하게)
    this.memCache.clear();
  }

  // 만료된 캐시 정리
  async cleanup() {
    try {
      const res = await db.query('DELETE FROM response_cache WHERE expires_at < NOW()');
      console.log(`[Cache] Cleaned up ${res.rowCount} expired entries`);
    } catch (e) {
      console.error('[Cache] Cleanup error:', e.message);
    }
  }
}

module.exports = new ResponseCache();
