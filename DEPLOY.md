# Travelagent 배포 가이드 (웹사이트 방식)

## 사전 준비
- GitHub 저장소: https://github.com/sungli01/Traver_AI
- Anthropic API Key: `[Plan-Craft와 동일한 Anthropic API Key 사용]`

---

## 1단계: Railway 배포 (Backend 먼저)

### 1-1. 프로젝트 생성
1. https://railway.app 접속 → 로그인
2. **New Project** 클릭
3. **Deploy from GitHub repo** 선택
4. `sungli01/Traver_AI` 선택

### 1-2. 서비스 설정
1. 생성된 서비스 클릭
2. **Settings** 탭:
   - **Root Directory**: `apps/server` 입력
   - **Start Command**: `node index.js` (자동 감지됨)
3. **Variables** 탭:
   - `ANTHROPIC_API_KEY` = `[Plan-Craft와 동일한 Anthropic API Key 사용]`
   - `PORT` = `8080`
   - `ALLOWED_ORIGINS` = `https://travelagent.co.kr,https://traver-ai.vercel.app` (Vercel URL 포함)

### 1-3. URL 확인
- **Deployments** 탭 → 배포 완료 확인
- **Settings** 탭 → **Public Networking** → URL 복사
- 예: `https://traver-ai-production-4599.up.railway.app`
- **이 URL을 메모!** (2단계에서 사용)

---

## 2단계: Vercel 배포 (Frontend)

### 2-1. 프로젝트 생성
1. https://vercel.com 접속 → 로그인
2. **Add New** → **Project** 클릭
3. **Import Git Repository** → `sungli01/Traver_AI` 선택

### 2-2. 빌드 설정
1. **Root Directory**: `apps/client` 입력
2. **Framework Preset**: Next.js (자동 감지됨)
3. **Build Command**: `npm run build` (자동)
4. **Environment Variables** 추가:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: (1-3에서 복사한 Railway URL)
5. **Deploy** 클릭

### 2-3. 배포 확인
- 배포 완료 후 Vercel URL 확인 (예: `https://traver-ai.vercel.app`)

---

## 3단계: 도메인 연동 (travelagent.co.kr)

### 3-1. Vercel 도메인 추가
1. Vercel 프로젝트 → **Settings** → **Domains**
2. `travelagent.co.kr` 입력 → **Add**
3. `www.travelagent.co.kr` 입력 → **Add**
4. Vercel이 제공하는 DNS 설정 확인

### 3-2. DNS 설정 (도메인 등록업체)
1. 도메인 관리 페이지 접속
2. DNS 레코드 추가:
   - **Type**: A, **Name**: @, **Value**: `76.76.21.21`
   - **Type**: CNAME, **Name**: www, **Value**: `cname.vercel-dns.com`
3. 저장 후 5~10분 대기

### 3-3. Railway CORS 업데이트
1. Railway → Variables 탭
2. `ALLOWED_ORIGINS`에 `https://travelagent.co.kr` 추가
3. 서비스 재시작

---

## 4단계: 동작 확인

1. https://travelagent.co.kr 접속
2. 좌측 하단 **"Travel 에이전트"** 창에 여행 관련 텍스트 입력
3. 타임라인이 생성되면 ✅ 성공!

---

## 트러블슈팅

**Railway 배포 실패:**
- Logs 탭 확인
- `ANTHROPIC_API_KEY` 길이 확인 (108자)

**Vercel 빌드 실패:**
- Build Logs 확인
- `NEXT_PUBLIC_API_URL`이 https:// 로 시작하는지 확인

**도메인 연결 안 됨:**
- DNS 전파 대기 (최대 48시간, 보통 10분)
- `nslookup travelagent.co.kr` 명령으로 확인
