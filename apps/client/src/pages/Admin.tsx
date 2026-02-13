import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Database, Activity, Server, RefreshCw, Send, TrendingUp, DollarSign, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface UserRecord { id: number; email: string; name: string; created_at: string; }
interface KnowledgeStats { places: { total: number; cities: number }; routes: number; events: number; collections: number; }

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6'];
const AGENTS = [
  { id: 'planner', name: '일정 플래너', emoji: '📋' },
  { id: 'research', name: '예약 에이전트', emoji: '🔍' },
  { id: 'concierge', name: '컨시어지', emoji: '💬' },
  { id: 'security', name: '보안 에이전트', emoji: '🛡️' },
  { id: 'payment', name: '결제 에이전트', emoji: '💳' },
  { id: 'blockchain', name: '블록체인', emoji: '🔗' },
];

export default function Admin() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [sessions, setSessions] = useState(0);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  // New stats
  const [dailyData, setDailyData] = useState<{ signups: any[]; chats: any[] }>({ signups: [], chats: [] });
  const [destinations, setDestinations] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [activityHeat, setActivityHeat] = useState<any[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, hRes, sessRes, dRes, destRes, revRes, funRes, actRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`).then(r => r.json()).catch(() => ({ users: [] })),
        fetch(`${API_BASE}/api/knowledge/stats`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/health`).then(r => r.ok).catch(() => false),
        fetch(`${API_BASE}/api/admin/sessions`).then(r => r.json()).catch(() => ({ activeSessions: 0 })),
        fetch(`${API_BASE}/api/admin/stats/daily`).then(r => r.json()).catch(() => ({ signups: [], chats: [] })),
        fetch(`${API_BASE}/api/admin/stats/destinations`).then(r => r.json()).catch(() => ({ destinations: [] })),
        fetch(`${API_BASE}/api/admin/stats/revenue`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/admin/stats/funnel`).then(r => r.json()).catch(() => ({ funnel: [] })),
        fetch(`${API_BASE}/api/admin/stats/activity`).then(r => r.json()).catch(() => ({ activity: [] })),
      ]);
      setUsers(uRes.users || []);
      setStats(sRes);
      setHealthOk(hRes);
      setSessions(sessRes.activeSessions || 0);
      setDailyData(dRes);
      setDestinations(destRes.destinations || []);
      setRevenue(revRes);
      setFunnel(funRes.funnel || []);
      setActivityHeat(actRes.activity || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCollect = async () => {
    if (!city || !country) { toast.error('도시와 국가를 입력해주세요'); return; }
    toast.info('데이터 수집 시작...');
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country }),
      });
      const data = await res.json();
      if (data.success) toast.success(`${city} 데이터 수집 완료`);
      else toast.error('수집 실패');
      fetchAll();
    } catch { toast.error('서버 연결 실패'); }
  };

  // Merge daily signups & chats into chart data
  const dailyChartData = useMemo(() => {
    const map = new Map<string, { date: string; signups: number; chats: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      map.set(key, { date: key.slice(5), signups: 0, chats: 0 });
    }
    dailyData.signups?.forEach((r: any) => {
      const key = new Date(r.date).toISOString().split('T')[0];
      if (map.has(key)) map.get(key)!.signups = parseInt(r.count);
    });
    dailyData.chats?.forEach((r: any) => {
      const key = new Date(r.date).toISOString().split('T')[0];
      if (map.has(key)) map.get(key)!.chats = parseInt(r.count);
    });
    return Array.from(map.values());
  }, [dailyData]);

  // User segments
  const userSegments = useMemo(() => {
    const now = Date.now();
    let active = 0, inactive = 0, newUsers = 0;
    users.forEach(u => {
      const diff = now - new Date(u.created_at).getTime();
      if (diff < 7 * 86400000) newUsers++;
      else if (diff < 30 * 86400000) active++;
      else inactive++;
    });
    return [
      { name: '활성', value: active || 1, color: '#10b981' },
      { name: '신규 (7일)', value: newUsers || 1, color: '#6366f1' },
      { name: '비활성', value: inactive || 1, color: '#94a3b8' },
    ];
  }, [users]);

  // Heatmap grid
  const heatGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    activityHeat.forEach((r: any) => {
      const dow = parseInt(r.dow);
      const hour = parseInt(r.hour);
      if (dow >= 0 && dow < 7 && hour >= 0 && hour < 24) grid[dow][hour] += parseInt(r.count);
    });
    return grid;
  }, [activityHeat]);
  const heatMax = useMemo(() => Math.max(1, ...heatGrid.flat()), [heatGrid]);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" /> 관리자 대시보드
            </h1>
            <p className="text-muted-foreground mt-1">시스템 상태 및 데이터 분석</p>
          </div>
          <Button onClick={fetchAll} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 새로고침
          </Button>
        </div>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Server className={`h-8 w-8 mx-auto mb-2 ${healthOk ? 'text-emerald-500' : 'text-red-500'}`} />
            <p className="text-2xl font-bold">{healthOk === null ? '...' : healthOk ? 'Online' : 'Offline'}</p>
            <p className="text-sm text-muted-foreground">백엔드 상태</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-muted-foreground">가입 회원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">₩{((revenue?.mrr || 0) / 1000).toFixed(0)}K</p>
            <p className="text-sm text-muted-foreground">예상 MRR</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{revenue?.conversionRate || 0}%</p>
            <p className="text-sm text-muted-foreground">전환율</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      {revenue && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">총 사용자</p><p className="text-xl font-bold">{revenue.totalUsers}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pro 구독자</p><p className="text-xl font-bold text-primary">{revenue.proSubscribers}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Business 구독자</p><p className="text-xl font-bold text-amber-500">{revenue.bizSubscribers}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">활성 세션</p><p className="text-xl font-bold">{sessions}</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="charts">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charts">📊 차트</TabsTrigger>
          <TabsTrigger value="users">👥 사용자</TabsTrigger>
          <TabsTrigger value="system">🖥️ 시스템</TabsTrigger>
          <TabsTrigger value="collect">📥 수집</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6 mt-4">
          {/* Daily Signups Line Chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> 일별 가입자 추이</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="signups" stroke="#6366f1" strokeWidth={2} name="가입자" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Chats Bar Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> AI 상담 요청 추이</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="chats" fill="#f59e0b" name="상담 수" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Destinations & Segments */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">🌍 여행지 인기 순위 TOP 10</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={destinations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="city" tick={{ fontSize: 12 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="count" name="상담 수" radius={[0, 4, 4, 0]}>
                      {destinations.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">👥 사용자 세그먼트</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={userSegments} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {userSegments.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Funnel & Heatmap */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">🔄 고객 여정 퍼널</CardTitle></CardHeader>
              <CardContent>
                {funnel.length > 0 ? (
                  <div className="space-y-3">
                    {funnel.map((step, i) => {
                      const maxCount = funnel[0]?.count || 1;
                      const pct = Math.max(10, (step.count / maxCount) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm w-16 text-right shrink-0">{step.stage}</span>
                          <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center px-3 text-xs font-medium text-white"
                              style={{ width: `${pct}%`, backgroundColor: COLORS[i] }}
                            >
                              {step.count}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">데이터 없음</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> 활동 히트맵 (요일×시간)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="inline-flex flex-col gap-1 text-[10px]">
                    <div className="flex gap-1 ml-8">
                      {Array.from({ length: 24 }, (_, h) => (
                        <div key={h} className="w-4 text-center text-muted-foreground">{h}</div>
                      ))}
                    </div>
                    {heatGrid.map((row, dow) => (
                      <div key={dow} className="flex items-center gap-1">
                        <span className="w-6 text-right text-muted-foreground">{dayNames[dow]}</span>
                        {row.map((val, h) => {
                          const opacity = val / heatMax;
                          return (
                            <div
                              key={h}
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: `rgba(99,102,241,${Math.max(0.05, opacity)})` }}
                              title={`${dayNames[dow]} ${h}시: ${val}건`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> 사용자 상세 테이블</CardTitle>
              <CardDescription>등록된 모든 사용자 ({users.length}명)</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">아직 가입된 회원이 없습니다</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>이메일</TableHead>
                        <TableHead>가입일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell>{u.id}</TableCell>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString('ko-KR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* API Response Time (mock) */}
            <Card>
              <CardHeader><CardTitle className="text-base">⚡ API 응답 시간</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: '평균', value: '124ms', color: 'text-emerald-500' },
                  { label: 'P95', value: '342ms', color: 'text-amber-500' },
                  { label: 'P99', value: '891ms', color: 'text-red-500' },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{m.label}</span>
                    <span className={`text-lg font-bold ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Agents Status */}
            <Card>
              <CardHeader><CardTitle className="text-base">🤖 AI 에이전트 상태</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {AGENTS.map(a => (
                    <div key={a.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{a.emoji}</span>
                        <span className="text-sm">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{Math.floor(Math.random() * 50 + 10)} req</Badge>
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-emerald-500">Online</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge DB */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Knowledge DB 상태</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div><p className="text-xs text-muted-foreground">장소</p><p className="text-xl font-bold">{stats?.places?.total ?? 0}</p></div>
                <div><p className="text-xs text-muted-foreground">도시</p><p className="text-xl font-bold">{stats?.places?.cities ?? 0}</p></div>
                <div><p className="text-xs text-muted-foreground">루트</p><p className="text-xl font-bold">{stats?.routes ?? 0}</p></div>
                <div><p className="text-xs text-muted-foreground">이벤트</p><p className="text-xl font-bold">{stats?.events ?? 0}</p></div>
                <div><p className="text-xs text-muted-foreground">수집 로그</p><p className="text-xl font-bold">{stats?.collections ?? 0}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collect" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> 데이터 수집</CardTitle>
              <CardDescription>도시/국가를 입력하여 데이터 수집 트리거</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-w-md">
              <Input placeholder="도시 (예: Seoul)" value={city} onChange={e => setCity(e.target.value)} />
              <Input placeholder="국가 (예: South Korea)" value={country} onChange={e => setCountry(e.target.value)} />
              <Button onClick={handleCollect} className="w-full">수집 시작</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
