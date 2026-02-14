import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, Building2, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface UsageData {
  plan: string;
  month: string;
  usage: Record<string, number>;
  limits: Record<string, number>;
}

const ACTION_LABELS: Record<string, string> = {
  chat: 'AI 상담',
  itinerary_create: '일정 생성',
  price_track: '가격 추적',
};

export function PlanBadge({ plan }: { plan: string }) {
  if (plan === 'pro') return <Badge className="bg-primary text-primary-foreground gap-1"><Crown className="h-3 w-3" />Pro</Badge>;
  if (plan === 'business') return <Badge className="bg-amber-500 text-white gap-1"><Building2 className="h-3 w-3" />Business</Badge>;
  return null;
}

export function UsageBanner() {
  const { token, user } = useAuthStore();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/user/usage`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setUsage)
      .catch(() => {});
  }, [token]);

  if (!usage || !user) return null;

  const plan = usage.plan;
  const entries = Object.entries(usage.limits).filter(([, v]) => v !== null);

  return (
    <>
      <Card className="border-dashed">
        <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <PlanBadge plan={plan} />
            {plan === 'free' && <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" />Free</Badge>}
            <span className="text-sm text-muted-foreground">{user.name}님의 이번 달 사용량</span>
          </div>
          <div className="flex flex-wrap gap-4 flex-1">
            {entries.map(([action, limit]) => {
              const used = usage.usage[action] || 0;
              const isInfinity = limit > 999999;
              const pct = isInfinity ? 0 : Math.min(100, (used / limit) * 100);
              const atLimit = !isInfinity && used >= limit;
              return (
                <div key={action} className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-xs whitespace-nowrap">{ACTION_LABELS[action] || action}</span>
                  {isInfinity ? (
                    <span className="text-xs text-emerald-500">무제한</span>
                  ) : (
                    <>
                      <Progress value={pct} className={`h-2 w-16 ${atLimit ? '[&>div]:bg-destructive' : ''}`} />
                      <span className={`text-xs ${atLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {used}/{limit}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {plan === 'free' && (
            <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => setShowUpgrade(true)}>
              업그레이드 <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>플랜 업그레이드</DialogTitle>
            <DialogDescription>
              더 많은 기능을 사용하려면 Pro 또는 Business 플랜으로 업그레이드하세요.
            </DialogDescription>
          </DialogHeader>
          <Link to="/pricing" onClick={() => setShowUpgrade(false)}>
            <Button className="w-full">요금제 보기</Button>
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사용 한도 도달</DialogTitle>
          <DialogDescription>
            현재 플랜의 월간 사용 한도에 도달했습니다. 업그레이드하여 더 많은 기능을 이용하세요.
          </DialogDescription>
        </DialogHeader>
        <Link to="/pricing" onClick={onClose}>
          <Button className="w-full">요금제 보기 →</Button>
        </Link>
      </DialogContent>
    </Dialog>
  );
}
