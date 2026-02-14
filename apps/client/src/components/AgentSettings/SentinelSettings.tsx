import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LockedField } from './LockedField';
import { useAgentSettings } from './useAgentSettings';

const defaults = {
  piiMaskingLevel: 'enhanced' as string,
  logRetention: '30d' as string,
  alertLevel: 'all' as string,
  require2FA: false,
};

export function SentinelSettings() {
  const { settings, update } = useAgentSettings('sentinel-agent', defaults);

  return (
    <div className="space-y-6">
      {/* PII 마스킹 수준 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">PII 마스킹 수준</Label>
        <Select value={settings.piiMaskingLevel} onValueChange={(v) => update('piiMaskingLevel', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">🟢 기본 — 이름, 전화번호</SelectItem>
            <SelectItem value="enhanced">🟡 강화 — 기본 + 이메일, 주소</SelectItem>
            <SelectItem value="maximum">🔴 최대 — 모든 개인 식별 정보</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 로그 보관 기간 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">자동 로그 보관 기간</Label>
        <Select value={settings.logRetention} onValueChange={(v) => update('logRetention', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7일</SelectItem>
            <SelectItem value="30d">30일</SelectItem>
            <SelectItem value="90d">90일</SelectItem>
            <SelectItem value="permanent">♾️ 영구</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 알림 수준 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">알림 수준</Label>
        <Select value={settings.alertLevel} onValueChange={(v) => update('alertLevel', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">📢 전체 알림</SelectItem>
            <SelectItem value="danger">⚠️ 위험만</SelectItem>
            <SelectItem value="critical">🚨 긴급만</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 2FA */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/30">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">2FA 요구</Label>
          <p className="text-xs text-muted-foreground">민감한 데이터 접근 시 2단계 인증을 요구합니다.</p>
        </div>
        <Switch checked={settings.require2FA} onCheckedChange={(v) => update('require2FA', v)} />
      </div>

      {/* 🔒 민감 - 보안 레벨 */}
      <LockedField
        label="보안 레벨 변경"
        value="Maximum"
        description="관리자에게 문의하여 보안 레벨을 변경할 수 있습니다."
      />
    </div>
  );
}
