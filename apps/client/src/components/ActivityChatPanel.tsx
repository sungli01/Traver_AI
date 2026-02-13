import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ActivityChatPanelProps {
  activityTitle: string;
  activityCategory: string;
  destination: string;
  onUpdateActivity?: (updates: Record<string, string>) => void;
  onClose: () => void;
}

const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';

export function ActivityChatPanel({
  activityTitle,
  activityCategory,
  destination,
  onUpdateActivity,
  onClose,
}: ActivityChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const systemContext = `사용자가 ${destination} 여행 중 "${activityTitle}" (${activityCategory})에 대해 질문합니다. 간결하게 답변하세요. 만약 장소 변경/수정을 요청하면 JSON으로 {\"update\":{\"title\":\"...\",\"cost\":\"...\",\"description\":\"...\"}} 형태를 응답 끝에 포함하세요.`;
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[컨텍스트: ${systemContext}]\n\n${text}`,
          type: 'chat',
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.message || '응답을 가져올 수 없습니다.';

      // Try to extract update JSON
      const jsonMatch = reply.match(/\{"update"\s*:\s*\{[^}]+\}\}/);
      if (jsonMatch && onUpdateActivity) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.update) onUpdateActivity(parsed.update);
        } catch { /* ignore parse errors */ }
      }

      // Clean display text (remove JSON block)
      const displayReply = reply.replace(/\{"update"\s*:\s*\{[^}]+\}\}/, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: displayReply || '수정 사항을 적용했습니다.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '서버 연결에 실패했습니다.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-100/60 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
        <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          💬 AI 문의 — {activityTitle}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-[200px] overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-6">
            "{activityTitle}"에 대해 질문해보세요<br />
            <span className="text-[10px]">예: 영업시간, 근처 맛집, 가격, 대안 장소 등</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5 text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" /> 응답 중...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-gray-900/50">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="질문을 입력하세요..."
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-gray-400"
          disabled={loading}
        />
        <Button size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={sendMessage} disabled={loading || !input.trim()}>
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
