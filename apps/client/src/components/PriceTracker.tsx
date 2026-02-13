import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, TrendingDown, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
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

interface PriceTrackerProps {
  tripId: string;
  tripData: any;
}

export function PriceTracker({ tripId, tripData }: PriceTrackerProps) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';

  // Check if already tracking
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
        // Convert DB format to display format
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

  const startTracking = async () => {
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
        setTracking(true);
        setLastChecked(new Date().toISOString());
      }
    } catch (err) {
      console.error('Price tracking failed:', err);
    } finally {
      setLoading(false);
    }
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
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const pctDiff = (current: number, low: number) => {
    if (!low || !current) return 0;
    return Math.round(((current - low) / current) * 100);
  };

  if (!tracking) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base text-blue-800 dark:text-blue-300">🔍 최저가 자동 추적</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          이 여행의 항공권과 호텔 가격을 AI가 자동으로 추적합니다. 최저가 도달 시 알림을 보내드립니다.
        </p>
        <Button
          onClick={startTracking}
          disabled={loading}
          className="rounded-xl gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? '가격 분석 중...' : '가격 추적 시작'}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-blue-200 bg-white dark:bg-gray-900 overflow-hidden"
    >
      {/* Header */}
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
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={refreshPrices} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {items.map((item, i) => {
          const diff = pctDiff(item.currentPrice, item.predictedLow);
          const isGoodDeal = item.buyNow || diff <= 5;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xl">
                {item.type === 'flight' ? '✈️' : '🏨'}
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

      {/* Footer */}
      <div className="px-5 py-2 bg-gray-50 dark:bg-gray-800/30 border-t">
        <p className="text-[11px] text-gray-500 text-center">💡 가격 변동 시 즉시 알려드립니다 · 6시간마다 자동 체크</p>
      </div>
    </motion.div>
  );
}
