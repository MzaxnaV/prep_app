import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TimeAnalysis from "./TimeAnalysis";
import { KINDS, SECTIONS, fmtClock, setResult, toRecord, saveSection } from "@/lib/sectionTimer";

const RESULTS = [['Correct', 'Right'], ['Incorrect', 'Wrong'], ['Blank', 'Blank']];

/** After the clock stops: check answers, mark each item, save. The draft survives a reload here too. */
export default function TimerReview({ draft, onChange, onSaved, onDiscard }) {
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const record = toRecord(draft);

  async function save() {
    setSaving(true);
    const row = await saveSection(draft);
    onSaved(row);
  }

  const mark = (i, patch) => onChange(setResult(draft, i, patch));
  const toCount = v => (v === '' ? null : Math.max(0, Number(v)));

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="rounded-xl bg-card border border-border p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-lg font-bold">{SECTIONS[draft.section].label} · mark it</h2>
            <p className="text-xs text-muted-foreground">
              Check the answers, mark each item, then save. Explanations last — redo the wrong ones untimed first.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left font-normal pb-2">#</th>
                <th className="text-left font-normal pb-2">Item</th>
                <th className="text-right font-normal pb-2">Decide</th>
                <th className="text-right font-normal pb-2">Read</th>
                <th className="text-right font-normal pb-2">Solve</th>
                <th className="text-right font-normal pb-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((it, i) => {
                const K = KINDS[it.kind];
                const work = it.read_seconds + it.solve_seconds;
                return (
                  <tr key={it.n} className="border-t border-border/40">
                    <td className="py-2 font-mono text-muted-foreground">{it.n}</td>
                    <td className="py-2">
                      {K.label}
                      <span className="text-muted-foreground">
                        {it.decision === 'skip' ? ' · skipped' : it.status === 'left' ? ' · left' : ''}
                        {it.visits > 1 ? ` · ${it.visits} visits` : ''}
                      </span>
                    </td>
                    <td className={`py-2 text-right font-mono ${it.decide_seconds > K.decide ? 'text-amber-400' : ''}`}>
                      {fmtClock(it.decide_seconds)}
                    </td>
                    <td className={`py-2 text-right font-mono ${K.read && it.read_seconds > K.read ? 'text-amber-400' : ''}`}>
                      {K.read && it.decision === 'attempt' ? fmtClock(it.read_seconds) : ''}
                    </td>
                    <td className={`py-2 text-right font-mono ${work > K.cap ? 'text-red-400' : work > K.warn ? 'text-amber-400' : ''}`}>
                      {it.decision === 'attempt' ? fmtClock(K.read ? it.solve_seconds : work) : ''}
                    </td>
                    <td className="py-2 pl-3">
                      {it.decision === 'skip' ? (
                        <p className="text-right text-muted-foreground">—</p>
                      ) : K.unit === 'question' ? (
                        <div className="flex justify-end gap-1">
                          {RESULTS.map(([value, label]) => (
                            <button key={value} type="button" onClick={() => mark(i, { result: value })}
                              className={`h-7 px-2 rounded-md text-[11px] transition-colors ${
                                it.result === value
                                  ? value === 'Correct' ? 'bg-emerald-500/25 text-emerald-400 font-semibold'
                                    : value === 'Incorrect' ? 'bg-red-500/25 text-red-400 font-semibold'
                                    : 'bg-muted text-foreground font-semibold'
                                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                              }`}>{label}</button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-1 text-[11px] text-muted-foreground">
                          <Input type="number" min="0" className="h-7 w-14 text-xs font-mono" placeholder="Qs"
                            value={it.questions_answered ?? ''} onChange={e => mark(i, { questions_answered: toCount(e.target.value) })} />
                          answered
                          <Input type="number" min="0" className="h-7 w-14 text-xs font-mono ml-1" placeholder="0"
                            value={it.questions_correct ?? ''} onChange={e => mark(i, { questions_correct: toCount(e.target.value) })} />
                          right
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Time analysis</h3>
        <TimeAnalysis record={record} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant={confirmDiscard ? 'destructive' : 'ghost'} onClick={() => (confirmDiscard ? onDiscard() : setConfirmDiscard(true))}
          onBlur={() => setConfirmDiscard(false)}>
          {confirmDiscard ? 'Discard for good' : 'Discard'}
        </Button>
        <Button onClick={save} disabled={saving || record.items.length === 0}>Save</Button>
      </div>
    </div>
  );
}
