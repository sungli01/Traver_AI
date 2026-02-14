import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export function useAgentSettings<T extends Record<string, unknown>>(agentId: string, defaults: T) {
  const { toast } = useToast();
  const storageKey = `agent-settings-${agentId}`;

  const [settings, setSettings] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return { ...defaults, ...JSON.parse(stored) };
    } catch {}
    return defaults;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
    } catch {}
  }, [storageKey]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(storageKey, JSON.stringify(next));
      toast({ title: '설정이 저장되었습니다', description: `${String(key)} 항목이 업데이트되었습니다.` });
      return next;
    });
  }, [storageKey, toast]);

  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSettings(defaults);
    toast({ title: '설정 초기화', description: '기본값으로 복원되었습니다.' });
  }, [storageKey, defaults, toast]);

  return { settings, update, reset };
}
