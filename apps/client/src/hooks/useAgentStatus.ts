import { useState, useCallback, useEffect, useRef } from 'react';
import { TravelAgent } from '@/lib/index';

/**
 * AI 에이전트들의 실시간 상태를 관리하고 추적하는 커스텀 훅
 * 에이전트의 작업 상태 전이(Idle -> Working -> Success/Error) 및 가상 작업 시뮬레이션을 처리합니다.
 */
export const useAgentStatus = (initialAgents: TravelAgent[]) => {
  const [agents, setAgents] = useState<TravelAgent[]>(initialAgents);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    const currentTimers = timersRef.current;
    return () => {
      Object.values(currentTimers).forEach(clearTimeout);
    };
  }, []);

  /**
   * 특정 에이전트의 상태와 마지막 활동 내역을 업데이트합니다.
   */
  const setAgentStatus = useCallback((id: string, status: TravelAgent['status'], lastAction?: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id ? { 
          ...agent, 
          status, 
          lastAction: lastAction ?? agent.lastAction 
        } : agent
      )
    );
  }, []);

  /**
   * 에이전트의 전체 속성을 부분적으로 업데이트합니다.
   */
  const updateAgent = useCallback((id: string, updates: Partial<TravelAgent>) => {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === id ? { ...agent, ...updates } : agent))
    );
  }, []);

  /**
   * 에이전트의 가상 작업을 시뮬레이션합니다.
   * Working 상태로 진입 후 일정 시간 뒤 Success 또는 Error 상태로 전이됩니다.
   */
  const runAgentTask = useCallback(async (id: string, taskName: string, duration: number = 3000) => {
    // 기존에 해당 에이전트에 걸려있던 타이머가 있다면 제거
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
    }

    setAgentStatus(id, 'working', `${taskName} 분석 중...`);

    return new Promise<{ success: boolean }>((resolve) => {
      const timer = setTimeout(() => {
        const isSuccess = Math.random() > 0.15; // 85% 성공 확률
        
        if (isSuccess) {
          updateAgent(id, {
            status: 'success',
            lastAction: `${taskName} 완료: 최적의 결과를 찾았습니다.`,
            efficiency: Math.min(1, 0.85 + Math.random() * 0.15)
          });
        } else {
          updateAgent(id, {
            status: 'error',
            lastAction: `${taskName} 중 예상치 못한 데이터 오류가 발생했습니다.`,
            efficiency: Math.max(0.1, Math.random() * 0.4)
          });
        }

        // 5초 후 다시 유휴(Idle) 상태로 복귀하여 대기
        timersRef.current[id] = setTimeout(() => {
          setAgentStatus(id, 'idle', '다음 명령을 기다리는 중');
        }, 5000);

        resolve({ success: isSuccess });
      }, duration);

      timersRef.current[id] = timer;
    });
  }, [setAgentStatus, updateAgent]);

  /**
   * 에이전트들이 배경에서 자율적으로 활동하고 있음을 시각화하기 위한 랜덤 활동 시뮬레이션
   */
  const triggerRandomActivity = useCallback(() => {
    const idleAgents = agents.filter(a => a.status === 'idle');
    if (idleAgents.length === 0) return;

    const randomAgent = idleAgents[Math.floor(Math.random() * idleAgents.length)];
    const randomTasks = [
      '항공 가격 변동 모니터링',
      '현지 날씨 정보 업데이트',
      '새로운 맛집 리스트 분석',
      '환율 변동성 체크',
      '예약 상태 무결성 검사'
    ];
    const randomTask = randomTasks[Math.floor(Math.random() * randomTasks.length)];

    runAgentTask(randomAgent.id, randomTask, 2000 + Math.random() * 3000);
  }, [agents, runAgentTask]);

  return {
    agents,
    setAgents,
    setAgentStatus,
    updateAgent,
    runAgentTask,
    triggerRandomActivity,
    statusSummary: {
      total: agents.length,
      working: agents.filter(a => a.status === 'working').length,
      idle: agents.filter(a => a.status === 'idle').length,
      error: agents.filter(a => a.status === 'error').length,
      success: agents.filter(a => a.status === 'success').length,
    }
  };
};
