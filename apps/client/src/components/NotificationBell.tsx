import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Zap, TrendingDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, loadFromStorage, syncPendingPurchases } = useNotificationStore();

  useEffect(() => {
    loadFromStorage();
    syncPendingPurchases();
    const interval = setInterval(syncPendingPurchases, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const count = unreadCount();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'purchase_approval': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'price_alert': return <TrendingDown className="w-4 h-4 text-blue-500" />;
      case 'booking_confirmed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  const handleApprove = async (requestId: number, notifId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';
    try {
      await fetch(`${apiUrl}/api/purchase/approve/${requestId}`, { method: 'POST' });
      removeNotification(notifId);
    } catch { /* silent */ }
  };

  const handleReject = async (requestId: number, notifId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';
    try {
      await fetch(`${apiUrl}/api/purchase/reject/${requestId}`, { method: 'POST' });
      removeNotification(notifId);
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm">알림</h3>
              {count > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {/* Items */}
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                알림이 없습니다
              </div>
            ) : (
              <div className="divide-y">
                {notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {/* Quick actions for purchase approvals */}
                        {n.type === 'purchase_approval' && n.data?.requestId && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="h-6 text-[10px] rounded-lg gap-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={(e) => { e.stopPropagation(); handleApprove(n.data.requestId, n.id); }}
                            >
                              <Check className="w-3 h-3" /> 승인
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] rounded-lg gap-1"
                              onClick={(e) => { e.stopPropagation(); handleReject(n.data.requestId, n.id); }}
                            >
                              <X className="w-3 h-3" /> 패스
                            </Button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                        className="text-gray-300 hover:text-gray-500 mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
