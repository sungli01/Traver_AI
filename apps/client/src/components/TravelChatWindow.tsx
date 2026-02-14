import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, X, Minimize2, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSecurityStore } from '@/stores/securityStore';
import { useAuthStore } from '@/stores/authStore';
import { ItineraryCard, tryParseItinerary, type Itinerary } from '@/components/ItineraryCard';

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

export function TravelChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { maskingEnabled, maskPII, addLog } = useSecurityStore();
  const { user, token } = useAuthStore();
  const userPlan = user?.plan || 'free';

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStep, scrollToBottom]);

  // 외부에서 채팅 메시지 수신 (여행 계획 폼 → 채팅)
  const sendMessageRef = useRef<((msg: string) => void) | null>(null);
  
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail) {
        setIsOpen(true);
        // 약간의 딜레이 후 전송 (채팅 윈도우 열리는 시간)
        setTimeout(() => {
          setInput(detail);
          sendMessageRef.current?.(detail);
        }, 300);
      }
    };
    window.addEventListener('travel-chat-send', handler);
    return () => window.removeEventListener('travel-chat-send', handler);
  }, []);

  const clearStepTimers = () => {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  };

  const sendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    let textToSend = trimmed;

    // PII masking
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
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setCurrentStep(0);

    // Start step simulation
    clearStepTimers();
    for (let i = 1; i < STEPS.length - 1; i++) {
      stepTimers.current.push(
        setTimeout(() => setCurrentStep(i), i * 2000)
      );
    }

    try {
      const contextMsgs = [...messages.slice(-5), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ message: textToSend, context: contextMsgs }),
      });

      let reply = '';
      if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streaming = true;
        while (streaming) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') { streaming = false; break; }
            try {
              const parsed = JSON.parse(payload);
              if (parsed.type === 'delta') reply += parsed.text;
              else if (parsed.type === 'done') { if (parsed.reply) reply = parsed.reply; }
              else if (parsed.type === 'error') reply = '⚠️ ' + parsed.error;
            } catch { /* large done event parse failure is safe — delta already accumulated */ }
          }
        }
      } else {
        const data = await response.json();
        reply = data.reply || data.message || '응답을 받지 못했습니다.';
      }
      if (!reply) reply = '응답을 받지 못했습니다.';

      clearStepTimers();
      setCurrentStep(STEPS.length - 1);

      // 구조화된 일정 JSON 파싱 시도
      const itinerary = tryParseItinerary(reply);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: itinerary ? '' : reply,
        itinerary: itinerary || undefined 
      }]);
    } catch {
      clearStepTimers();
      setCurrentStep(-1);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStep(-1), 2000);
    }
  };

  // ref 등록
  sendMessageRef.current = sendMessage;

  const handleSend = () => {
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 right-0 left-0 sm:left-auto sm:bottom-4 sm:right-4 z-50 w-full sm:w-[420px] h-[calc(100dvh-4rem)] sm:h-[600px] flex flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">여행 AI 컨시어지</p>
                  <p className="text-[10px] text-muted-foreground">항상 도와드릴 준비가 되어 있어요</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <p className="text-2xl mb-2">✈️</p>
                  <p>여행 계획을 도와드릴게요!</p>
                  <p className="text-xs mt-1">&quot;도쿄 3박4일 여행 계획해줘&quot;</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.itinerary ? (
                    <div className="w-full">
                      <ItineraryCard data={msg.itinerary} />
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
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
                        {done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : active ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                        ) : (
                          <span className="text-sm shrink-0">{step.icon}</span>
                        )}
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="여행 계획을 입력하세요..."
                  disabled={loading}
                  className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-xl h-9 w-9 shrink-0">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              {maskingEnabled && (
                <p className="text-[10px] text-emerald-500 mt-1 px-1">🔒 PII 마스킹 활성화됨</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
