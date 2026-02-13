import { 
  TravelAgent, 
  Trip, 
  PaymentCard, 
  AGENT_TYPES, 
  TRIP_STATUS 
} from "@/lib/index";
import { IMAGES } from "@/assets/images";

export const sampleAgents: TravelAgent[] = [
  {
    id: "skywork-orchestrator",
    name: "메인 오케스트레이터",
    type: AGENT_TYPES.SKYWORK_ORCHESTRATOR,
    status: "idle",
    description: "모든 AI 에이전트를 조율하고 여행 계획의 전체적인 흐름을 관리합니다.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Orchestrator",
    capabilities: ["에이전트 조율", "작업 분배", "성능 모니터링", "실시간 최적화"],
    lastAction: undefined,
    efficiency: 99,
    skyworkVersion: "v2.4.0",
    securityLevel: "maximum",
    piiMaskingEnabled: true,
    blockchainIntegrated: true,
    currentTask: undefined,
    securityMetrics: { dataProcessed: 0, piiMasked: 0, blockchainTransactions: 0, zkProofsGenerated: 0 }
  },
  {
    id: "research-engine",
    name: "리서치 엔진",
    type: AGENT_TYPES.RESEARCH_ENGINE,
    status: "idle",
    description: "실시간으로 여행 정보를 수집하고 분석하여 최신 데이터를 제공합니다.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Research",
    capabilities: ["실시간 정보 수집", "가격 비교", "리뷰 분석", "트렌드 예측"],
    lastAction: undefined,
    efficiency: 96,
    skyworkVersion: "v2.4.0",
    securityLevel: "enhanced",
    piiMaskingEnabled: true,
    blockchainIntegrated: false,
    currentTask: undefined,
    securityMetrics: { dataProcessed: 0, piiMasked: 0, blockchainTransactions: 0, zkProofsGenerated: 0 }
  },
  {
    id: "sentinel-agent",
    name: "센티넬 (보안 감시)",
    type: AGENT_TYPES.SENTINEL,
    status: "idle",
    description: "개인정보를 실시간으로 마스킹하고 모든 데이터 접근을 감시합니다.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sentinel",
    capabilities: ["PII 마스킹", "접근 제어", "보안 감사", "위협 탐지"],
    lastAction: undefined,
    efficiency: 100,
    skyworkVersion: "v2.4.0",
    securityLevel: "maximum",
    piiMaskingEnabled: true,
    blockchainIntegrated: true,
    currentTask: undefined,
    securityMetrics: { dataProcessed: 0, piiMasked: 0, blockchainTransactions: 0, zkProofsGenerated: 0 }
  },
  {
    id: "vault-guardian",
    name: "볼트 가디언",
    type: AGENT_TYPES.VAULT_GUARDIAN,
    status: "idle",
    description: "개인 데이터를 완전히 격리된 저장소에서 관리하고 보호합니다.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vault",
    capabilities: ["데이터 격리", "암호화 관리", "접근 로그", "백업 관리"],
    lastAction: undefined,
    efficiency: 98,
    skyworkVersion: "v2.4.0",
    securityLevel: "maximum",
    piiMaskingEnabled: true,
    blockchainIntegrated: true,
    currentTask: undefined,
    securityMetrics: { dataProcessed: 0, piiMasked: 0, blockchainTransactions: 0, zkProofsGenerated: 0 }
  },
  {
    id: "blockchain-verifier",
    name: "블록체인 검증기",
    type: AGENT_TYPES.BLOCKCHAIN_VERIFIER,
    status: "idle",
    description: "모든 예약과 결제를 블록체인에 기록하고 증명서를 생성합니다.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Blockchain",
    capabilities: ["블록체인 기록", "증명서 생성", "해시 검증", "스마트 컨트랙트"],
    lastAction: undefined,
    efficiency: 94,
    skyworkVersion: "v2.4.0",
    securityLevel: "maximum",
    piiMaskingEnabled: true,
    blockchainIntegrated: true,
    currentTask: undefined,
    securityMetrics: { dataProcessed: 0, piiMasked: 0, blockchainTransactions: 0, zkProofsGenerated: 0 }
  },
  {
    id: "zk-proof-engine",
    name: "ZK 증명 엔진",
    type: AGENT_TYPES.ZK_PROOF_ENGINE,
    status: "idle",
    description: "개인정보 노출 없이 필요한 조건들을 영지식 증명으로 검증합니다.",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ZKProof",
    capabilities: ["영지식 증명", "신원 확인", "자격 검증", "프라이버시 보호"],
    lastAction: undefined,
    efficiency: 97,
    skyworkVersion: "v2.4.0",
    securityLevel: "maximum",
    piiMaskingEnabled: true,
    blockchainIntegrated: true,
    currentTask: undefined,
    securityMetrics: { dataProcessed: 0, piiMasked: 0, blockchainTransactions: 0, zkProofsGenerated: 0 }
  }
];

export const sampleTrips: Trip[] = [];

const _sampleTripsBackup: Trip[] = [
  {
    id: "trip-1",
    title: "2026 도쿄 모던 이스케이프",
    destination: "도쿄, 일본",
    startDate: "2026-03-15",
    endDate: "2026-03-19",
    status: TRIP_STATUS.CONFIRMED,
    budget: 3500000,
    spent: 2800000,
    activeAgents: ["skywork-orchestrator", "blockchain-verifier", "sentinel-agent"],
    coverImage: IMAGES.AI_DASHBOARD_1,
    itinerary: [
      {
        day: 1,
        date: "2026-03-15",
        activities: [
          { 
            time: "10:30", 
            title: "인천발 나리타행 항공편", 
            type: "flight", 
            status: "booked",
            blockchainHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
            zkProofId: "zk_flight_001"
          },
          { 
            time: "14:00", 
            title: "파크 하얏트 도쿄 체크인", 
            type: "hotel", 
            status: "booked",
            blockchainHash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q",
            zkProofId: "zk_hotel_001"
          },
          { 
            time: "19:00", 
            title: "롯폰기 힐즈 디너", 
            type: "dining", 
            status: "booked",
            blockchainHash: "0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r"
          }
        ]
      },
      {
        day: 2,
        date: "2026-03-16",
        activities: [
          { 
            time: "09:00", 
            title: "팀랩 보더리스 관람", 
            type: "activity", 
            status: "booked",
            blockchainHash: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s"
          },
          { 
            time: "13:00", 
            title: "긴자 오마카세 런치", 
            type: "dining", 
            status: "booked",
            blockchainHash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t"
          }
        ]
      }
    ],
    blockchainProof: {
      transactionHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
      blockNumber: 18945672,
      timestamp: "2026-02-08 14:30:25",
      verificationStatus: "verified"
    },
    privacySettings: {
      piiMasked: true,
      dataIsolated: true,
      zkProofEnabled: true
    }
  },
  {
    id: "trip-2",
    title: "스위스 알프스 대자연 탐험",
    destination: "인터라켄, 스위스",
    startDate: "2026-06-10",
    endDate: "2026-06-20",
    status: TRIP_STATUS.PLANNING,
    budget: 8000000,
    spent: 0,
    activeAgents: ["skywork-orchestrator", "research-engine"],
    coverImage: IMAGES.TRAVEL_EXPERIENCE_1,
    itinerary: [
      {
        day: 1,
        date: "2026-06-10",
        activities: [
          { time: "23:30", title: "취리히행 국제선 항공편 조회", type: "flight", status: "pending" }
        ]
      }
    ],
    blockchainProof: {
      transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      blockNumber: 0,
      timestamp: "2026-02-08 15:00:00",
      verificationStatus: "pending"
    },
    privacySettings: {
      piiMasked: true,
      dataIsolated: true,
      zkProofEnabled: true
    }
  }
];

export const sampleCards: PaymentCard[] = [];

const _sampleCardsBackup: PaymentCard[] = [
  {
    id: "card-1",
    provider: "visa",
    last4: "8842",
    expiry: "08/28",
    isDefault: true,
    nickname: "개인 메인 카드",
    color: "bg-gradient-to-br from-indigo-600 to-blue-500",
    billingAddress: "서울특별시 강남구 테헤란로 123",
    tokenId: "tok_1a2b3c4d5e6f7g8h",
    encryptionLevel: "AES256",
    vaultLocation: "vault-kr-seoul-001",
    blockchainHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    zkProofId: "zk_card_001",
    lastUsed: "2026-02-08 14:30:25",
    securityScore: 98
  },
  {
    id: "card-2",
    provider: "mastercard",
    last4: "1055",
    expiry: "12/27",
    isDefault: false,
    nickname: "여행용 법인 카드",
    color: "bg-gradient-to-br from-slate-800 to-slate-900",
    billingAddress: "서울특별시 서초구 반포대로 45",
    tokenId: "tok_2b3c4d5e6f7g8h9i",
    encryptionLevel: "RSA2048",
    vaultLocation: "vault-kr-seoul-002",
    blockchainHash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q",
    zkProofId: "zk_card_002",
    lastUsed: "2026-02-07 09:15:42",
    securityScore: 95
  }
];

export const featuredDestinations = [
  {
    id: "dest-1",
    name: "파리",
    country: "프랑스",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    tags: ["낭만", "미식", "예술"],
    avgBudget: "4,500,000원"
  },
  {
    id: "dest-2",
    name: "교토",
    country: "일본",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    tags: ["전통", "휴식", "사찰"],
    avgBudget: "1,800,000원"
  },
  {
    id: "dest-3",
    name: "아이슬란드",
    country: "북유럽",
    image: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=800&q=80",
    tags: ["자연", "오로라", "로드트립"],
    avgBudget: "6,000,000원"
  }
];