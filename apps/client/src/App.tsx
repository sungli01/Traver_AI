import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ROUTE_PATHS } from "@/lib/index";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import Trips from "@/pages/Trips";
import Payment from "@/pages/Payment";
import Settings from "@/pages/Settings";
import Security from "@/pages/Security";
import Blockchain from "@/pages/Blockchain";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import OAuthCallback from "@/pages/OAuthCallback";
import SharedTrip from "@/pages/SharedTrip";
import Admin from "@/pages/Admin";
import Pricing from "@/pages/Pricing";
import CityGuide from "@/pages/CityGuide";
import CityDetail from "@/pages/CityDetail";
import TeamDashboard from "@/pages/TeamDashboard";

/**
 * @description AI 멀티에이전트 여행 서비스 - TravelAgent AI
 * 2026년 최신 보안 강화 시스템: PII 마스킹, 데이터 격리, 블록체인 증명
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" expand={false} richColors />
        <HashRouter>
          <Layout>
            <Routes>
              {/* 메인 대시보드 */}
              <Route 
                path={ROUTE_PATHS.DASHBOARD} 
                element={<Dashboard />} 
              />
              
              {/* AI 에이전트 관리 */}
              <Route 
                path={ROUTE_PATHS.AGENTS} 
                element={<Agents />} 
              />
              
              {/* 여행 일정 및 예약 관리 */}
              <Route 
                path={ROUTE_PATHS.TRIPS} 
                element={<Trips />} 
              />
              
              {/* 결제 정보 및 카드 관리 */}
              <Route 
                path={ROUTE_PATHS.PAYMENT} 
                element={<Payment />} 
              />
              
              {/* 사용자 설정 및 선호도 */}
              <Route 
                path={ROUTE_PATHS.SETTINGS} 
                element={<Settings />} 
              />
              
              {/* 보안 센터 - PII 마스킹 및 데이터 격리 */}
              <Route 
                path={ROUTE_PATHS.SECURITY} 
                element={<Security />} 
              />
              
              {/* 블록체인 증명 센터 */}
              <Route 
                path={ROUTE_PATHS.BLOCKCHAIN} 
                element={<Blockchain />} 
              />

              {/* 로그인 */}
              <Route 
                path={ROUTE_PATHS.LOGIN} 
                element={<Login />} 
              />

              {/* 회원가입 */}
              <Route 
                path={ROUTE_PATHS.REGISTER} 
                element={<Register />} 
              />

              {/* OAuth 콜백 */}
              <Route 
                path="/oauth-callback" 
                element={<OAuthCallback />} 
              />

              {/* 관리자 대시보드 */}
              <Route 
                path={ROUTE_PATHS.ADMIN} 
                element={<Admin />} 
              />

              {/* 요금제 */}
              <Route 
                path={ROUTE_PATHS.PRICING} 
                element={<Pricing />} 
              />

              {/* 도시 가이드 */}
              <Route path={ROUTE_PATHS.CITIES} element={<CityGuide />} />
              <Route path={ROUTE_PATHS.CITY_DETAIL} element={<CityDetail />} />

              {/* 팀 대시보드 (Pro/Business) */}
              <Route path={ROUTE_PATHS.TEAM_DASHBOARD} element={<TeamDashboard />} />

              {/* 공유받은 일정 import */}
              <Route 
                path="/shared/*" 
                element={<SharedTrip />} 
              />

              {/* 404 페이지 - 요청된 경로가 없을 경우 */}
              <Route 
                path="*" 
                element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <h2 className="text-4xl font-bold text-primary">404</h2>
                    <p className="text-muted-foreground text-lg">
                      요청하신 페이지를 찾을 수 없습니다.
                    </p>
                    <button 
                      onClick={() => window.location.href = '#' + ROUTE_PATHS.DASHBOARD}
                      className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
                    >
                      홈으로 돌아가기
                    </button>
                  </div>
                } 
              />
            </Routes>
          </Layout>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;