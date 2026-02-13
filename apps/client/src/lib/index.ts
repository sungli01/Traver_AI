export const ROUTE_PATHS = {
  DASHBOARD: '/',
  AGENTS: '/agents',
  TRIPS: '/trips',
  PAYMENT: '/payment',
  SETTINGS: '/settings',
  SECURITY: '/security',
  BLOCKCHAIN: '/blockchain',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
} as const;

// 멀티에이전트 시스템 타입
export const AGENT_TYPES = {
  // Core Agents
  SKYWORK_ORCHESTRATOR: 'SKYWORK_ORCHESTRATOR', // 전체 에이전트 조율
  RESEARCH_ENGINE: 'RESEARCH_ENGINE', // 실시간 여행 정보 수집
  PLANNER: 'PLANNER', // 여행 계획 수립
  BOOKING: 'BOOKING', // 예약 처리
  CONCIERGE: 'CONCIERGE', // 고객 서비스
  PAYMENT: 'PAYMENT', // 결제 처리
  // Security & Privacy Agents
  SENTINEL: 'SENTINEL', // PII 마스킹 및 보안 감시
  VAULT_GUARDIAN: 'VAULT_GUARDIAN', // 개인 데이터 격리 관리
  BLOCKCHAIN_VERIFIER: 'BLOCKCHAIN_VERIFIER', // 블록체인 증명 관리
  ZK_PROOF_ENGINE: 'ZK_PROOF_ENGINE', // 영지식 증명 처리
} as const;

export type AgentType = keyof typeof AGENT_TYPES;

export const TRIP_STATUS = {
  PLANNING: 'PLANNING',
  BOOKING: 'BOOKING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TripStatus = keyof typeof TRIP_STATUS;

// AI 에이전트 인터페이스
export interface TravelAgent {
  id: string;
  name: string;
  type: AgentType;
  status: 'idle' | 'working' | 'error' | 'success' | 'secured' | 'verifying';
  description: string;
  avatar: string;
  capabilities: string[];
  lastAction?: string;
  efficiency: number;
  // 시스템 버전
  skyworkVersion: string;
  securityLevel: 'standard' | 'enhanced' | 'maximum';
  piiMaskingEnabled: boolean;
  blockchainIntegrated: boolean;
  // 실시간 상태
  currentTask?: {
    id: string;
    description: string;
    progress: number;
    estimatedCompletion: string;
  };
  // 보안 메트릭
  securityMetrics: {
    dataProcessed: number;
    piiMasked: number;
    blockchainTransactions: number;
    zkProofsGenerated: number;
  };
}

// 블록체인 기반 여행 계획 인터페이스
export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  budget: number;
  spent: number;
  activeAgents: string[];
  coverImage: string;
  itinerary: {
    day: number;
    date: string;
    activities: {
      time: string;
      title: string;
      type: 'flight' | 'hotel' | 'activity' | 'dining';
      status: 'pending' | 'booked' | 'completed';
      blockchainHash?: string; // 예약 증명 해시
      zkProofId?: string; // 영지식 증명 ID
    }[];
  }[];
  // 블록체인 증명 정보
  blockchainProof: {
    transactionHash: string;
    blockNumber: number;
    timestamp: string;
    verificationStatus: 'pending' | 'verified' | 'failed';
  };
  // 개인정보 보호 설정
  privacySettings: {
    piiMasked: boolean;
    dataIsolated: boolean;
    zkProofEnabled: boolean;
  };
}
// 보안 강화된 결제 카드 인터페이스
export interface PaymentCard {
  id: string;
  provider: 'visa' | 'mastercard' | 'amex';
  last4: string; // 마스킹된 카드 번호
  expiry: string; // 암호화된 만료일
  isDefault: boolean;
  nickname: string;
  color: string;
  billingAddress?: string;
  // 보안 강화 속성
  tokenId: string; // PCI-DSS 준수 토큰
  encryptionLevel: 'AES256' | 'RSA2048';
  vaultLocation: string; // 격리된 저장소 위치
  blockchainHash?: string; // 블록체인 검증 해시
  zkProofId?: string; // 영지식 증명 ID
  lastUsed: string;
  securityScore: number; // 1-100 보안 점수
}

// 개인정보 보호 강화 사용자 인터페이스
export interface User {
  id: string;
  name: string; // PII 마스킹 적용
  email: string; // PII 마스킹 적용
  avatar: string;
  preferredCurrency: string;
  memberSince: string;
  preferences: {
    dietary: string[];
    travelStyle: 'luxury' | 'budget' | 'adventure' | 'business';
    autoBookingEnabled: boolean;
    // 개인정보 보호 설정
    piiMaskingLevel: 'basic' | 'enhanced' | 'maximum';
    dataIsolationEnabled: boolean;
    blockchainVerificationEnabled: boolean;
  };
  // 보안 메트릭
  securityProfile: {
    vaultId: string; // 개인 데이터 격리 저장소 ID
    encryptionKey: string; // 암호화 키 (해시값만 저장)
    zkProofCount: number; // 생성된 영지식 증명 수
    lastSecurityAudit: string;
  };
}

// 블록체인 증명 인터페이스
export interface BlockchainProof {
  id: string;
  type: 'reservation' | 'payment' | 'identity' | 'travel_document';
  hash: string;
  blockNumber: number;
  timestamp: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  zkProofData?: {
    proofId: string;
    publicInputs: string[];
    verificationKey: string;
  };
}

// PII 마스킹 설정 인터페이스
export interface PIIMaskingConfig {
  enabled: boolean;
  maskingLevel: 'partial' | 'full' | 'dynamic';
  maskedFields: string[];
  retentionPeriod: number; // 일 단위
  auditTrail: {
    timestamp: string;
    action: 'mask' | 'unmask' | 'access';
    agentId: string;
    reason: string;
  }[];
}

// 데이터 격리 저장소 인터페이스
export interface PersonalVault {
  id: string;
  userId: string;
  encryptionLevel: 'AES256' | 'RSA2048' | 'ECC384';
  accessLog: {
    timestamp: string;
    agentId: string;
    operation: 'read' | 'write' | 'delete';
    dataType: string;
  }[];
  isolationStatus: 'active' | 'locked' | 'archived';
}

export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case TRIP_STATUS.CONFIRMED:
    case 'success':
    case 'booked':
      return 'text-emerald-500 bg-emerald-500/10';
    case TRIP_STATUS.BOOKING:
    case 'working':
      return 'text-accent bg-accent/10';
    case TRIP_STATUS.PLANNING:
    case 'idle':
      return 'text-primary bg-primary/10';
    case TRIP_STATUS.CANCELLED:
    case 'error':
      return 'text-destructive bg-destructive/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
}