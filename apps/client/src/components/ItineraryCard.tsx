import { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, UtensilsCrossed, MapPin, ShoppingBag, Sparkles, Coffee,
  ExternalLink, Hotel, ChevronDown, ChevronUp,
  CalendarDays, Wallet, Star, Navigation, Plus, StickyNote, Check,
  Map as MapIcon, BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Lazy load map to avoid SSR issues with Leaflet
const ItineraryMap = lazy(() => import('./ItineraryMap').then(m => ({ default: m.ItineraryMap })));

interface Activity {
  time: string;
  title: string;
  description: string;
  category: string;
  cost: string;
  link?: string;
  linkLabel?: string;
  signature?: string;
  lat?: number;
  lng?: number;
}

interface Accommodation {
  name: string;
  cost: string;
  link?: string;
  linkLabel?: string;
  lat?: number;
  lng?: number;
}

interface Day {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
  accommodation?: Accommodation;
  dailyCost: string;
}

export interface Itinerary {
  type: 'itinerary';
  title: string;
  destination: string;
  period: string;
  totalBudget: string;
  summary: string;
  days: Day[];
}

/* ── Category config ── */
const categoryConfig: Record<string, { icon: typeof Plane; color: string; bg: string; ring: string; label: string; emoji: string }> = {
  transport:  { icon: Plane,             color: 'text-blue-600',    bg: 'bg-blue-500',    ring: 'ring-blue-200',    label: '교통',     emoji: '✈️' },
  restaurant: { icon: UtensilsCrossed,   color: 'text-orange-600',  bg: 'bg-orange-500',  ring: 'ring-orange-200',  label: '식사',     emoji: '🍽️' },
  attraction: { icon: MapPin,            color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-200', label: '관광',     emoji: '📍' },
  shopping:   { icon: ShoppingBag,       color: 'text-pink-600',    bg: 'bg-pink-500',    ring: 'ring-pink-200',    label: '쇼핑',     emoji: '🛍️' },
  activity:   { icon: Sparkles,          color: 'text-purple-600',  bg: 'bg-purple-500',  ring: 'ring-purple-200',  label: '액티비티', emoji: '⚡' },
  rest:       { icon: Coffee,            color: 'text-amber-600',   bg: 'bg-amber-500',   ring: 'ring-amber-200',   label: '휴식',     emoji: '☕' },
};

const getConfig = (cat: string) => categoryConfig[cat] || categoryConfig.attraction;

function mapsUrl(title: string, destination: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + ' ' + destination)}`;
}

/* ── Number badge (circle) ── */
function NumberBadge({ num, category }: { num: number; category: string }) {
  const cfg = getConfig(category);
  return (
    <div className={`w-8 h-8 rounded-full ${cfg.bg} text-white flex items-center justify-center text-xs font-bold ring-2 ${cfg.ring} shrink-0 shadow-sm`}>
      {num}
    </div>
  );
}

/* ── Connector line between places ── */
function Connector() {
  return (
    <div className="flex items-center gap-2 pl-[15px] py-1">
      <div className="w-px h-6 border-l-2 border-dashed border-gray-300" />
      <span className="text-[10px] text-gray-400 font-medium ml-2">이동</span>
    </div>
  );
}

/* ── Place card (RAMZI style) ── */
function PlaceCard({ activity, index, destination, isLast }: { activity: Activity; index: number; destination: string; isLast: boolean }) {
  const cfg = getConfig(activity.category);

  return (
    <div>
      <div className="flex gap-3 items-start group">
        {/* Left: number badge + vertical line */}
        <div className="flex flex-col items-center">
          <NumberBadge num={index + 1} category={activity.category} />
          {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[8px]" />}
        </div>

        {/* Center: content */}
        <div className="flex-1 min-w-0 pb-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm leading-tight text-gray-900 dark:text-gray-100">{activity.title}</h4>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
                {activity.description && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{activity.description}</span>
                  </>
                )}
              </div>
              {activity.time && (
                <span className="text-[10px] text-gray-400 font-mono">{activity.time}</span>
              )}
            </div>
            {/* Right: cost */}
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0 mt-0.5">
              {activity.cost}
            </span>
          </div>

          {/* Signature */}
          {activity.signature && (
            <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-2.5 py-1.5 border border-amber-200/60">
              <Star className="w-3 h-3 text-amber-500 mt-0.5 shrink-0 fill-amber-500" />
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">시그니처</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">{activity.signature}</p>
              </div>
            </div>
          )}

          {/* Links row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                {activity.linkLabel || '자세히 보기 →'}
              </a>
            )}
            <a
              href={mapsUrl(activity.title, destination)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
            >
              <Navigation className="w-3 h-3" />
              🗺️ 길찾기
            </a>
          </div>
        </div>
      </div>

      {/* Connector to next place */}
      {!isLast && <Connector />}
    </div>
  );
}

/* ── Accommodation card ── */
function AccommodationCard({ accommodation }: { accommodation: Accommodation }) {
  return (
    <div className="mt-3 mx-0">
      <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-2" />
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
        <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Hotel className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 truncate">🏨 {accommodation.name}</p>
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold">{accommodation.cost}</p>
        </div>
        {accommodation.link && (
          <a
            href={accommodation.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            {accommodation.linkLabel || '호텔 예약 →'}
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Day section ── */
function DaySection({ dayData, destination, isExpanded, onToggle }: { dayData: Day; destination: string; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* Day header bar */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center leading-none shadow-sm">
            <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Day</span>
            <span className="text-base font-black -mt-0.5">{dayData.day}</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{dayData.date}</p>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dayData.theme}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{dayData.dailyCost}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Day content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3">
              {/* Activities timeline */}
              {dayData.activities.map((activity, i) => (
                <PlaceCard
                  key={i}
                  activity={activity}
                  index={i}
                  destination={destination}
                  isLast={i === dayData.activities.length - 1}
                />
              ))}

              {/* Accommodation */}
              {dayData.accommodation && (
                <AccommodationCard accommodation={dayData.accommodation} />
              )}

              {/* Bottom action buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  장소 추가
                </button>
                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                  <StickyNote className="w-3.5 h-3.5" />
                  📝 메모 추가
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main ItineraryCard ── */
function parseCost(cost: string): number {
  const num = cost.replace(/[^0-9]/g, '');
  return parseInt(num, 10) || 0;
}

function CostSummary({ data }: { data: Itinerary }) {
  const totalParsed = parseCost(data.totalBudget);
  const dayBreakdown = data.days.map(d => ({
    day: d.day,
    date: d.date,
    cost: parseCost(d.dailyCost),
    activities: d.activities.length,
  }));
  const actualTotal = dayBreakdown.reduce((sum, d) => sum + d.cost, 0);
  const overBudget = totalParsed > 0 && actualTotal > totalParsed;

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold">비용 점검</span>
      </div>
      {dayBreakdown.map(d => (
        <div key={d.day} className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Day {d.day} ({d.date})</span>
          <span className="font-mono font-semibold">{d.cost.toLocaleString()}원</span>
        </div>
      ))}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex items-center justify-between">
        <span className="text-sm font-bold">합계</span>
        <span className={`text-sm font-black font-mono ${overBudget ? 'text-red-500' : 'text-primary'}`}>
          {actualTotal.toLocaleString()}원
          {overBudget && <span className="text-[10px] ml-1">(예산 초과!)</span>}
        </span>
      </div>
      {totalParsed > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>설정 예산</span>
          <span className="font-mono">{totalParsed.toLocaleString()}원</span>
        </div>
      )}
    </div>
  );
}

export function ItineraryCard({ data }: { data: Itinerary }) {
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [showMap, setShowMap] = useState(false);
  const [showCost, setShowCost] = useState(false);

  // Extract places with coordinates for map
  const mapPlaces = useMemo(() => {
    const places: { title: string; lat: number; lng: number; category: string; day: number; order: number }[] = [];
    data.days.forEach(day => {
      day.activities.forEach((act, idx) => {
        if (act.lat && act.lng) {
          places.push({ title: act.title, lat: act.lat, lng: act.lng, category: act.category, day: day.day, order: idx + 1 });
        }
      });
      if (day.accommodation?.lat && day.accommodation?.lng) {
        places.push({ title: day.accommodation.name, lat: day.accommodation.lat, lng: day.accommodation.lng, category: 'accommodation', day: day.day, order: 99 });
      }
    });
    return places;
  }, [data]);

  const toggleDay = (day: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(data.days.map(d => d.day)));
    setViewMode('full');
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
    setViewMode('summary');
  };

  return (
    <div className="w-full max-w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-black text-lg leading-tight text-gray-900 dark:text-gray-50">{data.title}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-[11px] gap-1 rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0">
                <MapPin className="w-3 h-3" /> {data.destination}
              </Badge>
              <Badge variant="secondary" className="text-[11px] gap-1 rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0">
                <CalendarDays className="w-3 h-3" /> {data.period}
              </Badge>
            </div>
          </div>
          <div className="text-right shrink-0 bg-primary/5 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1 text-primary">
              <Wallet className="w-4 h-4" />
              <span className="text-base font-black">{data.totalBudget}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">총 예산</span>
          </div>
        </div>
      </div>

      {/* View toggle bar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <Button
          variant={viewMode === 'summary' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs rounded-full px-4"
          onClick={collapseAll}
        >
          요약
        </Button>
        <Button
          variant={viewMode === 'full' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs rounded-full px-4"
          onClick={expandAll}
        >
          전체 일정
        </Button>
        <div className="flex-1" />
        {mapPlaces.length > 0 && (
          <Button
            variant={showMap ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs rounded-full px-3"
            onClick={() => setShowMap(!showMap)}
          >
            <MapIcon className="w-3 h-3 mr-1" />
            지도
          </Button>
        )}
        <Button
          variant={showCost ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs rounded-full px-3"
          onClick={() => setShowCost(!showCost)}
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          비용
        </Button>
      </div>

      {/* Map */}
      {showMap && mapPlaces.length > 0 && (
        <div className="px-4 pt-3">
          <Suspense fallback={<div className="h-[280px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm">지도 로딩 중...</div>}>
            <ItineraryMap places={mapPlaces} />
          </Suspense>
        </div>
      )}

      {/* Cost Summary */}
      {showCost && <CostSummary data={data} />}

      {/* Summary text */}
      <div className="px-4 pt-3">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{data.summary}</p>
      </div>

      {/* Days */}
      <div className="p-4 space-y-3">
        {data.days.map((day) => (
          <DaySection
            key={day.day}
            dayData={day}
            destination={data.destination}
            isExpanded={viewMode === 'full' || expandedDays.has(day.day)}
            onToggle={() => toggleDay(day.day)}
          />
        ))}
      </div>
    </div>
  );
}

/** JSON 파싱 시도. itinerary JSON이면 Itinerary 객체 반환, 아니면 null */
export function tryParseItinerary(text: string): Itinerary | null {
  // 여행 관련 키워드가 없으면 바로 null
  if (!text.includes('"days"') && !text.includes('"itinerary"')) return null;

  const attempts: string[] = [];
  
  // 1. ```json ... ``` 블록 (닫는 ``` 없어도 추출)
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
  if (jsonBlockMatch) {
    attempts.push(jsonBlockMatch[1].trim());
  }
  
  // 2. 첫 번째 { 부터 마지막 } 까지
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(text.substring(firstBrace, lastBrace + 1));
  }
  
  // 3. 첫 번째 { 부터 끝까지 (잘린 JSON 복구 시도)
  if (firstBrace !== -1) {
    attempts.push(text.substring(firstBrace));
  }

  for (let jsonStr of attempts) {
    try {
      // trailing commas 제거
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
      
      // 잘린 JSON 복구: 열린 괄호 수 세서 닫기
      let openBraces = 0, openBrackets = 0;
      let inString = false, escape = false;
      for (const ch of jsonStr) {
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
      
      // 닫히지 않은 괄호 보완
      if (openBraces > 0 || openBrackets > 0) {
        // 마지막 완전한 객체까지 자르기 시도
        const lastCompleteObj = jsonStr.lastIndexOf('}');
        if (lastCompleteObj > 0) {
          let trimmed = jsonStr.substring(0, lastCompleteObj + 1);
          // 남은 열린 괄호 닫기
          let ob = 0, obt = 0;
          let inStr2 = false, esc2 = false;
          for (const ch of trimmed) {
            if (esc2) { esc2 = false; continue; }
            if (ch === '\\') { esc2 = true; continue; }
            if (ch === '"') { inStr2 = !inStr2; continue; }
            if (inStr2) continue;
            if (ch === '{') ob++;
            if (ch === '}') ob--;
            if (ch === '[') obt++;
            if (ch === ']') obt--;
          }
          while (obt > 0) { trimmed += ']'; obt--; }
          while (ob > 0) { trimmed += '}'; ob--; }
          jsonStr = trimmed;
        }
      }

      const parsed = JSON.parse(jsonStr);
      if (parsed.days && Array.isArray(parsed.days)) {
        if (!parsed.type) parsed.type = 'itinerary';
        return parsed as Itinerary;
      }
    } catch {
      continue;
    }
  }
  
  return null;
}
