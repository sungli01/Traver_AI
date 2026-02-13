import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Send, Loader2, CheckCircle2, ArrowLeft, MessageSquare, Map as MapIcon, Pencil, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useSecurityStore } from '@/stores/securityStore';
import { ItineraryCard, tryParseItinerary, type Itinerary } from '@/components/ItineraryCard';
import { ScheduleEditor, itineraryToSchedule, saveTrip, type ScheduleData } from '@/components/ScheduleEditor';
import { ScheduleMap } from '@/components/ScheduleMap';

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
  const [sessionGoals, setSessionGoals] = useState<string[]>([]);
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
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

    // Broadcast active agents
    window.dispatchEvent(new CustomEvent('agent-status', {
      detail: { agents: ['planner', 'concierge', 'research'], active: true }
    }));

    clearStepTimers();
    for (let i = 1; i < STEPS.length - 1; i++) {
      stepTimers.current.push(setTimeout(() => setCurrentStep(i), i * 2000));
    }

    try {
      const contextMsgs = [...messages.slice(-5), userMsg].map(m => ({ role: m.role, content: m.content }));

      // Determine message type and include existing itinerary context for partial modification
      let msgType: 'generate' | 'modify' | 'chat' = 'generate';
      let messageToSend = textToSend;

      if (latestItinerary) {
        // Already have itinerary → this is a modification or chat
        const looksLikeModify = /수정|변경|바꿔|추가|삭제|제거|대신|다른|빼고|넣어/.test(textToSend);
        if (looksLikeModify) {
          msgType = 'modify';
          // Include condensed existing itinerary as context
          const condensed = {
            title: latestItinerary.title,
            destination: latestItinerary.destination,
            days: latestItinerary.days.map(d => ({
              day: d.day,
              date: d.date,
              places: d.activities.map(a => a.title),
            })),
          };
          messageToSend = `[기존 일정 컨텍스트]\n${JSON.stringify(condensed)}\n\n[사용자 수정 요청]\n기존 일정을 유지하면서, 아래 요청에 해당하는 부분만 수정해줘:\n${textToSend}`;
        } else {
          msgType = 'chat';
        }
      }

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: messageToSend, context: contextMsgs, type: msgType, sessionId: sessionIdRef.current, goals: sessionGoals }),
      });

      let reply = '';
      let newGoals: string[] | null = null;
      if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.type === 'delta') reply += parsed.text;
              else if (parsed.type === 'done') { reply = parsed.reply || reply; newGoals = parsed.goals || null; }
              else if (parsed.type === 'error') reply = '⚠️ ' + parsed.error;
            } catch { /* ignore */ }
          }
        }
      } else {
        const data = await response.json();
        reply = data.reply || data.message || '응답을 받지 못했습니다.';
        newGoals = data.goals || null;
      }
      if (!reply) reply = '응답을 받지 못했습니다.';
      if (newGoals && Array.isArray(newGoals)) setSessionGoals(newGoals);

      clearStepTimers();
      setCurrentStep(STEPS.length - 1);

      const itinerary = tryParseItinerary(reply);
      if (itinerary) {
        setLatestItinerary(itinerary);
        // Auto-transition to schedule editor after itinerary is generated
        setTimeout(() => {
          const sd = itineraryToSchedule(itinerary);
          saveTrip(sd);
          setScheduleData(sd);
          setScheduleMode(true);
          onScheduleSaved?.();
        }, 1500);
      }

      // Extract change summary text before JSON (if any)
      let summaryText = '';
      if (itinerary) {
        const jsonStart = reply.indexOf('{');
        if (jsonStart > 0) {
          summaryText = reply.substring(0, jsonStart).replace(/```json\s*/g, '').trim();
        }
      }

      // Strip JSON from display text even if itinerary parsing fails
      const stripJson = (text: string) => {
        // Remove ```json...``` blocks
        let cleaned = text.replace(/```(?:json)?\s*[\s\S]*?(?:```|$)/g, '').trim();
        // Remove raw JSON objects (starts with { and has "days" or "type")
        const braceStart = cleaned.indexOf('{');
        if (braceStart !== -1 && (cleaned.includes('"days"') || cleaned.includes('"itinerary"') || cleaned.includes('"type"'))) {
          cleaned = cleaned.substring(0, braceStart).trim();
        }
        return cleaned;
      };

      const newMessages: ChatMessage[] = [];
      if (itinerary) {
        // Itinerary parsed successfully
        if (summaryText) {
          newMessages.push({ role: 'assistant', content: summaryText });
        }
        newMessages.push({ role: 'assistant', content: '', itinerary });
      } else {
        // Itinerary parsing failed — still strip JSON from display
        const displayText = stripJson(reply);
        // Try one more time to parse for preview
        const retryItinerary = tryParseItinerary(reply);
        if (retryItinerary) {
          setLatestItinerary(retryItinerary);
          if (displayText) newMessages.push({ role: 'assistant', content: displayText });
          newMessages.push({ role: 'assistant', content: '', itinerary: retryItinerary });
        } else {
          newMessages.push({ role: 'assistant', content: displayText || '일정을 생성했습니다. 우측 프리뷰를 확인하세요.' });
        }
      }
      setMessages(prev => [...prev, ...newMessages]);
    } catch {
      clearStepTimers();
      setCurrentStep(-1);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStep(-1), 2000);
      // Deactivate agents
      window.dispatchEvent(new CustomEvent('agent-status', {
        detail: { agents: ['planner', 'concierge', 'research'], active: false }
      }));
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

  // Place click map preview
  const [placePreview, setPlacePreview] = useState<{ lat: number; lng: number; title: string } | null>(null);
  const placeMapRef = useRef<HTMLDivElement>(null);

  const handlePlaceClick = useCallback((activity: { lat?: number; lng?: number; title: string }) => {
    if (activity.lat && activity.lng) {
      setPlacePreview({ lat: activity.lat, lng: activity.lng, title: activity.title });
      setMobileTab('preview');
    }
  }, []);

  // Render place preview map with Leaflet
  const placeMapInstanceRef = useRef<any>(null);
  useEffect(() => {
    if (!placePreview || !placeMapRef.current) return;
    // Cleanup previous map
    if (placeMapInstanceRef.current) {
      try { placeMapInstanceRef.current.remove(); } catch {}
      placeMapInstanceRef.current = null;
    }
    const initMap = (L: any) => {
      if (!placeMapRef.current) return;
      const map = L.map(placeMapRef.current, { zoomControl: true }).setView([placePreview.lat, placePreview.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
      L.marker([placePreview.lat, placePreview.lng]).addTo(map).bindPopup(`<strong>${placePreview.title}</strong>`).openPopup();
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 500);
      placeMapInstanceRef.current = map;
    };
    const L = (window as any).L;
    if (!L) {
      import('leaflet').then(leaflet => initMap(leaflet.default));
    } else {
      initMap(L);
    }
    return () => {
      if (placeMapInstanceRef.current) {
        try { placeMapInstanceRef.current.remove(); } catch {}
        placeMapInstanceRef.current = null;
      }
    };
  }, [placePreview]);

  const [editChatOpen, setEditChatOpen] = useState(false);
  const [editChatMessages, setEditChatMessages] = useState<ChatMessage[]>([]);
  const [editChatInput, setEditChatInput] = useState('');
  const [editChatLoading, setEditChatLoading] = useState(false);

  const handleAIEditRequest = (sd: ScheduleData) => {
    // Stay in schedule mode — open inline edit chat instead of going back to full chat
    const updated = { ...sd, status: 'planning' as const, updatedAt: new Date().toISOString() };
    saveTrip(updated);
    setScheduleData(updated);
    setLiveScheduleData(updated);
    onScheduleSaved?.();
    setEditChatOpen(true);
    setEditChatMessages([{
      role: 'assistant',
      content: `현재 일정을 확인했습니다. 어떤 부분을 수정할까요?\n(예: "Day3 점심을 현지 맛집으로 변경해줘", "Day5에 골프장 추가해줘")`
    }]);
  };

  const sendEditChatMessage = async (text: string) => {
    if (!text.trim() || editChatLoading || !scheduleData) return;
    const trimmedText = text.trim();
    const userMsg: ChatMessage = { role: 'user', content: trimmedText };
    setEditChatMessages(prev => [...prev, userMsg]);
    setEditChatInput('');
    setEditChatLoading(true);

    // Detect if this is a modification request or just a chat question
    const isModifyRequest = /수정|변경|바꿔|추가|삭제|제거|대신|다른|빼고|넣어|옮겨|교체/.test(trimmedText);

    // Build compact context from current schedule
    const compactSchedule = scheduleData.days.map(d =>
      `Day${d.day}(${d.date} ${d.theme}): ${d.activities.map(a => `${a.title}(${a.category},${a.cost})`).join(' → ')}${d.accommodation ? ` [숙소:${d.accommodation.name}]` : ''}`
    ).join('\n');

    let contextMsg: string;
    let msgType: string;

    if (isModifyRequest) {
      msgType = 'modify';
      contextMsg = `[기존 일정 컨텍스트 - 수정 요청된 부분만 변경하세요]\n${scheduleData.title} | ${scheduleData.destination}\n${compactSchedule}\n\n사용자 수정 요청: ${trimmedText}`;
    } else {
      msgType = 'chat';
      contextMsg = `[참고 일정: ${scheduleData.title} | ${scheduleData.destination}]\n${compactSchedule}\n\n질문에만 간결하게 답변하세요. JSON을 생성하지 마세요.\n\n사용자 질문: ${trimmedText}`;
    }

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: contextMsg, type: msgType }),
      });

      let reply = '';
      if (res.headers.get('content-type')?.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.type === 'delta') reply += parsed.text;
              else if (parsed.type === 'done') reply = parsed.reply || reply;
              else if (parsed.type === 'error') reply = '⚠️ ' + parsed.error;
            } catch { /* ignore */ }
          }
        }
      } else {
        const data = await res.json();
        reply = data.response || data.message || '응답을 받지 못했습니다.';
      }
      if (!reply) reply = '응답을 받지 못했습니다.';
      
      // Check if response contains itinerary JSON
      const itinerary = tryParseItinerary(reply);
      if (itinerary) {
        // Update schedule with new itinerary
        const newSchedule = itineraryToSchedule(itinerary);
        newSchedule.id = scheduleData.id; // Keep same ID
        newSchedule.status = 'planning';
        saveTrip(newSchedule);
        setScheduleData(newSchedule);
        setLiveScheduleData(newSchedule);
        setLatestItinerary(itinerary);
        onScheduleSaved?.();
        
        // Extract text before JSON as change summary
        const jsonStart = reply.indexOf('{');
        let summaryText = jsonStart > 0 ? reply.slice(0, jsonStart).replace(/```(?:json)?\s*/g, '').trim() : '';
        setEditChatMessages(prev => [...prev, { role: 'assistant', content: summaryText || '✅ 일정이 수정되었습니다. 좌측에서 변경 내용을 확인하세요.' }]);
      } else {
        // Strip any JSON from display even if parsing failed
        let displayReply = reply.replace(/```(?:json)?\s*[\s\S]*?(?:```|$)/g, '').trim();
        const braceIdx = displayReply.indexOf('{');
        if (braceIdx !== -1 && (displayReply.includes('"days"') || displayReply.includes('"type"'))) {
          displayReply = displayReply.substring(0, braceIdx).trim();
        }
        setEditChatMessages(prev => [...prev, { role: 'assistant', content: displayReply || reply.substring(0, 200) }]);
      }
    } catch (e) {
      setEditChatMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setEditChatLoading(false);
    }
  };

  // Active day tracking for map
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [liveScheduleData, setLiveScheduleData] = useState<ScheduleData | null>(scheduleData);
  const [scheduleMobileTab, setScheduleMobileTab] = useState<'editor' | 'map'>('editor');
  const [showMap, setShowMap] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const handleActivitySelect = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    if (!showMap) setShowMap(true);
    setScheduleMobileTab('map');
  }, [showMap]);

  // Sync liveScheduleData when scheduleData changes externally
  useEffect(() => {
    if (scheduleData) setLiveScheduleData(scheduleData);
  }, [scheduleData]);

  // Schedule editor mode — split layout
  if (scheduleMode && scheduleData) {
    const mapData = liveScheduleData || scheduleData;
    return (
      <div className="flex flex-col h-full">
        {/* Top bar with map toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <button onClick={() => setScheduleMode(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> 여행 목록으로
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">📋 스케줄 노트 편집 중</span>
            <button
              onClick={() => setShowMap(v => !v)}
              className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                showMap
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              📍 지도 {showMap ? '닫기' : '보기'}
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex lg:hidden border-b border-border shrink-0">
          <button
            onClick={() => setScheduleMobileTab('editor')}
            className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${scheduleMobileTab === 'editor' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            <Pencil className="w-3.5 h-3.5" /> 편집
          </button>
          <button
            onClick={() => setScheduleMobileTab('map')}
            className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${scheduleMobileTab === 'map' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            <MapIcon className="w-3.5 h-3.5" /> 지도
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex">
          {/* Desktop layout */}
          <div className="hidden lg:flex flex-1">
            <div className="min-w-[320px] border-r border-border overflow-y-auto p-4 transition-all duration-300" style={{ width: showMap ? '45%' : '100%' }}>
              <ScheduleEditor
                schedule={scheduleData}
                onBack={() => setScheduleMode(false)}
                onRequestAIEdit={handleAIEditRequest}
                onActiveDayChange={setActiveDay}
                onDataChange={setLiveScheduleData}
                onActivitySelect={handleActivitySelect}
              />
            </div>
            {(showMap || editChatOpen) && (
              <div className="w-[55%] animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Right panel tabs: Map / AI Chat */}
                <div className="flex border-b border-border shrink-0 bg-background">
                  <button
                    onClick={() => { setShowMap(true); setEditChatOpen(false); }}
                    className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${showMap && !editChatOpen ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  >📍 지도</button>
                  <button
                    onClick={() => { setEditChatOpen(true); setShowMap(false); }}
                    className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${editChatOpen ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  >💬 AI 수정</button>
                </div>
                {editChatOpen ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {editChatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}>{msg.content}</div>
                        </div>
                      ))}
                      {editChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl px-3 py-2 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> 수정 중...
                          </div>
                        </div>
                      )}
                    </div>
                    <form onSubmit={e => { e.preventDefault(); sendEditChatMessage(editChatInput); }} className="p-3 border-t border-border flex gap-2">
                      <input
                        value={editChatInput}
                        onChange={e => setEditChatInput(e.target.value)}
                        placeholder="수정할 내용을 입력..."
                        className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        disabled={editChatLoading}
                      />
                      <Button type="submit" size="sm" className="rounded-xl" disabled={editChatLoading || !editChatInput.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1">
                    <ScheduleMap scheduleData={mapData} activeDay={activeDay ?? undefined} selectedActivityId={selectedActivityId} />
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Mobile: tab switch */}
          <div className="lg:hidden flex-1">
            {scheduleMobileTab === 'editor' ? (
              <div className="h-full overflow-y-auto p-4">
                <ScheduleEditor
                  schedule={scheduleData}
                  onBack={() => setScheduleMode(false)}
                  onRequestAIEdit={handleAIEditRequest}
                  onActiveDayChange={setActiveDay}
                  onDataChange={setLiveScheduleData}
                  onActivitySelect={handleActivitySelect}
                />
              </div>
            ) : (
              <ScheduleMap scheduleData={mapData} activeDay={activeDay ?? undefined} className="h-full" selectedActivityId={selectedActivityId} />
            )}
          </div>
        </div>
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
                <ItineraryCard data={msg.itinerary} onPlaceClick={handlePlaceClick} />
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
    <div className="flex flex-col h-full overflow-y-auto p-2 lg:p-3">
      {latestItinerary ? (
        <div className="space-y-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">✅ 일정이 생성되었습니다! 잠시 후 자동으로 이동합니다.</p>
            <Button
              className="w-full rounded-2xl h-12 gap-2 text-base font-semibold shadow-lg"
              onClick={handleMoveToSchedule}
            >
              📋 컨시어지(스케줄 편집)로 이동
            </Button>
          </div>
          <ItineraryCard data={latestItinerary} onPlaceClick={handlePlaceClick} />
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

  // Fullscreen place map mode
  if (placePreview) {
    return (
      <div className="relative h-full w-full">
        {/* Map fills entire area */}
        <div ref={placeMapRef} style={{ height: '100%', width: '100%' }} />
        {/* Place name label — bottom center */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-xl rounded-2xl px-5 py-2.5 flex items-center gap-2 border border-gray-200 dark:border-gray-700" style={{ zIndex: 1000 }}>
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-bold text-foreground">{placePreview.title}</span>
        </div>
        {/* Close button — bottom center, below label */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2" style={{ zIndex: 1000 }}>
          <Button
            variant="default"
            size="lg"
            className="rounded-full shadow-2xl gap-2 h-12 px-8 text-sm font-bold"
            onClick={() => { setPlacePreview(null); setMobileTab('chat'); }}
          >
            <X className="w-4 h-4" /> 지도 닫기
          </Button>
        </div>
      </div>
    );
  }

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
          <div className="w-[38%] min-w-[320px] border-r border-border">{chatPanel}</div>
          <div className="w-[62%]">{previewPanel}</div>
        </div>
        {/* Mobile: tab switch */}
        <div className="lg:hidden flex-1">
          {mobileTab === 'chat' ? chatPanel : previewPanel}
        </div>
      </div>
    </div>
  );
}
