import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogQuestionDialog from "../qa/LogQuestionDialog";
import TopicHeatmap from "../qa/TopicHeatmap";
import { fmtTime } from "@/lib/qaData";
import moment from "moment";

// CAT Quant (QA) — distinct from CFA Quantitative Methods, which lives under CFA Progress.

// Marks -> questions per percentile (CAT '21, from the Obsidian vault).
const QA_TARGETS = [
  { pct: '90', marks: 18, questions: 6 },
  { pct: '95', marks: 24, questions: 8 },
  { pct: '97', marks: 28, questions: '9–10' },
  { pct: '99', marks: 34, questions: '11–12' },
];

export default function QATab({ children }) {
  const [showLog, setShowLog] = useState(false);

  const { data: questions = [], refetch } = useQuery({
    queryKey: ['qaQuestions'],
    queryFn: () => db.entities.QAQuestion.list('-date', 2000),
  });

  const recent = questions.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-muted-foreground text-sm">
          CAT Quant · {questions.length} questions logged · Arithmetic is ~40% of the section
        </p>
        <Button onClick={() => setShowLog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log Question
        </Button>
      </div>

      {children}

      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          What QA actually asks of you
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          CAT&nbsp;&rsquo;21 marks &rarr; questions, out of 22. 99%ile is roughly half the section.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {QA_TARGETS.map(t => (
            <div key={t.pct} className={`rounded-lg p-2.5 ${t.pct === '99' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted/30'}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.pct}%ile</p>
              <p className="text-lg font-bold font-mono">{t.questions}<span className="text-xs text-muted-foreground font-normal">Q</span></p>
              <p className="text-[10px] text-muted-foreground">{t.marks} marks</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
          Secure Arithmetic first, then Algebra. Geometry and Modern Math are the last 20% of marks for the
          first 50% of the effort — only invest there once the rest is at 90%.
        </p>
      </div>

      <TopicHeatmap questions={questions} />

      {recent.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent questions
          </h3>
          <div className="space-y-1">
            {recent.map(q => (
              <div key={q.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                <span className="text-[10px] text-muted-foreground font-mono w-12 shrink-0">
                  {moment(q.date).format('MMM D')}
                </span>
                <span className="text-xs flex-1 truncate" title={q.topic}>{q.topic}</span>
                {q.confidence && (
                  <span className="text-[9px] text-purple-400 hidden sm:block shrink-0">{q.confidence}</span>
                )}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  q.result === 'Correct' ? 'bg-emerald-500/15 text-emerald-400'
                    : q.result === 'Incorrect' ? 'bg-red-500/15 text-red-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {q.result === 'Incorrect' ? 'wrong' : q.result === 'Skipped' ? 'skip' : 'right'}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground w-10 text-right shrink-0">
                  {fmtTime(q.time_seconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showLog && <LogQuestionDialog onClose={() => { setShowLog(false); refetch(); }} />}
    </div>
  );
}
