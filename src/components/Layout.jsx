import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Calendar, BookOpen, GraduationCap,
  ClipboardList, Target, Menu, X, ChevronRight, FlaskConical, ScrollText, Crosshair, Timer, Settings
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXAMS, useExamDates, daysUntil } from "../lib/examDates";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/action", label: "Action Plan", icon: Crosshair },
  { path: "/today", label: "Today's Plan", icon: Calendar },
  { path: "/cfa", label: "CFA Progress", icon: BookOpen },
  { path: "/cat", label: "CAT Progress", icon: GraduationCap },
  { path: "/lab", label: "Lab", icon: FlaskConical },
  { path: "/drill", label: "Calculation Drill", icon: Timer },
  { path: "/mocks", label: "Mock Tests", icon: ClipboardList },
  { path: "/targets", label: "Targets & Rules", icon: Target },
  { path: "/plan", label: "Master Plan", icon: ScrollText },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dates = useExamDates();
  const scheduled = EXAMS.filter(e => dates[e.key]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed h-full z-30">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold tracking-tight text-white">Study Command</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1 font-mono">
            {scheduled.length ? 'Campaign active' : 'No exam scheduled'}
          </p>
        </div>

        {/* An exam with no date gets no countdown at all — see lib/examDates.js. */}
        <div className="p-4 space-y-1.5">
          {scheduled.map(e => (
            <ExamCountdown key={e.key} label={e.label} days={daysUntil(dates[e.key])} color={e.color} />
          ))}
          {!scheduled.length && (
            <Link
              to="/settings"
              className="block px-3 py-2 rounded-lg bg-sidebar-accent/50 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              Set an exam date →
            </Link>
          )}
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 font-mono uppercase tracking-widest">
            {scheduled.length ? scheduled.map(e => e.label).join(' + ') : 'Dormant'}
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold">Study Command</h1>
          <p className="text-[10px] text-sidebar-foreground/60 font-mono">
            {scheduled.length
              ? scheduled.map(e => `${e.label}: ${daysUntil(dates[e.key])}d`).join(' · ')
              : 'No exam scheduled'}
          </p>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="lg:hidden fixed inset-0 z-30 bg-sidebar/95 backdrop-blur-sm pt-16"
          >
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function ExamCountdown({ label, days, color }) {
  const urgency = days < 30 ? 'animate-pulse' : '';
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent/50">
      <span className="text-xs text-sidebar-foreground/70">{label}</span>
      <span className={`text-sm font-bold font-mono ${color} ${urgency}`}>
        {days > 0 ? `${days}d` : 'EXAM DAY'}
      </span>
    </div>
  );
}