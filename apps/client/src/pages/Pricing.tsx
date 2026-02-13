import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Crown, Zap, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const plans = [
  {
    name: 'Free',
    price: 0,
    icon: Zap,
    color: 'text-muted-foreground',
    badge: null,
    description: '기본 AI 여행 상담',
    features: [
      { name: 'AI 상담', value: '월 5회', included: true },
      { name: '여행 일정 생성', value: '월 2건', included: true },
      { name: '실시간 가격 알림', value: '', included: false },
      { name: '팀 공유', value: '', included: false },
      { name: 'API 접근', value: '', included: false },
      { name: '우선 응답', value: '', included: false },
      { name: '전담 컨시어지', value: '', included: false },
    ],
  },
  {
    name: 'Pro',
    price: 9900,
    icon: Crown,
    color: 'text-primary',
    badge: '인기',
    description: '활발한 여행자를 위한 플랜',
    features: [
      { name: 'AI 상담', value: '무제한', included: true },
      { name: '여행 일정 생성', value: '무제한', included: true },
      { name: '실시간 가격 알림', value: '최대 10건', included: true },
      { name: '팀 공유', value: '최대 3명', included: true },
      { name: 'API 접근', value: '', included: false },
      { name: '우선 응답', value: '✓', included: true },
      { name: '전담 컨시어지', value: '', included: false },
    ],
  },
  {
    name: 'Business',
    price: 29900,
    icon: Building2,
    color: 'text-amber-500',
    badge: 'Premium',
    description: '팀 & 기업을 위한 플랜',
    features: [
      { name: 'AI 상담', value: '무제한', included: true },
      { name: '여행 일정 생성', value: '무제한', included: true },
      { name: '실시간 가격 알림', value: '무제한', included: true },
      { name: '팀 공유', value: '무제한', included: true },
      { name: 'API 접근', value: '✓', included: true },
      { name: '우선 응답', value: '✓', included: true },
      { name: '전담 컨시어지', value: '✓', included: true },
    ],
  },
];

export default function Pricing() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold">요금제</h1>
        <p className="text-muted-foreground mt-2">당신에게 맞는 플랜을 선택하세요</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`relative h-full flex flex-col ${plan.badge === '인기' ? 'border-primary shadow-lg' : ''}`}>
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant={plan.badge === '인기' ? 'default' : 'secondary'}>
                  {plan.badge}
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <plan.icon className={`h-10 w-10 mx-auto mb-2 ${plan.color}`} />
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted-foreground">/월</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.name} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? '' : 'text-muted-foreground/60'}>{f.name}</span>
                      {f.value && f.included && (
                        <span className="ml-auto text-xs text-muted-foreground">{f.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={plan.badge === '인기' ? 'default' : 'outline'}
                  onClick={() => plan.price > 0 && setShowDialog(true)}
                  disabled={plan.price === 0}
                >
                  {plan.price === 0 ? '현재 플랜' : '구독하기'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>서비스 준비중</DialogTitle>
            <DialogDescription>
              프리미엄 구독 결제 기능은 현재 준비중입니다. 곧 만나보실 수 있습니다! 🚀
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowDialog(false)} className="w-full">확인</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
