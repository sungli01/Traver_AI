import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  TrendingUp,
  Calendar,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  Bot,
  Plane
} from 'lucide-react';
import { ROUTE_PATHS, formatCurrency } from '@/lib/index';
import { sampleAgents, sampleTrips } from '@/data/index';
import { TripGrid } from '@/components/TripCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { IMAGES } from '@/assets/images';
import { Link } from 'react-router-dom';

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
  const activeTripsCount = sampleTrips.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
  const totalSpent = sampleTrips.reduce((acc, curr) => acc + curr.spent, 0);
  const activeAgentsCount = sampleAgents.filter(a => a.status === 'working' || a.status === 'success').length;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative h-[320px] rounded-3xl overflow-hidden"
      >
        <img 
          src={IMAGES.SKYWORK_ARCHITECTURE_20260208_005257_31} 
          alt="Skywork AI Architecture"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent flex flex-col justify-center px-8 md:px-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
              <ShieldCheck className="w-3 h-3 mr-1.5" />
              Skywork 멀티에이전트 시스템 가동 중
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              안전한 여행, <span className="text-primary">VoyageSafe</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mb-8">
              개인정보 보호와 블록체인 증명이 적용된 차세대 AI 여행 서비스입니다. 
              모든 데이터는 암호화되어 안전하게 관리됩니다.
            </p>
            <div className="flex gap-3">
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                새 여행 계획하기
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
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
                <h3 className="text-3xl font-bold">{activeTripsCount}</h3>
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
                <h3 className="text-3xl font-bold">{formatCurrency(totalSpent)}</h3>
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
                <h3 className="text-3xl font-bold">{activeAgentsCount}</h3>
                <span className="text-xs text-emerald-500 font-medium">정상 작동 중</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Agents Section - Compact Icon Bar */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">나의 AI 에이전트</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {sampleAgents.map(agent => {
                const statusColor = 
                  agent.status === 'working' || agent.status === 'success' || agent.status === 'secured' || agent.status === 'verifying'
                    ? 'bg-emerald-500'
                    : agent.status === 'idle'
                    ? 'bg-yellow-500'
                    : 'bg-red-500';
                return (
                  <Tooltip key={agent.id}>
                    <TooltipTrigger asChild>
                      <div className="relative cursor-pointer">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar} />
                        </Avatar>
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${statusColor}`} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{agent.name}: {agent.currentTask?.description || agent.status}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary">
              <Link to={ROUTE_PATHS.AGENTS}>
                에이전트 설정 <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

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
            <h2 className="text-2xl font-bold">진행 및 예정된 여행</h2>
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
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold">스마트 예약 결제가 준비되었습니다</h3>
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