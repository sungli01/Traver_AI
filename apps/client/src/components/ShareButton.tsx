import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, MessageCircle, Twitter, Facebook, Link2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compressToEncodedURIComponent } from 'lz-string';
import type { ScheduleData } from '@/components/ScheduleEditor';

const BASE_URL = 'https://www.travelagent.co.kr';

interface ShareButtonProps {
  schedule: ScheduleData;
  /** Compact mode for trip cards */
  compact?: boolean;
}

function buildShareText(s: ScheduleData) {
  const title = `🌍 ${s.title} - TravelAgent AI로 만든 여행 계획`;
  const desc = `${s.destination} ${s.period}, ${s.days.length}일 일정`;
  return { title, desc };
}

function buildShareUrl(s: ScheduleData) {
  return `${BASE_URL}/#/trips?share=${s.id}`;
}

function buildTeamShareUrl(s: ScheduleData) {
  const payload = JSON.stringify({
    title: s.title,
    destination: s.destination,
    period: s.period,
    totalBudget: s.totalBudget,
    summary: s.summary,
    days: s.days,
  });
  const compressed = compressToEncodedURIComponent(payload);
  return `${BASE_URL}/#/shared/${compressed}`;
}

const snsOptions = [
  {
    key: 'kakao',
    label: '카카오톡',
    icon: MessageCircle,
    color: 'text-yellow-600',
    bg: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
    getUrl: (text: string, url: string) =>
      `https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(url)}`,
  },
  {
    key: 'line',
    label: 'LINE',
    icon: MessageCircle,
    color: 'text-green-600',
    bg: 'hover:bg-green-50 dark:hover:bg-green-900/20',
    getUrl: (_text: string, url: string) =>
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    icon: Twitter,
    color: 'text-sky-500',
    bg: 'hover:bg-sky-50 dark:hover:bg-sky-900/20',
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    getUrl: (_text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
] as const;

export function ShareButton({ schedule, compact }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const { title, desc } = buildShareText(schedule);
  const shareUrl = buildShareUrl(schedule);
  const fullText = `${title}\n${desc}`;

  const isMobile = () =>
    'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768;

  const handleShare = async () => {
    // Only use Web Share API on mobile touch devices (Edge desktop has broken navigator.share)
    if (isMobile() && navigator.share) {
      try {
        await navigator.share({ title, text: desc, url: shareUrl });
        return;
      } catch {
        // User cancelled or not supported — fall through to dropdown
      }
    }
    setOpen(v => !v);
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  };

  const teamShareUrl = buildTeamShareUrl(schedule);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size={compact ? 'icon' : 'sm'}
        className={compact ? 'rounded-full w-8 h-8' : 'rounded-xl gap-1.5 text-xs'}
        onClick={handleShare}
        title="공유하기"
      >
        <Share2 className={compact ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'} />
        {!compact && '공유'}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SNS 공유</p>
          </div>

          <div className="py-1">
            {snsOptions.map(opt => (
              <button
                key={opt.key}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${opt.bg}`}
                onClick={() => {
                  window.open(opt.getUrl(fullText, shareUrl), '_blank', 'width=600,height=400');
                  setOpen(false);
                }}
              >
                <opt.icon className={`w-4 h-4 ${opt.color}`} />
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}

            {/* Copy link */}
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { copyToClipboard(shareUrl, 'link'); }}
            >
              {copied === 'link' ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4 text-gray-500" />}
              <span className="font-medium">{copied === 'link' ? '복사 완료!' : '링크 복사'}</span>
            </button>
          </div>

          {/* Team share section */}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">🤝 단체 공유 (회람)</p>
              <p className="text-[11px] text-muted-foreground mb-2">링크를 받은 사람이 일정을 자신의 계정에 복사하고 개별 결제할 수 있습니다.</p>
              <button
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
                onClick={() => { copyToClipboard(teamShareUrl, 'team'); }}
              >
                {copied === 'team' ? <Check className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                {copied === 'team' ? '공유 링크 복사 완료!' : '단체 공유 링크 복사'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
