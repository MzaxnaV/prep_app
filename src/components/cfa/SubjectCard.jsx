import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

// Defined outside component — never recreated on re-render
const STATUS_COLORS = {
  'Not Started': 'bg-slate-500/10 text-slate-500',
  'In Progress': 'bg-blue-500/10 text-blue-500',
  'Gap-Filling': 'bg-purple-500/10 text-purple-500',
  'Revision': 'bg-amber-500/10 text-amber-500',
  'Complete': 'bg-emerald-500/10 text-emerald-500',
};

// moduleStats shape:
//   { total, completed, inProgress, modules: Array<ModuleProgress & { completedLessonsCount }> }
//   modules are pre-sorted by module_id and completedLessonsCount is pre-parsed in CFAProgress
function accColor(pct) {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 65) return 'text-amber-400';
  return 'text-red-400';
}

export default function SubjectCard({ subject, moduleStats, practiceStats, moduleAccuracy = {} }) {
  const [expanded, setExpanded] = useState(false);

  const questionProgress = subject.question_target > 0
    ? Math.min(100, Math.round((subject.total_questions_done / subject.question_target) * 100))
    : 0;

  const moduleProgress = moduleStats && moduleStats.total > 0
    ? Math.round((moduleStats.completed / moduleStats.total) * 100)
    : 0;

  const totalLessons = moduleStats ? moduleStats.modules.reduce((s, m) => s + m.total_lessons, 0) : 0;
  const doneLessons = moduleStats ? moduleStats.modules.reduce((s, m) => s + m.completedLessonsCount, 0) : 0;
  const lessonProgress = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold">{subject.subject}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[subject.status]}`}>
                {subject.status}
              </span>
              {subject.exam_weight && (
                <span className="text-[10px] text-muted-foreground font-mono">{subject.exam_weight}</span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Questions</p>
                <p className="text-sm font-bold font-mono">
                  {subject.total_questions_done || 0}
                  <span className="text-muted-foreground font-normal">/{subject.question_target || '—'}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Accuracy</p>
                <p className="text-sm font-bold font-mono">
                  {subject.current_accuracy ? `${subject.current_accuracy}%` : '—'}
                  {subject.target_accuracy && (
                    <span className="text-muted-foreground font-normal">/{subject.target_accuracy}%</span>
                  )}
                </p>
              </div>
              {moduleStats && moduleStats.total > 0 && (
                <>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Modules</p>
                    <p className="text-sm font-bold font-mono">
                      {moduleStats.completed}
                      {moduleStats.inProgress > 0 && (
                        <span className="text-blue-400 font-normal">+{moduleStats.inProgress}</span>
                      )}
                      <span className="text-muted-foreground font-normal">/{moduleStats.total}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Chapters</p>
                    <p className="text-sm font-bold font-mono">
                      {doneLessons}
                      <span className="text-muted-foreground font-normal">/{totalLessons}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 ml-3">
            <div className="w-16 space-y-1">
              <Progress value={questionProgress} className="h-1.5" />
              {moduleStats && moduleStats.total > 0 && (
                <>
                  <Progress value={moduleProgress} className="h-1.5 [&>div]:bg-blue-500" title={`Modules: ${moduleStats.completed}/${moduleStats.total}`} />
                  <Progress value={lessonProgress} className="h-1.5 [&>div]:bg-sky-400" title={`Chapters: ${doneLessons}/${totalLessons}`} />
                </>
              )}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
          {practiceStats && (
            <div>
              <p className="text-[10px] text-amber-400 uppercase font-bold mb-2">Qbank Practice Analytics</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Latest</p>
                  <p className="text-base font-bold font-mono text-amber-400">{practiceStats.latestAcc}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Wtd Avg (last {practiceStats.sessionCount})</p>
                  <p className="text-base font-bold font-mono text-blue-400">{practiceStats.weightedAvg}%</p>
                </div>
              </div>
            </div>
          )}
          {moduleStats && moduleStats.total > 0 && (
            <div>
              <p className="text-[10px] text-blue-400 uppercase font-bold mb-1.5">Module Progress</p>
              <div className="flex flex-wrap gap-1.5">
                {moduleStats.modules.map(m => {
                  const color =
                    m.status === 'Complete' ? 'bg-emerald-500/10 text-emerald-400' :
                    m.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-muted text-muted-foreground';
                  const acc = moduleAccuracy[String(m.module_id)];
                  const titleText = acc
                    ? `${m.module_name} · latest ${acc.latestAcc}% · wtd avg ${acc.weightedAvg}% (${acc.sessionCount} sessions)`
                    : m.module_name;
                  return (
                    <span
                      key={m.module_id}
                      title={titleText}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 ${color}`}
                    >
                      {m.module_id}
                      {m.status !== 'Not Started' && (
                        <span className="opacity-70">{m.completedLessonsCount}/{m.total_lessons}</span>
                      )}
                      {acc && (
                        <span className={`font-bold ${accColor(acc.weightedAvg)}`}>{acc.weightedAvg}%</span>
                      )}
                    </span>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500/50 mr-1" />complete
                <span className="inline-block w-2 h-2 rounded-sm bg-blue-500/50 mr-1 ml-2" />in progress
              </p>
            </div>
          )}
          {subject.pending_topics && (
            <div>
              <p className="text-[10px] text-red-400 uppercase font-bold mb-1">Pending Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {subject.pending_topics.split(',').map((t, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-red-500/10 text-red-400">
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {subject.completed_topics && (
            <div>
              <p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Completed Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {subject.completed_topics.split(',').map((t, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                    {t.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {subject.notes && (
            <p className="text-xs text-muted-foreground">{subject.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
