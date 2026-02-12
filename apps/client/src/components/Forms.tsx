import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar as CalendarIcon, CreditCard, Bot, MapPin, Plane, Sparkles, Wallet, ShieldCheck } from 'lucide-react';
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
    required_error: '시작일을 선택해주세요.',
  }),
  endDate: z.date({
    required_error: '종료일을 선택해주세요.',
  }),
  budget: z.coerce.number().min(1000, '최소 예산은 1,000원 이상입니다.'),
  travelStyle: z.enum(['luxury', 'budget', 'adventure', 'business']),
});

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
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>여행 제목</FormLabel>
                <FormControl>
                  <Input placeholder="예: 2026 파리 낭만 여행" {...field} className="bg-background/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>목적지</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="도시 또는 국가" {...field} className="pl-10 bg-background/50" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>시작일</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-background/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>종료일</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-background/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ko })
                        ) : (
                          <span>날짜 선택</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => (form.getValues('startDate') ? date < form.getValues('startDate') : date < new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>예산 (₩)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="number" placeholder="총 예산 입력" {...field} className="pl-10 bg-background/50" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="travelStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>여행 스타일</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="스타일 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="luxury">럭셔리 (Luxury)</SelectItem>
                    <SelectItem value="budget">가성비 (Budget)</SelectItem>
                    <SelectItem value="adventure">모험 (Adventure)</SelectItem>
                    <SelectItem value="business">비즈니스 (Business)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
          <Plane className="w-5 h-5 mr-2" />
          여행 계획 시작하기
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
