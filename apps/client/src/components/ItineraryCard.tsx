import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, UtensilsCrossed, MapPin, ShoppingBag, Sparkles, Coffee,
  ExternalLink, Hotel, ChevronDown, ChevronUp,
  CalendarDays, Wallet, Star, Navigation, Plus, StickyNote, Check,
  Map as MapIcon, BarChart3, Clock, Phone, Globe, X, MapPinIcon,
  DollarSign, Timer, Users, Utensils, Wifi, Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Lazy load map to avoid SSR issues with Leaflet
const ItineraryMap = lazy(() => import('./ItineraryMap').then(m => ({ default: m.ItineraryMap })));

interface PlaceDetail {
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  admission?: string;
  duration?: string;
  rating?: number;
  reviewSummary?: string;
  photoKeywords?: string;
  tips?: string;
  menu?: string[];
  priceRange?: string;
  waitTime?: string;
  reservation?: string;
  checkIn?: string;
  checkOut?: string;
  facilities?: string[];
  breakfast?: string;
}

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
  detail?: PlaceDetail;
}

interface Accommodation {
  name: string;
  cost: string;
  link?: string;
  linkLabel?: string;
  lat?: number;
  lng?: number;
  detail?: PlaceDetail;
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

/* ── Place Detail Modal ── */
function PlaceDetailModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const d = activity.detail;
  const cfg = getConfig(activity.category);
  if (!d) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full sm:max-w-md max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-5 pt-5 pb-3 ${cfg.bg} bg-opacity-10`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{categoryConfig[activity.category]?.emoji || '📍'}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} text-white`}>{cfg.label}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-50 leading-tight">{activity.title}</h3>
                {activity.description && <p className="text-sm text-gray-500 mt-1">{activity.description}</p>}
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Rating */}
            {d.rating && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(d.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{d.rating}</span>
              </div>
            )}
            {d.reviewSummary && <p className="text-xs text-gray-500 mt-1 italic">"{d.reviewSummary}"</p>}
          </div>

          {/* Body */}
          <div className="px-5 py-4 overflow-y-auto max-h-[55vh] space-y-3">
            {/* Cost & Time */}
            <div className="flex gap-3">
              {activity.cost && (
                <div className="flex-1 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 text-center">
                  <DollarSign className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-xs text-gray-500">비용</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{activity.cost}</p>
                </div>
              )}
              {d.duration && (
                <div className="flex-1 bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 text-center">
                  <Timer className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-xs text-gray-500">소요시간</p>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{d.duration}</p>
                </div>
              )}
              {d.admission && (
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
                  <Info className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs text-gray-500">입장료</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{d.admission}</p>
                </div>
              )}
            </div>

            {/* Info rows */}
            <div className="space-y-2">
              {d.address && (
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-gray-400">주소</p><p className="text-sm text-gray-700 dark:text-gray-300">{d.address}</p></div>
                </div>
              )}
              {d.hours && (
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-gray-400">운영시간</p><p className="text-sm text-gray-700 dark:text-gray-300">{d.hours}</p></div>
                </div>
              )}
              {d.phone && (
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-gray-400">전화번호</p><a href={`tel:${d.phone}`} className="text-sm text-blue-600">{d.phone}</a></div>
                </div>
              )}
              {d.website && (
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div><p className="text-xs text-gray-400">홈페이지</p><a href={d.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{d.website}</a></div>
                </div>
              )}
            </div>

            {/* Restaurant specific */}
            {d.menu && d.menu.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-orange-700 dark:text-orange-300">대표 메뉴</span>
                </div>
                <ul className="space-y-1">
                  {d.menu.map((m, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {m}</li>)}
                </ul>
                {d.priceRange && <p className="text-xs text-gray-500 mt-2">💰 가격대: {d.priceRange}</p>}
                {d.waitTime && <p className="text-xs text-gray-500">⏳ 웨이팅: {d.waitTime}</p>}
                {d.reservation && <p className="text-xs text-gray-500">📞 예약: {d.reservation}</p>}
              </div>
            )}

            {/* Accommodation specific */}
            {(d.checkIn || d.checkOut) && (
              <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Hotel className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">숙소 정보</span>
                </div>
                {d.checkIn && <p className="text-sm text-gray-700 dark:text-gray-300">체크인: {d.checkIn}</p>}
                {d.checkOut && <p className="text-sm text-gray-700 dark:text-gray-300">체크아웃: {d.checkOut}</p>}
                {d.breakfast && <p className="text-sm text-gray-700 dark:text-gray-300">조식: {d.breakfast}</p>}
                {d.facilities && d.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {d.facilities.map((f, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Signature */}
            {activity.signature && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300">시그니처</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400">{activity.signature}</p>
              </div>
            )}

            {/* Tips */}
            {d.tips && (
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3">
                <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">💡 여행자 팁</p>
                <p className="text-sm text-green-700 dark:text-green-400">{d.tips}</p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
            {activity.link && (
              <a href={activity.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                <button className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                  <ExternalLink className="w-4 h-4" /> {activity.linkLabel || '자세히 보기'}
                </button>
              </a>
            )}
            <a href={mapsUrl(activity.title, '')} target="_blank" rel="noopener noreferrer" className={activity.link ? '' : 'flex-1'}>
              <button className="h-10 px-4 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                <Navigation className="w-4 h-4" /> 지도
              </button>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Place card (RAMZI style) ── */
function PlaceCard({ activity, index, destination, isLast, prevActivity, onPlaceClick }: { activity: Activity; index: number; destination: string; isLast: boolean; prevActivity?: Activity; onPlaceClick?: (activity: Activity) => void }) {
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
              <h4
                className={`font-bold text-sm leading-tight ${(activity.detail || (activity.lat && activity.lng)) ? 'text-blue-700 dark:text-blue-400 underline decoration-dotted cursor-pointer hover:text-blue-500 transition-colors' : 'text-gray-900 dark:text-gray-100'}`}
                onClick={() => {
                  if (activity.detail) {
                    // Dispatch custom event to open detail modal
                    window.dispatchEvent(new CustomEvent('open-place-detail', { detail: activity }));
                  } else if (activity.lat && activity.lng && onPlaceClick) {
                    onPlaceClick(activity);
                  }
                }}
              >{activity.title}</h4>
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
            {activity.category !== 'transport' && (
              <a
                href={prevActivity?.lat && prevActivity?.lng && activity.lat && activity.lng
                  ? `https://www.google.com/maps/dir/${prevActivity.lat},${prevActivity.lng}/${activity.lat},${activity.lng}`
                  : mapsUrl(activity.title, destination)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
              >
                <Navigation className="w-3 h-3" />
                🗺️ 길찾기
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Connector to next place */}
      {!isLast && <Connector />}
    </div>
  );
}

/* ── Accommodation card ── */
function AccommodationCard({ accommodation, onPlaceClick }: { accommodation: Accommodation; onPlaceClick?: (activity: Activity) => void }) {
  return (
    <div className="mt-3 mx-0">
      <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-2" />
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
        <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Hotel className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-bold truncate ${accommodation.lat && accommodation.lng ? 'text-indigo-600 dark:text-indigo-300 underline decoration-dotted cursor-pointer hover:text-indigo-400 transition-colors' : 'text-indigo-700 dark:text-indigo-300'}`}
            onClick={() => { if (accommodation.lat && accommodation.lng && onPlaceClick) onPlaceClick({ time: '', title: accommodation.name, description: '', category: 'rest', cost: accommodation.cost, lat: accommodation.lat, lng: accommodation.lng }); }}
          >🏨 {accommodation.name}</p>
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
function DaySection({ dayData, destination, isExpanded, onToggle, prevDayAccommodation, onPlaceClick }: { dayData: Day; destination: string; isExpanded: boolean; onToggle: () => void; prevDayAccommodation?: Accommodation; onPlaceClick?: (activity: Activity) => void }) {
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
              {dayData.activities.map((activity, i) => {
                // For first activity of the day, use previous day's accommodation as origin
                let prevAct: Activity | undefined;
                if (i > 0) {
                  prevAct = dayData.activities[i - 1];
                } else if (prevDayAccommodation?.lat && prevDayAccommodation?.lng) {
                  prevAct = {
                    time: '', title: prevDayAccommodation.name, description: '', category: 'rest',
                    cost: '', lat: prevDayAccommodation.lat, lng: prevDayAccommodation.lng
                  };
                }
                return (
                  <PlaceCard
                    key={i}
                    activity={activity}
                    index={i}
                    destination={destination}
                    isLast={i === dayData.activities.length - 1}
                    prevActivity={prevAct}
                    onPlaceClick={onPlaceClick}
                  />
                );
              })}

              {/* Accommodation */}
              {dayData.accommodation && (
                <AccommodationCard accommodation={dayData.accommodation} onPlaceClick={onPlaceClick} />
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

export function ItineraryCard({ data, onMoveToSchedule, onPlaceClick }: { data: Itinerary; onMoveToSchedule?: (data: Itinerary) => void; onPlaceClick?: (activity: Activity) => void }) {
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [showMap, setShowMap] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);

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

  // Listen for place detail open events
  useEffect(() => {
    const handler = (e: Event) => {
      setDetailActivity((e as CustomEvent).detail as Activity);
    };
    window.addEventListener('open-place-detail', handler);
    return () => window.removeEventListener('open-place-detail', handler);
  }, []);

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

      {/* Cost Summary - removed: spending statistics hidden */}

      {/* Summary text */}
      <div className="px-4 pt-3">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{data.summary}</p>
      </div>

      {/* Days */}
      <div className="p-4 space-y-3">
        {data.days.map((day, idx) => (
          <DaySection
            key={day.day}
            dayData={day}
            destination={data.destination}
            isExpanded={viewMode === 'full' || expandedDays.has(day.day)}
            onToggle={() => toggleDay(day.day)}
            prevDayAccommodation={idx > 0 ? data.days[idx - 1].accommodation : undefined}
            onPlaceClick={onPlaceClick}
          />
        ))}
      </div>

      {/* Move to schedule note button */}
      {onMoveToSchedule && (
        <div className="px-4 pb-4">
          <Button
            className="w-full rounded-2xl h-11 gap-2 text-sm font-semibold shadow-md"
            onClick={() => onMoveToSchedule(data)}
          >
            📋 스케줄 노트로 옮기기
          </Button>
        </div>
      )}

      {/* Place detail modal */}
      {detailActivity?.detail && (
        <PlaceDetailModal activity={detailActivity} onClose={() => setDetailActivity(null)} />
      )}
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
