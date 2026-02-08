import React, { useState } from 'react';
import { MessageSquare, Paperclip, Link as LinkIcon, Send } from 'lucide-react';

export default function TravelAgentWindow() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 여행 계획서나 관련 링크를 이곳에 던져주세요. 제가 바로 일정표로 만들어 드릴게요!' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async (content) => {
    setMessages(prev => [...prev, { role: 'user', content }]);
    setInput('');

    // 시뮬레이션: 1.5초 후 에이전트의 분석 결과가 도착하는 것을 재현
    setTimeout(() => {
      const samplePlan = {
        id: "tokyo-001",
        title: "도쿄 비즈니스 & 여행",
        destination: "Tokyo, Japan",
        itinerary: [
          {
            day: 1,
            activities: [
              { time: "11:30", description: "나리타 공항 도착 (LH710)", location: "Narita Airport", cost: 35000 },
              { time: "14:00", description: "호텔 체크인 및 짐 보관", location: "Shibuya Stream Excel Hotel", cost: 0 },
              { time: "18:00", description: "시부야 스카이 전망대 관람", location: "Shibuya Sky", cost: 22000 }
            ]
          },
          {
            day: 2,
            activities: [
              { time: "10:00", description: "팀랩 플래닛 전시회", location: "Toyosu teamLab", cost: 38000 },
              { time: "13:00", description: "츠키지 시장 초밥 점심", location: "Tsukiji Market", cost: 45000 }
            ]
          }
        ]
      };
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '분석이 완료되었습니다! 도쿄 2일차까지의 일정을 대시보드에 구성해 드렸습니다. 추가하고 싶은 링크가 더 있으신가요?' 
      }]);
      
      if (onPlanGenerated) onPlanGenerated(samplePlan);
    }, 1500);
  };

  return (
    <div className="fixed bottom-4 left-4 w-80 h-96 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all hover:shadow-blue-100">
      <div className="p-3 bg-blue-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-semibold text-sm">Travel Agent (Opus)</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-50 ml-6 text-blue-900' : 'bg-gray-100 mr-6'}`}>
            {m.content}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-100 space-y-2">
        <div className="flex gap-2 justify-center pb-1">
          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition-colors" title="파일 첨부">
            <Paperclip size={16} />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition-colors" title="링크 추가">
            <LinkIcon size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="여기에 던져주세요..."
            className="flex-1 bg-gray-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button onClick={() => handleSend(input)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
