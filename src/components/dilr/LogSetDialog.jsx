import { useState } from "react";
import { db } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SET_TYPES, FAILURE_MODES, FAILURE_FIX, DIFFICULTY } from "@/lib/dilrData";
import moment from "moment";

// Logged 3-4x per session, so entry has to be fast: date and source persist
// between saves, everything else is one tap or one number.
// From the section timer: `defaults` carries its times, `single` drops "Save + next set".
export default function LogSetDialog({ onClose, defaults = {}, single = false, onSaved }) {
  const [form, setForm] = useState({
    date: moment().format('YYYY-MM-DD'),
    source: '',
    set_type: '',
    perceived_difficulty: '',
    actual_difficulty: '',
    triage_decision: 'Attempted',
    triage_was_correct: null,
    time_seconds: '',
    questions_total: '',
    questions_correct: '',
    solved_fully: false,
    failure_mode: 'None',
    notes: '',
    ...defaults,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const attempted = form.triage_decision === 'Attempted';

  const save = async (again) => {
    if (!form.set_type) return;
    setSaving(true);
    await db.entities.DILRSet.create({
      ...form,
      time_seconds: form.time_seconds === '' ? null : Math.round(Number(form.time_seconds) * 60),
      questions_total: form.questions_total === '' ? null : Number(form.questions_total),
      questions_correct: form.questions_correct === '' ? null : Number(form.questions_correct),
    });
    await onSaved?.();
    setSaving(false);
    if (again) {
      // Keep date + source; clear the per-set fields for the next one.
      setForm(f => ({
        ...f,
        set_type: '', perceived_difficulty: '', actual_difficulty: '',
        triage_decision: 'Attempted', triage_was_correct: null,
        time_seconds: '', questions_total: '', questions_correct: '',
        solved_fully: false, failure_mode: 'None', notes: '',
      }));
    } else {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Log DILR Set</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Date</Label>
              <Input type="date" className="h-8 text-xs" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Source</Label>
              <Input className="h-8 text-xs" placeholder="CAT 2023 S1 / Cracku Sec 4"
                value={form.source} onChange={e => set('source', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Set type</Label>
            <Select value={form.set_type} onValueChange={v => set('set_type', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick the archetype" /></SelectTrigger>
              <SelectContent>
                {SET_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Intuition calibration — the vault's "What makes S easy?" question,
              made measurable. Perceived before, actual after. */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Intuition calibration</p>
            <div className="grid grid-cols-2 gap-3">
              {[['perceived_difficulty', 'Looked (before)'], ['actual_difficulty', 'Was (after)']].map(([field, label]) => (
                <div key={field}>
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {DIFFICULTY.map(d => (
                      <button key={d} onClick={() => set(field, form[field] === d ? '' : d)}
                        className={`h-7 rounded-md text-[10px] transition-colors ${
                          form[field] === d ? 'bg-purple-500/25 text-purple-300 font-semibold' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                        }`}>{d[0]}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {form.perceived_difficulty && form.actual_difficulty &&
              DIFFICULTY.indexOf(form.perceived_difficulty) < DIFFICULTY.indexOf(form.actual_difficulty) && (
              <p className="text-[10px] text-red-400 leading-relaxed">
                → Underestimated. This is the trap-set pattern — note in the box below exactly what made it look easy.
              </p>
            )}
          </div>

          {/* Triage — scored separately from solving. This is the 50% skill. */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">60-second triage</p>
            <div className="grid grid-cols-2 gap-2">
              {['Attempted', 'Skipped'].map(d => (
                <button key={d} onClick={() => set('triage_decision', d)}
                  className={`h-8 rounded-md text-xs font-medium transition-colors ${
                    form.triage_decision === d ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}>{d}</button>
              ))}
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">In hindsight, was that call right?</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[['Yes', true], ['No', false], ['—', null]].map(([label, val]) => (
                  <button key={label} onClick={() => set('triage_was_correct', val)}
                    className={`h-7 rounded-md text-[11px] transition-colors ${
                      form.triage_was_correct === val ? 'bg-amber-500/20 text-amber-500 font-semibold' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {attempted && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Time (min)</Label>
                  <Input type="number" step="0.5" className="h-8 text-xs" placeholder="10"
                    value={form.time_seconds} onChange={e => set('time_seconds', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Questions</Label>
                  <Input type="number" className="h-8 text-xs" placeholder="4"
                    value={form.questions_total} onChange={e => set('questions_total', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Correct</Label>
                  <Input type="number" className="h-8 text-xs" placeholder="3"
                    value={form.questions_correct} onChange={e => set('questions_correct', e.target.value)} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={form.solved_fully} onCheckedChange={v => set('solved_fully', !!v)} />
                <span className="text-xs text-muted-foreground">Cracked it fully (grid completely determined)</span>
              </label>

              <div>
                <Label className="text-[11px] text-muted-foreground">What went wrong</Label>
                <Select value={form.failure_mode} onValueChange={v => set('failure_mode', v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FAILURE_MODES.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                {FAILURE_FIX[form.failure_mode] && (
                  <p className="text-[10px] text-blue-400 mt-1.5 leading-relaxed">→ {FAILURE_FIX[form.failure_mode]}</p>
                )}
              </div>
            </>
          )}

          <div>
            <Label className="text-[11px] text-muted-foreground">The pattern to remember</Label>
            <Textarea className="text-xs min-h-16" placeholder="What was the entry point? What should I have seen first?"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
            {!single && (
              <Button size="sm" className="flex-1" disabled={!form.set_type || saving} onClick={() => save(true)}>
                Save + next set
              </Button>
            )}
            <Button size="sm" variant={single ? 'default' : 'secondary'} disabled={!form.set_type || saving} onClick={() => save(false)}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
