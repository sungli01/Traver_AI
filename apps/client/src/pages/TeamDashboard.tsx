import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Crown, Mail, Shield, BarChart3, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/use-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface TeamMember {
  id: number;
  member_email: string;
  member_name: string | null;
  role: string;
  invited_at: string;
  accepted_at: string | null;
}

export default function TeamDashboard() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const plan = user?.plan || 'free';

  const fetchMembers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/team`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMembers(data.members || []);
    } catch { /* */ }
  };

  useEffect(() => { fetchMembers(); }, [token]);

  const invite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: '초대 실패', description: data.error, variant: 'destructive' });
      } else {
        toast({ title: '초대 완료', description: `${email}에게 초대를 보냈습니다.` });
        setEmail('');
        fetchMembers();
      }
    } catch {
      toast({ title: '오류', description: '서버 연결 실패', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/team/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMembers();
    } catch { /* */ }
  };

  if (plan !== 'pro' && plan !== 'business') {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold">팀 대시보드</h2>
        <p className="text-muted-foreground">Pro 또는 Business 플랜에서 팀 기능을 사용할 수 있습니다.</p>
        <Button onClick={() => window.location.hash = '#/pricing'}>요금제 보기</Button>
      </div>
    );
  }

  const maxMembers = plan === 'business' ? '무제한' : '3명';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {plan === 'business' ? <Building2 className="h-8 w-8 text-amber-500" /> : <Users className="h-8 w-8 text-blue-500" />}
            팀 대시보드
          </h1>
          <p className="text-muted-foreground mt-1">팀원을 초대하고 일정을 공유하세요 · 최대 {maxMembers}</p>
        </div>
        <Badge className={plan === 'business' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}>
          {plan === 'business' ? '👑 Business' : '⚡ Pro'}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{members.length}</div>
            <p className="text-sm text-muted-foreground">팀원 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{members.filter(m => m.accepted_at).length}</div>
            <p className="text-sm text-muted-foreground">활성 멤버</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{members.filter(m => !m.accepted_at).length}</div>
            <p className="text-sm text-muted-foreground">초대 대기</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> 팀원 초대</CardTitle>
          <CardDescription>이메일 주소로 팀원을 초대하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="이메일 주소 입력..."
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && invite()}
            />
            <Button onClick={invite} disabled={loading || !email.trim()}>
              <UserPlus className="h-4 w-4 mr-2" /> 초대
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> 팀원 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">아직 팀원이 없습니다. 위에서 초대해보세요!</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.member_name || m.member_email}</p>
                      <p className="text-xs text-muted-foreground">{m.member_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.accepted_at ? 'default' : 'secondary'}>
                      {m.accepted_at ? '활성' : '대기중'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
