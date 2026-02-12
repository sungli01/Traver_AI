import { create } from 'zustand';

export interface Detection {
  type: 'phone' | 'email' | 'card' | 'passport';
  original: string;
  masked: string;
}

export interface MaskingLog {
  id: string;
  timestamp: string;
  originalType: 'name' | 'phone' | 'email' | 'card' | 'passport';
  maskedValue: string;
  context: string;
  agentId: string;
}

interface SecurityState {
  maskingEnabled: boolean;
  maskingLevel: 'basic' | 'enhanced' | 'maximum';
  logs: MaskingLog[];
  toggleMasking: () => void;
  setMaskingLevel: (level: 'basic' | 'enhanced' | 'maximum') => void;
  addLog: (log: MaskingLog) => void;
  maskPII: (text: string) => { masked: string; detections: Detection[] };
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  maskingEnabled: false,
  maskingLevel: 'basic',
  logs: [],
  toggleMasking: () => set((s) => ({ maskingEnabled: !s.maskingEnabled })),
  setMaskingLevel: (level) => set({ maskingLevel: level }),
  addLog: (log) => set((s) => ({ logs: [log, ...s.logs] })),
  maskPII: (text: string) => {
    const detections: Detection[] = [];

    let masked = text;

    // Phone: 010-1234-5678 or 01012345678
    masked = masked.replace(/(01[016789])[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g, (_m, p1, _p2, p3) => {
      const original = _m;
      const result = `${p1}-****-${p3}`;
      detections.push({ type: 'phone', original, masked: result });
      return result;
    });

    // Email
    masked = masked.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (_m, local, domain) => {
      const result = `${local[0]}***@${domain}`;
      detections.push({ type: 'email', original: _m, masked: result });
      return result;
    });

    // Card number: 1234-5678-9012-3456
    masked = masked.replace(/(\d{4})[-.\s]?(\d{4})[-.\s]?(\d{4})[-.\s]?(\d{4})/g, (_m, _p1, _p2, _p3, p4) => {
      const result = `****-****-****-${p4}`;
      detections.push({ type: 'card', original: _m, masked: result });
      return result;
    });

    // Passport: M12345678
    masked = masked.replace(/([A-Z])(\d{8})/g, (_m, letter, digits) => {
      const result = `${letter}****${digits.slice(-4)}`;
      detections.push({ type: 'passport', original: _m, masked: result });
      return result;
    });

    return { masked, detections };
  },
}));
