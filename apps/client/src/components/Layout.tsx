import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  Map, 
  CreditCard, 
  Shield,
  Blocks,
  Search, 
  Bell, 
  Menu, 
  X, 
  LogOut,
  User,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTE_PATHS } from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IMAGES } from '@/assets/images';
import { TravelChatWindow } from '@/components/TravelChatWindow';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { name: '대시보드', path: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard },
  { name: '여행 일정', path: ROUTE_PATHS.TRIPS, icon: Map },
  { name: '결제 관리', path: ROUTE_PATHS.PAYMENT, icon: CreditCard },
  { name: '보안 센터', path: ROUTE_PATHS.SECURITY, icon: Shield },
  { name: '블록체인', path: ROUTE_PATHS.BLOCKCHAIN, icon: Blocks },
];

const SIDEBAR_AGENTS = [
  { id: 'planner', emoji: '📋', name: '일정 플래너' },
  { id: 'research', emoji: '🔍', name: '예약 에이전트' },
  { id: 'concierge', emoji: '💬', name: '컨시어지' },
  { id: 'security', emoji: '🛡️', name: '보안 에이전트' },
  { id: 'payment', emoji: '💳', name: '결제 에이전트' },
  { id: 'blockchain', emoji: '🔗', name: '블록체인' },
];

function SidebarAgentGrid({ isOpen, activeAgents }: { isOpen: boolean; activeAgents: string[] }) {
  const navigate = useNavigate();
  
  if (!isOpen) {
    return (
      <div className="px-2 py-3 border-t border-sidebar-border bg-sidebar relative z-10">
        <button
          onClick={() => navigate(ROUTE_PATHS.AGENTS)}
          className="w-full flex justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          title="AI 에이전트"
        >
          <Bot className="h-5 w-5 text-sidebar-foreground/60" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-sidebar-border bg-sidebar relative z-10">
      <button
        onClick={() => navigate(ROUTE_PATHS.AGENTS)}
        className="text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3 hover:text-primary transition-colors cursor-pointer"
      >
        AI 에이전트
      </button>
      <div className="grid grid-cols-3 gap-2">
        {SIDEBAR_AGENTS.map((agent) => {
          const isActive = activeAgents.includes(agent.id);
          return (
            <button
              key={agent.id}
              onClick={() => navigate(ROUTE_PATHS.AGENTS)}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <div className={`agent-icon-wrapper ${isActive ? 'active' : ''}`}>
                <span className="text-lg leading-none">{agent.emoji}</span>
              </div>
              <span className={`agent-label ${isActive ? 'active' : ''} group-hover:opacity-100`}>
                {agent.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const location = useLocation();

  const getPageTitle = () => {
    const currentItem = NAV_ITEMS.find(item => item.path === location.pathname);
    if (currentItem) return currentItem.name;
    if (location.pathname === ROUTE_PATHS.AGENTS) return 'AI 에이전트';
    return '대시보드';
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Listen for agent status events from chat
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.active) {
        setActiveAgents(detail.agents || []);
      } else {
        setActiveAgents(prev => prev.filter(a => !(detail.agents || []).includes(a)));
      }
    };
    window.addEventListener('agent-status', handler);
    return () => window.removeEventListener('agent-status', handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Globe className="text-primary-foreground h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap text-sidebar-foreground">
                TravelAgent AI
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <SidebarAgentGrid isOpen={isSidebarOpen} activeAgents={activeAgents} />
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className={`flex items-center gap-3 ${isSidebarOpen ? 'px-2' : 'justify-center'}`}>
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-sidebar-foreground">김민수</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">Premium Plan</p>
              </div>
            )}
            {isSidebarOpen && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-72 h-full bg-sidebar border-r border-sidebar-border p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="text-primary-foreground h-5 w-5" />
                  </div>
                  <span className="font-bold text-lg text-sidebar-foreground">TravelAgent AI</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      }`
                    }
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="absolute bottom-8 left-6 right-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>KM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">김민수</p>
                    <p className="text-xs text-muted-foreground">Premium Member</p>
                  </div>
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full h-16 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="h-full px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-bold tracking-tight md:text-xl">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-md mx-4">
              <div className="relative w-full hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="여행지, 호텔, 항공권 검색..."
                  className="pl-10 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-accent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent border-2 border-background"></span>
              </Button>
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-medium text-accent">AI 에이전트 활성 중</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">System Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer Info (Optional) */}
        <footer className="p-4 text-center text-xs text-muted-foreground border-t border-border/50">
          <span className="hidden sm:inline">© 2026 TravelAgent AI Systems. 모든 권리 보유. | 자율 에이전트 엔진 v2.4.0</span>
          <span className="sm:hidden">© 2026 TravelAgent AI</span>
        </footer>
      </div>

      {/* Global Chat Window */}
      <TravelChatWindow />
    </div>
  );
}