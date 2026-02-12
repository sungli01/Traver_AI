import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, Key, Database, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IMAGES } from '@/assets/images';
import { useSecurityStore } from '@/stores/securityStore';

export default function Security() {
  const { maskingEnabled, maskingLevel, logs, toggleMasking, setMaskingLevel } = useSecurityStore();

  const securityMetrics = {
    overallScore: 98,
    piiMasked: logs.length,
    zkProofsGenerated: 89,
    blockchainTransactions: 156,
    dataIsolationLevel: 'Maximum',
  };

  const typeLabel: Record<string, string> = {
    phone: '전화번호',
    email: '이메일',
    card: '카드번호',
    passport: '여권번호',
    name: '이름',
  };

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8"
      >
        <div className="absolute inset-0 opacity-20">
          <img
            src={IMAGES.PII_MASKING_SYSTEM_20260208_005256_33}
            alt="보안 시스템"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">보안 센터</h1>
              <p className="text-muted-foreground">개인정보 보호 및 블록체인 보안 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
              보안 점수: {securityMetrics.overallScore}/100
            </Badge>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              {securityMetrics.dataIsolationLevel} 격리
            </Badge>
            {maskingEnabled && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                🔒 PII 마스킹 활성
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="pii-masking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pii-masking">PII 마스킹</TabsTrigger>
          <TabsTrigger value="masking-logs">마스킹 이력</TabsTrigger>
          <TabsTrigger value="blockchain">블록체인 증명</TabsTrigger>
          <TabsTrigger value="audit">보안 감사</TabsTrigger>
        </TabsList>

        {/* PII 마스킹 탭 */}
        <TabsContent value="pii-masking" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  PII 마스킹 설정
                </CardTitle>
                <CardDescription>개인식별정보 자동 마스킹 및 비식별화 설정</CardDescription>
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
                  <div className="flex justify-between text-sm">
                    <span>마스킹 처리된 데이터</span>
                    <span>{logs.length}건</span>
                  </div>
                  <Progress value={Math.min(logs.length * 10, 100)} className="h-2" />
                </div>

                {/* Masking level selector */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">마스킹 레벨</p>
                  <div className="flex gap-2">
                    {(['basic', 'enhanced', 'maximum'] as const).map((level) => (
                      <Button
                        key={level}
                        variant={maskingLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMaskingLevel(level)}
                        className="flex-1 capitalize"
                      >
                        {level === 'basic' ? '기본' : level === 'enhanced' ? '강화' : '최대'}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <EyeOff className="h-4 w-4 mr-2" />
                  마스킹 규칙 설정
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>마스킹 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['phone', 'email', 'card', 'passport'].map((type) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{typeLabel[type]}</span>
                      <Badge variant="secondary">
                        {logs.filter((l) => l.originalType === type).length}건
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 마스킹 이력 탭 */}
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
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {typeLabel[log.originalType] || log.originalType}
                          </Badge>
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

        {/* 블록체인 증명 탭 */}
        <TabsContent value="blockchain" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  블록체인 증명 시스템
                </CardTitle>
                <CardDescription>예약 및 결제 내역의 블록체인 기반 증명</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-primary/10">
                    <p className="text-2xl font-bold text-primary">{securityMetrics.blockchainTransactions}</p>
                    <p className="text-sm text-muted-foreground">블록체인 거래</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/10">
                    <p className="text-2xl font-bold text-accent">{securityMetrics.zkProofsGenerated}</p>
                    <p className="text-sm text-muted-foreground">ZK 증명</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">증명서 다운로드</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>최근 블록체인 활동</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: '예약 증명', hash: '0x1a2b...3c4d', status: '검증됨' },
                    { type: '결제 증명', hash: '0x5e6f...7g8h', status: '검증됨' },
                    { type: 'ZK 증명', hash: '0x9i0j...1k2l', status: '처리중' },
                    { type: '신원 증명', hash: '0x3m4n...5o6p', status: '검증됨' },
                  ].map((a, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{a.type}</p>
                        <p className="text-xs text-muted-foreground font-mono">{a.hash}</p>
                      </div>
                      <Badge
                        variant={a.status === '검증됨' ? 'default' : 'secondary'}
                        className={a.status === '검증됨' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                      >
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 보안 감사 탭 */}
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
                  <p className="text-2xl font-bold text-emerald-500">A+</p>
                  <p className="text-sm text-muted-foreground">보안 등급</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-primary">100%</p>
                  <p className="text-sm text-muted-foreground">암호화 적용</p>
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
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                          {c.status}
                        </Badge>
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
