import { useEffect, useState } from 'react';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { loadSavedTrips, saveTrip, type ScheduleData } from '@/components/ScheduleEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, CalendarDays, Wallet, CheckCircle2, Download, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function uid() { return Math.random().toString(36).slice(2, 10); }

export default function SharedTrip() {
  const [schedule, setSchedule] = useState<Partial<ScheduleData> | null>(null);
  const [error, setError] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    // Extract code from hash: #/shared/{code}
    const hash = window.location.hash;
    const match = hash.match(/#\/shared\/(.+)$/);
    if (!match) { setError(true); return; }

    const code = match[1];
    try {
      const json = decompressFromEncodedURIComponent(code);
      if (!json) { setError(true); return; }
      const parsed = JSON.parse(json);
      setSchedule(parsed);
    } catch {
      setError(true);
    }
  }, []);

  const handleImport = () => {
    if (!schedule) return;
    const now = new Date().toISOString();
    const full: ScheduleData = {
      id: uid() + uid(),
      title: schedule.title || '공유받은 일정',
      destination: schedule.destination || '',
      period: schedule.period || '',
      totalBudget: schedule.totalBudget || '',
      summary: schedule.summary || '',
      days: (schedule.days || []).map((d: any, i: number) => ({
        ...d,
        id: d.id || uid(),
        day: d.day || i + 1,
      })),
      createdAt: now,
      updatedAt: now,
      status: 'planning',
    };
    saveTrip(full);
    setImported(true);
  };

  const handlePayment = () => {
    // Navigate to payment with shared trip info
    window.location.hash = '#/payment';
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <h2 className="text-2xl font-bold">❌ 유효하지 않은 공유 링크</h2>
        <p className="text-muted-foreground">공유 링크가 손상되었거나 만료되었습니다.</p>
        <Button onClick={() => { window.location.hash = '#/trips'; }} className="rounded-2xl">
          내 여행으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🌍 공유받은 여행 일정</h1>
        <p className="text-muted-foreground">누군가가 여행 일정을 공유했습니다. 내 일정으로 가져올 수 있습니다.</p>
      </div>

      <Card className="rounded-2xl border shadow-lg">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold">{schedule.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs gap-1 rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-700 border-0">
              <MapPin className="w-3 h-3" /> {schedule.destination}
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1 rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border-0">
              <CalendarDays className="w-3 h-3" /> {schedule.period}
            </Badge>
            {schedule.totalBudget && (
              <Badge variant="secondary" className="text-xs gap-1 rounded-full px-2.5 py-0.5 bg-primary/10 text-primary border-0">
                <Wallet className="w-3 h-3" /> {schedule.totalBudget}
              </Badge>
            )}
          </div>
          {schedule.summary && (
            <p className="text-sm text-muted-foreground">{schedule.summary}</p>
          )}

          {/* Days overview */}
          {schedule.days && schedule.days.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">{schedule.days.length}일 일정</p>
              {schedule.days.map((day: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-primary/20 py-1">
                  <span className="font-medium text-foreground">Day {day.day}</span>
                  {day.theme && <span> · {day.theme}</span>}
                  {day.activities && <span> · {day.activities.length}개 활동</span>}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!imported ? (
              <Button className="flex-1 rounded-xl gap-2" onClick={handleImport}>
                <Download className="w-4 h-4" /> 내 일정으로 가져오기
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1 rounded-xl gap-2" disabled>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 가져오기 완료!
                </Button>
                <Button className="flex-1 rounded-xl gap-2" onClick={handlePayment}>
                  <CreditCard className="w-4 h-4" /> 개인 결제하기
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => { window.location.hash = '#/trips'; }}>
                  내 일정 보기
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
