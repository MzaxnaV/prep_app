import { summariseByType, triageStats, failureModeCounts, calibrationStats, fmtTime } from "@/lib/dilrData";
import { Target, Timer, AlertTriangle, Compass } from "lucide-react";

// Accuracy bands. Red isn't failure — it's the skip list, which is the point:
// on exam day you want a pre-decided answer to "is this set for me?"
function band(accuracy) {
  if (accuracy == null) return { bg: 'bg-muted/30', text: 'text-muted-foreground', verdict: 'no data' };
  if (accuracy >= 85) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', verdict: 'hunt these' };
  if (accuracy >= 70) return { bg: 'bg-amber-500/15', text: 'text-amber-400', verdict: 'attempt' };
  if (accuracy >= 50) return { bg: 'bg-orange-500/15', text: 'text-orange-400', verdict: 'only if easy' };
  return { bg: 'bg-red-500/15', text: 'text-red-400', verdict: 'skip' };
}

export default function SetTypeHeatmap({ sets }) {
  if (!sets.length) {
    return (
      <div className="rounded-xl bg-card border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No DILR sets logged yet.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Log every set you attempt — including the ones you skip. Three weeks of this becomes your exam-day skip list.
        </p>
      </div>
    );
  }

  const rows = summariseByType(sets);
  const triage = triageStats(sets);
  const failures = failureModeCounts(sets);
  const calib = calibrationStats(sets);

  return (
    <div className="space-y-4">
      {/* Triage and calibration — tracked apart from solving, because they fail differently */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Target} label="Triage accuracy" value={triage.rate != null ? `${triage.rate}%` : '—'}
          sub={triage.judged ? `${triage.right}/${triage.judged} calls right` : 'not yet judged'} />
        <Stat icon={Compass} label="Intuition calibration" value={calib.rate != null ? `${calib.rate}%` : '—'}
          sub={calib.rated ? `${calib.under} underestimated` : 'rate difficulty before + after'} />
        <Stat icon={Timer} label="Sets logged" value={sets.length}
          sub={`${sets.filter(s => s.triage_decision === 'Attempted').length} attempted`} />
        <Stat icon={AlertTriangle} label="Top failure" value={failures[0]?.mode ?? '—'}
          sub={failures[0] ? `${failures[0].count} times` : 'nothing logged'} />
      </div>

      {calib.under > 0 && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/25 p-3">
          <p className="text-xs text-red-400 font-semibold mb-0.5">
            {calib.under} set{calib.under > 1 ? 's' : ''} looked easier than they were
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            These are the trap sets — the ones that pass triage and then eat the section. Re-read your notes on
            them together and look for the shared tell. That tell is the answer to &ldquo;what makes a set easy?&rdquo;
          </p>
        </div>
      )}

      {/* The heatmap proper */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Set type performance
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Sorted worst first. The bottom rows are your skip list — decide now, not in the exam hall.
        </p>

        <div className="grid grid-cols-12 gap-1 text-[9px] text-muted-foreground font-bold uppercase px-2 mb-1">
          <span className="col-span-4">Type</span>
          <span className="col-span-2 text-center">Accuracy</span>
          <span className="col-span-2 text-center">Cracked</span>
          <span className="col-span-2 text-center">Median</span>
          <span className="col-span-2 text-right">Verdict</span>
        </div>

        <div className="space-y-1">
          {rows.map(r => {
            const b = band(r.accuracy);
            return (
              <div key={r.type} className={`grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-md ${b.bg}`}>
                <span className="col-span-4 text-xs font-medium truncate" title={r.type}>{r.type}</span>
                <span className={`col-span-2 text-center text-sm font-mono font-bold ${b.text}`}>
                  {r.accuracy != null ? `${r.accuracy}%` : '—'}
                </span>
                <span className="col-span-2 text-center text-xs font-mono text-muted-foreground">
                  {r.solveRate != null ? `${r.solveRate}%` : '—'}
                </span>
                <span className={`col-span-2 text-center text-xs font-mono ${
                  r.medianTime > 720 ? 'text-red-400' : 'text-muted-foreground'
                }`}>
                  {fmtTime(r.medianTime)}
                </span>
                <span className={`col-span-2 text-right text-[10px] font-bold uppercase ${b.text}`}>{b.verdict}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
          Median over 12:00 is shown red — a set type you solve accurately but slowly is still a trap,
          because it eats the two sets you would have cracked instead.
        </p>
      </div>

      {/* Failure modes with their matching fix */}
      {failures.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Failure modes — and what each one actually needs
          </h3>
          <div className="space-y-2">
            {failures.map(f => (
              <div key={f.mode} className="flex gap-3 items-start">
                <span className="text-xs font-mono font-bold text-red-400 w-6 shrink-0">{f.count}×</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium">{f.mode}</p>
                  <p className="text-[10px] text-blue-400 leading-relaxed">→ {f.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
