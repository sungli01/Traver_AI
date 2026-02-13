import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Clock, Zap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PurchaseRequest {
  id: number;
  trip_id: string;
  item_type: string;
  item_name: string;
  destination: string;
  travel_date: string;
  current_price: number;
  predicted_low: number;
  recommendation: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface PurchaseApprovalProps {
  tripId?: string;
}

export function PurchaseApproval({ tripId }: PurchaseApprovalProps) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [purchasedId, setPurchasedId] = useState<number | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [tripId]);

  const fetchPending = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/purchase/pending`);
      if (!res.ok) return;
      const data = await res.json();
      let reqs = data.requests || [];
      if (tripId) {
        reqs = reqs.filter((r: PurchaseRequest) => r.trip_id === tripId);
      }
      setRequests(reqs);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${apiUrl}/api/purchase/approve/${id}`, { method: 'POST' });
      if (res.ok) {
        setPurchasedId(id);
        setTimeout(() => {
          setRequests(prev => prev.filter(r => r.id !== id));
          setPurchasedId(null);
        }, 2000);
      }
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${apiUrl}/api/purchase/reject/${id}`, { method: 'POST' });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    } catch { /* silent */ }
    setActionLoading(null);
  };

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {requests.map((req) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="rounded-2xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-3 bg-yellow-100/50 dark:bg-yellow-900/20 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <h3 className="font-bold text-sm text-yellow-800 dark:text-yellow-300">⚡ 구매 승인 요청</h3>
              <div className="ml-auto">
                <CountdownTimer expiresAt={req.expires_at} />
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Item info */}
              <div className="flex items-start gap-3">
                <span className="text-2xl">{req.item_type === 'flight' ? '✈️' : '🏨'}</span>
                <div className="flex-1">
                  <p className="font-bold text-base text-gray-900 dark:text-gray-100">{req.item_name}</p>
                  {req.destination && (
                    <p className="text-xs text-gray-500 mt-0.5">{req.destination} {req.travel_date && `· ${req.travel_date}`}</p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <div className="text-center flex-1 p-3 rounded-xl bg-white dark:bg-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">현재 가격</p>
                  <p className="text-xl font-black text-primary">₩{Number(req.current_price).toLocaleString()}</p>
                </div>
                {req.predicted_low && (
                  <div className="text-center flex-1 p-3 rounded-xl bg-white dark:bg-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">예상 최저가</p>
                    <p className="text-xl font-black text-blue-600">₩{Number(req.predicted_low).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* AI recommendation */}
              {req.recommendation && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-sm text-blue-800 dark:text-blue-300">
                  🤖 {req.recommendation}
                </div>
              )}

              {/* Actions */}
              {purchasedId === req.id ? (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-center gap-2 py-4 text-emerald-600"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-bold">결제가 완료되었습니다! ✓</span>
                </motion.div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 rounded-xl h-11 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id}
                  >
                    {actionLoading === req.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    승인하고 결제
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 gap-2 border-gray-300"
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id}
                  >
                    <X className="w-4 h-4" />
                    이번엔 패스
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('만료됨');
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${hours}시간 ${mins}분 남음`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="text-[10px] text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
      <Clock className="w-3 h-3" /> {remaining}
    </span>
  );
}
