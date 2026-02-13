import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'purchase_approval' | 'price_alert' | 'booking_confirmed';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
  loadFromStorage: () => void;
  syncPendingPurchases: () => Promise<void>;
}

const STORAGE_KEY = 'travel_notifications';

function saveToStorage(notifications: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch { /* ignore */ }
}

function loadFromStorageFn(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: Math.random().toString(36).slice(2, 10),
      read: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [notification, ...state.notifications];
      saveToStorage(updated);
      return { notifications: updated };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      saveToStorage(updated);
      return { notifications: updated };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map(n => ({ ...n, read: true }));
      saveToStorage(updated);
      return { notifications: updated };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter(n => n.id !== id);
      saveToStorage(updated);
      return { notifications: updated };
    });
  },

  clearAll: () => {
    saveToStorage([]);
    set({ notifications: [] });
  },

  unreadCount: () => get().notifications.filter(n => !n.read).length,

  loadFromStorage: () => {
    set({ notifications: loadFromStorageFn() });
  },

  syncPendingPurchases: async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';
      const res = await fetch(`${apiUrl}/api/purchase/pending`);
      if (!res.ok) return;
      const data = await res.json();
      const pending = data.requests || [];
      const current = get().notifications;

      for (const req of pending) {
        const exists = current.some(n => n.data?.requestId === req.id && n.type === 'purchase_approval');
        if (!exists) {
          get().addNotification({
            type: 'purchase_approval',
            title: `⚡ 구매 승인 요청`,
            message: `${req.item_name} - ₩${Number(req.current_price).toLocaleString()}`,
            data: { requestId: req.id, ...req },
          });
        }
      }
    } catch { /* silent */ }
  },
}));
