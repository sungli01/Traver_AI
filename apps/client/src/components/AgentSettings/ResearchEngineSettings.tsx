import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAgentSettings } from './useAgentSettings';

const defaults = {
  sources: { flight: true, hotel: true, restaurant: true, attraction: true },
  priceAlertThreshold: 10,
  minReviewScore: 3,
  searchFrequency: '1h' as string,
  preferredAirlines: '',
  preferredHotels: '',
};

const SOURCE_OPTIONS = [
  { key: 'flight', label: '✈️ 항공' },
  { key: 'hotel', label: '🏨 호텔' },
  { key: 'restaurant', label: '🍽️ 맛집' },
  { key: 'attraction', label: '🗺️ 관광지' },
] as const;

export function ResearchEngineSettings() {
  const { settings, update } = useAgentSettings('research-engine', defaults);

  const toggleSource = (key: string) => {
    update('sources', { ...settings.sources, [key]: !settings.sources[key as keyof typeof settings.sources] });
  };

  return (
    <div className="space-y-6">
      {/* 검색 소스 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">검색 소스</Label>
        <div className="grid grid-cols-2 gap-3">
          {SOURCE_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 rounded-xl border border-border/50 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
              <Checkbox
                checked={settings.sources[key as keyof typeof settings.sources]}
                onCheckedChange={() => toggleSource(key)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 가격 알림 기준치 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">가격 변동 알림 기준</Label>
        <div className="px-1">
          <Slider
            value={[settings.priceAlertThreshold]}
            onValueChange={([v]) => update('priceAlertThreshold', v)}
            min={1}
            max={50}
            step={1}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          가격이 <Badge variant="outline" className="text-[10px] mx-1">{settings.priceAlertThreshold}%</Badge> 이상 변동 시 알림
        </p>
      </div>

      {/* 리뷰 최소 점수 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">리뷰 최소 점수 필터</Label>
        <div className="px-1">
          <Slider
            value={[settings.minReviewScore]}
            onValueChange={([v]) => update('minReviewScore', v)}
            min={1}
            max={5}
            step={0.5}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          ⭐ {settings.minReviewScore}점 이상만 결과에 표시
        </p>
      </div>

      {/* 검색 빈도 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">검색 빈도</Label>
        <Select value={settings.searchFrequency} onValueChange={(v) => update('searchFrequency', v)}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="realtime">⚡ 실시간</SelectItem>
            <SelectItem value="1h">🕐 1시간마다</SelectItem>
            <SelectItem value="6h">🕕 6시간마다</SelectItem>
            <SelectItem value="daily">📅 매일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 선호 항공사 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">선호 항공사</Label>
        <Input
          placeholder="예: 대한항공, 아시아나, JAL"
          value={settings.preferredAirlines}
          onChange={(e) => update('preferredAirlines', e.target.value)}
          className="bg-background/50"
        />
      </div>

      {/* 선호 호텔 체인 */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">선호 호텔 체인</Label>
        <Input
          placeholder="예: 메리어트, 하얏트, 힐튼"
          value={settings.preferredHotels}
          onChange={(e) => update('preferredHotels', e.target.value)}
          className="bg-background/50"
        />
      </div>
    </div>
  );
}
