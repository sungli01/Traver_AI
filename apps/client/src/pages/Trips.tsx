import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  MapPin
} from 'lucide-react';
import {
  TRIP_STATUS,
  Trip,
  formatCurrency
} from '@/lib/index';
import { sampleTrips } from '@/data/index';
import { TripGrid } from '@/components/TripCards';
import { NewTripForm } from '@/components/Forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

/**
 * 여행 관리 페이지
 * 사용자의 모든 여행 계획, 예약 상태, 일정을 통합 관리하는 중앙 허브 페이지입니다.
 */
export default function Trips() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // 필터링된 여행 목록 계산
  const filteredTrips = useMemo(() => {
    return sampleTrips.filter((trip) => {
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'planning' && trip.status === TRIP_STATUS.PLANNING) ||
        (activeTab === 'confirmed' && trip.status === TRIP_STATUS.CONFIRMED) ||
        (activeTab === 'completed' && trip.status === TRIP_STATUS.COMPLETED);
      
      const matchesSearch = 
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  // 요약 통계 데이터
  const stats = useMemo(() => {
    return {
      total: sampleTrips.length,
      upcoming: sampleTrips.filter(t => t.status === TRIP_STATUS.CONFIRMED).length,
      planning: sampleTrips.filter(t => t.status === TRIP_STATUS.PLANNING).length,
      totalSpent: sampleTrips.reduce((acc, t) => acc + t.spent, 0)
    };
  }, []);

  const handleCreateTrip = (data: any) => {
    setIsDialogOpen(false);
    
    // AI 채팅으로 여행 계획 요청 전달
    const startStr = data.startDate ? new Date(data.startDate).toLocaleDateString('ko-KR') : '';
    const endStr = data.endDate ? new Date(data.endDate).toLocaleDateString('ko-KR') : '';
    const budget = data.budget ? `${data.budget.toLocaleString()}원` : '';
    const styleMap: Record<string, string> = { luxury: '럭셔리', budget: '가성비', adventure: '모험', business: '비즈니스' };
    const style = styleMap[data.travelStyle] || data.travelStyle;
    
    let chatMessage = `${data.destination} 여행 계획해줘. 제목: ${data.title}, 기간: ${startStr} ~ ${endStr}, 예산: ${budget}, 스타일: ${style}`;
    if (data.additionalInfo?.trim()) {
      chatMessage += `\n\n추가 요청사항:\n${data.additionalInfo.trim()}`;
    }
    
    // 커스텀 이벤트로 채팅 윈도우에 메시지 전달
    window.dispatchEvent(new CustomEvent('travel-chat-send', { detail: chatMessage }));
    
    toast({
      title: "AI 여행 계획 시작",
      description: `${data.destination} 여행을 AI 컨시어지가 계획하고 있습니다.`,
    });
  };

  return (
    <div className="w-full space-y-8 pb-12 animate-in fade-in duration-700">
      {/* 상단 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">내 여행 관리</h1>
          <p className="text-muted-foreground text-lg">
            2026년의 모든 여행 계획과 예약 상태를 에이전트와 함께 관리하세요.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto rounded-2xl gap-2 shadow-xl shadow-primary/25 h-14 px-8 text-base font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="w-6 h-6" />
              새 여행 계획하기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-background/95">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-3xl font-bold">새로운 여행 시작하기</DialogTitle>
              <DialogDescription className="text-lg">
                AI 멀티에이전트가 당신의 취향을 분석하여 최적의 경로와 예약을 제안합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <NewTripForm onSubmit={handleCreateTrip} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 요약 대시보드 위젯 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[ 
          { label: '전체 여행', value: stats.total, icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: '확정된 예약', value: stats.upcoming, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: '설계 진행 중', value: stats.planning, icon: Clock, color: 'text-accent', bg: 'bg-accent/10' },
          { label: '누적 지출 금액', value: formatCurrency(stats.totalSpent), icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="border-none shadow-sm hover:shadow-lg transition-all bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden group">
              <CardContent className="p-7 flex items-center gap-5">
                <div className={`p-4 rounded-[1.25rem] ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500`}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 필터 및 검색 바 */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-muted/20 p-2.5 rounded-[2rem] border border-border/40">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
          <TabsList className="flex overflow-x-auto h-12 bg-transparent gap-1.5 p-1 w-full">
            {['all', 'planning', 'confirmed', 'completed'].map((tab) => (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                className="rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary px-8 text-sm font-bold transition-all"
              >
                {tab === 'all' && '전체 보기'}
                {tab === 'planning' && '설계 중'}
                {tab === 'confirmed' && '예약 확정'}
                {tab === 'completed' && '지난 여행'}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="어디로 떠나시나요? 목적지 검색..."
            className="pl-12 h-12 bg-background border-none shadow-inner rounded-2xl text-base focus-visible:ring-2 focus-visible:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 여행 리스트 그리드 영역 */}
      <div className="min-h-[500px]">
        {filteredTrips.length > 0 ? (
          <TripGrid 
            trips={filteredTrips} 
            onTripSelect={(trip) => toast({ title: `${trip.title}`, description: "에이전트가 상세 일정을 로드하고 있습니다." })}
          />
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 sm:py-40 text-center space-y-6"
          >
            <div className="p-10 rounded-[3rem] bg-muted/10 border border-dashed border-muted-foreground/20">
              <Calendar className="w-20 h-20 text-muted-foreground opacity-20" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-3xl font-bold">검색된 여행이 없습니다</h3>
              <p className="text-muted-foreground text-lg">
                선택한 필터나 검색어와 일치하는 일정이 없네요. <br />
                에이전트와 함께 새로운 여행을 설계해볼까요?
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="rounded-2xl h-12 px-8" onClick={() => { setActiveTab('all'); setSearchQuery(''); }}>
                검색 조건 초기화
              </Button>
              <Button className="rounded-2xl h-12 px-8 shadow-lg shadow-primary/20" onClick={() => setIsDialogOpen(true)}>
                첫 여행 만들기
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
