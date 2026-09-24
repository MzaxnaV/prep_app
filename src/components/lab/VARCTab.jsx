import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import { useState } from "react";
import { Plus, BookOpen, Timer, PenLine, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogVARCDialog from "../varc/LogVARCDialog";
import {
  summariseByDomain, summariseVA, readingStats, summaryDiscipline,
  difficultyPairing, varcErrorCounts, overallAccuracy, RC_DOMAINS, fmtTime,
} from "@/lib/varcData";

// Marks -> questions per percentile (CAT '21, from the Obsidian vault).
const VARC_TARGETS = [
  { pct: '90', marks: 28, questions: 9 },
  { pct: '95', marks: 34, questions: '11–12' },
  { pct: '99', marks: 45, questions: '14–15' },
  { pct: '99.5', marks: 49, questions: '17–18' },
];

function band(a) {
  if (a == null) return { bg: 'bg-muted/30', text: 'text-muted-foreground' };
  if (a >= 85) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
  if (a >= 70) return { bg: 'bg-amber-500/15', text: 'text-amber-400' };
  if (a >= 50) return { bg: 'bg-orange-500/15', text: 'text-orange-400' };
  return { bg: 'bg-red-500/15', text: 'text-red-400' };
}

export default function VARCTab({ children }) {
  const [showLog, setShowLog] = useState(false);

  const { data: items = [], refetch } = useQuery({
    queryKey: ['varcItems'],
    queryFn: () => db.entities.VARCItem.list('-date', 2000),
  });

  const domains = summariseByDomain(items);
  const vaRows = summariseVA(items);
  const reading = readingStats(items);
  const summary = summaryDiscipline(items);
  const pairing = difficultyPairing(items);
  const errors = varcErrorCounts(items);
  const accuracy = overallAccuracy(items);
  const untouched = RC_DOMAINS.filter(d => !domains.some(x => x.domain === d));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-muted-foreground text-sm">
          {reading.passages} passages · {items.length - reading.passages} VA questions logged
        </p>
        <Button onClick={() => setShowLog(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log VARC
        </Button>
      </div>

      {children}

      {items.length === 0 && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 p-4">
          <p className="text-xs text-amber-400 font-semibold mb-1">Nothing logged yet.</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Log passages as you read them. The two numbers worth watching from the start:
            <strong> re-read count</strong>, which should trend to zero &mdash; going back means the first pass
            was passive &mdash; and <strong>accuracy on what you attempted</strong>, which is the figure that
            says whether attempting more would win marks or lose them.
          </p>
        </div>
      )}

      {/* Targets */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          What VARC actually asks of you
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          CAT&nbsp;&rsquo;21 marks &rarr; questions, out of 24. At 99%ile you can leave 9 untouched.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {VARC_TARGETS.map(t => (
            <div key={t.pct} className={`rounded-lg p-2.5 ${t.pct === '99' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted/30'}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.pct}%ile</p>
              <p className="text-lg font-bold font-mono">{t.questions}<span className="text-xs text-muted-foreground font-normal">Q</span></p>
              <p className="text-[10px] text-muted-foreground">{t.marks} marks</p>
            </div>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={BookOpen} label="RC accuracy" value={accuracy.rc != null ? `${accuracy.rc}%` : '—'} sub={`${reading.passages} passages`} />
            <Stat icon={PenLine} label="VA accuracy" value={accuracy.va != null ? `${accuracy.va}%` : '—'} sub={`${items.length - reading.passages} questions`} />
            <Stat icon={Timer} label="Median read" value={fmtTime(reading.medianRead)}
              sub={reading.onPace === null ? 'target 2:00–2:30' : reading.onPace ? 'on pace' : 'too slow'} />
            <Stat icon={AlertTriangle} label="Top error" value={errors[0]?.type ?? '—'} sub={errors[0] ? `${errors[0].count} times` : 'none logged'} />
          </div>

          {/* Summary discipline — prescribed by the vault, never measured until now */}
          {summary.total > 0 && (
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                3-line summary discipline
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                Written on {summary.written} of {summary.total} passages ({summary.rate}%).
              </p>
              {summary.accWith != null && summary.accWithout != null && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-3">
                    <p className="text-lg font-bold font-mono text-emerald-400">{summary.accWith}%</p>
                    <p className="text-[10px] text-muted-foreground">accuracy with summary</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-lg font-bold font-mono">{summary.accWithout}%</p>
                    <p className="text-[10px] text-muted-foreground">without</p>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
                If the gap is real and persistent, the summary is not overhead — it is the technique.
              </p>
            </div>
          )}

          {/* Domain heatmap — the blind spot detector */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              RC accuracy by domain
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              Worst first. CAT RC spans everything — a weak domain is a blind spot, not a preference.
            </p>
            <div className="space-y-1">
              {domains.map(d => {
                const b = band(d.accuracy);
                return (
                  <div key={d.domain} className={`grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-md ${b.bg}`}>
                    <span className="col-span-6 text-xs font-medium truncate" title={d.domain}>{d.domain}</span>
                    <span className={`col-span-2 text-center text-sm font-mono font-bold ${b.text}`}>
                      {d.accuracy != null ? `${d.accuracy}%` : '—'}
                    </span>
                    <span className="col-span-2 text-center text-[10px] font-mono text-muted-foreground">{d.passages}p</span>
                    <span className="col-span-2 text-right text-[10px] font-mono text-muted-foreground">{fmtTime(d.medianRead)}</span>
                  </div>
                );
              })}
            </div>
            {untouched.length > 0 && (
              <p className="text-[10px] text-amber-400 mt-3 leading-relaxed">
                Never attempted: {untouched.join(', ')}. Untested is not the same as strong — rotate these in.
              </p>
            )}
          </div>

          {/* VA by type */}
          {vaRows.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                VA by type
              </h3>
              <div className="space-y-1">
                {vaRows.map(r => {
                  const b = band(r.accuracy);
                  return (
                    <div key={r.type} className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${b.bg}`}>
                      <span className="text-xs font-medium flex-1 truncate">{r.type}</span>
                      {r.noPenalty && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                          TITA · never blank
                        </span>
                      )}
                      <span className={`text-sm font-mono font-bold w-12 text-right ${b.text}`}>
                        {r.accuracy != null ? `${r.accuracy}%` : '—'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{r.count}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
                Para Jumble and Odd Sentence Out carry no negative marking — leaving one blank is strictly
                worse than guessing. Para Summary is MCQ and does penalise.
              </p>
            </div>
          )}

          {/* Vault hypothesis check */}
          {pairing && pairing.hardPassageAccuracy != null && pairing.easyPassageAccuracy != null && (
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Hard passage &rarr; easy questions?
              </h3>
              <p className="text-[11px] text-muted-foreground mb-3">
                Your notes claim difficult passages carry easier questions. Checking it against your data:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-lg font-bold font-mono">{pairing.hardPassageAccuracy}%</p>
                  <p className="text-[10px] text-muted-foreground">on difficult passages</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-lg font-bold font-mono">{pairing.easyPassageAccuracy}%</p>
                  <p className="text-[10px] text-muted-foreground">on easy passages</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
                If these are close, a hard-reading passage is an opportunity rather than a warning — and
                skipping one on sight is costing you marks.
              </p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Error types — and what each one needs
              </h3>
              <div className="space-y-2">
                {errors.map(e => (
                  <div key={e.type} className="flex gap-3 items-start">
                    <span className="text-xs font-mono font-bold text-red-400 w-6 shrink-0">{e.count}&times;</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{e.type}</p>
                      <p className="text-[10px] text-blue-400 leading-relaxed">&rarr; {e.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showLog && <LogVARCDialog onClose={() => { setShowLog(false); refetch(); }} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold font-mono truncate" title={String(value)}>{value}</p>
      <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
    </div>
  );
}
