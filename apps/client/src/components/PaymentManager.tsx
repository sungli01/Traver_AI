import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Check, 
  Lock, 
  ChevronRight, 
  AlertCircle,
  History
} from 'lucide-react';
import { 
  PaymentCard, 
  formatCurrency, 
  ROUTE_PATHS 
} from '@/lib/index';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { springPresets, hoverLift } from '@/lib/motion';

// 샘플 데이터 (실제 서비스에서는 API나 상위 컴포넌트에서 주입)
const MOCK_CARDS: PaymentCard[] = [
  {
    id: 'card-1',
    provider: 'visa',
    last4: '4242',
    expiry: '12/28',
    isDefault: true,
    nickname: '현대카드 ZERO',
    color: 'oklch(0.52 0.16 265)', // Primary Deep Indigo
    billingAddress: '서울특별시 강남구 테헤란로 123',
    tokenId: 'tok_mock_1',
    encryptionLevel: 'AES256',
    vaultLocation: 'vault-kr-seoul-001',
    lastUsed: '2026-02-08 14:30:25',
    securityScore: 98
  },
  {
    id: 'card-2',
    provider: 'mastercard',
    last4: '8888',
    expiry: '05/27',
    isDefault: false,
    nickname: '신한 Air Sky',
    color: 'oklch(0.2 0.03 240)', // Sidebar/Darker tone
    billingAddress: '서울특별시 서초구 반포대로 45',
    tokenId: 'tok_mock_2',
    encryptionLevel: 'RSA2048',
    vaultLocation: 'vault-kr-seoul-002',
    lastUsed: '2026-02-07 09:15:42',
    securityScore: 95
  }
];

interface CardItemProps {
  card: PaymentCard;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

function CardItem({ card, isSelected, onClick, compact = false }: CardItemProps) {
  const isVisa = card.provider === 'visa';

  return (
    <motion.div
      variants={hoverLift}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl p-5 transition-all duration-300 overflow-hidden",
        "border-2",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/30",
        compact ? "h-40 w-full" : "h-48 w-full",
        "bg-gradient-to-br from-card to-muted/30"
      )}
    >
      {/* Card Background Glow */}
      <div 
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: card.color }}
      />

      <div className="relative h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {card.nickname}
            </p>
            <div className="flex items-center gap-2">
              {isVisa ? (
                <span className="text-xl font-black italic text-blue-800">VISA</span>
              ) : (
                <div className="flex">
                  <div className="w-4 h-4 rounded-full bg-red-500 opacity-80" />
                  <div className="w-4 h-4 rounded-full bg-orange-500 -ml-2 opacity-80" />
                </div>
              )}
            </div>
          </div>
          {card.isDefault && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] px-1.5 py-0">
              기본
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              ))}
            </div>
            <span className="font-mono text-lg tracking-widest font-medium">
              {card.last4}
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Expiry</p>
              <p className="font-mono text-sm">{card.expiry}</p>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-primary text-white rounded-full p-1"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CardSelector({ onCardSelect }: { onCardSelect?: (card: PaymentCard) => void }) {
  const [selectedId, setSelectedId] = useState<string>(MOCK_CARDS[0]?.id);

  const handleSelect = (card: PaymentCard) => {
    setSelectedId(card.id);
    onCardSelect?.(card);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MOCK_CARDS.map((card) => (
        <CardItem 
          key={card.id} 
          card={card} 
          isSelected={selectedId === card.id} 
          onClick={() => handleSelect(card)}
          compact
        />
      ))}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="h-40 w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-colors"
      >
        <div className="p-2 rounded-full bg-muted">
          <Plus className="w-5 h-5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">새 카드 등록</span>
      </motion.button>
    </div>
  );
}

export function PaymentManager({ onCardSelect }: { onCardSelect?: (card: PaymentCard) => void }) {
  const [isAgentAuthorized, setIsAgentAuthorized] = useState(true);
  const [selectedCard, setSelectedCard] = useState<PaymentCard>(MOCK_CARDS[0]);

  const handleCardSelection = (card: PaymentCard) => {
    setSelectedCard(card);
    onCardSelect?.(card);
  };

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Card View (Secure Glass Effect) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              결제 수단 관리
            </h2>
            <Button variant="outline" size="sm" className="rounded-full">
              카드 관리
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_CARDS.map((card) => (
              <CardItem 
                key={card.id} 
                card={card} 
                isSelected={selectedCard.id === card.id} 
                onClick={() => handleCardSelection(card)}
              />
            ))}
          </div>
        </div>

        {/* Security & Agent Config (Bento Box) */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                보안 및 자동 결제
              </CardTitle>
              <CardDescription>
                AI 에이전트의 자율 예약 권한을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">원클릭 예약 승인</p>
                  <p className="text-xs text-muted-foreground">최저가 발견 시 즉시 결제</p>
                </div>
                <motion.div 
                  className={cn(
                    "w-12 h-6 rounded-full cursor-pointer p-1 transition-colors",
                    isAgentAuthorized ? "bg-primary" : "bg-muted"
                  )}
                  onClick={() => setIsAgentAuthorized(!isAgentAuthorized)}
                >
                  <motion.div 
                    layout
                    transition={springPresets.snappy}
                    className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-sm",
                      isAgentAuthorized ? "ml-6" : "ml-0"
                    )}
                  />
                </motion.div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-700">보안 암호화 활성화됨</p>
                    <p className="text-[11px] text-emerald-600/80 leading-relaxed">
                      모든 결제 정보는 256비트 SSL 암호화로 보호되며, 실제 카드 번호는 에이전트에게 노출되지 않습니다.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4" />
                최근 결제 내역
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <p className="font-medium">도쿄 항공권 예약</p>
                    <p className="text-xs text-muted-foreground">2026.02.05 · 에어아시아</p>
                  </div>
                  <span className="font-mono font-semibold">{formatCurrency(458000)}</span>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary">
                전체 내역 보기 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Usage Notice */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          에이전트가 예약을 수행할 때 선택된 <strong>{selectedCard.nickname} (끝자리 {selectedCard.last4})</strong> 카드로 결제가 진행됩니다.
          예약 확정 전 카카오톡이나 이메일로 알림이 발송됩니다.
        </p>
      </div>
    </div>
  );
}
