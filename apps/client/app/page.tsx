'use client';

import { useState } from 'react';
import TravelAgentWindow from '../components/TravelAgentWindow';
import ItineraryTimeline from '../components/ItineraryTimeline';

export default function Home() {
  const [currentPlan, setCurrentPlan] = useState(null);

  // 에이전트로부터 플랜을 수신했을 때의 처리 (예시 데이터)
  const handleUpdatePlan = (newPlan) => {
    setCurrentPlan(newPlan);
  };

  return (
    <main className="min-h-screen bg-gray-50 relative p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Skywork Voyage Intelligence</h1>
            <p className="text-gray-500">전문화된 AI 기반 여행 관리 대시보드</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-sm font-medium text-gray-600">Opus 4.6 Engine</span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 중앙 캔버스: 타임라인 위젯 */}
          <div className="lg:col-span-2 bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[600px]">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
              인터랙티브 일정표
            </h2>
            
            {currentPlan ? (
              <ItineraryTimeline plan={currentPlan} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                <p>에이전트에게 자료를 제공하면 일정표가 생성됩니다.</p>
                <p className="text-xs mt-2">추진 중인 파일 또는 URL 링크를 좌측 하단 에이전트 창에 넣어보세요.</p>
              </div>
            )}
          </div>
          
          {/* 우측 사이드바: 통계 및 보안 */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">예산 분석</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-bold text-blue-600">₩ 0</span>
                  <span className="text-xs text-gray-400">Total Estimated</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-[10%]" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="text-green-400">●</span> 보안 모니터링
              </h3>
              <div className="space-y-3 text-sm opacity-80">
                <div className="flex justify-between">
                  <span>개인정보 마스킹</span>
                  <span className="text-green-400 text-xs">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>블록체인 증명성</span>
                  <span className="text-blue-400 text-xs">READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TravelAgentWindow onPlanGenerated={handleUpdatePlan} />
    </main>
  );
}
