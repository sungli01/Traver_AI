import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSecurityStore } from '@/stores/securityStore';
import { ItineraryCard, tryParseItinerary, type Itinerary } from '@/components/ItineraryCard';
import { ScheduleEditor, itineraryToSchedule, saveTrip, type ScheduleData } from '@/components/ScheduleEditor';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  itinerary?: Itinerary;
}

const STEPS = [
  { icon: '📋', label: '일정 계획 확인 중...' },
  { icon: '✈️', label: '항공편 확인 중...' },
  { icon: '🏨', label: '호텔 확인 중...' },
  { icon: '🚗', label: '이동수단 확인 중...' },
  { icon: '💰', label: '예산 분석 중...' },
  { icon: '✅', label: '완료!' },
];

const apiUrl = import.meta.env.VITE_API_URL || 'https://traverai-production.up.railway.app';

interface FullScreenChatProps {
  onBack: () => void;
  initialMessage?: string;
  onScheduleSaved?: () => void;
}

export function FullScreenChat({ onBack, initialMessage, onScheduleSaved }: FullScreenChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  const [latestItinerary, setLatestItinerary] = useState<Itinerary | null>(null);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const initialSent = useRef(false);

  const { maskingEnabled, maskPII, addLog } = useSecurityStore();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, currentStep, scrollToBottom]);

  const clearStepTimers = () => {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  };

  const sendMessage = useCallback(async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    let textToSend = trimmed;
    if (maskingEnabled) {
      const { masked, detections } = maskPII(trimmed);
      detections.forEach((d) => {
        addLog({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          originalType: d.type as 'phone' | 'email' | 'card' | 'passport',
          maskedValue: d.masked,
          context: trimmed.slice(0, 30),
          agentId: 'concierge',
        });
      });
      textToSend = masked;
    }

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setCurrentStep(0);

    clearStepTimers();
    for (let i = 1; i < STEPS.length - 1; i++) {
      stepTimers.current.push(setTimeout(() => setCurrentStep(i), i * 2000));
    }

    try {
      const contextMsgs = [...messages.slice(-5), userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, context: contextMsgs }),
      });
      const data = await response.json();
      const reply = data.reply || data.message || '응답을 받지 못했습니다.';

      clearStepTimers();
      setCurrentStep(STEPS.length - 1);

      const itinerary = tryParseItinerary(reply);
      if (itinerary) setLatestItinerary(itinerary);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: itinerary ? '' : reply,
        itinerary: itinerary || undefined,
      }]);
    } catch {
      clearStepTimers();
      setCurrentStep(-1);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStep(-1), 2000);
    }
  }, [loading, maskingEnabled, maskPII, addLog, messages]);

  // Send initial message once
  useEffect(() => {
    if (initialMessage && !initialSent.current) {
      initialSent.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, sendMessage]);

  // Listen for external travel-chat-send events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail) sendMessage(detail);
    };
    window.addEventListener('travel-chat-send', handler);
    return () => window.removeEventListener('travel-chat-send', handler);
  }, [sendMessage]);

  const handleMoveToSchedule = () => {
    if (!latestItinerary) return;
    const sd = itineraryToSchedule(latestItinerary);
    saveTrip(sd);
    setScheduleData(sd);
    setScheduleMode(true);
    onScheduleSaved?.();
  };

  const handleAIEditRequest = (sd: ScheduleData) => {
    setScheduleMode(false);
    const summary = sd.days.map(d =>
      `Day${d.day}(${d.date}): ${d.activities.map(a => a.title).join(', ')}`
    ).join('\n');
    const msg = `이 일정을 수정해줘:\n${summary}\n\n수정 요청: `;
    setInput(msg);
  };

  // Schedule editor mode
  if (scheduleMode && scheduleData) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <ScheduleEditor
          schedule={scheduleData}
          onBack={() => setScheduleMode(false)}
          onRequestAIEdit={handleAIEditRequest}
        />
      </div>
    );
  }

  const chatPanel = (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            <p className="text-3xl mb-3">✈️</p>
            <p className="text-lg font-semibold">여행 계획을 도와드릴게요!</p>
            <p className="text-xs mt-1 opacity-70">&quot;도쿄 3박4일 여행 계획해줘&quot;</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.itinerary ? (
              <div className="w-full max-w-full lg:hidden">
                <ItineraryCard data={msg.itinerary} />
              </div>
            ) : msg.itinerary ? null : (
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {/* Progress steps */}
        {currentStep >= 0 && (
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            {STEPS.map((step, i) => {
              if (i > currentStep) return null;
              const done = i < currentStep;
              const active = i === currentStep && currentStep < STEPS.length - 1;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    : active ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    : <span className="text-sm shrink-0">{step.icon}</span>}
                  <span className={done ? 'text-muted-foreground line-through' : active ? 'text-primary font-medium' : 'font-medium'}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="여행 계획을 입력하세요..."
            disabled={loading}
            className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-xl h-10 w-10 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        {maskingEnabled && <p className="text-[10px] text-emerald-500 mt-1 px-1">🔒 PII 마스킹 활성화됨</p>}
      </div>
    </div>
  );

  const previewPanel = (
    <div className="flex flex-col h-full overflow-y-auto p-4">
      {latestItinerary ? (
        <div className="space-y-4">
          <ItineraryCard data={latestItinerary} />
          <Button
            className="w-full rounded-2xl h-12 gap-2 text-base font-semibold shadow-lg"
            onClick={handleMoveToSchedule}
          >
            📋 스케줄 노트로 옮기기
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center py-12">
          <div className="p-6 rounded-3xl bg-muted/10 border border-dashed border-muted-foreground/20 mb-4">
            <MessageSquare className="w-12 h-12 opacity-20" />
          </div>
          <p className="text-sm font-medium">AI에게 여행 계획을 요청하면</p>
          <p className="text-sm">여기에 일정 프리뷰가 표시됩니다</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> 여행 목록으로
        </button>
        <span className="text-sm font-semibold text-muted-foreground">✈️ 새 여행 계획 중...</span>
      </div>

      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b border-border shrink-0">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors ${mobileTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
        >
          💬 채팅
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors ${mobileTab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
        >
          📅 일정 프리뷰 {latestItinerary ? '●' : ''}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex">
        {/* Desktop: side by side */}
        <div className="hidden lg:flex flex-1">
          <div className="w-1/2 border-r border-border">{chatPanel}</div>
          <div className="w-1/2">{previewPanel}</div>
        </div>
        {/* Mobile: tab switch */}
        <div className="lg:hidden flex-1">
          {mobileTab === 'chat' ? chatPanel : previewPanel}
        </div>
      </div>
    </div>
  );
}
