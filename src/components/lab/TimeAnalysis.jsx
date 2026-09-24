import { KINDS, analyse, fmtClock } from "@/lib/sectionTimer";

const TONE = {
  good: 'text-emerald-400',
  bad: 'text-red-400',
  warn: 'text-amber-400',
  muted: 'text-muted-foreground',
};

/** Where the minutes went — the vault's time analysis, filled in. */
export default function TimeAnalysis({ record }) {
  const a = analyse(record);
  const of = a.limit ? `of ${fmtClock(a.limit)}` : 'of the time spent';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Items" value={a.total} sub={`${a.attemptPct}% attempted`} />
        <Tile label="Time" value={fmtClock(a.elapsed)} sub={a.limit ? `limit ${fmtClock(a.limit)}` : 'no limit'}
          warn={a.limit && a.elapsed > a.limit} />
        <Tile label="Deciding" value={fmtClock(a.deciding.seconds)} sub={`${a.deciding.pct}% ${a.limit ? 'of limit' : 'of time'}`} />
      </div>

      {a.byKind.map(k => {
        const K = KINDS[k.kind];
        return (
          <div key={k.kind} className="rounded-lg border border-border p-3">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="text-xs font-semibold">{k.label} · {k.total}</p>
              <p className="text-[11px] font-mono text-muted-foreground">
                {k.answered ? `${k.correct}/${k.answered} right · ${k.accuracy}%` : 'no answers marked'}
              </p>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  <th className="text-left font-normal pb-1"></th>
                  <th className="text-right font-normal pb-1">#</th>
                  <th className="text-right font-normal pb-1">Time</th>
                  <th className="text-right font-normal pb-1">{of}</th>
                </tr>
              </thead>
              <tbody>
                {k.rows.map(r => (
                  <tr key={r.label} className="border-t border-border/40">
                    <td className={`py-1 ${TONE[r.tone]}`}>{r.label}</td>
                    <td className="py-1 text-right font-mono">{r.count}</td>
                    <td className="py-1 text-right font-mono">{fmtClock(r.seconds)}</td>
                    <td className="py-1 text-right font-mono">{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[11px]">
              <Median label="Median decide" value={k.medianDecide} target={K.decide}
                extra={k.slowDecides ? `${k.slowDecides} past ${fmtClock(K.decide)}` : null} />
              <Median label={K.read ? 'Median read + solve' : 'Median solve'} value={k.medianWork} target={K.warn}
                extra={k.overCap ? `${k.overCap} past the ${fmtClock(K.cap)} cap` : null} />
              {K.read && <Median label="Median read" value={k.medianRead} target={K.read} />}
            </div>
          </div>
        );
      })}

      {a.unaccounted >= 5 && (
        <p className="text-[10px] text-muted-foreground">
          {fmtClock(a.unaccounted)} went on an item still undecided when the section ended — not counted above.
        </p>
      )}
    </div>
  );
}

function Tile({ label, value, sub, warn }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold font-mono ${warn ? 'text-red-400' : ''}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Median({ label, value, target, extra }) {
  const slow = value != null && value > target;
  return (
    <div>
      <span className="text-muted-foreground">{label} </span>
      <span className={`font-mono font-semibold ${slow ? 'text-amber-400' : ''}`}>{value == null ? '—' : fmtClock(value)}</span>
      <span className="text-muted-foreground font-mono"> / {fmtClock(target)}</span>
      {extra && <p className="text-[10px] text-red-400">{extra}</p>}
    </div>
  );
}
