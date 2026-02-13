import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown,
  Save, MessageSquare, Wallet, CalendarDays, MapPin, X,
  Plane, UtensilsCrossed, ShoppingBag, Sparkles, Coffee,
  Hotel, Check, Pencil, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Itinerary } from '@/components/ItineraryCard';

/* ── Types ── */
interface EditableActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
  cost: string;
  memo: string;
  link?: string;
  lat?: number;
  lng?: number;
}

interface EditableAccommodation {
  name: string;
  cost: string;
  link?: string;
}

interface EditableDay {
  id: string;
  day: number;
  date: string;
  theme: string;
  activities: EditableActivity[];
  accommodation?: EditableAccommodation;
}

export interface ScheduleData {
  id: string;
  title: string;
  destination: string;
  period: string;
  totalBudget: string;
  summary: string;
  days: EditableDay[];
  createdAt: string;
  updatedAt: string;
  status: 'planning';
}

/* ── Category config ── */
const categoryConfig: Record<string, { icon: typeof Plane; color: string; bg: string; label: string }> = {
  transport:  { icon: Plane,           color: 'text-blue-600',    bg: 'bg-blue-500',    label: '교통' },
  restaurant: { icon: UtensilsCrossed, color: 'text-orange-600',  bg: 'bg-orange-500',  label: '식사' },
  attraction: { icon: MapPin,          color: 'text-emerald-600', bg: 'bg-emerald-500', label: '관광' },
  shopping:   { icon: ShoppingBag,     color: 'text-pink-600',    bg: 'bg-pink-500',    label: '쇼핑' },
  activity:   { icon: Sparkles,        color: 'text-purple-600',  bg: 'bg-purple-500',  label: '액티비티' },
  rest:       { icon: Coffee,          color: 'text-amber-600',   bg: 'bg-amber-500',   label: '휴식' },
};
const categories = Object.entries(categoryConfig).map(([key, v]) => ({ key, label: v.label }));
const getConfig = (cat: string) => categoryConfig[cat] || categoryConfig.attraction;

function uid() { return Math.random().toString(36).slice(2, 10); }

function parseCost(cost: string): number {
  return parseInt(cost.replace(/[^0-9]/g, ''), 10) || 0;
}

/* ── Convert Itinerary → ScheduleData ── */
export function itineraryToSchedule(data: Itinerary): ScheduleData {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: data.title,
    destination: data.destination,
    period: data.period,
    totalBudget: data.totalBudget,
    summary: data.summary,
    days: data.days.map(d => ({
      id: uid(),
      day: d.day,
      date: d.date,
      theme: d.theme,
      activities: d.activities.map(a => ({
        id: uid(),
        time: a.time,
        title: a.title,
        description: a.description,
        category: a.category,
        cost: a.cost,
        memo: '',
        link: a.link,
        lat: a.lat,
        lng: a.lng,
      })),
      accommodation: d.accommodation ? { name: d.accommodation.name, cost: d.accommodation.cost, link: d.accommodation.link } : undefined,
    })),
    createdAt: now,
    updatedAt: now,
    status: 'planning',
  };
}

/* ── localStorage helpers ── */
export function loadSavedTrips(): ScheduleData[] {
  try {
    return JSON.parse(localStorage.getItem('savedTrips') || '[]');
  } catch { return []; }
}

export function saveTrip(schedule: ScheduleData) {
  const trips = loadSavedTrips();
  const idx = trips.findIndex(t => t.id === schedule.id);
  schedule.updatedAt = new Date().toISOString();
  if (idx >= 0) trips[idx] = schedule;
  else trips.push(schedule);
  localStorage.setItem('savedTrips', JSON.stringify(trips));
}

export function deleteTrip(id: string) {
  const trips = loadSavedTrips().filter(t => t.id !== id);
  localStorage.setItem('savedTrips', JSON.stringify(trips));
}

/* ── Activity Editor Row ── */
function ActivityRow({
  activity, index, total, onUpdate, onDelete, onMove,
}: {
  activity: EditableActivity;
  index: number;
  total: number;
  onUpdate: (a: EditableActivity) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  const cfg = getConfig(activity.category);
  const Icon = cfg.icon;

  if (!editing) {
    return (
      <div className="flex gap-3 items-start group">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full ${cfg.bg} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}>
            {index + 1}
          </div>
          {index < total - 1 && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[8px]" />}
        </div>
        <div className="flex-1 min-w-0 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{activity.title}</h4>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
                {activity.description && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{activity.description}</span>
                  </>
                )}
              </div>
              {activity.time && <span className="text-[10px] text-gray-400 font-mono">{activity.time}</span>}
              {activity.memo && (
                <p className="text-xs text-amber-600 mt-1 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">📝 {activity.memo}</p>
              )}
            </div>
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap shrink-0">{activity.cost}</span>
          </div>
          {/* Action buttons on hover */}
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" />
            </Button>
            {index > 0 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(-1)}>
                <ArrowUp className="w-3 h-3" />
              </Button>
            )}
            {index < total - 1 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(1)}>
                <ArrowDown className="w-3 h-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Editing mode
  return (
    <div className="border border-primary/30 rounded-xl p-3 space-y-2 bg-primary/5 mb-2">
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={activity.title}
          onChange={e => onUpdate({ ...activity, title: e.target.value })}
          placeholder="장소 이름"
          className="text-sm h-8"
        />
        <Input
          value={activity.time}
          onChange={e => onUpdate({ ...activity, time: e.target.value })}
          placeholder="시간 (예: 09:00-11:00)"
          className="text-sm h-8"
        />
      </div>
      <Input
        value={activity.description}
        onChange={e => onUpdate({ ...activity, description: e.target.value })}
        placeholder="설명"
        className="text-sm h-8"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={activity.category}
          onChange={e => onUpdate({ ...activity, category: e.target.value })}
          className="text-sm h-8 rounded-md border border-input bg-background px-2"
        >
          {categories.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <Input
          value={activity.cost}
          onChange={e => onUpdate({ ...activity, cost: e.target.value })}
          placeholder="비용"
          className="text-sm h-8"
        />
      </div>
      <textarea
        value={activity.memo}
        onChange={e => onUpdate({ ...activity, memo: e.target.value })}
        placeholder="개인 메모 (선택)"
        className="w-full text-sm rounded-md border border-input bg-background px-2 py-1.5 resize-none"
        rows={2}
      />
      <div className="flex justify-end">
        <Button size="sm" className="h-7 text-xs rounded-lg" onClick={() => setEditing(false)}>
          <Check className="w-3 h-3 mr-1" /> 완료
        </Button>
      </div>
    </div>
  );
}

/* ── Add Activity Form ── */
function AddActivityForm({ onAdd, onCancel }: { onAdd: (a: EditableActivity) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: '', time: '', description: '', category: 'attraction', cost: '', memo: '' });

  return (
    <div className="border border-dashed border-primary/40 rounded-xl p-3 space-y-2 bg-primary/5">
      <div className="grid grid-cols-2 gap-2">
        <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="장소 이름 *" className="text-sm h-8" />
        <Input value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="시간" className="text-sm h-8" />
      </div>
      <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="설명" className="text-sm h-8" />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="text-sm h-8 rounded-md border border-input bg-background px-2">
          {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <Input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="비용" className="text-sm h-8" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>취소</Button>
        <Button size="sm" className="h-7 text-xs" disabled={!form.title.trim()} onClick={() => {
          onAdd({ id: uid(), ...form, memo: form.memo });
          onCancel();
        }}>
          <Plus className="w-3 h-3 mr-1" /> 추가
        </Button>
      </div>
    </div>
  );
}

/* ── Day Accordion ── */
function DayAccordion({
  day, isExpanded, onToggle, onUpdate, onDelete,
}: {
  day: EditableDay;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (d: EditableDay) => void;
  onDelete: () => void;
}) {
  const [addingActivity, setAddingActivity] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingHeader, setEditingHeader] = useState(false);

  const dayCost = day.activities.reduce((sum, a) => sum + parseCost(a.cost), 0)
    + (day.accommodation ? parseCost(day.accommodation.cost) : 0);

  const updateActivity = (actId: string, updated: EditableActivity) => {
    onUpdate({ ...day, activities: day.activities.map(a => a.id === actId ? updated : a) });
  };

  const removeActivity = (actId: string) => {
    onUpdate({ ...day, activities: day.activities.filter(a => a.id !== actId) });
    setDeleteTarget(null);
  };

  const moveActivity = (actId: string, dir: -1 | 1) => {
    const idx = day.activities.findIndex(a => a.id === actId);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= day.activities.length) return;
    const acts = [...day.activities];
    [acts[idx], acts[newIdx]] = [acts[newIdx], acts[idx]];
    onUpdate({ ...day, activities: acts });
  };

  const addActivity = (a: EditableActivity) => {
    onUpdate({ ...day, activities: [...day.activities, a] });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 hover:from-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex flex-col items-center justify-center leading-none shadow-sm">
            <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">Day</span>
            <span className="text-base font-black -mt-0.5">{day.day}</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{day.date}</p>
            <p className="text-xs text-gray-500 mt-0.5">{day.theme}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{dayCost > 0 ? `${dayCost.toLocaleString()}원` : ''}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 space-y-1">
              {/* Edit date/theme */}
              {editingHeader ? (
                <div className="flex gap-2 mb-3">
                  <Input value={day.date} onChange={e => onUpdate({ ...day, date: e.target.value })} placeholder="날짜" className="text-sm h-8 flex-1" />
                  <Input value={day.theme} onChange={e => onUpdate({ ...day, theme: e.target.value })} placeholder="테마" className="text-sm h-8 flex-1" />
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingHeader(false)}>
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <button onClick={() => setEditingHeader(true)} className="text-[10px] text-gray-400 hover:text-primary mb-2 flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" /> 날짜/테마 수정
                </button>
              )}

              {/* Activities */}
              {day.activities.map((act, i) => (
                <ActivityRow
                  key={act.id}
                  activity={act}
                  index={i}
                  total={day.activities.length}
                  onUpdate={(a) => updateActivity(act.id, a)}
                  onDelete={() => setDeleteTarget(act.id)}
                  onMove={(dir) => moveActivity(act.id, dir)}
                />
              ))}

              {/* Accommodation */}
              {day.accommodation && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50">
                  <Hotel className="w-5 h-5 text-indigo-500" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">🏨 {day.accommodation.name}</p>
                    <p className="text-xs text-indigo-500 font-semibold">{day.accommodation.cost}</p>
                  </div>
                </div>
              )}

              {/* Add activity */}
              {addingActivity ? (
                <AddActivityForm onAdd={addActivity} onCancel={() => setAddingActivity(false)} />
              ) : (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed border-gray-200">
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8" onClick={() => setAddingActivity(true)}>
                    <Plus className="w-3.5 h-3.5" /> 장소 추가
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8 text-red-500 hover:text-red-700 ml-auto" onClick={onDelete}>
                    <Trash2 className="w-3.5 h-3.5" /> Day 삭제
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>장소를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>이 장소를 일정에서 삭제합니다. 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && removeActivity(deleteTarget)}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Main ScheduleEditor ── */
export function ScheduleEditor({
  schedule,
  onBack,
  onRequestAIEdit,
}: {
  schedule: ScheduleData;
  onBack: () => void;
  onRequestAIEdit?: (schedule: ScheduleData) => void;
}) {
  const [data, setData] = useState<ScheduleData>(schedule);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(data.days.map(d => d.id)));
  const [saved, setSaved] = useState(false);
  const [deleteDayTarget, setDeleteDayTarget] = useState<string | null>(null);

  const totalCost = useMemo(() => {
    return data.days.reduce((sum, day) => {
      const dayCost = day.activities.reduce((s, a) => s + parseCost(a.cost), 0)
        + (day.accommodation ? parseCost(day.accommodation.cost) : 0);
      return sum + dayCost;
    }, 0);
  }, [data]);

  const toggleDay = (id: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateDay = useCallback((dayId: string, updated: EditableDay) => {
    setData(prev => ({ ...prev, days: prev.days.map(d => d.id === dayId ? updated : d) }));
    setSaved(false);
  }, []);

  const deleteDay = (dayId: string) => {
    setData(prev => ({
      ...prev,
      days: prev.days.filter(d => d.id !== dayId).map((d, i) => ({ ...d, day: i + 1 })),
    }));
    setDeleteDayTarget(null);
    setSaved(false);
  };

  const addDay = () => {
    const newDay: EditableDay = {
      id: uid(),
      day: data.days.length + 1,
      date: '',
      theme: '새로운 날',
      activities: [],
    };
    setData(prev => ({ ...prev, days: [...prev.days, newDay] }));
    setExpandedDays(prev => new Set([...prev, newDay.id]));
    setSaved(false);
  };

  const handleSave = () => {
    saveTrip(data);
    setSaved(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          ← 돌아가기
        </button>
        <div className="flex items-center gap-2">
          {onRequestAIEdit && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => onRequestAIEdit(data)}>
              <MessageSquare className="w-3.5 h-3.5" /> AI에게 수정 요청
            </Button>
          )}
          <Button size="sm" className="rounded-xl gap-1.5 text-xs" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> {saved ? '저장됨 ✓' : '저장'}
          </Button>
        </div>
      </div>

      {/* Title card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h2 className="font-black text-xl text-gray-900 dark:text-gray-50">{data.title}</h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary" className="text-[11px] gap-1 rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-700 border-0">
            <MapPin className="w-3 h-3" /> {data.destination}
          </Badge>
          <Badge variant="secondary" className="text-[11px] gap-1 rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border-0">
            <CalendarDays className="w-3 h-3" /> {data.period}
          </Badge>
          <Badge variant="secondary" className="text-[11px] gap-1 rounded-full px-2.5 py-0.5 bg-primary/10 text-primary border-0">
            <Wallet className="w-3 h-3" /> 예산: {data.totalBudget}
          </Badge>
        </div>
        {/* Cost summary */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="font-bold">현재 합계:</span>
          <span className="font-black font-mono text-primary">{totalCost.toLocaleString()}원</span>
          {parseCost(data.totalBudget) > 0 && totalCost > parseCost(data.totalBudget) && (
            <span className="text-xs text-red-500 font-bold">(예산 초과!)</span>
          )}
        </div>
      </div>

      {/* Days */}
      <div className="space-y-3">
        {data.days.map((day) => (
          <DayAccordion
            key={day.id}
            day={day}
            isExpanded={expandedDays.has(day.id)}
            onToggle={() => toggleDay(day.id)}
            onUpdate={(d) => updateDay(day.id, d)}
            onDelete={() => setDeleteDayTarget(day.id)}
          />
        ))}
      </div>

      {/* Add day */}
      <Button variant="outline" className="w-full rounded-2xl h-12 gap-2 border-dashed text-muted-foreground hover:text-primary" onClick={addDay}>
        <Plus className="w-4 h-4" /> Day {data.days.length + 1} 추가
      </Button>

      {/* Delete day confirmation */}
      <AlertDialog open={!!deleteDayTarget} onOpenChange={() => setDeleteDayTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 날짜를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>해당 날짜의 모든 일정이 삭제됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDayTarget && deleteDay(deleteDayTarget)}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
