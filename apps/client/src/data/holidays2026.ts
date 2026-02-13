// 2026년 주요 여행지 국가 공휴일 데이터
export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export const HOLIDAYS_BY_COUNTRY: Record<string, Holiday[]> = {
  '한국': [
    { date: '2026-01-01', name: '새해' },
    { date: '2026-02-16', name: '설날 연휴' },
    { date: '2026-02-17', name: '설날' },
    { date: '2026-02-18', name: '설날 연휴' },
    { date: '2026-03-01', name: '삼일절' },
    { date: '2026-05-05', name: '어린이날' },
    { date: '2026-05-24', name: '부처님 오신 날' },
    { date: '2026-06-06', name: '현충일' },
    { date: '2026-08-15', name: '광복절' },
    { date: '2026-10-03', name: '개천절' },
    { date: '2026-10-04', name: '추석 연휴' },
    { date: '2026-10-05', name: '추석' },
    { date: '2026-10-06', name: '추석 연휴' },
    { date: '2026-10-09', name: '한글날' },
    { date: '2026-12-25', name: '크리스마스' },
  ],
  '일본': [
    { date: '2026-01-01', name: '元日 (설날)' },
    { date: '2026-01-12', name: '成人の日 (성인의 날)' },
    { date: '2026-02-11', name: '建国記念の日 (건국기념일)' },
    { date: '2026-02-23', name: '天皇誕生日 (천황 생일)' },
    { date: '2026-03-20', name: '春分の日 (춘분)' },
    { date: '2026-04-29', name: '昭和の日 (쇼와의 날)' },
    { date: '2026-05-03', name: '憲法記念日 (헌법기념일)' },
    { date: '2026-05-04', name: 'みどりの日 (녹색의 날)' },
    { date: '2026-05-05', name: 'こどもの日 (어린이날)' },
    { date: '2026-07-20', name: '海の日 (바다의 날)' },
    { date: '2026-08-11', name: '山の日 (산의 날)' },
    { date: '2026-09-21', name: '敬老の日 (경로의 날)' },
    { date: '2026-09-23', name: '秋分の日 (추분)' },
    { date: '2026-10-12', name: 'スポーツの日 (스포츠의 날)' },
    { date: '2026-11-03', name: '文化の日 (문화의 날)' },
    { date: '2026-11-23', name: '勤労感謝の日 (근로감사의 날)' },
  ],
  '태국': [
    { date: '2026-01-01', name: 'วันขึ้นปีใหม่ (새해)' },
    { date: '2026-02-26', name: 'วันมาฆบูชา (마카부차)' },
    { date: '2026-04-06', name: 'วันจักรี (짜끄리 왕조 기념일)' },
    { date: '2026-04-13', name: 'วันสงกรานต์ (쏭끄란)' },
    { date: '2026-04-14', name: 'วันสงกรานต์ (쏭끄란)' },
    { date: '2026-04-15', name: 'วันสงกรานต์ (쏭끄란)' },
    { date: '2026-05-01', name: 'วันแรงงาน (노동절)' },
    { date: '2026-05-04', name: 'วันฉัตรมงคล (대관식 기념일)' },
    { date: '2026-05-24', name: 'วันวิสาขบูชา (비사카부차)' },
    { date: '2026-06-03', name: 'วันเฉลิมพระชนมพรรษาราชินี (왕비 생일)' },
    { date: '2026-07-22', name: 'วันอาสาฬหบูชา (아사라하부차)' },
    { date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษา (국왕 생일)' },
    { date: '2026-08-12', name: 'วันแม่แห่งชาติ (어머니날)' },
    { date: '2026-10-23', name: 'วันปิยมหาราช (쫄라롱껀 대왕 기일)' },
    { date: '2026-12-05', name: 'วันพ่อแห่งชาติ (아버지날)' },
    { date: '2026-12-10', name: 'วันรัฐธรรมนูญ (헌법기념일)' },
    { date: '2026-12-31', name: 'วันสิ้นปี (새해 전야)' },
  ],
  '베트남': [
    { date: '2026-01-01', name: 'Tết Dương lịch (새해)' },
    { date: '2026-02-16', name: 'Tết Nguyên Đán (설날 연휴)' },
    { date: '2026-02-17', name: 'Tết Nguyên Đán (설날)' },
    { date: '2026-02-18', name: 'Tết Nguyên Đán (설날 연휴)' },
    { date: '2026-02-19', name: 'Tết Nguyên Đán (설날 연휴)' },
    { date: '2026-02-20', name: 'Tết Nguyên Đán (설날 연휴)' },
    { date: '2026-04-30', name: 'Ngày Giải phóng (통일의 날)' },
    { date: '2026-05-01', name: 'Ngày Quốc tế Lao động (노동절)' },
    { date: '2026-09-02', name: 'Quốc khánh (국경일)' },
  ],
  '미국': [
    { date: '2026-01-01', name: "New Year's Day (새해)" },
    { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
    { date: '2026-02-16', name: "Presidents' Day" },
    { date: '2026-05-25', name: 'Memorial Day (현충일)' },
    { date: '2026-06-19', name: 'Juneteenth' },
    { date: '2026-07-04', name: 'Independence Day (독립기념일)' },
    { date: '2026-09-07', name: 'Labor Day (노동절)' },
    { date: '2026-10-12', name: 'Columbus Day' },
    { date: '2026-11-11', name: 'Veterans Day (재향군인의 날)' },
    { date: '2026-11-26', name: 'Thanksgiving (추수감사절)' },
    { date: '2026-12-25', name: 'Christmas (크리스마스)' },
  ],
  '프랑스': [
    { date: '2026-01-01', name: "Jour de l'An (새해)" },
    { date: '2026-04-06', name: 'Lundi de Pâques (부활절 월요일)' },
    { date: '2026-05-01', name: 'Fête du Travail (노동절)' },
    { date: '2026-05-08', name: 'Victoire 1945 (종전기념일)' },
    { date: '2026-05-14', name: "Ascension (예수 승천일)" },
    { date: '2026-05-25', name: 'Lundi de Pentecôte (성령강림 월요일)' },
    { date: '2026-07-14', name: 'Fête Nationale (프랑스 혁명기념일)' },
    { date: '2026-08-15', name: 'Assomption (성모승천일)' },
    { date: '2026-11-01', name: 'Toussaint (만성절)' },
    { date: '2026-11-11', name: 'Armistice (휴전기념일)' },
    { date: '2026-12-25', name: 'Noël (크리스마스)' },
  ],
  '영국': [
    { date: '2026-01-01', name: "New Year's Day (새해)" },
    { date: '2026-04-03', name: 'Good Friday (성금요일)' },
    { date: '2026-04-06', name: 'Easter Monday (부활절 월요일)' },
    { date: '2026-05-04', name: 'Early May Bank Holiday' },
    { date: '2026-05-25', name: 'Spring Bank Holiday' },
    { date: '2026-08-31', name: 'Summer Bank Holiday' },
    { date: '2026-12-25', name: 'Christmas Day (크리스마스)' },
    { date: '2026-12-28', name: 'Boxing Day (박싱데이)' },
  ],
  '스페인': [
    { date: '2026-01-01', name: 'Año Nuevo (새해)' },
    { date: '2026-01-06', name: 'Epifanía (주현절)' },
    { date: '2026-04-03', name: 'Viernes Santo (성금요일)' },
    { date: '2026-05-01', name: 'Día del Trabajador (노동절)' },
    { date: '2026-08-15', name: 'Asunción (성모승천일)' },
    { date: '2026-10-12', name: 'Fiesta Nacional (국경일)' },
    { date: '2026-11-01', name: 'Todos los Santos (만성절)' },
    { date: '2026-12-06', name: 'Día de la Constitución (헌법기념일)' },
    { date: '2026-12-08', name: 'Inmaculada Concepción (성모무염시태)' },
    { date: '2026-12-25', name: 'Navidad (크리스마스)' },
  ],
  '이탈리아': [
    { date: '2026-01-01', name: 'Capodanno (새해)' },
    { date: '2026-01-06', name: 'Epifania (주현절)' },
    { date: '2026-04-05', name: 'Pasqua (부활절)' },
    { date: '2026-04-06', name: 'Lunedì dell\'Angelo (부활절 월요일)' },
    { date: '2026-04-25', name: 'Festa della Liberazione (해방기념일)' },
    { date: '2026-05-01', name: 'Festa dei Lavoratori (노동절)' },
    { date: '2026-06-02', name: 'Festa della Repubblica (공화국의 날)' },
    { date: '2026-08-15', name: 'Ferragosto (성모승천일)' },
    { date: '2026-11-01', name: 'Tutti i Santi (만성절)' },
    { date: '2026-12-08', name: 'Immacolata Concezione (성모무염시태)' },
    { date: '2026-12-25', name: 'Natale (크리스마스)' },
    { date: '2026-12-26', name: 'Santo Stefano (성스테파노의 날)' },
  ],
  '호주': [
    { date: '2026-01-01', name: "New Year's Day (새해)" },
    { date: '2026-01-26', name: 'Australia Day (호주의 날)' },
    { date: '2026-04-03', name: 'Good Friday (성금요일)' },
    { date: '2026-04-04', name: 'Saturday before Easter' },
    { date: '2026-04-06', name: 'Easter Monday (부활절 월요일)' },
    { date: '2026-04-25', name: 'ANZAC Day (안작데이)' },
    { date: '2026-06-08', name: "Queen's Birthday (여왕 생일)" },
    { date: '2026-12-25', name: 'Christmas Day (크리스마스)' },
    { date: '2026-12-28', name: 'Boxing Day (박싱데이)' },
  ],
};

// 도시 → 국가 매핑
export const CITY_TO_COUNTRY: Record<string, string> = {
  // 한국
  '제주': '한국', '부산': '한국', '강릉': '한국', '여수': '한국', '경주': '한국',
  '속초': '한국', '전주': '한국', '통영': '한국', '거제': '한국', '담양': '한국',
  // 일본
  '도쿄': '일본', '오사카': '일본', '교토': '일본', '후쿠오카': '일본', '삿포로': '일본',
  '나고야': '일본', '요코하마': '일본', '고베': '일본', '히로시마': '일본', '나라': '일본',
  '가고시마': '일본', '오키나와': '일본', '나가사키': '일본', '센다이': '일본', '가나자와': '일본',
  '하코다테': '일본', '벳푸': '일본', '유후인': '일본', '다카마쓰': '일본', '시즈오카': '일본',
  '가마쿠라': '일본', '닛코': '일본',
  // 태국
  '방콕': '태국', '치앙마이': '태국', '푸켓': '태국', '파타야': '태국', '끄라비': '태국',
  '코사무이': '태국', '코팡안': '태국',
  // 베트남
  '하노이': '베트남', '다낭': '베트남', '호치민': '베트남', '호이안': '베트남',
  '사파': '베트남', '나트랑': '베트남', '달랏': '베트남', '하롱베이': '베트남',
  // 미국
  '뉴욕': '미국', '하와이': '미국', 'LA': '미국', '샌프란시스코': '미국', '시애틀': '미국',
  '라스베이거스': '미국', '시카고': '미국', '보스턴': '미국', '워싱턴DC': '미국',
  '마이애미': '미국', '올랜도': '미국', '샌디에이고': '미국', '괌': '미국', '사이판': '미국',
  // 프랑스
  '파리': '프랑스', '니스': '프랑스', '모나코': '프랑스',
  // 영국
  '런던': '영국', '에든버러': '영국',
  // 스페인
  '바르셀로나': '스페인', '마드리드': '스페인', '세비야': '스페인', '그라나다': '스페인',
  // 이탈리아
  '로마': '이탈리아', '피렌체': '이탈리아', '베네치아': '이탈리아', '밀라노': '이탈리아',
  '나폴리': '이탈리아', '아말피': '이탈리아',
  // 호주
  '시드니': '호주', '멜버른': '호주', '골드코스트': '호주', '케언즈': '호주', '퍼스': '호주',
};

/** 특정 국가의 공휴일을 Date 기반 Map으로 반환 */
export function getHolidayMap(country: string): Map<string, string> {
  const map = new Map<string, string>();
  const holidays = HOLIDAYS_BY_COUNTRY[country];
  if (!holidays) return map;
  for (const h of holidays) {
    map.set(h.date, h.name);
  }
  return map;
}
