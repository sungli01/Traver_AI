import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  Plane,
  CreditCard,
  MapPin,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { 
  TravelAgent, 
  AGENT_TYPES, 
  getStatusColor 
} from '@/lib/index';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: TravelAgent;
  onActivate?: () => void;
}

export function AgentCard({ agent, onActivate }: AgentCardProps) {
  const [priceTrackStatus, setPriceTrackStatus] = useState<{ active: boolean; itemCount: number; lastCheck: string | null }>({ active: false, itemCount: 0, lastCheck: null });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.agent === 'booking') {
        setPriceTrackStatus({ active: detail.active, itemCount: detail.itemCount || 0, lastCheck: detail.lastCheck || null });
      }
    };
    window.addEventListener('agent-status', handler);
    return () => window.removeEventListener('agent-status', handler);
  }, []);

  const isBookingAgent = agent.type === AGENT_TYPES.BOOKING;
  const isPriceTracking = isBookingAgent && priceTrackStatus.active;

  const isWorking = agent.status === 'working' || isPriceTracking;
  const isError = agent.status === 'error';
  const isSuccess = agent.status === 'success';

  const getAgentIcon = (type: string) => {
    switch (type) {
      case AGENT_TYPES.PLANNER:
        return <MapPin className="w-5 h-5" />;
      case AGENT_TYPES.BOOKING:
        return <Plane className="w-5 h-5" />;
      case AGENT_TYPES.CONCIERGE:
        return <Sparkles className="w-5 h-5" />;
      case AGENT_TYPES.PAYMENT:
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Cpu className="w-5 h-5" />;
    }
  };

  const getStatusIcon = () => {
    if (isWorking) return <Loader2 className="w-4 h-4 animate-spin text-accent" />;
    if (isSuccess) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (isError) return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      {/* Glow effect for active state */}
      <AnimatePresence>
        {isWorking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-0.5 bg-accent/30 rounded-[calc(var(--radius)+2px)] blur-md z-0"
          />
        )}
      </AnimatePresence>

      <Card className={cn(
        "relative z-10 overflow-hidden border-border transition-all duration-300",
        isWorking ? "ring-2 ring-accent/50 shadow-[0_0_20px_rgba(var(--accent),0.2)]" : "hover:shadow-lg",
        "bg-card/80 backdrop-blur-sm"
      )}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl bg-muted transition-colors",
                isWorking ? "bg-accent/20 text-accent" : "group-hover:bg-primary/10"
              )}>
                {getAgentIcon(agent.type)}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{agent.name}</CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {agent.type} AGENT
                </CardDescription>
              </div>
            </div>
            <Badge className={cn("px-2 py-0.5 text-[10px]", getStatusColor(agent.status))}>
              <span className="flex items-center gap-1.5">
                {getStatusIcon()}
                {agent.status.toUpperCase()}
              </span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
            {agent.description}
          </p>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">효율성 점수</span>
              <span className="font-mono font-bold">{Math.round(agent.efficiency * 100)}%</span>
            </div>
            <Progress 
              value={agent.efficiency * 100} 
              className={cn(
                "h-1.5",
                agent.efficiency > 0.8 ? "[&>div]:bg-emerald-500" : 
                agent.efficiency > 0.5 ? "[&>div]:bg-accent" : "[&>div]:bg-destructive"
              )} 
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.slice(0, 3).map((cap, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] bg-secondary/50 font-normal">
                {cap}
              </Badge>
            ))}
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="w-8 h-8 border-2 border-background ring-1 ring-border cursor-help">
                        <AvatarImage src={agent.avatar} />
                        <AvatarFallback><Cpu size={14} /></AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{agent.name} 상세 정보</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background ring-1 ring-border">
                  <ShieldCheck size={14} className="text-primary" />
                </div>
              </div>

              <Button 
                size="sm" 
                variant={isWorking ? "secondary" : "default"}
                className="h-8 text-xs font-semibold px-4"
                disabled={isWorking}
                onClick={onActivate}
              >
                {isWorking ? '작업 중...' : '활성화'}
              </Button>
            </div>
          </div>

          {/* Price tracking status */}
          <AnimatePresence>
            {isPriceTracking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 flex items-start gap-2 border border-blue-200/30">
                  <span className="relative flex h-2.5 w-2.5 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <div className="text-[11px] leading-tight text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">추적 중...</span>
                    <span className="text-blue-500 ml-1">{priceTrackStatus.itemCount}개 항목</span>
                    {priceTrackStatus.lastCheck && (
                      <span className="block text-[10px] text-blue-400 mt-0.5">
                        마지막 체크: {new Date(priceTrackStatus.lastCheck).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time Action Log Overlay */}
          <AnimatePresence>
            {agent.lastAction && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <div className="bg-muted/50 rounded-lg p-2 flex items-start gap-2 border border-border/30">
                  <Zap size={12} className="text-accent mt-0.5 shrink-0" />
                  <span className="text-[11px] font-mono leading-tight text-muted-foreground">
                    {agent.lastAction}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AgentGridProps {
  agents: TravelAgent[];
  onAgentAction?: (id: string) => void;
}

export function AgentGrid({ agents, onAgentAction }: AgentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {agents.map((agent) => (
        <AgentCard 
          key={agent.id} 
          agent={agent} 
          onActivate={() => onAgentAction?.(agent.id)}
        />
      ))}
    </div>
  );
}
