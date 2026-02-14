import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAgentSettings } from './useAgentSettings';

const defaults = {
  priority: 'balanced' as string,
  autoAssign: true,
  speedAccuracyBalance: 50,
  language: 'ko' as string,
};

export function OrchestratorSettings() {
  const { settings, update } = useAgentSettings('skywork-orchestrator', defaults);

  return (
    <div className="space-y-6">
      {/* 작업 우선순위 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">작업 우선순위</Label>
        <Select value={settings.priority} onValueChange={(v) => update('priority', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">💰 가격 우선</SelectItem>
            <SelectItem value="convenience">🛋️ 편의성 우선</SelectItem>
            <SelectItem value="time">⚡ 시간 우선</SelectItem>
            <SelectItem value="balanced">⚖️ 균형 모드</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 자동 할당 */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/30">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">에이전트 자동 할당</Label>
          <p className="text-xs text-muted-foreground">작업에 최적화된 에이전트를 자동으로 배정합니다.</p>
        </div>
        <Switch checked={settings.autoAssign} onCheckedChange={(v) => update('autoAssign', v)} />
      </div>

      {/* 응답 속도 vs 정확도 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">응답 속도 ↔ 정확도 밸런스</Label>
        <div className="px-1">
          <Slider
            value={[settings.speedAccuracyBalance]}
            onValueChange={([v]) => update('speedAccuracyBalance', v)}
            min={0}
            max={100}
            step={5}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>⚡ 빠른 응답</span>
          <Badge variant="outline" className="text-[10px]">{settings.speedAccuracyBalance}%</Badge>
          <span>🎯 높은 정확도</span>
        </div>
      </div>

      {/* 언어 설정 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">언어 설정</Label>
        <Select value={settings.language} onValueChange={(v) => update('language', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ko">🇰🇷 한국어</SelectItem>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="ja">🇯🇵 日本語</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
