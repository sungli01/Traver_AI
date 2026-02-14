import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LockedField } from './LockedField';
import { useAgentSettings } from './useAgentSettings';

const defaults = {
  backupFrequency: 'daily' as string,
  dataRetention: '6m' as string,
};

export function VaultGuardianSettings() {
  const { settings, update } = useAgentSettings('vault-guardian', defaults);

  return (
    <div className="space-y-6">
      {/* 백업 주기 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">자동 백업 주기</Label>
        <Select value={settings.backupFrequency} onValueChange={(v) => update('backupFrequency', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">📅 매일</SelectItem>
            <SelectItem value="weekly">📆 주간</SelectItem>
            <SelectItem value="monthly">🗓️ 월간</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 암호화 방식 (읽기 전용) */}
      <LockedField
        label="암호화 방식"
        value="AES-256-GCM"
        description="시스템 보안 정책에 의해 설정됩니다."
      />

      {/* 데이터 보관 기간 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">데이터 보관 기간</Label>
        <Select value={settings.dataRetention} onValueChange={(v) => update('dataRetention', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1개월</SelectItem>
            <SelectItem value="3m">3개월</SelectItem>
            <SelectItem value="6m">6개월</SelectItem>
            <SelectItem value="1y">1년</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 🔒 민감 - 데이터 삭제 */}
      <LockedField
        label="데이터 삭제"
        value="비활성화"
        description="데이터 삭제는 관리자만 수행할 수 있습니다."
      />

      {/* 🔒 민감 - 격리 해제 */}
      <LockedField
        label="격리 해제"
        value="비활성화"
        description="데이터 격리 해제는 관리자 승인이 필요합니다."
      />
    </div>
  );
}
