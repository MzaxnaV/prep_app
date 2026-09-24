import { useState } from "react";
import { db } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RC_DOMAINS, VA_TYPES, VA_NO_PENALTY, DIFFICULTY, VARC_ERRORS, VARC_ERROR_FIX } from "@/lib/varcData";
import moment from "moment";

// From the section timer: `defaults` carries its times, `single` drops "Save + next".
export default function LogVARCDialog({ onClose, defaults = {}, single = false, onSaved }) {
  const [form, setForm] = useState({
    date: moment().format('YYYY-MM-DD'),
    source: '',
    kind: 'RC Passage',
    domain: '',
    va_type: '',
    passage_difficulty: '',
    question_difficulty: '',
    read_time_seconds: '',
    solve_time_seconds: '',
    questions_total: '',
    questions_correct: '',
    summary_written: false,
    error_type: 'None',
    notes: '',
    ...defaults,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isRC = form.kind === 'RC Passage';

  const save = async (again) => {
    setSaving(true);
    const toSecs = v => (v === '' ? null : Math.round(Number(v) * 60));
    await db.entities.VARCItem.create({
      ...form,
      read_time_seconds: isRC ? toSecs(form.read_time_seconds) : null,
      solve_time_seconds: toSecs(form.solve_time_seconds),
      questions_total: form.questions_total === '' ? (isRC ? null : 1) : Number(form.questions_total),
      questions_correct: form.questions_correct === '' ? null : Number(form.questions_correct),
    });
    await onSaved?.();
    setSaving(false);
    if (again) {
      setForm(f => ({
        ...f, domain: '', va_type: '', passage_difficulty: '', question_difficulty: '',
        read_time_seconds: '', solve_time_seconds: '', questions_total: '', questions_correct: '',
        summary_written: false, error_type: 'None', notes: '',
      }));
    } else {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Log VARC</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {['RC Passage', 'VA Question'].map(k => (
              <button key={k} onClick={() => set('kind', k)}
                className={`h-8 rounded-md text-xs font-medium transition-colors ${
                  form.kind === k ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}>{k}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Date</Label>
              <Input type="date" className="h-8 text-xs" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Source</Label>
              <Input className="h-8 text-xs" placeholder="CAT 2023 S1 / VARC1000"
                value={form.source} onChange={e => set('source', e.target.value)} />
            </div>
          </div>

          {isRC ? (
            <>
              <div>
                <Label className="text-[11px] text-muted-foreground">Domain</Label>
                <Select value={form.domain} onValueChange={v => set('domain', v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Subject area" /></SelectTrigger>
                  <SelectContent>
                    {RC_DOMAINS.map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Vault observation: hard passage tends to carry easy questions. */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Passage vs questions</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['passage_difficulty', 'Passage was'], ['question_difficulty', 'Questions were']].map(([field, label]) => (
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
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Read (min)</Label>
                  <Input type="number" step="0.25" className="h-8 text-xs" placeholder="2.5"
                    value={form.read_time_seconds} onChange={e => set('read_time_seconds', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Solve</Label>
                  <Input type="number" step="0.25" className="h-8 text-xs" placeholder="5.5"
                    value={form.solve_time_seconds} onChange={e => set('solve_time_seconds', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Qs</Label>
                  <Input type="number" className="h-8 text-xs" placeholder="4"
                    value={form.questions_total} onChange={e => set('questions_total', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Right</Label>
                  <Input type="number" className="h-8 text-xs" placeholder="3"
                    value={form.questions_correct} onChange={e => set('questions_correct', e.target.value)} />
                </div>
              </div>
              {Number(form.read_time_seconds) > 2.75 && (
                <p className="text-[10px] text-amber-400">
                  Over 2:45 reading. Target is 2–2.5 min for ~500 words.
                </p>
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={form.summary_written} onCheckedChange={v => set('summary_written', !!v)} />
                <span className="text-xs text-muted-foreground">Wrote the 3-line summary from memory first</span>
              </label>
            </>
          ) : (
            <>
              <div>
                <Label className="text-[11px] text-muted-foreground">VA type</Label>
                <Select value={form.va_type} onValueChange={v => set('va_type', v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Question type" /></SelectTrigger>
                  <SelectContent>
                    {VA_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.va_type && VA_NO_PENALTY[form.va_type] && (
                  <p className="text-[10px] text-emerald-400 mt-1.5">
                    TITA — no negative marking. Never leave this blank; a guess is strictly better.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Time (min)</Label>
                  <Input type="number" step="0.25" className="h-8 text-xs" placeholder="1"
                    value={form.solve_time_seconds} onChange={e => set('solve_time_seconds', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Qs</Label>
                  <Input type="number" className="h-8 text-xs" placeholder="1"
                    value={form.questions_total} onChange={e => set('questions_total', e.target.value)} />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Right</Label>
                  <Input type="number" className="h-8 text-xs" placeholder="1"
                    value={form.questions_correct} onChange={e => set('questions_correct', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div>
            <Label className="text-[11px] text-muted-foreground">What went wrong</Label>
            <Select value={form.error_type} onValueChange={v => set('error_type', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VARC_ERRORS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {VARC_ERROR_FIX[form.error_type] && (
              <p className="text-[10px] text-blue-400 mt-1.5 leading-relaxed">→ {VARC_ERROR_FIX[form.error_type]}</p>
            )}
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">
              {isRC ? "The author's actual argument (and what I missed)" : 'The pattern I missed'}
            </Label>
            <Textarea className="text-xs min-h-16" placeholder={isRC ? 'In 2–3 sentences…' : 'Opening sentence? Pronoun chain? Theme outlier?'}
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
            {!single && <Button size="sm" className="flex-1" disabled={saving} onClick={() => save(true)}>Save + next</Button>}
            <Button size="sm" variant={single ? 'default' : 'secondary'} disabled={saving} onClick={() => save(false)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
