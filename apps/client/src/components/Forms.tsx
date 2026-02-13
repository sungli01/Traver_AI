import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar as CalendarIcon, CreditCard, Bot, MapPin, Plane, Sparkles, Wallet, ShieldCheck } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AGENT_TYPES } from '@/lib/index';

// --- Schemas ---

const tripSchema = z.object({
  title: z.string().min(2, '여행 제목은 2글자 이상이어야 합니다.'),
  destination: z.string().min(2, '목적지를 입력해주세요.'),
  startDate: z.date({
    required_error: '출발일을 선택해주세요.',
  }),
  endDate: z.date({
    required_error: '도착일을 선택해주세요.',
  }),
  budget: z.coerce.number().min(1000, '최소 예산은 1,000원 이상입니다.'),
  travelStyle: z.enum(['luxury', 'budget', 'adventure', 'business']),
  additionalInfo: z.string().optional(),
});

// 도시 목록 (국가별 분류)
const POPULAR_CITIES = [
  // 일본
  '도쿄', '오사카', '교토', '후쿠오카', '삿포로', '나고야', '요코하마', '고베',
  '히로시마', '나라', '가고시마', '오키나와', '나가사키', '센다이', '가나자와',
  '하코다테', '벳푸', '유후인', '다카마쓰', '시즈오카', '가마쿠라', '닛코',
  // 동남아
  '방콕', '치앙마이', '푸켓', '파타야', '끄라비',
  '싱가포르', '하노이', '다낭', '호치민', '호이안', '사파', '나트랑', '달랏',
  '발리', '자카르타', '족자카르타', '세부', '보라카이', '마닐라', '팔라완',
  '쿠알라룸푸르', '코타키나발루', '페낭', '랑카위',
  '양곤', '바간', '프놈펜', '시엠립', '비엔티안', '루앙프라방',
  // 중국/대만/홍콩
  '상하이', '베이징', '광저우', '선전', '시안', '청두', '하얼빈', '구이린',
  '타이베이', '가오슝', '타이중', '지우펀', '홍콩', '마카오',
  // 유럽
  '파리', '런던', '로마', '바르셀로나', '프라하', '비엔나', '부다페스트',
  '암스테르담', '베를린', '뮌헨', '취리히', '인터라켄', '루체른',
  '피렌체', '베네치아', '밀라노', '나폴리', '아말피',
  '마드리드', '세비야', '그라나다', '리스본', '포르투',
  '아테네', '산토리니', '두브로브니크', '헬싱키', '스톡홀름', '코펜하겐', '오슬로',
  '에든버러', '아이슬란드', '잘츠부르크', '브뤼셀', '니스', '모나코',
  // 미주
  '뉴욕', '하와이', 'LA', '샌프란시스코', '시애틀', '라스베이거스', '시카고',
  '보스턴', '워싱턴DC', '마이애미', '올랜도', '샌디에이고',
  '밴쿠버', '토론토', '몬트리올', '캘거리',
  '칸쿤', '멕시코시티', '하바나', '리마', '부에노스아이레스', '상파울루',
  // 오세아니아
  '시드니', '멜버른', '골드코스트', '케언즈', '퍼스',
  '오클랜드', '퀸스타운', '크라이스트처치', '괌', '사이판', '팔라우', '피지',
  // 중동/아프리카
  '두바이', '아부다비', '이스탄불', '카이로', '카사블랑카', '케이프타운', '나이로비',
  // 리조트/섬
  '몰디브', '보라보라', '모리셔스', '하롱베이', '코사무이', '코팡안', '랑카위',
  // 한국
  '제주', '부산', '강릉', '여수', '경주', '속초', '전주', '통영', '거제', '담양',
];

function formatNumberWithCommas(value: string): string {
  const num = value.replace(/[^0-9]/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseFormattedNumber(value: string): number {
  return parseInt(value.replace(/,/g, ''), 10) || 0;
}

const agentConfigSchema = z.object({
  plannerEnabled: z.boolean().default(true),
  bookingEnabled: z.boolean().default(true),
  conciergeEnabled: z.boolean().default(false),
  autoBooking: z.boolean().default(false),
  instructions: z.string().optional(),
});

const cardSchema = z.object({
  provider: z.enum(['visa', 'mastercard', 'amex']),
  nickname: z.string().min(2, '카드 별칭을 입력해주세요.'),
  cardNumber: z.string().regex(/^\d{16}$/, '카드 번호 16자리를 입력해주세요.'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'MM/YY 형식으로 입력해주세요.'),
  isDefault: z.boolean().default(false),
});

// --- Components ---

export function NewTripForm({ onSubmit }: { onSubmit: (data: z.infer<typeof tripSchema>) => void }) {
  const form = useForm<z.infer<typeof tripSchema>>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: '',
      destination: '',
      budget: 0,
      travelStyle: 'adventure',
      additionalInfo: '',
    },
  });

  // 도시 자동추천
  const [cityQuery, setCityQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 예산 포맷
  const [budgetDisplay, setBudgetDisplay] = useState('');

  // 날짜 range
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (cityQuery.length > 0) {
      const filtered = POPULAR_CITIES.filter(city =>
        city.toLowerCase().includes(cityQuery.toLowerCase())
      );
      setFilteredCities(filtered.slice(0, 8));
      setShowSuggestions(filtered.length > 0);
    } else {
      // 입력 없으면 인기 도시 보여주기
      setFilteredCities(POPULAR_CITIES.slice(0, 8));
    }
  }, [cityQuery]);

  // 외부 클릭 시 자동추천 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) form.setValue('startDate', range.from);
    if (range?.to) {
      form.setValue('endDate', range.to);
      // 출발일+도착일 모두 선택되면 캘린더 자동 닫기
      setTimeout(() => setCalendarOpen(false), 300);
    }
  }, [form]);

  const handleBudgetChange = useCallback((rawValue: string) => {
    const display = formatNumberWithCommas(rawValue);
    setBudgetDisplay(display);
    form.setValue('budget', parseFormattedNumber(rawValue));
  }, [form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 여행 제목 */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>여행 제목</FormLabel>
              <FormControl>
                <Input placeholder="예: 2026 파리 낭만 여행" {...field} className="bg-background/50 h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 목적지 - 자동추천 */}
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>목적지</FormLabel>
              <div className="relative" ref={suggestionsRef}>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="도시 또는 국가 검색 (목록에 없어도 직접 입력 가능)"
                      value={cityQuery || field.value}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        field.onChange(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && cityQuery.trim()) {
                          field.onChange(cityQuery.trim());
                          setShowSuggestions(false);
                        }
                      }}
                      onBlur={() => {
                        // Allow free text: if user typed something not in list, accept it
                        if (cityQuery.trim() && !field.value) {
                          field.onChange(cityQuery.trim());
                        }
                      }}
                      className="pl-10 bg-background/50 h-11"
                      autoComplete="off"
                    />
                  </div>
                </FormControl>
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-xl max-h-48 overflow-y-auto">
                    {cityQuery.length === 0 && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">인기 도시</div>
                    )}
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-accent/10 active:bg-accent/20 flex items-center gap-2 text-sm transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          field.onChange(city);
                          setCityQuery(city);
                          setShowSuggestions(false);
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 날짜 - 출발일/도착일 한번에 선택 */}
        <div className="space-y-2">
          <FormLabel>여행 기간</FormLabel>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background/50 h-11",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "M월 d일", { locale: ko })} → {format(dateRange.to, "M월 d일", { locale: ko })}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))}박
                      </span>
                    </>
                  ) : (
                    <>{format(dateRange.from, "M월 d일", { locale: ko })} → 도착일 선택</>
                  )
                ) : (
                  "출발일 ~ 도착일 선택"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={ko}
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.startDate && (
            <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 예산 - 천단위 구분 */}
          <FormField
            control={form.control}
            name="budget"
            render={() => (
              <FormItem>
                <FormLabel>예산 (₩)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="예: 2,000,000"
                      value={budgetDisplay}
                      onChange={(e) => handleBudgetChange(e.target.value)}
                      className="pl-10 bg-background/50 h-11"
                    />
                    {budgetDisplay && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        원
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 여행 스타일 */}
          <FormField
            control={form.control}
            name="travelStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>여행 스타일</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50 h-11">
                      <SelectValue placeholder="스타일 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="luxury">🏨 럭셔리</SelectItem>
                    <SelectItem value="budget">💰 가성비</SelectItem>
                    <SelectItem value="adventure">🏔️ 모험</SelectItem>
                    <SelectItem value="business">💼 비즈니스</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 추가 정보 (자연어 입력) */}
        <FormField
          control={form.control}
          name="additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>추가 요청사항</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`자유롭게 작성해주세요. 예시:\n• 여행 목표: 가족과 힐링 여행, 맛집 탐방 위주\n• 인원: 성인 2명 + 아이 1명 (5세)\n• 참고사항: 해산물 알레르기, 유모차 이동 가능한 곳\n• 꼭 가고 싶은 곳: 팀랩, 츠키지 시장\n• 숙소: 역 근처 선호, 온천 포함`}
                  className="min-h-[140px] bg-background/50 text-sm leading-relaxed resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                여행 목표, 인원, 참고사항, 선호도 등을 자유롭게 입력하면 AI가 맞춤 일정을 설계합니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
          <Plane className="w-5 h-5 mr-2" />
          AI로 여행 계획 시작하기
        </Button>
      </form>
    </Form>
  );
}

export function AgentConfigForm({ onSubmit }: { onSubmit: (data: z.infer<typeof agentConfigSchema>) => void }) {
  const form = useForm<z.infer<typeof agentConfigSchema>>({
    resolver: zodResolver(agentConfigSchema),
    defaultValues: {
      plannerEnabled: true,
      bookingEnabled: true,
      conciergeEnabled: false,
      autoBooking: false,
      instructions: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold">멀티 에이전트 활성화</h3>
          </div>
          
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="plannerEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold">일정 최적화 에이전트</FormLabel>
                    <FormDescription>실시간 교통 및 날씨를 반영하여 일정을 관리합니다.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bookingEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold">예약 자동화 에이전트</FormLabel>
                    <FormDescription>최저가 항공 및 숙박을 탐색하고 예약을 준비합니다.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold">자율성 설정</h3>
          </div>
          
          <FormField
            control={form.control}
            name="autoBooking"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-emerald-500/20 p-4 bg-emerald-500/5">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-semibold text-emerald-700 dark:text-emerald-400">원클릭 자동 결제 허용</FormLabel>
                  <FormDescription>에이전트가 최적의 상품 발견 시 등록된 카드로 자동 예약합니다.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>에이전트 특별 지침</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="예: 창가 좌석 선호, 호텔은 4성급 이상, 특정 알러지 정보 등..."
                  className="min-h-[120px] bg-background/50"
                  {...field}
                />
              </FormControl>
              <FormDescription>에이전트가 의사결정을 내릴 때 참고할 개인적 취향을 입력하세요.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Sparkles className="w-4 h-4 mr-2" />
          에이전트 설정 저장
        </Button>
      </form>
    </Form>
  );
}

export function AddCardForm({ onSubmit }: { onSubmit: (data: z.infer<typeof cardSchema>) => void }) {
  const form = useForm<z.infer<typeof cardSchema>>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      provider: 'visa',
      nickname: '',
      cardNumber: '',
      expiry: '',
      isDefault: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-primary/20 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <CreditCard className="w-24 h-24 rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카드사</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-white/30">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="visa">VISA</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카드 별칭</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 메인 여행용" {...field} className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-white/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카드 번호 (16자리)</FormLabel>
                  <FormControl>
                    <Input placeholder="0000 0000 0000 0000" {...field} maxLength={16} className="font-mono tracking-widest bg-white/50 dark:bg-black/20 backdrop-blur-sm border-white/30" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>유효 기간</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/YY" {...field} maxLength={5} className="font-mono bg-white/50 dark:bg-black/20 backdrop-blur-sm border-white/30" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="pb-1">
                      <FormLabel className="text-sm">기본 결제 수단</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 bg-primary text-white font-bold hover:shadow-primary/30 transition-all">
          결제 수단 안전하게 등록
        </Button>
        
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          모든 카드 정보는 256비트 AES 암호화로 보호됩니다.
        </p>
      </form>
    </Form>
  );
}
