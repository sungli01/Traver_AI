import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, UtensilsCrossed, MapPin, ShoppingBag, Sparkles, Coffee,
  Clock, DollarSign, ExternalLink, Hotel, ChevronDown, ChevronUp,
  CalendarDays, Wallet, Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Activity {
  time: string;
  title: string;
  description: string;
  category: string;
  cost: string;
  link?: string;
  linkLabel?: string;
  signature?: string;
}

interface Accommodation {
  name: string;
  cost: string;
  link?: string;
  linkLabel?: string;
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

const categoryConfig: Record<string, { icon: typeof Plane; color: string; bg: string; label: string }> = {
  transport: { icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50', label: '교통' },
  restaurant: { icon: UtensilsCrossed, color: 'text-orange-600', bg: 'bg-orange-50', label: '식사' },
  attraction: { icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '관광' },
  shopping: { icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50', label: '쇼핑' },
  activity: { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50', label: '액티비티' },
  rest: { icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', label: '휴식' },
};

function ActivityItem({ activity }: { activity: Activity }) {
  const config = categoryConfig[activity.category] || categoryConfig.attraction;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 group">
      {/* Timeline */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {activity.time}
              </span>
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${config.color} border-current/20`}>
                {config.label}
              </Badge>
            </div>
            <h4 className="font-semibold text-sm mt-1 leading-tight">{activity.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{activity.description}</p>
          </div>
          <span className="text-xs font-semibold text-primary whitespace-nowrap shrink-0">
            {activity.cost}
          </span>
        </div>

        {/* Signature Menu */}
        {activity.signature && (
          <div className="mt-1.5 flex items-start gap-1.5 bg-orange-50 dark:bg-orange-950/20 rounded-lg px-2.5 py-1.5 border border-orange-200/50">
            <Star className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">시그니처 메뉴</span>
              <p className="text-xs text-orange-700 dark:text-orange-400">{activity.signature}</p>
            </div>
          </div>
        )}

        {/* Link */}
        {activity.link && (
          <a
            href={activity.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1.5 font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            {activity.linkLabel || '자세히 보기'}
          </a>
        )}
      </div>
    </div>
  );
}

function DayCard({ dayData, isExpanded, onToggle }: { dayData: Day; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Day Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            D{dayData.day}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">{dayData.date}</p>
            <p className="text-xs text-muted-foreground">{dayData.theme}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{dayData.dailyCost}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Day Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              {/* Activities */}
              {dayData.activities.map((activity, i) => (
                <ActivityItem key={i} activity={activity} />
              ))}

              {/* Accommodation */}
              {dayData.accommodation && (
                <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50">
                  <Hotel className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">{dayData.accommodation.name}</p>
                    <p className="text-[11px] text-indigo-600/80">{dayData.accommodation.cost}</p>
                  </div>
                  {dayData.accommodation.link && (
                    <a
                      href={dayData.accommodation.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-600 hover:underline font-medium flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {dayData.accommodation.linkLabel || '예약'}
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ItineraryCard({ data }: { data: Itinerary }) {
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

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
    <div className="w-full max-w-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-base leading-tight">{data.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-[10px] gap-1">
                <MapPin className="w-3 h-3" /> {data.destination}
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <CalendarDays className="w-3 h-3" /> {data.period}
              </Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-primary">
              <Wallet className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{data.totalBudget}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">총 예산</span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/20">
        <Button
          variant={viewMode === 'summary' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs rounded-lg"
          onClick={collapseAll}
        >
          요약
        </Button>
        <Button
          variant={viewMode === 'full' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs rounded-lg"
          onClick={expandAll}
        >
          전체 일정
        </Button>
      </div>

      {/* Summary */}
      {viewMode === 'summary' && (
        <div className="p-4 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
          
          {/* Day Overview */}
          <div className="space-y-2">
            {data.days.map((day) => (
              <DayCard
                key={day.day}
                dayData={day}
                isExpanded={expandedDays.has(day.day)}
                onToggle={() => toggleDay(day.day)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full View */}
      {viewMode === 'full' && (
        <div className="p-4 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground mb-4">{data.summary}</p>
          {data.days.map((day) => (
            <DayCard
              key={day.day}
              dayData={day}
              isExpanded={true}
              onToggle={() => toggleDay(day.day)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** JSON 파싱 시도. itinerary JSON이면 Itinerary 객체 반환, 아니면 null */
export function tryParseItinerary(text: string): Itinerary | null {
  try {
    // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
    let jsonStr = text;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else if (text.trim().startsWith('{')) {
      jsonStr = text.trim();
    } else {
      return null;
    }
    
    const parsed = JSON.parse(jsonStr);
    if (parsed.type === 'itinerary' && parsed.days && Array.isArray(parsed.days)) {
      return parsed as Itinerary;
    }
    return null;
  } catch {
    return null;
  }
}
