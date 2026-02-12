import { useState } from 'react';
import { motion } from 'framer-motion';
import { Blocks, CheckCircle, Clock, AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IMAGES } from '@/assets/images';

export default function Blockchain() {
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const blockchainStats = {
    totalTransactions: 1247,
    verifiedProofs: 1189,
    pendingVerifications: 12,
    zkProofsGenerated: 456
  };

  const recentTransactions = [
    {
      id: '1',
      type: '항공편 예약',
      hash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
      blockNumber: 18945672,
      timestamp: '2026-02-08 14:30:25',
      status: 'verified',
      amount: '₩850,000',
      destination: '도쿄'
    },
    {
      id: '2',
      type: '호텔 예약',
      hash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q',
      blockNumber: 18945671,
      timestamp: '2026-02-08 14:25:18',
      status: 'verified',
      amount: '₩320,000',
      destination: '도쿄'
    },
    {
      id: '3',
      type: '결제 처리',
      hash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r',
      blockNumber: 18945670,
      timestamp: '2026-02-08 14:20:42',
      status: 'pending',
      amount: '₩125,000',
      destination: '오사카'
    },
    {
      id: '4',
      type: 'ZK 증명',
      hash: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s',
      blockNumber: 18945669,
      timestamp: '2026-02-08 14:15:33',
      status: 'verified',
      amount: '-',
      destination: '신원 확인'
    }
  ];

  const zkProofs = [
    {
      id: 'zk_001',
      type: '연령 증명',
      description: '만 18세 이상 확인 (실제 나이 노출 없음)',
      status: 'verified',
      createdAt: '2026-02-08 13:45:12',
      verificationKey: 'vk_age_proof_2026'
    },
    {
      id: 'zk_002',
      type: '국적 증명',
      description: '한국 국적 확인 (여권 정보 노출 없음)',
      status: 'verified',
      createdAt: '2026-02-08 13:40:28',
      verificationKey: 'vk_nationality_proof_2026'
    },
    {
      id: 'zk_003',
      type: '결제 능력 증명',
      description: '충분한 잔액 확인 (계좌 정보 노출 없음)',
      status: 'pending',
      createdAt: '2026-02-08 13:35:45',
      verificationKey: 'vk_balance_proof_2026'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
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
            src={IMAGES.BLOCKCHAIN_VERIFICATION_20260208_005257_32} 
            alt="블록체인 시스템"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm">
              <Blocks className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">블록체인 증명 센터</h1>
              <p className="text-muted-foreground">여행 예약 및 결제의 불변 증명 시스템</p>
            </div>
          </div>
          
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-primary">{blockchainStats.totalTransactions.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">총 거래</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-emerald-500">{blockchainStats.verifiedProofs.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">검증 완료</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-amber-500">{blockchainStats.pendingVerifications}</p>
              <p className="text-sm text-muted-foreground">검증 대기</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-accent">{blockchainStats.zkProofsGenerated}</p>
              <p className="text-sm text-muted-foreground">ZK 증명</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">블록체인 거래</TabsTrigger>
          <TabsTrigger value="zk-proofs">영지식 증명</TabsTrigger>
          <TabsTrigger value="certificates">증명서 관리</TabsTrigger>
        </TabsList>

        {/* 블록체인 거래 탭 */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>최근 블록체인 거래</CardTitle>
              <CardDescription>
                모든 여행 예약과 결제가 블록체인에 불변 기록으로 저장됩니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>거래 유형</TableHead>
                    <TableHead>해시</TableHead>
                    <TableHead>블록 번호</TableHead>
                    <TableHead>시간</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.type}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                      </TableCell>
                      <TableCell>{tx.blockNumber.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{tx.timestamp}</TableCell>
                      <TableCell>{tx.amount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tx.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(tx.status)}
                            {tx.status === 'verified' ? '검증됨' : '대기중'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 영지식 증명 탭 */}
        <TabsContent value="zk-proofs" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>영지식 증명 (Zero-Knowledge Proofs)</CardTitle>
                <CardDescription>
                  개인정보 노출 없이 필요한 조건만 증명
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zkProofs.map((proof) => (
                    <div 
                      key={proof.id}
                      className="p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedProof(proof.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{proof.type}</h4>
                        <Badge className={getStatusColor(proof.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(proof.status)}
                            {proof.status === 'verified' ? '검증됨' : '처리중'}
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{proof.description}</p>
                      <p className="text-xs text-muted-foreground">
                        생성: {proof.createdAt}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ZK 증명 상세 정보</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProof ? (
                  <div className="space-y-4">
                    {(() => {
                      const proof = zkProofs.find(p => p.id === selectedProof);
                      return proof ? (
                        <>
                          <div>
                            <h4 className="font-medium mb-2">{proof.type}</h4>
                            <p className="text-sm text-muted-foreground">{proof.description}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">증명 ID:</span>
                              <span className="text-sm font-mono">{proof.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">검증 키:</span>
                              <span className="text-sm font-mono">{proof.verificationKey}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">생성 시간:</span>
                              <span className="text-sm">{proof.createdAt}</span>
                            </div>
                          </div>
                          <Button className="w-full" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            증명서 다운로드
                          </Button>
                        </>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Blocks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>증명을 선택하여 상세 정보를 확인하세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 증명서 관리 탭 */}
        <TabsContent value="certificates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>여행 증명서</CardTitle>
                <CardDescription>
                  블록체인 기반 여행 예약 증명서
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: '도쿄 여행 패키지', date: '2026-03-15 ~ 2026-03-20', status: 'verified' },
                    { title: '오사카 비즈니스 출장', date: '2026-02-28 ~ 2026-03-02', status: 'verified' },
                    { title: '제주도 휴가', date: '2026-04-10 ~ 2026-04-13', status: 'pending' }
                  ].map((cert, index) => (
                    <div key={index} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{cert.title}</h4>
                        <Badge className={getStatusColor(cert.status)}>
                          {cert.status === 'verified' ? '발급됨' : '처리중'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{cert.date}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        증명서 다운로드
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>증명서 검증</CardTitle>
                <CardDescription>
                  제3자 증명서 검증 및 확인
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">QR 코드 검증</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      증명서의 QR 코드를 스캔하여 진위를 확인할 수 있습니다
                    </p>
                    <Button variant="outline" className="w-full">
                      QR 코드 스캔
                    </Button>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">해시 검증</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      블록체인 해시값으로 증명서 무결성을 확인합니다
                    </p>
                    <Button variant="outline" className="w-full">
                      해시 검증
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}