import {
  summariseByTopic, confidenceBreakdown, timeBleed, egoQuestions,
  errorTypeCounts, AREA_WEIGHT, fmtTime, fmtMinutes,
} from "@/lib/qaData";
import { Brain, Timer, AlertTriangle, Flame } from "lucide-react";

function band(accuracy) {
  if (accuracy == null) return { bg: 'bg-muted/30', text: 'text-muted-foreground', verdict: 'no data' };
  if (accuracy >= 85) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', verdict: 'secure' };
  if (accuracy >= 70) return { bg: 'bg-amber-500/15', text: 'text-amber-400', verdict: 'shore up' };
  if (accuracy >= 50) return { bg: 'bg-orange-500/15', text: 'text-orange-400', verdict: 'weak' };
  return { bg: 'bg-red-500/15', text: 'text-red-400', verdict: 'leaking' };
}

export default function TopicHeatmap({ questions }) {
  if (!questions.length) {
    return (
      <div className="rounded-xl bg-card border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No QA questions logged yet.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Log the wrong ones, the skipped ones, and anything that took over 2 minutes. Not all 25 — just the diagnostic ones.
        </p>
      </div>
    );
  }

  const rows = summariseByTopic(questions);
  const confidence = confidenceBreakdown(questions);
  const bleed = timeBleed(questions);
  const ego = egoQuestions(questions);
  const errors = errorTypeCounts(questions);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Brain} label="Questions logged" value={questions.length}
          sub={`${questions.filter(q => q.result === 'Correct').length} correct`} />
        <Stat icon={Timer} label="Time on zero-score" value={`${bleed.wastedPct}%`}
          sub={`${fmtMinutes(bleed.incorrect + bleed.skipped)} wrong + skipped`} />
        <Stat icon={Flame} label="Ego questions" value={ego.length}
          sub="3+ min, scored nothing" />
        <Stat icon={AlertTriangle} label="Top error" value={errors[0]?.type ?? '—'}
          sub={errors[0] ? `${errors[0].count} times` : 'nothing logged'} />
      </div>

      {/* The vault's diagnosis: a wrong answer means something different
          depending on which confidence bucket it came from. */}
      {confidence.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Confidence &rarr; diagnosis
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            &ldquo;I got 14/25&rdquo; tells you nothing. <em>Which</em> questions you got wrong tells you everything.
          </p>
          <div className="space-y-2">
            {confidence.map(c => (
              <div key={c.level} className="flex gap-3 items-start py-1.5 border-b border-border/50 last:border-0">
                <div className="w-24 shrink-0">
                  <p className="text-xs font-medium">{c.level}</p>
                  <p className="text-[10px] text-muted-foreground">{c.total} logged</p>
                </div>
                <div className="w-12 shrink-0 text-center">
                  <p className={`text-sm font-mono font-bold ${
                    c.accuracy == null ? 'text-muted-foreground'
                      : c.accuracy >= 80 ? 'text-emerald-400'
                      : c.accuracy >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`}>{c.accuracy != null ? `${c.accuracy}%` : '—'}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground">{c.label}</p>
                  <p className="text-[10px] text-blue-400 leading-relaxed">{c.fix}</p>
                </div>
              </div>
            ))}
          </div>
          {confidence.find(c => c.level === 'Comfortable' && c.wrong > 0) && (
            <p className="text-[10px] text-red-400 mt-3 leading-relaxed">
              {confidence.find(c => c.level === 'Comfortable').wrong} question(s) you felt comfortable about
              went wrong. That is the most expensive bucket — you had no warning, so you did not skip.
            </p>
          )}
        </div>
      )}

      {/* Time bleed — the vault asks for exactly this split */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Where the time went
        </h3>
        <div className="flex h-3 rounded-full overflow-hidden mb-2">
          <div className="bg-emerald-500" style={{ width: `${bleed.correctPct}%` }} />
          <div className="bg-red-500" style={{ width: `${bleed.incorrectPct}%` }} />
          <div className="bg-muted-foreground/40" style={{ width: `${bleed.skippedPct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Correct', bleed.correct, bleed.correctPct, 'text-emerald-400'],
            ['Wrong', bleed.incorrect, bleed.incorrectPct, 'text-red-400'],
            ['Skipped', bleed.skipped, bleed.skippedPct, 'text-muted-foreground'],
          ].map(([label, secs, pct, color]) => (
            <div key={label}>
              <p className={`text-sm font-mono font-bold ${color}`}>{pct}%</p>
              <p className="text-[10px] text-muted-foreground">{label} · {fmtMinutes(secs)}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
          Time on wrong and skipped questions bought nothing. Under ~25% is healthy; above 40% means
          selection is failing at the 15-second evaluate step, not at solving.
        </p>
      </div>

      {/* Topic heatmap */}
      <div className="rounded-xl bg-card border border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Topic performance
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Worst first. Weight your response by area share — Arithmetic is ~40% of the section, Modern Math ~5%.
        </p>

        <div className="grid grid-cols-12 gap-1 text-[9px] text-muted-foreground font-bold uppercase px-2 mb-1">
          <span className="col-span-4">Topic</span>
          <span className="col-span-3">Area</span>
          <span className="col-span-2 text-center">Accuracy</span>
          <span className="col-span-1 text-center">n</span>
          <span className="col-span-2 text-right">Median</span>
        </div>

        <div className="space-y-1">
          {rows.map(r => {
            const b = band(r.accuracy);
            return (
              <div key={r.topic} className={`grid grid-cols-12 gap-1 items-center px-2 py-1.5 rounded-md ${b.bg}`}>
                <span className="col-span-4 text-xs font-medium truncate" title={r.topic}>{r.topic}</span>
                <span className="col-span-3 text-[10px] text-muted-foreground truncate">
                  {r.area} <span className="opacity-60">{AREA_WEIGHT[r.area]}</span>
                </span>
                <span className={`col-span-2 text-center text-sm font-mono font-bold ${b.text}`}>
                  {r.accuracy != null ? `${r.accuracy}%` : '—'}
                </span>
                <span className="col-span-1 text-center text-[10px] font-mono text-muted-foreground">{r.seen}</span>
                <span className={`col-span-2 text-right text-xs font-mono ${
                  r.medianTime > 150 ? 'text-red-400' : 'text-muted-foreground'
                }`}>{fmtTime(r.medianTime)}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-3 leading-relaxed">
          Median over 2:30 shown red. A topic you get right but slowly still costs you the questions you never reached.
        </p>
      </div>

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
