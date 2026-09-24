import { GraduationCap, CalendarPlus } from "lucide-react";
import moment from "moment";
import { Link } from "react-router-dom";
import { EXAMS, useExamDates, daysUntil } from "../lib/examDates";
import CountdownCard from "../dashboard/CountdownCard";
import AdherenceCard from "../dashboard/AdherenceCard";
import ActionPlanCard from "../dashboard/ActionPlanCard";
import PhaseIndicator from "../dashboard/PhaseIndicator";
import QuickStats from "../dashboard/QuickStats";
import TodayPreview from "../dashboard/TodayPreview";
import { motion } from "framer-motion";

export default function Dashboard() {
  const dates = useExamDates();
  const scheduled = EXAMS.filter(e => dates[e.key]);
  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {moment().format('dddd, MMMM D, YYYY')} — Stay focused, stay consistent.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduled.map(e => (
          <CountdownCard
            key={e.key}
            title={e.label}
            days={daysUntil(dates[e.key])}
            color={e.color.replace('-400', '-500')}
            icon={GraduationCap}
          />
        ))}
        {!scheduled.length && <NoExamCard />}
        <AdherenceCard />
      </div>

      <ActionPlanCard />

      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PhaseIndicator />
        <TodayPreview />
      </div>
    </div>
  );
}

/**
 * The dashboard opened on a countdown, so with no exam set it opened on nothing.
 * This says why rather than leaving a hole — the dormant state is a decision, not
 * a missing record.
 */
function NoExamCard() {
  return (
    <div className="rounded-xl bg-card border border-dashed border-border p-6 flex flex-col justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <CalendarPlus className="w-4 h-4" />
        <p className="text-xs font-medium uppercase tracking-wider">No exam scheduled</p>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        Both exams are dormant. The logs stay put and the labs still work —
        nothing here is counting down.
      </p>
      <Link to="/settings" className="text-xs text-emerald-500 hover:underline mt-3 w-fit">
        Set a date →
      </Link>
    </div>
  );
}

function getGreeting() {
  const hour = moment().hour();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}