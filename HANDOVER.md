# SVI 프로젝트 인수인계 가이드 (Handover Document)

## 1. 프로젝트 개요
- **명칭**: Skywork Voyage Intelligence (SVI)
- **목적**: Claude 3 Opus 기반의 지능형 여행 일정 자동화 서비스.

## 2. 기술 스택
- **Front-end**: Next.js 14 (App Router), Tailwind CSS, Shadcn UI
- **Back-end**: Node.js/Express, @anthropic-ai/sdk
- **Deployment**: Vercel (Client), Railway (Server)

## 3. 핵심 기능 동작 원리
1. 사용자가 좌측 하단 'Travel 에이전트' 창에 여행 관련 자료(텍스트, 링크 등)를 던짐.
2. 백엔드의 Claude 3 Opus API가 이를 분석하여 `TravelPlan` 규격의 JSON을 생성.
3. 프론트엔드의 `ItineraryTimeline` 위젯이 이를 수신하여 요일별 타임라인으로 시각화.

## 4. 환경 변수 설정 (필수)
- `ANTHROPIC_API_KEY`: Anthropic API 접근 키.
- `NEXT_PUBLIC_API_URL`: 백엔드(Railway) 배포 주소.

## 5. 인프라 정보
- **Domain**: www.travelagent.co.kr
- **GitHub**: https://github.com/sungli01/Traver_AI
