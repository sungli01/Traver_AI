import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface AuthUser {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ loading: false, error: data.error || '로그인 실패' });
        return false;
      }
      localStorage.setItem('auth_token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch {
      set({ loading: false, error: '서버 연결 실패' });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ loading: false, error: data.error || '회원가입 실패' });
        return false;
      }
      localStorage.setItem('auth_token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return true;
    } catch {
      set({ loading: false, error: '서버 연결 실패' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null });
  },

  loadFromStorage: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, token });
      } else {
        localStorage.removeItem('auth_token');
        set({ token: null });
      }
    } catch {
      // server unavailable, keep token for later
    }
  },
}));
