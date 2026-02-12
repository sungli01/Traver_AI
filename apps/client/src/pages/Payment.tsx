import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  ShieldCheck,
  History,
  Settings2,
  ChevronRight,
  Lock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  ROUTE_PATHS, 
  PaymentCard, 
  formatCurrency, 
  formatDate 
} from '@/lib/index';
import { sampleCards } from '@/data/index';
import { PaymentManager } from '@/components/PaymentManager';
import { AddCardForm } from '@/components/Forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { springPresets, fadeInUp, staggerContainer, staggerItem } from '@/lib/motion';

const transactionHistory = [
  {
    id: 'tx-1',
    date: '2026-02-05',
    description: '대한항공 나리타행 항공권',
    amount: 1240000,
    category: '항공',
    status: 'completed',
    card: 'visa-8842'
  },
  {
    id: 'tx-2',
    date: '2026-02-01',
    description: '파크 하얏트 도쿄 예약 보증금',
    amount: 450000,
    category: '숙박',
    status: 'completed',
    card: 'visa-8842'
  },
  {
    id: 'tx-3',
    date: '2026-01-28',
    description: '에이전트 프리미엄 서비스 연회비',
    amount: 99000,
    category: '서비스',
    status: 'completed',
    card: 'mastercard-1055'
  },
  {
    id: 'tx-4',
    date: '2026-01-20',
    description: '스위스 루체른 숙소 가예약',
    amount: 0,
    category: '숙박',
    status: 'pending',
    card: 'visa-8842'
  }
];

export default function Payment() {
  const [cards, setCards] = useState<PaymentCard[]>(sampleCards);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [autoBooking, setAutoBooking] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState(true);

  const handleAddCard = (newCardData: any) => {
    const newCard: PaymentCard = {
      id: `card-${Date.now()}`,
      provider: newCardData.provider || 'visa',
      last4: newCardData.cardNumber.slice(-4),
      expiry: newCardData.expiry,
      isDefault: cards.length === 0,
      nickname: newCardData.nickname || '새 카드',
      color: 'bg-gradient-to-br from-gray-700 to-gray-900',
      tokenId: `tok_${Date.now()}`,
      encryptionLevel: 'AES256',
      vaultLocation: 'vault-kr-seoul-new',
      lastUsed: new Date().toISOString(),
      securityScore: 85
    };
    setCards([...cards, newCard]);
    setIsAddCardOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">결제 관리</h1>
          <p className="text-muted-foreground">등록된 결제 수단과 지출 내역을 안전하게 관리하세요.</p>
        </div>

        <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" />
              <span>카드 추가하기</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">새 결제 수단 등록</DialogTitle>
            </DialogHeader>
            <AddCardForm onSubmit={handleAddCard} />
          </DialogContent>
        </Dialog>
      </div>

      <motion.div 
        variants={staggerContainer} 
        initial="hidden" 
        animate="visible" 
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left Column: Cards & Transactions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card Management Section */}
          <motion.section variants={staggerItem}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">내 결제 카드</h2>
            </div>
            <PaymentManager />
          </motion.section>

          {/* Transaction History Section */}
          <motion.section variants={staggerItem}>
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-accent" />
                    최근 결제 내역
                  </CardTitle>
                  <CardDescription>에이전트가 처리한 최근 30일간의 트랜잭션입니다.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                  전체보기 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[120px]">날짜</TableHead>
                      <TableHead>항목</TableHead>
                      <TableHead className="hidden sm:table-cell">금액</TableHead>
                      <TableHead className="text-right">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionHistory.map((tx) => (
                      <TableRow key={tx.id} className="group transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{tx.description}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{tx.category} • {tx.card}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold hidden sm:table-cell">
                          {tx.amount > 0 ? formatCurrency(tx.amount) : '예약 확인 중'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant="secondary" 
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              tx.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            {tx.status === 'completed' ? '결제완료' : '진행중'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Right Column: Settings & Security */}
        <div className="space-y-8">
          {/* Agent Payment Settings */}
          <motion.section variants={staggerItem}>
            <Card className="border-border/40 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  자동 결제 설정
                </CardTitle>
                <CardDescription>AI 에이전트의 결제 권한을 설정합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">원클릭 자동 예약</Label>
                    <p className="text-xs text-muted-foreground">최저가 발견 시 즉시 예약을 수행합니다.</p>
                  </div>
                  <Switch 
                    checked={autoBooking} 
                    onCheckedChange={setAutoBooking} 
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">지출 한도 경보</Label>
                    <p className="text-xs text-muted-foreground">설정 예산의 90% 도달 시 결제를 중단합니다.</p>
                  </div>
                  <Switch 
                    checked={spendingLimit} 
                    onCheckedChange={setSpendingLimit} 
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>자동 결제가 활성화되면 에이전트가 최적의 타이밍에 직접 결제를 수행합니다.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Security Status */}
          <motion.section variants={staggerItem}>
            <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  보안 및 데이터 보호
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold">PCI-DSS 인증 완료</p>
                    <p className="text-muted-foreground">모든 카드 정보는 금융권 수준의 암호화 기술로 보호됩니다.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold">부정 사용 실시간 감지</p>
                    <p className="text-muted-foreground">비정상적인 결제 패턴 탐지 시 즉시 알림을 제공합니다.</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-xs h-9 rounded-lg border-primary/20 hover:bg-primary/10">
                  보안 리포트 확인
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
}
