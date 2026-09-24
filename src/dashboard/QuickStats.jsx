import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import { BookOpen, Target, Brain, TrendingUp } from "lucide-react";
import moment from "moment";

export default function QuickStats() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['studySessions', 'recent'],
    queryFn: () => db.entities.StudySession.filter(
      { date: moment().format('YYYY-MM-DD') },
      '-created_date',
      50
    ),
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['studySessions', 'all'],
    queryFn: () => db.entities.StudySession.list('-created_date', 500),
  });

  const todayCompleted = sessions.filter(s => s.completed).length;
  const todayTotal = sessions.length;
  const totalQuestions = allSessions.reduce((sum, s) => sum + (s.questions_attempted || 0), 0);
  const totalCorrect = allSessions.reduce((sum, s) => sum + (s.questions_correct || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalHours = Math.round(allSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60);

  const stats = [
    { label: "Today's Blocks", value: `${todayCompleted}/${todayTotal || '—'}`, icon: BookOpen, color: "text-amber-500" },
    { label: "Questions Done", value: totalQuestions.toLocaleString(), icon: Target, color: "text-emerald-500" },
    { label: "Accuracy", value: totalQuestions > 0 ? `${overallAccuracy}%` : '—', icon: Brain, color: "text-blue-500" },
    { label: "Hours Logged", value: totalHours.toLocaleString(), icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold font-mono">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}