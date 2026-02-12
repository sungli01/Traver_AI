import { motion } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Plane, 
  Hotel, 
  Utensils, 
  Compass, 
  CreditCard 
} from "lucide-react";
import { 
  Trip, 
  TRIP_STATUS, 
  formatCurrency, 
  formatDate, 
  getStatusColor 
} from "@/lib/index";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TripCardProps {
  trip: Trip;
  onManage?: () => void;
}

export function TripCard({ trip, onManage }: TripCardProps) {
  const statusLabels: Record<string, string> = {
    [TRIP_STATUS.PLANNING]: "계획 중",
    [TRIP_STATUS.BOOKING]: "예약 진행 중",
    [TRIP_STATUS.CONFIRMED]: "예약 확정",
    [TRIP_STATUS.COMPLETED]: "여행 완료",
    [TRIP_STATUS.CANCELLED]: "취소됨",
  };

  const budgetPercentage = Math.min((trip.spent / trip.budget) * 100, 100);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "flight":
        return <Plane className="w-3 h-3" />;
      case "hotel":
        return <Hotel className="w-3 h-3" />;
      case "dining":
        return <Utensils className="w-3 h-3" />;
      default:
        return <Compass className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border bg-card group">
        <div className="relative h-48 overflow-hidden">
          <img
            src={trip.coverImage}
            alt={trip.destination}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <Badge 
            className={cn(
              "absolute top-4 right-4 border-none font-medium",
              getStatusColor(trip.status)
            )}
          >
            {statusLabels[trip.status] || trip.status}
          </Badge>
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
              <MapPin className="w-3 h-3" />
              <span>{trip.destination}</span>
            </div>
            <h3 className="text-lg font-bold leading-tight">{trip.title}</h3>
          </div>
        </div>

        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(trip.startDate)}</span>
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div className="text-muted-foreground">
              <span>{formatDate(trip.endDate)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">예산 집행률</span>
              <span className="font-mono">{budgetPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={budgetPercentage} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatCurrency(trip.spent)} 지출</span>
              <span>전체 예산 {formatCurrency(trip.budget)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-full mb-1">활성 에이전트</span>
            {trip.activeAgents.map((agentId) => (
              <div 
                key={agentId} 
                className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center ring-1 ring-accent/30"
                title={agentId}
              >
                <CreditCard className="w-3 h-3 text-accent" />
              </div>
            ))}
            {trip.activeAgents.length === 0 && (
              <span className="text-xs text-muted-foreground italic">활성 에이전트 없음</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 pt-0">
          <Button 
            onClick={onManage} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl"
          >
            상세 일정 관리
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

interface TripGridProps {
  trips: Trip[];
  onTripSelect?: (trip: Trip) => void;
}

export function TripGrid({ trips, onTripSelect }: TripGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <TripCard 
          key={trip.id} 
          trip={trip} 
          onManage={() => onTripSelect?.(trip)} 
        />
      ))}
      
      {trips.length === 0 && (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <Compass className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">등록된 여행 일정이 없습니다.</p>
          <p className="text-sm opacity-60">에이전트와 함께 첫 번째 여행을 계획해보세요.</p>
        </div>
      )}
    </div>
  );
}
