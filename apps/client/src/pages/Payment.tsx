import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Plus, ShieldCheck, History, Settings2, ChevronRight,
  Lock, AlertCircle, CheckCircle2, Trash2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/index';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { staggerContainer, staggerItem } from '@/lib/motion';

interface SavedCard {
  id: string;
  nickname: string;
  provider: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
  addedAt: string;
}

function loadCards(): SavedCard[] {
  try { return JSON.parse(localStorage.getItem('savedCards') || '[]'); } catch { return []; }
}
function saveCards(cards: SavedCard[]) { localStorage.setItem('savedCards', JSON.stringify(cards)); }

function loadPaymentHistory() {
  try { return JSON.parse(localStorage.getItem('paymentHistory') || '[]'); } catch { return []; }
}

const defaultHistory = [
  { id: 'tx-1', date: '2026-02-05', description: '대한항공 나리타행 항공권', amount: 1240000, category: '항공', status: 'completed' },
  { id: 'tx-2', date: '2026-02-01', description: '파크 하얏트 도쿄 예약 보증금', amount: 450000, category: '숙박', status: 'completed' },
  { id: 'tx-3', date: '2026-01-28', description: '에이전트 프리미엄 서비스 연회비', amount: 99000, category: '서비스', status: 'completed' },
];

export default function Payment() {
  const [cards, setCards] = useState<SavedCard[]>(loadCards);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [autoBooking, setAutoBooking] = useState(() => localStorage.getItem('autoBooking') !== 'false');
  const [spendingLimit, setSpendingLimit] = useState(true);
  const history = loadPaymentHistory().length > 0 ? loadPaymentHistory() : defaultHistory;

  // Add card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardNickname, setCardNickname] = useState('');
  const [cardProvider, setCardProvider] = useState('visa');

  useEffect(() => { saveCards(cards); }, [cards]);
  useEffect(() => { localStorage.setItem('autoBooking', String(autoBooking)); }, [autoBooking]);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const nums = cardNumber.replace(/\D/g, '');
    if (nums.length < 13) { toast.error('올바른 카드번호를 입력해주세요'); return; }
    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) { toast.error('만료일을 MM/YY 형식으로 입력해주세요'); return; }
    const newCard: SavedCard = {
      id: `card-${Date.now()}`,
      nickname: cardNickname || `${cardProvider.toUpperCase()} 카드`,
      provider: cardProvider,
      last4: nums.slice(-4),
      expiry: cardExpiry,
      isDefault: cards.length === 0,
      addedAt: new Date().toISOString(),
    };
    setCards(prev => [...prev, newCard]);
    setIsAddCardOpen(false);
    setCardNumber(''); setCardExpiry(''); setCardNickname('');
    toast.success('카드가 추가되었습니다');
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    toast.success('카드가 삭제되었습니다');
  };

  const setDefault = (id: string) => {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
  };

  const maskCardNumber = (last4: string) => `****-****-****-${last4}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">결제 관리</h1>
          <p className="text-muted-foreground">등록된 결제 수단과 지출 내역을 안전하게 관리하세요.</p>
        </div>
        <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 gap-2 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" /> 카드 추가하기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>새 결제 수단 등록</DialogTitle></DialogHeader>
            <form onSubmit={handleAddCard} className="space-y-4 pt-4">
              <div>
                <Label>카드 별명</Label>
                <Input placeholder="내 카드" value={cardNickname} onChange={e => setCardNickname(e.target.value)} />
              </div>
              <div>
                <Label>카드사</Label>
                <Select value={cardProvider} onValueChange={setCardProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="amex">AMEX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>카드번호</Label>
                <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} maxLength={19} />
              </div>
              <div>
                <Label>만료일</Label>
                <Input placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} maxLength={5} />
              </div>
              <Button type="submit" className="w-full">카드 등록</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Cards List */}
          <motion.section variants={staggerItem}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">내 결제 카드</h2>
            </div>
            {cards.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>등록된 카드가 없습니다. 카드를 추가해주세요.</p>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {cards.map(card => (
                  <Card key={card.id} className={`relative overflow-hidden ${card.isDefault ? 'border-primary' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">{card.nickname}</p>
                          <p className="text-xs text-muted-foreground uppercase">{card.provider}</p>
                        </div>
                        {card.isDefault && <Badge className="bg-primary/10 text-primary">기본</Badge>}
                      </div>
                      <p className="font-mono text-lg mb-2">{maskCardNumber(card.last4)}</p>
                      <p className="text-sm text-muted-foreground">만료: {card.expiry}</p>
                      <div className="flex gap-2 mt-4">
                        {!card.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => setDefault(card.id)}>기본 설정</Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeCard(card.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.section>

          {/* Transaction History */}
          <motion.section variants={staggerItem}>
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-accent" /> 최근 결제 내역
                  </CardTitle>
                  <CardDescription>에이전트가 처리한 최근 결제 트랜잭션</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>날짜</TableHead>
                        <TableHead>항목</TableHead>
                        <TableHead className="hidden sm:table-cell">금액</TableHead>
                        <TableHead className="text-right">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(tx.date)}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{tx.description}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{tx.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold hidden sm:table-cell">
                            {tx.amount > 0 ? formatCurrency(tx.amount) : '확인 중'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className={`rounded-full px-2 py-0.5 text-[10px] ${tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
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

        {/* Right Column */}
        <div className="space-y-8">
          <motion.section variants={staggerItem}>
            <Card className="border-border/40 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> 자동 결제 설정
                </CardTitle>
                <CardDescription>AI 에이전트의 결제 권한을 설정합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">원클릭 자동 예약</Label>
                    <p className="text-xs text-muted-foreground">최저가 발견 시 즉시 예약</p>
                  </div>
                  <Switch checked={autoBooking} onCheckedChange={setAutoBooking} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">지출 한도 경보</Label>
                    <p className="text-xs text-muted-foreground">예산 90% 도달 시 중단</p>
                  </div>
                  <Switch checked={spendingLimit} onCheckedChange={setSpendingLimit} />
                </div>
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>자동 결제가 활성화되면 에이전트가 직접 결제를 수행합니다.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section variants={staggerItem}>
            <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10"><ShieldCheck className="w-32 h-32" /></div>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> 보안 및 데이터 보호
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg"><Lock className="w-4 h-4 text-primary" /></div>
                  <div className="text-xs">
                    <p className="font-semibold">PCI-DSS 인증 완료</p>
                    <p className="text-muted-foreground">금융권 수준 암호화 보호</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                  <div className="text-xs">
                    <p className="font-semibold">부정 사용 실시간 감지</p>
                    <p className="text-muted-foreground">비정상 패턴 탐지 즉시 알림</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
}
