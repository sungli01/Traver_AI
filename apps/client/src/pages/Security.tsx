import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, Key, Database, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IMAGES } from '@/assets/images';

export default function Security() {
  const [piiMaskingEnabled, setPiiMaskingEnabled] = useState(true);
  const [dataIsolationEnabled, setDataIsolationEnabled] = useState(true);
  const [blockchainEnabled, setBlockchainEnabled] = useState(true);

  const securityMetrics = {
    overallScore: 98,
    piiMasked: 1247,
    zkProofsGenerated: 89,
    blockchainTransactions: 156,
    dataIsolationLevel: 'Maximum'
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
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="pii-masking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pii-masking">PII 마스킹</TabsTrigger>
          <TabsTrigger value="data-isolation">데이터 격리</TabsTrigger>
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
                <CardDescription>
                  개인식별정보 자동 마스킹 및 비식별화 설정
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">실시간 PII 마스킹</p>
                    <p className="text-sm text-muted-foreground">AI 에이전트 간 통신 시 자동 마스킹</p>
                  </div>
                  <Switch 
                    checked={piiMaskingEnabled}
                    onCheckedChange={setPiiMaskingEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>마스킹 처리된 데이터</span>
                    <span>{securityMetrics.piiMasked.toLocaleString()}건</span>
                  </div>
                  <Progress value={85} className="h-2" />
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm">이름/주소</span>
                    <Badge variant="secondary">456건</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">카드 정보</span>
                    <Badge variant="secondary">234건</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">연락처</span>
                    <Badge variant="secondary">189건</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">여권 정보</span>
                    <Badge variant="secondary">78건</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 데이터 격리 탭 */}
        <TabsContent value="data-isolation" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  개인 데이터 볼트
                </CardTitle>
                <CardDescription>
                  완전 격리된 개인 데이터 저장소 관리
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">데이터 격리 활성화</p>
                    <p className="text-sm text-muted-foreground">Zero-Knowledge 아키텍처 적용</p>
                  </div>
                  <Switch 
                    checked={dataIsolationEnabled}
                    onCheckedChange={setDataIsolationEnabled}
                  />
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="font-medium">볼트 상태</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AES-256 암호화 | RSA-2048 키 교환
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  암호화 키 재생성
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>접근 로그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { agent: 'Skywork Orchestrator', action: '데이터 읽기', time: '2분 전' },
                    { agent: 'Booking Agent', action: '카드 토큰 접근', time: '5분 전' },
                    { agent: 'Sentinel Agent', action: '보안 스캔', time: '12분 전' },
                    { agent: 'Vault Guardian', action: '백업 생성', time: '1시간 전' }
                  ].map((log, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{log.agent}</p>
                        <p className="text-xs text-muted-foreground">{log.action}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
                <CardDescription>
                  예약 및 결제 내역의 블록체인 기반 증명
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">블록체인 증명 활성화</p>
                    <p className="text-sm text-muted-foreground">모든 거래의 불변 기록 생성</p>
                  </div>
                  <Switch 
                    checked={blockchainEnabled}
                    onCheckedChange={setBlockchainEnabled}
                  />
                </div>
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
                <Button variant="outline" className="w-full">
                  증명서 다운로드
                </Button>
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
                    { type: '신원 증명', hash: '0x3m4n...5o6p', status: '검증됨' }
                  ].map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{activity.type}</p>
                        <p className="text-xs text-muted-foreground font-mono">{activity.hash}</p>
                      </div>
                      <Badge 
                        variant={activity.status === '검증됨' ? 'default' : 'secondary'}
                        className={activity.status === '검증됨' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                      >
                        {activity.status}
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
              <CardDescription>
                시스템 보안 상태 및 컴플라이언스 현황
              </CardDescription>
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
                    { standard: 'SOC 2', status: '준수', score: 99 }
                  ].map((compliance, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{compliance.standard}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={compliance.score} className="w-20 h-2" />
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                          {compliance.status}
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