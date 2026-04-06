import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BarChart3, Vote, BrainCircuit, 
  Trophy, Sparkles, Menu, X, LogOut, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Vote, label: 'Polls', path: '/polls' },
  { icon: BrainCircuit, label: 'Quizzes', path: '/quizzes' },
  { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  { icon: Sparkles, label: 'AI Assistant', path: '/ai-assistant' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Vote className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="font-bold text-lg tracking-tight"
          >
            Pollar
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Vote className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Pollar</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-card border-r border-border shadow-2xl"
            >
              <NavContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-card border-r border-border z-40 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <NavContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-accent transition-colors"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </>
  );
}