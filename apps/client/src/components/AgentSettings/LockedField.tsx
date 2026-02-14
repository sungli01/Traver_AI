import React from 'react';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LockedFieldProps {
  label: string;
  value: string;
  description?: string;
}

export function LockedField({ label, value, description }: LockedFieldProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/20 opacity-75">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">{label}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-500">
            관리자 전용
          </Badge>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <span className="text-sm font-mono text-muted-foreground">{value}</span>
    </div>
  );
}
