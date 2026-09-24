import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogSetDialog from "../dilr/LogSetDialog";
import SetTypeHeatmap from "../dilr/SetTypeHeatmap";
import { fmtTime } from "@/lib/dilrData";
import moment from "moment";

// Per-section question counts needed at each percentile (CAT '21 data, from the
// vault notes). Far more actionable than a percentile target: DILR 99%ile is
// ~12 questions — three sets, cracked cleanly. Not four, not five.
const DILR_TARGETS = [
  { pct: '95', marks: 24, questions: 8, sets: '2' },
  { pct: '97', marks: 29, questions: 10, sets: '2–3' },
  { pct: '99', marks: 34, questions: 12, sets: '3' },
  { pct: '99.5', marks: 37, questions: '13+', sets: '3–4' },
];

export default function DILRTab({ children }) {
  const [showLog, setShowLog] = useState(false);

  const { data: sets = [], refetch } = useQuery({
    queryKey: ['dilrSets'],
    queryFn: () => db.entities.DILRSet.list('-date', 1000),
  });

  const recent = sets.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-muted-foreground text-sm">
          {sets.length} sets logged · Set selection is 50% of the section
        </p>
        <Button onClick={() => setShowLog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log Set
        </Button>
      </div>

      {children}

      {/* What the section actually requires — in questions, not percentiles */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          What DILR actually asks of you
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          CAT&nbsp;&rsquo;21 marks &rarr; questions. Three sets solved cleanly is a 99%ile section.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {DILR_TARGETS.map(t => (
            <div key={t.pct} className={`rounded-lg p-2.5 ${t.pct === '99' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted/30'}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.pct}%ile</p>
              <p className="text-lg font-bold font-mono">{t.questions}<span className="text-xs text-muted-foreground font-normal">Q</span></p>
              <p className="text-[10px] text-muted-foreground">{t.marks} marks · {t.sets} sets</p>
            </div>
          ))}
        </div>
      </div>

      <SetTypeHeatmap sets={sets} />

      {recent.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent sets
          </h3>
          <div className="space-y-1">
            {recent.map(s => {
              const acc = s.questions_total ? Math.round((s.questions_correct || 0) / s.questions_total * 100) : null;
              return (
                <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-[10px] text-muted-foreground font-mono w-12 shrink-0">
                    {moment(s.date).format('MMM D')}
                  </span>
                  <span className="text-xs flex-1 truncate" title={s.set_type}>{s.set_type}</span>
                  {s.source && <span className="text-[10px] text-muted-foreground truncate max-w-24 hidden sm:block">{s.source}</span>}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    s.triage_decision === 'Skipped' ? 'bg-muted text-muted-foreground' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {s.triage_decision === 'Skipped' ? 'skip' : 'att'}
                  </span>
                  <span className="text-xs font-mono w-12 text-right shrink-0">
                    {acc != null ? `${acc}%` : '—'}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-right shrink-0">
                    {fmtTime(s.time_seconds)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showLog && <LogSetDialog onClose={() => { setShowLog(false); refetch(); }} />}
    </div>
  );
}
