import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Settings2,
  Activity,
  History,
  Zap,
  ShieldCheck,
  Plus,
  Search,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { sampleAgents } from '@/data/index';
import { TravelAgent, getStatusColor } from '@/lib/index';
import { AgentGrid } from '@/components/AgentCards';
import { AgentConfigForm } from '@/components/Forms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Agents() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleAgentAction = (id: string) => {
    setSelectedAgentId(id);
    setIsConfigOpen(true);
  };

  const selectedAgent = sampleAgents.find((a) => a.id === selectedAgentId);

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <Bot className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Multi-Agent System</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">AI 에이전트 센터</h1>
          <p className="text-muted-foreground text-lg">
            2026년형 지능형 에이전트들이 당신의 여행을 실시간으로 관리하고 있습니다.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="에이전트 검색..." className="pl-10" />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="shrink-0 gap-2">
                <Plus className="w-4 h-4" />
                새 에이전트 등록
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>커스텀 에이전트 생성</DialogTitle>
                <DialogDescription>
                  특정 목적에 특화된 새로운 AI 에이전트를 시스템에 추가합니다.
                </DialogDescription>
              </DialogHeader>
              <AgentConfigForm onSubmit={(data) => console.log('New Agent:', data)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            활성 에이전트 상태
          </h2>
          <Badge variant="outline" className="px-3 py-1">
            전체 시스템 가동률: 96.5%
          </Badge>
        </div>
        <AgentGrid agents={sampleAgents} onAgentAction={handleAgentAction} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-md">
            <Tabs defaultValue="performance" className="w-full h-full flex flex-col">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>심층 관리 모드</CardTitle>
                    <CardDescription>에이전트별 세부 성능 및 설정 제어</CardDescription>
                  </div>
                  <TabsList className="bg-background/50 border">
                    <TabsTrigger value="performance" className="gap-2">
                      <Zap className="w-4 h-4" /> <span className="hidden sm:inline">성능</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="w-4 h-4" /> <span className="hidden sm:inline">히스토리</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                      <ShieldCheck className="w-4 h-4" /> <span className="hidden sm:inline">보안/권한</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                <TabsContent value="performance" className="m-0 p-6 space-y-8">
                  {sampleAgents.map((agent) => (
                    <div key={agent.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full border bg-muted" />
                          <div>
                            <p className="font-medium text-sm">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-mono font-bold">{agent.efficiency}%</span>
                          <p className="text-[10px] text-muted-foreground uppercase">Efficiency</p>
                        </div>
                      </div>
                      <Progress value={agent.efficiency} className="h-2 bg-muted/50" />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="history" className="m-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-6 space-y-6">
                      {sampleAgents.map((agent) => (
                        <div key={agent.id} className="flex gap-4">
                          <div className="mt-1">
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <div className="w-px h-full bg-border mx-auto mt-2" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{agent.name} <span className="text-muted-foreground font-normal">- {agent.lastAction}</span></p>
                              <span className="text-[10px] text-muted-foreground font-mono">2026-02-08 00:33</span>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono text-muted-foreground border">
                              $ agent --task "{agent.lastAction}" --status success
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="security" className="m-0 p-6 space-y-4">
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-accent" />
                      <div>
                        <h3 className="font-bold">보안 에이전트 감시 중</h3>
                        <p className="text-sm text-muted-foreground">모든 결제 및 예약 트랜잭션은 볼트(Vault) 에이전트에 의해 256비트 암호화 처리됩니다.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">자동 결제 권한</p>
                        <p className="text-sm font-semibold">허용됨 (한도 2,000,000 KRW)</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">데이터 접근 레벨</p>
                        <p className="text-sm font-semibold">Level 4 (개인정보 암호화)</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                전역 시스템 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>자율 예약 모드</span>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">활성화</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>예산 초과 알림</span>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">90% 지점</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>데이터 학습 주도권</span>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">사용자 선호도</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
                시스템 전체 재설정
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-lg bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-tighter">
                <Terminal className="w-4 h-4" />
                시스템 로그 브로드캐스트
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="font-mono text-[11px] p-4 space-y-2 text-muted-foreground overflow-hidden">
                <p className="text-emerald-500">[00:33:52] Swift: Finding flight discounts...</p>
                <p>[00:33:45] Aura: Itinerary optimization v2.4 applied.</p>
                <p className="text-accent">[00:33:30] Vault: Payment credential validated.</p>
                <p>[00:33:20] Guidey: Mapping Tokyo restaurant trends.</p>
                <p className="animate-pulse text-primary">_</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAgent?.avatar && (
                <img src={selectedAgent.avatar} alt="" className="w-10 h-10 rounded-full border" />
              )}
              <div>
                <span>{selectedAgent?.name} 설정 관리</span>
                <p className="text-xs font-normal text-muted-foreground">{selectedAgent?.type} 에이전트 매개변수 조정</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AgentConfigForm 
              onSubmit={(data) => {
                console.log('Config Updated:', data);
                setIsConfigOpen(false);
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
