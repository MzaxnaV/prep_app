import { useState } from "react";
import { ChevronDown, Calculator } from "lucide-react";
import {
  FRACTION_GRID, PERCENT_PAIRS, GROWTH_MULTIPLIERS, PIE_ANGLES, MATH_CONSTANTS,
} from "../../lib/studyPlanData";

const TIER_LABEL = {
  1: 'reflex by Oct 4',
  2: 'solid by Oct 11',
  3: 'recognise on sight',
};
const TIER_CLASS = {
  1: 'text-accent border-accent/40',
  2: 'text-blue-400 border-blue-400/40',
  3: 'text-muted-foreground border-border',
};

function Family({ family, tier, cue, cells }) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h4 className="text-xs font-bold">{family}</h4>
        <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${TIER_CLASS[tier]}`}>
          {TIER_LABEL[tier]}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug mb-2">{cue}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
        {cells.map(([f, d, p]) => (
          <div key={f} className="flex items-baseline justify-between gap-2 font-mono text-[11px] tabular-nums border-b border-border/40 pb-0.5">
            <span className="font-semibold">{f}</span>
            <span className="text-muted-foreground">{d}</span>
            <span className="text-accent/80">{p}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The fraction sight-reading grid. Collapsed by default, and not rendered at all
 * while a drill run is in progress — the run is only honest if the table is out
 * of sight.
 */
export default function CalculationReference() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-6 text-left hover:bg-muted/20 transition-colors"
      >
        <Calculator className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Calculation reference
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Fraction sight-reading — {FRACTION_GRID.reduce((n, f) => n + f.cells.length, 0)} cells in{' '}
            {FRACTION_GRID.length} families. Every drill card is drawn from this table.
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            A decimal is inert; a fraction cancels. Index on the <strong>first two digits</strong> — this is
            a lookup, not a conversion. If you are working the fraction out, the entry isn&rsquo;t learned yet.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {FRACTION_GRID.map(f => <Family key={f.family} {...f} />)}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <h4 className="text-xs font-bold mb-1">Reciprocal pairs</h4>
              <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                An increase of 1/n is undone by a decrease of 1/(n+1).
              </p>
              <div className="space-y-0.5">
                {PERCENT_PAIRS.map(p => (
                  <div key={p.up} className="grid grid-cols-4 gap-1 font-mono text-[11px] tabular-nums border-b border-border/40 pb-0.5">
                    <span className="text-emerald-500">{p.up}</span>
                    <span className="text-muted-foreground">{p.upF}</span>
                    <span className="text-red-400">{p.down}</span>
                    <span className="text-muted-foreground">{p.downF}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <h4 className="text-xs font-bold mb-1">Growth multipliers</h4>
                <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                  14,400 at 8.33% for 2 years = 14400 × 169/144 = 16,900.
                </p>
                <div className="space-y-0.5">
                  {GROWTH_MULTIPLIERS.map(g => (
                    <div key={g.rate} className="grid grid-cols-3 gap-1 font-mono text-[11px] tabular-nums border-b border-border/40 pb-0.5">
                      <span className="font-semibold">{g.rate}</span>
                      <span className="text-muted-foreground">{g.y1}</span>
                      <span className="text-muted-foreground">{g.y2}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <h4 className="text-xs font-bold mb-1">Pie angles &amp; constants</h4>
                <p className="text-[11px] text-muted-foreground leading-snug mb-2">1% = 3.6°.</p>
                <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
                  {[...PIE_ANGLES, ...MATH_CONSTANTS].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-1 font-mono text-[11px] tabular-nums border-b border-border/40 pb-0.5">
                      <span className="font-semibold">{k}</span>
                      <span className="text-muted-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
