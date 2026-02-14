import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LockedField } from './LockedField';
import { useAgentSettings } from './useAgentSettings';

const defaults = {
  verificationScope: { identity: true, qualification: true, payment: true },
  proofValidity: '7d' as string,
  privacyLevel: 'standard' as string,
};

const SCOPE_OPTIONS = [
  { key: 'identity', label: '🪪 신원 검증' },
  { key: 'qualification', label: '📜 자격 검증' },
  { key: 'payment', label: '💳 결제 검증' },
] as const;

export function ZkProofEngineSettings() {
  const { settings, update } = useAgentSettings('zk-proof-engine', defaults);

  const toggleScope = (key: string) => {
    update('verificationScope', {
      ...settings.verificationScope,
      [key]: !settings.verificationScope[key as keyof typeof settings.verificationScope],
    });
  };

  return (
    <div className="space-y-6">
      {/* 자동 검증 범위 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">자동 검증 범위</Label>
        <div className="space-y-2">
          {SCOPE_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-border/50 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
              <Checkbox
                checked={settings.verificationScope[key as keyof typeof settings.verificationScope]}
                onCheckedChange={() => toggleScope(key)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 증명 유효기간 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">증명 유효기간</Label>
        <Select value={settings.proofValidity} onValueChange={(v) => update('proofValidity', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">1일</SelectItem>
            <SelectItem value="7d">7일</SelectItem>
            <SelectItem value="30d">30일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 프라이버시 수준 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">프라이버시 수준</Label>
        <Select value={settings.privacyLevel} onValueChange={(v) => update('privacyLevel', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">🟢 표준 — 필수 정보만 검증</SelectItem>
            <SelectItem value="enhanced">🔵 강화 — 최소 노출 원칙</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 🔒 민감 - 증명 알고리즘 */}
      <LockedField
        label="증명 알고리즘 변경"
        value="Groth16 + PLONK"
        description="증명 알고리즘은 시스템 관리자만 변경할 수 있습니다."
      />
    </div>
  );
}
