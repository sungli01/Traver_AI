import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Database, Activity, Server, RefreshCw, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface UserRecord {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface KnowledgeStats {
  places: { total: number; cities: number };
  routes: number;
  events: number;
  collections: number;
}

export default function Admin() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [sessions, setSessions] = useState(0);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Collect form
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, hRes, sessRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`).then(r => r.json()).catch(() => ({ users: [] })),
        fetch(`${API_BASE}/api/knowledge/stats`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/health`).then(r => r.ok).catch(() => false),
        fetch(`${API_BASE}/api/admin/sessions`).then(r => r.json()).catch(() => ({ activeSessions: 0 })),
      ]);
      setUsers(uRes.users || []);
      setStats(sRes);
      setHealthOk(hRes);
      setSessions(sessRes.activeSessions || 0);
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

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" /> 관리자 대시보드
            </h1>
            <p className="text-muted-foreground mt-1">시스템 상태 및 사용자 관리</p>
          </div>
          <Button onClick={fetchAll} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 새로고침
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
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
            <Database className="h-8 w-8 mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{stats?.places?.total ?? '-'}</p>
            <p className="text-sm text-muted-foreground">장소 ({stats?.places?.cities ?? 0}개 도시)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{sessions}</p>
            <p className="text-sm text-muted-foreground">활성 세션</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Users Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> 가입 회원 목록</CardTitle>
            <CardDescription>등록된 모든 사용자</CardDescription>
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

        {/* Knowledge DB & Collect */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Knowledge DB</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><span className="text-sm">장소</span><Badge variant="secondary">{stats?.places?.total ?? 0}</Badge></div>
              <div className="flex justify-between"><span className="text-sm">도시</span><Badge variant="secondary">{stats?.places?.cities ?? 0}</Badge></div>
              <div className="flex justify-between"><span className="text-sm">루트</span><Badge variant="secondary">{stats?.routes ?? 0}</Badge></div>
              <div className="flex justify-between"><span className="text-sm">이벤트</span><Badge variant="secondary">{stats?.events ?? 0}</Badge></div>
              <div className="flex justify-between"><span className="text-sm">수집 로그</span><Badge variant="secondary">{stats?.collections ?? 0}</Badge></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> 데이터 수집</CardTitle>
              <CardDescription>도시/국가를 입력하여 데이터 수집 트리거</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="도시 (예: Seoul)" value={city} onChange={e => setCity(e.target.value)} />
              <Input placeholder="국가 (예: South Korea)" value={country} onChange={e => setCountry(e.target.value)} />
              <Button onClick={handleCollect} className="w-full">수집 시작</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
