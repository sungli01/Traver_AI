import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, TrendingDown, BarChart3, RefreshCw, Bell, Mail, MessageSquare, Smartphone, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PriceItem {
  type: string;
  name: string;
  currentPrice: number;
  predictedLow: number;
  confidence: number;
  recommendation: string;
  buyNow: boolean;
}

interface ExtractedItem {
  type: string;
  name: string;
  destination: string;
  travelDate: string;
  category: string;
}

type NotificationChannel = 'app' | 'email' | 'kakao' | 'sms';

interface PriceTrackerProps {
  tripId: string;
  tripData: any;
}

const CHANNEL_OPTIONS: { id: NotificationChannel; label: string; icon: any; available: boolean }[] = [
  { id: 'app', label: '앱 내 알림', icon: Bell, available: true },
  { id: 'email', label: '이메일 알림', icon: Mail, available: true },
  { id: 'kakao', label: '카카오톡 알림', icon: MessageSquare, available: false },
  { id: 'sms', label: 'SMS 알림', icon: Smartphone, available: false },
];

export function PriceTracker({ tripId, tripData }: PriceTrackerProps) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Step flow state
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=items, 2=channels, 3=tracking
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedChannels, setSelectedChannels] = useState<Set<NotificationChannel>>(new Set(['app']));
  const [extracting, setExtracting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';

  useEffect(() => {
    fetchStatus();
  }, [tripId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/price-track/${tripId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.prices && data.prices.length > 0) {
        setTracking(true);
        setLastChecked(data.prices[0]?.checked_at);
        setItems(data.prices.map((p: any) => ({
          type: p.item_type,
          name: p.item_name,
          currentPrice: p.price,
          predictedLow: Math.round(p.price * 0.85),
          confidence: 0.7,
          recommendation: '',
          buyNow: false,
        })));
      }
    } catch { /* silent */ }
  };

  const extractItems = async () => {
    setExtracting(true);
    try {
      const res = await fetch(`${apiUrl}/api/price-track/extract-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripData }),
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setExtractedItems(data.items);
        setSelectedItems(new Set(data.items.map((_: any, i: number) => String(i))));
      }
    } catch (err) {
      console.error('Extract items failed:', err);
    } finally {
      setExtracting(false);
    }
  };

  const startTracking = async () => {
    setLoading(true);
    try {
      const selectedItemsList = Array.from(selectedItems).map(i => extractedItems[Number(i)]);
      const res = await fetch(`${apiUrl}/api/price-track/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          tripData,
          selectedItems: selectedItemsList.length > 0 ? selectedItemsList : undefined,
          notificationChannels: Array.from(selectedChannels),
        }),
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setTracking(true);
        setLastChecked(new Date().toISOString());
        // Dispatch agent status event
        window.dispatchEvent(new CustomEvent('agent-status', {
          detail: { agent: 'booking', active: true, itemCount: data.items.length, lastCheck: new Date().toISOString() }
        }));
      }
    } catch (err) {
      console.error('Price tracking failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopTracking = () => {
    setTracking(false);
    setItems([]);
    setStep(1);
    setExtractedItems([]);
    setSelectedItems(new Set());
    window.dispatchEvent(new CustomEvent('agent-status', {
      detail: { agent: 'booking', active: false, itemCount: 0, lastCheck: null }
    }));
  };

  const refreshPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/price-track/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, tripData }),
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setLastChecked(new Date().toISOString());
        window.dispatchEvent(new CustomEvent('agent-status', {
          detail: { agent: 'booking', active: true, itemCount: data.items.length, lastCheck: new Date().toISOString() }
        }));
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const pctDiff = (current: number, low: number) => {
    if (!low || !current) return 0;
    return Math.round(((current - low) / current) * 100);
  };

  const toggleItem = (idx: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleChannel = (ch: NotificationChannel) => {
    if (ch === 'app') return; // app is always on
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  // Not tracking yet — show step flow
  if (!tracking) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden"
      >
        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-blue-200/50 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base text-blue-800 dark:text-blue-300">🔍 최저가 자동 추적</h3>
        </div>

        <div className="px-5 py-3 flex items-center gap-2 text-xs text-gray-500 border-b border-blue-100/50">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </span>
              <span className={step === s ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}>
                {s === 1 ? '항목 선택' : s === 2 ? '알림 채널' : '추적 시작'}
              </span>
              {s < 3 && <ChevronRight className="w-3 h-3 text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* Step 1: Extract & select items */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  AI가 일정에서 예약이 필요한 항목을 자동으로 도출합니다. 추적할 항목을 선택하세요.
                </p>
                {extractedItems.length === 0 ? (
                  <Button onClick={extractItems} disabled={extracting} className="rounded-xl gap-2">
                    {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {extracting ? '항목 분석 중...' : '예약 필요 항목 도출'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {extractedItems.map((item, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(String(i))}
                          onChange={() => toggleItem(String(i))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">
                          {item.type === 'flight' ? '✈️' : item.type === 'hotel' ? '🏨' : item.type === 'rental_car' ? '🚗' : item.type === 'activity' ? '🎫' : item.type === 'restaurant' ? '🍽️' : '📌'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-500">{item.category} · {item.travelDate}</p>
                        </div>
                      </label>
                    ))}
                    <div className="flex justify-between pt-3">
                      <span className="text-xs text-gray-500">{selectedItems.size}개 선택됨</span>
                      <Button onClick={() => setStep(2)} disabled={selectedItems.size === 0} size="sm" className="rounded-xl gap-1">
                        다음 <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Notification channels */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  최저가 도달 시 알림을 받을 채널을 선택하세요.
                </p>
                <div className="space-y-2">
                  {CHANNEL_OPTIONS.map(ch => (
                    <label key={ch.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedChannels.has(ch.id)
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300'
                        : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selectedChannels.has(ch.id)}
                        onChange={() => toggleChannel(ch.id)}
                        disabled={ch.id === 'app'}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <ch.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium flex-1">{ch.label}</span>
                      {!ch.available && (
                        <Badge variant="secondary" className="text-[10px]">준비중</Badge>
                      )}
                      {ch.id === 'app' && (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">기본</Badge>
                      )}
                    </label>
                  ))}
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="rounded-xl gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> 이전
                  </Button>
                  <Button onClick={() => { setStep(3); startTracking(); }} disabled={loading} size="sm" className="rounded-xl gap-1">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? '분석 중...' : '추적 시작'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Tracking active — show results
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-blue-200 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-blue-800 dark:text-blue-300">🔍 최저가 추적 중</h3>
          {lastChecked && (
            <span className="text-[10px] text-gray-500">
              마지막 체크: {new Date(lastChecked).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={refreshPrices} disabled={loading}>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={stopTracking}>
            중지
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item, i) => {
          const diff = pctDiff(item.currentPrice, item.predictedLow);
          const isGoodDeal = item.buyNow || diff <= 5;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xl">
                {item.type === 'flight' ? '✈️' : item.type === 'hotel' ? '🏨' : item.type === 'rental_car' ? '🚗' : item.type === 'activity' ? '🎫' : '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500">
                    현재 <strong className="text-gray-800 dark:text-gray-200">₩{item.currentPrice.toLocaleString()}</strong>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">
                    예상 최저 <strong className="text-blue-600">₩{item.predictedLow.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {isGoodDeal ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] gap-1">
                    <BarChart3 className="w-3 h-3" /> 지금이 적기!
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <TrendingDown className="w-3 h-3" /> {diff}% 하락 예측
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
        {items.length === 0 && !loading && (
          <p className="text-sm text-gray-400 text-center py-4">추적 중인 항목이 없습니다</p>
        )}
      </div>

      <div className="px-5 py-2 bg-gray-50 dark:bg-gray-800/30 border-t">
        <p className="text-[11px] text-gray-500 text-center">💡 가격 변동 시 즉시 알려드립니다 · 6시간마다 자동 체크</p>
      </div>
    </motion.div>
  );
}
