import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Bot,
  Plane,
  MapPin,
  Wallet,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ROUTE_PATHS, formatCurrency } from '@/lib/index';
import { sampleAgents, sampleTrips } from '@/data/index';
import { TripGrid } from '@/components/TripCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { loadSavedTrips, type ScheduleData } from '@/components/ScheduleEditor';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Dashboard() {
  const [savedTrips, setSavedTrips] = useState<ScheduleData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setSavedTrips(loadSavedTrips());
  }, []);

  const confirmedCount = savedTrips.filter(t => t.status === 'confirmed').length;
  const planningCount = savedTrips.filter(t => t.status === 'planning').length;
  const activeTripsCount = sampleTrips.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length + savedTrips.length;
  const totalSpent = sampleTrips.reduce((acc, curr) => acc + curr.spent, 0);
  const activeAgentsCount = sampleAgents.filter(a => a.status === 'working' || a.status === 'success').length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 pb-8 sm:pb-12">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-[200px] sm:h-[280px] md:h-[320px] rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-600/10 to-purple-600/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent flex flex-col justify-center px-8 md:px-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
              <ShieldCheck className="w-3 h-3 mr-1.5" />
              AI 멀티에이전트 시스템 가동 중
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              스마트한 여행, <span className="text-primary">TravelAgent AI</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-md mb-8">
              AI 멀티에이전트가 최적의 여행 계획을 설계합니다. 맞춤 일정, 실시간 가격 비교, 스마트 예약.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20" asChild>
                <Link to={ROUTE_PATHS.TRIPS}>
                  <Plus className="w-4 h-4 mr-2" />
                  새 여행 계획하기
                </Link>
              </Button>
              <Button variant="secondary" size="lg" className="rounded-full px-8" asChild>
                <Link to={ROUTE_PATHS.AGENTS}>
                  에이전트 설정
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Overview */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6"
      >
        <motion.div variants={fadeInUp}>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm font-medium">진행 중인 여행</span>
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Plane className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold">{activeTripsCount}</h3>
                <span className="text-xs text-emerald-500 font-medium">+1 지난달 대비</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm font-medium">이번 달 총 지출</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold">{formatCurrency(totalSpent)}</h3>
                <span className="text-xs text-muted-foreground font-medium">자동 결제 포함</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm font-medium">활성 에이전트</span>
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <Bot className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold">{activeAgentsCount}</h3>
                <span className="text-xs text-emerald-500 font-medium">정상 작동 중</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* AI Generated Trips from localStorage */}
      {savedTrips.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-2xl font-bold">내 여행 프로젝트</h2>
              <span className="text-sm text-muted-foreground">({savedTrips.length})</span>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
              <Link to={ROUTE_PATHS.TRIPS}>
                전체 보기 <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTrips.map(trip => (
              <motion.div
                key={trip.id}
                whileHover={{ y: -2 }}
                className="cursor-pointer"
                onClick={() => navigate(ROUTE_PATHS.TRIPS)}
              >
                <Card className="border shadow-sm hover:shadow-lg transition-all rounded-2xl overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base">{trip.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {trip.destination}
                        </p>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] font-bold rounded-full ${
                        trip.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {trip.status === 'confirmed' ? '예약 확정' : '설계 중'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.period}</span>
                      <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> {trip.totalBudget}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trip.days.length}일 · {trip.days.reduce((s, d) => s + d.activities.length, 0)}개 장소
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Upcoming Trips Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-2xl font-bold">진행 및 예정된 여행</h2>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
            <Link to={ROUTE_PATHS.TRIPS}>
              전체 일정 보기 <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <TripGrid trips={sampleTrips} />
      </motion.section>

      {/* Quick Action Footer Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-4"
      >
        <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <CardContent className="p-5 sm:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-lg sm:text-2xl font-bold">스마트 예약 결제가 준비되었습니다</h3>
                <p className="text-primary-foreground/80">
                  등록된 카드 정보를 바탕으로 에이전트가 최저가 항공권을 자동으로 예약할 수 있습니다.
                </p>
              </div>
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-full font-bold px-10 bg-white text-primary hover:bg-white/90 shadow-lg"
                asChild
              >
                <Link to={ROUTE_PATHS.PAYMENT}>
                  결제 수단 관리
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}