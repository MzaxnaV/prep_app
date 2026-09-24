import { useState } from "react";
import { db } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QA_TOPICS, CONFIDENCE, ERROR_TYPES, ERROR_FIX, CONFIDENCE_DIAGNOSIS, areaOf } from "@/lib/qaData";
import moment from "moment";

// CAT QA only — unrelated to CFA Quantitative Methods.
// Log the wrong ones, the skipped ones, and anything that took over 2 minutes.
// Logging all 25 every day is not the goal; the diagnostic ones are.
// From the section timer: `defaults` carries its times, `single` drops "Save + next".
export default function LogQuestionDialog({ onClose, defaults = {}, single = false, onSaved }) {
  const [form, setForm] = useState({
    date: moment().format('YYYY-MM-DD'),
    source: '',
    topic: '',
    confidence: '',
    result: 'Incorrect',
    time_seconds: '',
    error_type: 'None',
    notes: '',
    ...defaults,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const diagnosis = form.confidence && form.result === 'Incorrect'
    ? CONFIDENCE_DIAGNOSIS[form.confidence] : null;

  const save = async (again) => {
    if (!form.topic) return;
    setSaving(true);
    await db.entities.QAQuestion.create({
      ...form,
      area: areaOf(form.topic),
      time_seconds: form.time_seconds === '' ? null : Math.round(Number(form.time_seconds) * 60),
    });
    await onSaved?.();
    setSaving(false);
    if (again) {
      setForm(f => ({
        ...f, topic: '', confidence: '', result: 'Incorrect',
        time_seconds: '', error_type: 'None', notes: '',
      }));
    } else {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Log QA Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Date</Label>
              <Input type="date" className="h-8 text-xs" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Source</Label>
              <Input className="h-8 text-xs" placeholder="Sarvesh Ch.4 / CAT 2023 S2"
                value={form.source} onChange={e => set('source', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Topic</Label>
            <Select value={form.topic} onValueChange={v => set('topic', v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick the topic" /></SelectTrigger>
              <SelectContent>
                {Object.entries(QA_TOPICS).map(([area, topics]) => (
                  <SelectGroup key={area}>
                    <SelectLabel className="text-[10px] uppercase tracking-wider">{area}</SelectLabel>
                    {topics.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confidence at the 15-second evaluate step — the vault's taxonomy.
              A wrong answer means something different from each bucket. */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
              How it felt at the 15-second read
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {CONFIDENCE.map(c => (
                <button key={c} onClick={() => set('confidence', form.confidence === c ? '' : c)}
                  className={`h-8 rounded-md text-[11px] transition-colors ${
                    form.confidence === c ? 'bg-purple-500/25 text-purple-300 font-semibold' : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}>{c}</button>
              ))}
            </div>
            {diagnosis && (
              <p className="text-[10px] text-blue-400 leading-relaxed">
                → <span className="font-semibold">{diagnosis.label}.</span> {diagnosis.fix}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Result</Label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {['Correct', 'Incorrect', 'Skipped'].map(r => (
                  <button key={r} onClick={() => set('result', r)}
                    className={`h-8 rounded-md text-[10px] transition-colors ${
                      form.result === r
                        ? r === 'Correct' ? 'bg-emerald-500/25 text-emerald-400 font-semibold'
                          : r === 'Incorrect' ? 'bg-red-500/25 text-red-400 font-semibold'
                          : 'bg-muted text-foreground font-semibold'
                        : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}>{r === 'Incorrect' ? 'Wrong' : r === 'Skipped' ? 'Skip' : 'Right'}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Time (min)</Label>
              <Input type="number" step="0.25" className="h-8 text-xs mt-1" placeholder="2"
                value={form.time_seconds} onChange={e => set('time_seconds', e.target.value)} />
              {Number(form.time_seconds) >= 3 && form.result !== 'Correct' && (
                <p className="text-[10px] text-red-400 mt-1">Ego question — 3+ min for nothing.</p>
              )}
            </div>
          </div>

          {form.result !== 'Correct' && (
            <div>
              <Label className="text-[11px] text-muted-foreground">What went wrong</Label>
              <Select value={form.error_type} onValueChange={v => set('error_type', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ERROR_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {ERROR_FIX[form.error_type] && (
                <p className="text-[10px] text-blue-400 mt-1.5 leading-relaxed">→ {ERROR_FIX[form.error_type]}</p>
              )}
            </div>
          )}

          <div>
            <Label className="text-[11px] text-muted-foreground">The shortcut or formula I missed</Label>
            <Textarea className="text-xs min-h-16" placeholder="What was the fast path?"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>Cancel</Button>
            {!single && (
              <Button size="sm" className="flex-1" disabled={!form.topic || saving} onClick={() => save(true)}>
                Save + next
              </Button>
            )}
            <Button size="sm" variant={single ? 'default' : 'secondary'} disabled={!form.topic || saving} onClick={() => save(false)}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
