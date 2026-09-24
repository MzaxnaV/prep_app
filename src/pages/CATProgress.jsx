import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import { motion } from "framer-motion";
import { getCurrentPhase } from "../lib/studyPlanData";
import { useExamDates, daysUntil } from "../lib/examDates";
import SectionGuide from "../components/cat/SectionGuide";
import CATSectionProgress from "../components/cat/CATSectionProgress";
import LogSessionDialog from "../components/LogSessionDialog";
import { Plus, BookOpen, Brain, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CATProgress() {
  const [showLog, setShowLog] = useState(false);
  const catDays = daysUntil(useExamDates().cat);
  const phase = getCurrentPhase();

  const { data: sessions = [], refetch } = useQuery({
    queryKey: ['catSessions'],
    queryFn: () => db.entities.StudySession.filter({ exam: 'CAT' }, '-date', 500),
  });

  const { data: mocks = [] } = useQuery({
    queryKey: ['catMocks'],
    queryFn: () => db.entities.MockTest.filter({ exam_type: 'CAT Full' }, '-date', 50),
  });

  const sectionStats = getSectionStats(sessions);
  const latestMock = mocks[0];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">CAT</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {catDays == null
                ? 'No exam date set — the log below is kept for whenever this restarts.'
                : `${catDays} days remaining · Phase ${phase}`}
            </p>
          </div>
          <Button onClick={() => setShowLog(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Log Session
          </Button>
        </div>
      </motion.div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard
          title="VARC"
          icon={BookOpen}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          stats={sectionStats.VARC}
          target={phase === 1 ? "Maintenance — 30 min/day" : "90 min/day — 4-5 RC passages"}
          latestPercentile={latestMock?.varc_percentile}
        />
        <SectionCard
          title="DILR"
          icon={Brain}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          stats={sectionStats.DILR}
          target={phase === 1 ? "75 min/day — build fundamentals" : "3 hrs/day — timed sets"}
          latestPercentile={latestMock?.dilr_percentile}
        />
        <SectionCard
          title="QA"
          icon={Calculator}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          stats={sectionStats.Quant}
          target={phase === 1 ? "45 min/day — build fundamentals" : "90 min/day — 20-25 questions"}
          latestPercentile={latestMock?.quant_percentile}
        />
      </div>

      {/* Section Progress Over Time */}
      <CATSectionProgress sessions={sessions} />

      {/* Section Guides */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Practice Guides & Resources
        </h2>
        {['VARC', 'DILR', 'Quant'].map(section => (
          <SectionGuide key={section} section={section} phase={phase} />
        ))}
      </div>

      {showLog && (
        <LogSessionDialog exam="CAT" onClose={() => { setShowLog(false); refetch(); }} />
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, color, bgColor, stats, target, latestPercentile }) {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{target}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Sessions" value={stats.sessions} />
        <Stat label="Questions" value={stats.questions} />
        <Stat label="Accuracy" value={stats.accuracy > 0 ? `${stats.accuracy}%` : '—'} />
        <Stat label="Latest %ile" value={latestPercentile ? `${latestPercentile}` : '—'} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}

function getSectionStats(sessions) {
  const sections = { VARC: { sessions: 0, questions: 0, correct: 0, accuracy: 0 }, DILR: { sessions: 0, questions: 0, correct: 0, accuracy: 0 }, Quant: { sessions: 0, questions: 0, correct: 0, accuracy: 0 } };
  sessions.forEach(s => {
    const sec = sections[s.subject];
    if (!sec) return;
    sec.sessions++;
    sec.questions += s.questions_attempted || 0;
    sec.correct += s.questions_correct || 0;
  });
  Object.values(sections).forEach(s => {
    s.accuracy = s.questions > 0 ? Math.round((s.correct / s.questions) * 100) : 0;
  });
  return sections;
}

