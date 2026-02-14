import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LockedField } from './LockedField';
import { useAgentSettings } from './useAgentSettings';

const defaults = {
  autoRecord: true,
  autoCertificate: true,
  recordScope: 'all' as string,
};

export function BlockchainVerifierSettings() {
  const { settings, update } = useAgentSettings('blockchain-verifier', defaults);

  return (
    <div className="space-y-6">
      {/* 자동 기록 */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/30">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">자동 블록체인 기록</Label>
          <p className="text-xs text-muted-foreground">예약/결제 시 자동으로 블록체인에 기록합니다.</p>
        </div>
        <Switch checked={settings.autoRecord} onCheckedChange={(v) => update('autoRecord', v)} />
      </div>

      {/* 증명서 자동 생성 */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/30">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">증명서 자동 생성</Label>
          <p className="text-xs text-muted-foreground">블록체인 기록 완료 시 증명서를 자동 발급합니다.</p>
        </div>
        <Switch checked={settings.autoCertificate} onCheckedChange={(v) => update('autoCertificate', v)} />
      </div>

      {/* 기록 범위 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">기록 범위</Label>
        <Select value={settings.recordScope} onValueChange={(v) => update('recordScope', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reservation">📋 예약만</SelectItem>
            <SelectItem value="payment">💳 결제만</SelectItem>
            <SelectItem value="all">📦 전체 (예약 + 결제)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 🔒 민감 - 스마트 컨트랙트 */}
      <LockedField
        label="스마트 컨트랙트 수정"
        value="비활성화"
        description="스마트 컨트랙트 변경은 관리자 승인이 필요합니다."
      />
    </div>
  );
}
