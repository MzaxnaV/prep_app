import { useState } from "react";
import { ChevronDown, X as Times } from "lucide-react";
import { MULTIPLICATION_GRID } from "../../lib/studyPlanData";
import { multiplicationEntry } from "../../lib/drill";

const TIER_LABEL = {
  1: 'instant, both ways',
  2: 'solid',
  3: 'recognise on sight',
};
const TIER_CLASS = {
  1: 'text-accent border-accent/40',
  2: 'text-blue-400 border-blue-400/40',
  3: 'text-muted-foreground border-border',
};

function Family({ family, kind, tier, cue, cells }) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h4 className="text-xs font-bold">{family}</h4>
        <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${TIER_CLASS[tier]}`}>
          {TIER_LABEL[tier]}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug mb-2">{cue}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-1">
        {cells.map(cell => {
          const { key, label, value } = multiplicationEntry(kind, cell);
          return (
            <div key={key} className="flex items-baseline justify-between gap-2 font-mono text-[11px] tabular-nums border-b border-border/40 pb-0.5">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The multiplication tables the evening drill is drawn from. Collapsed by
 * default, and not rendered at all while a run is in progress.
 */
export default function MultiplicationReference() {
  const [open, setOpen] = useState(false);
  const total = MULTIPLICATION_GRID.reduce((n, f) => n + f.cells.length, 0);

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-6 text-left hover:bg-muted/20 transition-colors"
      >
        <Times className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Multiplication reference
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tables, squares, cubes, powers — {total} entries in {MULTIPLICATION_GRID.length} families.
            Every multiplication card is drawn from this table.
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Both directions, always: 7 × 8 and 56 ÷ 7 are the same fact, and Zetamac asks for both. If you
            are building an answer from ×10, the entry isn&rsquo;t learned yet.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {MULTIPLICATION_GRID.map(f => <Family key={f.family} {...f} />)}
          </div>
        </div>
      )}
    </div>
  );
}
