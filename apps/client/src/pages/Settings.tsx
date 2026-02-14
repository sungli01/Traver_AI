import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Bot,
  Globe,
  Save,
  LogOut,
  Camera,
  CheckCircle2,
  Smartphone,
  Mail
} from 'lucide-react';
import { ROUTE_PATHS, User as UserType } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { Key, Copy, RefreshCw, Check, Trash2 } from 'lucide-react';

const SAMPLE_USER: UserType = {
  id: 'user-123',
  name: '김에이전트',
  email: 'agent.kim@travel-ai.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
  preferredCurrency: 'KRW',
  memberSince: '2024-05-20',
  preferences: {
    dietary: ['비건', '글루텐 프리'],
    travelStyle: 'luxury',
    autoBookingEnabled: true,
    piiMaskingLevel: 'enhanced',
    dataIsolationEnabled: true,
    blockchainVerificationEnabled: true,
  },
  securityProfile: {
    vaultId: 'vault-user-123',
    encryptionKey: 'enc_key_hash_abc123',
    zkProofCount: 45,
    lastSecurityAudit: '2026-02-08 10:00:00',
  },
};


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function ApiKeySection() {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const [keys, setKeys] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const plan = user?.plan || 'free';

  const fetchKeys = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/apikeys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setKeys(data.keys || []);
    } catch { /* */ }
  };

  React.useEffect(() => { fetchKeys(); }, [token]);

  const createKey = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/apikeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'API Key ' + (keys.length + 1) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'API 키 생성 완료', description: '새 API 키가 생성되었습니다.' });
        fetchKeys();
      } else {
        toast({ title: '오류', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: '오류', description: '서버 연결 실패', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (id: number) => {
    await fetch(`${API_BASE_URL}/api/apikeys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchKeys();
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (plan !== 'business') {
    return (
      <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h3 className="text-lg font-bold">API 키는 Business 전용 기능입니다</h3>
          <p className="text-sm text-muted-foreground">Business 플랜으로 업그레이드하여 API 접근 권한을 얻으세요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> API 키 관리</CardTitle>
        <CardDescription>외부 서비스에서 TravelAgent API에 접근할 수 있는 키를 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={createKey} disabled={loading} className="gap-2">
          <Key className="w-4 h-4" /> 새 API 키 생성
        </Button>
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">아직 생성된 API 키가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="text-xs font-mono text-muted-foreground truncate">{k.api_key.slice(0, 12)}{'*'.repeat(20)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copyKey(k.api_key, String(k.id))}>
                    {copiedId === String(k.id) ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteKey(k.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserType>(SAMPLE_USER);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "설정 저장 완료",
        description: "모든 변경 사항이 안전하게 저장되었습니다.",
      });
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground">개인 정보, AI 에이전트 권한 및 알림 설정을 관리하세요.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-lg shadow-primary/20">
          {isSaving ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Save className="w-4 h-4" /></motion.div> : <Save className="w-4 h-4" />}
          설정 저장하기
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
          <TabsList className="flex flex-row lg:flex-col h-auto bg-transparent border-none gap-1 lg:space-y-1 p-0 overflow-x-auto">
            <TabsTrigger 
              value="profile" 
              className="justify-start w-full px-4 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <User className="w-4 h-4 mr-3" /> 프로필 정보
            </TabsTrigger>
            <TabsTrigger 
              value="agents" 
              className="justify-start w-full px-4 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Bot className="w-4 h-4 mr-3" /> AI 에이전트 권한
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="justify-start w-full px-4 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Bell className="w-4 h-4 mr-3" /> 알림 및 보안
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="justify-start w-full px-4 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <CreditCard className="w-4 h-4 mr-3" /> 결제 수단
            </TabsTrigger>
            <TabsTrigger 
              value="apikeys" 
              className="justify-start w-full px-4 py-3 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Key className="w-4 h-4 mr-3" /> API 키
            </TabsTrigger>
            <Separator className="my-2" />
            <Button variant="ghost" className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-3" /> 로그아웃
            </Button>
          </TabsList>

          <div className="space-y-6">
            <TabsContent value="profile" className="m-0">
              <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>기본 프로필</CardTitle>
                  <CardDescription>에이전트가 여행을 계획할 때 사용하는 개인 정보입니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>AK</AvatarFallback>
                      </Avatar>
                      <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 shadow-md">
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-2">Premium Member</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">이름</Label>
                      <Input id="name" defaultValue={user.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일 주소</Label>
                      <Input id="email" type="email" defaultValue={user.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">주요 통화</Label>
                      <Select defaultValue={user.preferredCurrency}>
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="통화 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KRW">KRW (₩)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="style">선호하는 여행 스타일</Label>
                      <Select defaultValue={user.preferences.travelStyle}>
                        <SelectTrigger id="style">
                          <SelectValue placeholder="스타일 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="luxury">럭셔리</SelectItem>
                          <SelectItem value="budget">가성비</SelectItem>
                          <SelectItem value="adventure">어드벤처</SelectItem>
                          <SelectItem value="business">비즈니스</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="m-0">
              <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>AI 에이전트 자율성 설정</CardTitle>
                  <CardDescription>에이전트가 대신 결제하거나 예약할 수 있는 범위를 설정합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">자동 예약 시스템 활성화</Label>
                      <p className="text-sm text-muted-foreground">에이전트가 최적의 옵션을 찾으면 별도 승인 없이 예약을 진행합니다.</p>
                    </div>
                    <Switch checked={user.preferences.autoBookingEnabled} onCheckedChange={(val) => setUser({...user, preferences: {...user.preferences, autoBookingEnabled: val}})} />
                  </div>
                  
                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                      <Shield className="w-4 h-4" /> 에이전트별 접근 권한
                    </h4>
                    <div className="grid gap-4">
                      {['플래너 에이전트', '부킹 에이전트', '컨시어지 에이전트', '페이먼트 에이전트'].map((agent) => (
                        <div key={agent} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                              <Bot className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{agent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px]">Full Access</Badge>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="m-0">
              <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>알림 및 보안 설정</CardTitle>
                  <CardDescription>중요한 업데이트와 시스템 보안에 대한 알림 방식을 선택하세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/10">
                      <div className="flex items-center gap-4">
                        <Smartphone className="w-5 h-5 text-accent" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">푸시 알림</p>
                          <p className="text-xs text-muted-foreground">실시간 에이전트 상태 및 일정 변경 알림</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/10">
                      <div className="flex items-center gap-4">
                        <Mail className="w-5 h-5 text-accent" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">이메일 요약 리포트</p>
                          <p className="text-xs text-muted-foreground">주간 여행 지출 및 에이전트 활동 보고서</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">2단계 인증 (2FA)</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                        현재 활성화됨
                      </div>
                      <Button variant="outline" size="sm">관리하기</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="apikeys" className="m-0">
              <ApiKeySection />
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" /> 데이터 리전
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Seoul, KR</p>
            <p className="text-xs text-muted-foreground mt-1">최저 지연 시간 및 데이터 주권 보장</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="w-4 h-4" /> 에이전트 지능 지수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">GPT-4o (Custom)</p>
            <p className="text-xs text-muted-foreground mt-1">2026-02-08 업데이트 완료</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/50 to-transparent border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> 보안 등급
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">Enterprise</p>
            <p className="text-xs text-muted-foreground mt-1">종단간 암호화 적용 중</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
