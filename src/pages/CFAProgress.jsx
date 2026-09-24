import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import SubjectCard from "../components/cfa/SubjectCard";
import WeekPlanTimeline from "../components/cfa/WeekPlanTimeline";
import LogSessionDialog from "../components/LogSessionDialog";
import EditProgressDialog from "../components/cfa/EditProgressDialog";
import { motion } from "framer-motion";
import { CFA_SUBJECT_NAMES } from "../lib/studyPlanData";
import { useExamDates, daysUntil } from "../lib/examDates";
import { activityKey } from "../lib/activities";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

export default function CFAProgress() {
  const [showLog, setShowLog] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const cfaDays = daysUntil(useExamDates().cfa);

  const { data: subjects = [], refetch: refetchSubjects } = useQuery({
    queryKey: ['subjectProgress', 'CFA'],
    queryFn: () => db.entities.SubjectProgress.filter({ exam: 'CFA' }, 'created_date', 50),
  });

  const { data: moduleProgress = [], refetch: refetchModules } = useQuery({
    queryKey: ['moduleProgress'],
    queryFn: () => db.entities.ModuleProgress.list('created_date', 200),
  });

  const { data: cfaSessions = [] } = useQuery({
    queryKey: ['studySessions', 'CFA'],
    queryFn: () => db.entities.StudySession.filter({ exam: 'CFA' }, '-date', 1000),
  });

  // Build per-subject module stats map: subjectFull → { total, completed, inProgress, modules[] }
  // modules are sorted by module_id and each has completedLessonsCount pre-parsed
  const moduleStatsBySubject = useMemo(() => {
    const map = {};
    for (const m of moduleProgress) {
      if (!map[m.subject]) {
        map[m.subject] = { total: 0, completed: 0, inProgress: 0, modules: [] };
      }
      const stats = map[m.subject];
      stats.total += 1;
      stats.modules.push({
        ...m,
        completedLessonsCount: JSON.parse(m.completed_lessons || '[]').length,
      });
      if (m.status === 'Complete') stats.completed += 1;
      else if (m.status === 'In Progress') stats.inProgress += 1;
    }
    for (const stats of Object.values(map)) {
      stats.modules.sort((a, b) => a.module_id - b.module_id);
    }
    return map;
  }, [moduleProgress]);

  // Per-subject practice stats: latest accuracy + weighted avg of last 5 Qbank sessions
  const practiceStatsBySubject = useMemo(() => {
    const practiceSessions = cfaSessions
      .filter(s => activityKey(s.activity_type) === 'practice' && s.questions_attempted > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    const map = {};
    for (const subjectName of CFA_SUBJECT_NAMES) {
      const recent = practiceSessions.filter(s => s.subject === subjectName).slice(0, 5);
      if (recent.length === 0) { map[subjectName] = null; continue; }

      const latestAcc = Math.round((recent[0].questions_correct / recent[0].questions_attempted) * 100);
      const totalAttempted = recent.reduce((s, sess) => s + sess.questions_attempted, 0);
      const totalCorrect = recent.reduce((s, sess) => s + sess.questions_correct, 0);
      const weightedAvg = Math.round((totalCorrect / totalAttempted) * 100);

      map[subjectName] = { latestAcc, weightedAvg, sessionCount: recent.length };
    }
    return map;
  }, [cfaSessions]);

  // Per-module accuracy: attribute each session's accuracy to every module it covered
  const moduleAccuracyById = useMemo(() => {
    const practiceSessions = cfaSessions
      .filter(s => activityKey(s.activity_type) === 'practice' && s.questions_attempted > 0 && s.module_selections)
      .sort((a, b) => b.date.localeCompare(a.date));

    const sessionsByModule = {};
    for (const sess of practiceSessions) {
      try {
        const sel = JSON.parse(sess.module_selections);
        for (const moduleId of Object.keys(sel)) {
          if (!sessionsByModule[moduleId]) sessionsByModule[moduleId] = [];
          sessionsByModule[moduleId].push(sess);
        }
      } catch {}
    }

    const map = {};
    for (const [moduleId, sessions] of Object.entries(sessionsByModule)) {
      const recent = sessions.slice(0, 5);
      const latestAcc = Math.round((recent[0].questions_correct / recent[0].questions_attempted) * 100);
      const totalAttempted = recent.reduce((s, sess) => s + sess.questions_attempted, 0);
      const totalCorrect = recent.reduce((s, sess) => s + sess.questions_correct, 0);
      map[moduleId] = {
        latestAcc,
        weightedAvg: Math.round((totalCorrect / totalAttempted) * 100),
        sessionCount: recent.length,
      };
    }
    return map;
  }, [cfaSessions]);

  function handleClose() {
    setShowLog(false);
    refetchSubjects();
    refetchModules();
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">CFA Level 1</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {cfaDays == null
                ? 'No exam date set — module progress is kept for the next sitting.'
                : `${cfaDays} days remaining`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowEdit(true)} size="sm" variant="outline" className="gap-2">
              <Pencil className="w-4 h-4" /> Edit Progress
            </Button>
            <Button onClick={() => setShowLog(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Log Session
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Subject Progress
          </h2>
          {subjects.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No subjects tracked yet. They will be initialized shortly.</p>
            </div>
          ) : (
            subjects.map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                moduleStats={moduleStatsBySubject[s.subject] || null}
                practiceStats={practiceStatsBySubject[s.subject] || null}
                moduleAccuracy={moduleAccuracyById}
              />
            ))
          )}
        </div>

        <div>
          <WeekPlanTimeline />
        </div>
      </div>

      {showLog && (
        <LogSessionDialog
          exam="CFA"
          onClose={handleClose}
        />
      )}

      {showEdit && (
        <EditProgressDialog
          onClose={() => { setShowEdit(false); refetchSubjects(); refetchModules(); }}
        />
      )}
    </div>
  );
}
