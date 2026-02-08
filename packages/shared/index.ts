export interface TravelPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency: string;
  itinerary: DayPlan[];
}

export interface DayPlan {
  day: number;
  activities: Activity[];
}

export interface Activity {
  time: string;
  description: string;
  location?: string;
  cost?: number;
}

export type AgentRole = 'concierge' | 'planner' | 'document' | 'transaction' | 'security';

export interface AgentMessage {
  role: AgentRole;
  content: string;
  timestamp: string;
}
