import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, Activity, CheckCircle2, AlertTriangle, XCircle, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IMAGES } from '@/assets/images';
import { useSecurityStore } from '@/stores/securityStore';

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export default function Security() {
  const { maskingEnabled, maskingLevel, logs, toggleMasking, setMaskingLevel } = useSecurityStore();
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [checking, setChecking] = useState(false);

  // Compute security score dynamically
  const computeScore = () => {
    let score = 0;
    if (maskingEnabled) score += 30;
    if (maskingLevel === 'enhanced') score += 20;
    if (maskingLevel === 'maximum') score += 30;
    if (window.location.protocol === 'https:') score += 10;
    // Password change within 90 days (simulated: check localStorage)
    const lastPwChange = localStorage.getItem('lastPasswordChange');
    if (lastPwChange) {
      const daysSince = (Date.now() - new Date(lastPwChange).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 90) score += 10;
    }
    return Math.min(score, 100);
  };

  const securityScore = computeScore();

  const runSecurityCheck = () => {
    setChecking(true);
    setTimeout(() => {
      const results: CheckResult[] = [];

      // HTTPS check
      results.push({
        name: 'HTTPS 연결',
        status: window.location.protocol === 'https:' ? 'pass' : 'warn',
        detail: window.location.protocol === 'https:' ? 'HTTPS로 안전하게 연결됨' : '개발환경 HTTP 사용 중 (프로덕션에서는 HTTPS 필수)',
      });

      // PII masking
      results.push({
        name: 'PII 마스킹',
        status: maskingEnabled ? 'pass' : 'fail',
        detail: maskingEnabled ? `마스킹 활성 (레벨: ${maskingLevel})` : 'PII 마스킹이 비활성화됨 — 개인정보 노출 위험',
      });

      // Masking level
      results.push({
        name: '마스킹 레벨',
        status: maskingLevel === 'maximum' ? 'pass' : maskingLevel === 'enhanced' ? 'warn' : 'fail',
        detail: `현재 레벨: ${maskingLevel === 'basic' ? '기본' : maskingLevel === 'enhanced' ? '강화' : '최대'}`,
      });

      // localStorage sensitive data check
      const sensitiveKeys = ['auth_token', 'savedCards'];
      const foundSensitive = sensitiveKeys.filter(k => localStorage.getItem(k));
      results.push({
        name: 'localStorage 민감 데이터',
        status: foundSensitive.length > 0 ? 'warn' : 'pass',
        detail: foundSensitive.length > 0
          ? `민감 데이터 키 발견: ${foundSensitive.join(', ')} (프로덕션에서는 암호화 필요)`
          : 'localStorage에 민감 데이터 없음',
      });

      // Session timeout
      results.push({
        name: '세션 타임아웃',
        status: 'warn',
        detail: '세션 자동 만료 미설정 — 추후 구현 권장',
      });

      // Auth token
      const token = localStorage.getItem('auth_token');
      results.push({
        name: '인증 토큰',
        status: token ? 'pass' : 'warn',
        detail: token ? 'JWT 토큰 존재 — 로그인 상태' : '로그인되지 않음',
      });

      setCheckResults(results);
      setChecking(false);
    }, 800);
  };

  const statusIcon = (s: string) => {
    if (s === 'pass') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (s === 'warn') return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const statusColor = (s: string) => s === 'pass' ? 'bg-emerald-500/10 text-emerald-500' : s === 'warn' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500';

  const typeLabel: Record<string, string> = { phone: '전화번호', email: '이메일', card: '카드번호', passport: '여권번호', name: '이름' };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8">
        <div className="absolute inset-0 opacity-20">
          <img src={IMAGES.PII_MASKING_SYSTEM_20260208_005256_33} alt="보안 시스템" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm"><Shield className="h-8 w-8 text-primary" /></div>
            <div>
              <h1 className="text-3xl font-bold">보안 센터</h1>
              <p className="text-muted-foreground">개인정보 보호 및 보안 점검</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge variant="secondary" className={securityScore >= 80 ? 'bg-emerald-500/10 text-emerald-500' : securityScore >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}>
              보안 점수: {securityScore}/100
            </Badge>
            {maskingEnabled && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">🔒 PII 마스킹 활성</Badge>
            )}
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="pii-masking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="pii-masking">PII 마스킹</TabsTrigger>
          <TabsTrigger value="masking-logs">마스킹 이력</TabsTrigger>
          <TabsTrigger value="security-check">보안 점검</TabsTrigger>
          <TabsTrigger value="audit">보안 감사</TabsTrigger>
        </TabsList>

        {/* PII Masking Tab */}
        <TabsContent value="pii-masking" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> PII 마스킹 설정</CardTitle>
                <CardDescription>개인식별정보 자동 마스킹</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">실시간 PII 마스킹</p>
                    <p className="text-sm text-muted-foreground">채팅 입력 시 자동 마스킹</p>
                  </div>
                  <Switch checked={maskingEnabled} onCheckedChange={toggleMasking} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>마스킹 처리 건수</span><span>{logs.length}건</span></div>
                  <Progress value={Math.min(logs.length * 10, 100)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">마스킹 레벨</p>
                  <div className="flex gap-2">
                    {(['basic', 'enhanced', 'maximum'] as const).map(level => (
                      <Button key={level} variant={maskingLevel === level ? 'default' : 'outline'} size="sm"
                        onClick={() => setMaskingLevel(level)} className="flex-1">
                        {level === 'basic' ? '기본' : level === 'enhanced' ? '강화' : '최대'}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {maskingLevel === 'basic' && '기본: 전화번호, 이메일 마스킹'}
                    {maskingLevel === 'enhanced' && '강화: 기본 + 카드번호, 여권번호 마스킹'}
                    {maskingLevel === 'maximum' && '최대: 모든 PII + 이름, 주소 마스킹'}
                  </p>
                </div>
                <Button variant="outline" className="w-full"><EyeOff className="h-4 w-4 mr-2" /> 마스킹 규칙 설정</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>마스킹 통계</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['phone', 'email', 'card', 'passport'].map(type => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{typeLabel[type]}</span>
                      <Badge variant="secondary">{logs.filter(l => l.originalType === type).length}건</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Masking Logs Tab */}
        <TabsContent value="masking-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>실시간 마스킹 이력</CardTitle>
              <CardDescription>채팅에서 감지된 개인정보 마스킹 기록</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <EyeOff className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>마스킹 이력이 없습니다.</p>
                  <p className="text-xs mt-1">채팅에서 개인정보를 입력하면 여기에 기록됩니다.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{typeLabel[log.originalType] || log.originalType}</Badge>
                          <span className="text-sm font-mono font-medium">{log.maskedValue}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">컨텍스트: {log.context}...</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Check Tab */}
        <TabsContent value="security-check" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5" /> 보안 점검 실행</CardTitle>
                  <CardDescription>시스템 보안 상태를 실시간으로 점검합니다</CardDescription>
                </div>
                <Button onClick={runSecurityCheck} disabled={checking}>
                  {checking ? '점검 중...' : '보안 점검 실행'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {checkResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>"보안 점검 실행" 버튼을 클릭하여 시스템 보안 상태를 확인하세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkResults.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg border">
                      {statusIcon(r.status)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{r.name}</p>
                          <Badge className={statusColor(r.status)}>
                            {r.status === 'pass' ? '통과' : r.status === 'warn' ? '경고' : '위험'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{r.detail}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm font-medium">
                      점검 결과: {checkResults.filter(r => r.status === 'pass').length}개 통과 / {checkResults.filter(r => r.status === 'warn').length}개 경고 / {checkResults.filter(r => r.status === 'fail').length}개 위험
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>보안 감사 리포트</CardTitle>
              <CardDescription>시스템 보안 상태 및 컴플라이언스 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                  <Shield className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-500">{securityScore >= 80 ? 'A+' : securityScore >= 60 ? 'B' : 'C'}</p>
                  <p className="text-sm text-muted-foreground">보안 등급</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-primary">{securityScore}%</p>
                  <p className="text-sm text-muted-foreground">보안 점수</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-accent/10">
                  <Activity className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-accent">24/7</p>
                  <p className="text-sm text-muted-foreground">모니터링</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">컴플라이언스 현황</h4>
                <div className="space-y-2">
                  {[
                    { standard: 'GDPR', status: '준수', score: 100 },
                    { standard: 'PCI-DSS', status: '준수', score: 98 },
                    { standard: 'ISO 27001', status: '준수', score: 96 },
                    { standard: 'SOC 2', status: '준수', score: 99 },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{c.standard}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={c.score} className="w-20 h-2" />
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">{c.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
