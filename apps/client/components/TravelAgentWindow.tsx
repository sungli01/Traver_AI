'use client';

import React, { useState } from 'react';
import { MessageSquare, Paperclip, Link as LinkIcon, Send } from 'lucide-react';

interface TravelAgentWindowProps {
  onPlanGenerated: (plan: any) => void;
}

export default function TravelAgentWindow({ onPlanGenerated }: TravelAgentWindowProps) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 여행 계획서나 관련 링크를 이곳에 던져주세요. 제가 바로 일정표로 만들어 드릴게요!' }
  ]);
  const [input, setInput] = useState('');

    const handleSend = async (content) => {
    if (!content.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content }]);
    setInput('');

    // Backend API 호출
    try {
      // 실서버 주소 강제 고정
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://traverai-production.up.railway.app';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: messages.slice(-5) 
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || '응답을 받지 못했습니다.';

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply
      }]);

      // JSON 파싱 시도 (일정표 데이터 추출)
      try {
        const jsonMatch = reply.match(/\{[\s\S]*"itinerary"[\s\S]*\}/);
        if (jsonMatch && onPlanGenerated) {
          const plan = JSON.parse(jsonMatch[0]);
          onPlanGenerated(plan);
        }
      } catch (e) {
        console.log('No structured plan found in response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
      }]);
    }
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
