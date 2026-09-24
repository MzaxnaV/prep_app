import { useState, useMemo } from "react";
import { db } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, CheckCircle2, CircleDashed, PlusCircle } from "lucide-react";
import { isAnalysed } from "@/lib/mockAnalysis";
import moment from "moment";

const PLATFORMS = ['IMS SimCAT', 'TIME AIMCAT', 'Career Launcher', 'Cracku', '2IIM', 'CFA Institute', 'Kaplan Schweser', 'Other'];
const CAT_SECTIONS = [['VARC', 'varc'], ['DILR', 'dilr'], ['QA', 'quant']];
// CAT 2024–25 pattern. Prefilled so a manual entry only needs attempted + correct.
const CAT_TOTALS = { varc: 24, dilr: 22, quant: 22 };

function sectionsOf(mock) {
  if (mock.exam_type === 'CAT Full') return CAT_SECTIONS;
  if (mock.exam_type === 'CAT Sectional') {
    const found = CAT_SECTIONS.find(([lbl]) => lbl === mock.section);
    return found ? [found] : [];
  }
  return [['Overall', 'cfa']];
}

/** attempted = correct + wrong; the store keeps the components, not the sum. */
function tally(mock, prefix) {
  const c = Number(mock[`${prefix}_correct`]) || 0;
  const w = Number(mock[`${prefix}_incorrect`]) || 0;
  const att = c + w;
  return { c, w, att, acc: att ? Math.round((c / att) * 100) : null };
}

export default function MockAnalysisDialog({ mocks = [], initialMock = null, onClose }) {
  const [step, setStep] = useState(initialMock ? 'analyse' : 'select');
  const [selected, setSelected] = useState(initialMock);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'select' && !initialMock && (
              <button
                type="button"
                onClick={() => { setStep('select'); setSelected(null); }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Back to mock list"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            Mock Analysis
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <SelectMock
            mocks={mocks}
            onPick={m => { setSelected(m); setStep('analyse'); }}
            onManual={() => setStep('manual')}
          />
        )}

        {step === 'analyse' && selected && (
          <AnalysisForm mock={selected} onClose={onClose} />
        )}

        {step === 'manual' && <ManualEntry onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function SelectMock({ mocks, onPick, onManual }) {
  const pending = mocks.filter(m => !isAnalysed(m)).length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Which mock are you writing up?
        {pending > 0 && (
          <span className="text-amber-400 font-medium"> {pending} still unanalysed.</span>
        )}
      </p>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {mocks.map(m => {
          const done = isAnalysed(m);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(m)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
            >
              {done
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                : <CircleDashed className="w-4 h-4 text-amber-400 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {moment(m.date).format('MMM D, YYYY')}
                  {m.platform && <span className="text-muted-foreground font-normal"> · {m.platform}</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {m.exam_type}{m.section ? ` · ${m.section}` : ''}
                  {m.overall_score != null && ` · score ${m.overall_score}`}
                </p>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wide shrink-0 ${
                done ? 'text-emerald-500' : 'text-amber-400'
              }`}>
                {done ? 'analysed' : 'pending'}
              </span>
            </button>
          );
        })}

        {mocks.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">No mocks logged yet.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onManual}
        className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:bg-muted/40 transition-colors text-left"
      >
        <PlusCircle className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm">
          Not listed — <span className="text-muted-foreground">enter it manually</span>
        </span>
      </button>
    </div>
  );
}

/** Read-only recap so the numbers are in front of you while writing. */
function Recap({ mock }) {
  const rows = sectionsOf(mock).map(([label, prefix]) => ({ label, ...tally(mock, prefix) }));
  const any = rows.some(r => r.att > 0);
  if (!any) return null;

  const total = rows.reduce(
    (a, r) => ({ c: a.c + r.c, att: a.att + r.att }),
    { c: 0, att: 0 }
  );
  const overallAcc = total.att ? Math.round((total.c / total.att) * 100) : null;

  return (
    <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5">
      <div className="grid grid-cols-4 gap-2 text-[9px] font-bold uppercase text-muted-foreground">
        <span />
        <span className="text-center">Attempted</span>
        <span className="text-center">Correct</span>
        <span className="text-center">Accuracy</span>
      </div>
      {rows.map(r => (
        <div key={r.label} className="grid grid-cols-4 gap-2 items-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.label}</span>
          <span className="text-xs font-mono text-center">{r.att || '—'}</span>
          <span className="text-xs font-mono text-emerald-400 text-center">{r.c || '—'}</span>
          <span className={`text-xs font-mono text-center ${
            r.acc != null && r.acc < 60 ? 'text-red-400' : 'text-muted-foreground'
          }`}>
            {r.acc != null ? `${r.acc}%` : '—'}
          </span>
        </div>
      ))}
      {rows.length > 1 && (
        <div className="grid grid-cols-4 gap-2 items-center border-t border-border pt-1.5">
          <span className="text-[10px] font-bold uppercase">Overall</span>
          <span className="text-xs font-mono text-center font-bold">{total.att}</span>
          <span className="text-xs font-mono text-emerald-400 text-center font-bold">{total.c}</span>
          <span className="text-xs font-mono text-center font-bold">
            {overallAcc != null ? `${overallAcc}%` : '—'}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * The three written fields, prompted with the questions the plan actually asks
 * after a mock — the point of the rule is that these get answered, not that a
 * box gets filled.
 */
function NoteFields({ form, setField }) {
  return (
    <>
      <div>
        <Label className="text-xs">Key mistakes & learnings</Label>
        <p className="text-[10px] text-muted-foreground mb-1">
          For wrong answers: comprehension failure, inference failure, or trap? Each needs a different fix.
        </p>
        <Textarea rows={3} value={form.key_mistakes}
          onChange={e => setField('key_mistakes', e.target.value)}
          placeholder="What went wrong, and which kind of wrong was it?" />
      </div>
      <div>
        <Label className="text-xs">Strategy notes</Label>
        <p className="text-[10px] text-muted-foreground mb-1">
          Which sets did you attempt? Which should you have skipped? Why did you attempt what you attempted?
        </p>
        <Textarea rows={3} value={form.strategy_notes}
          onChange={e => setField('strategy_notes', e.target.value)}
          placeholder="Set selection and attempt decisions..." />
      </div>
      <div>
        <Label className="text-xs">Time analysis</Label>
        <p className="text-[10px] text-muted-foreground mb-1">Where did you bleed time?</p>
        <Textarea rows={2} value={form.time_analysis}
          onChange={e => setField('time_analysis', e.target.value)}
          placeholder="Time per section, where it ran out..." />
      </div>
    </>
  );
}

function AnalysisForm({ mock, onClose }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    key_mistakes: mock.key_mistakes ?? '',
    strategy_notes: mock.strategy_notes ?? '',
    time_analysis: mock.time_analysis ?? '',
  });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await db.entities.MockTest.update(mock.id, form);
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium">
          {moment(mock.date).format('MMM D, YYYY')}
          {mock.platform && <span className="text-muted-foreground font-normal"> · {mock.platform}</span>}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {mock.exam_type}{mock.section ? ` · ${mock.section}` : ''}
        </p>
      </div>

      <Recap mock={mock} />
      <NoteFields form={form} setField={setField} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Analysis'}</Button>
      </div>
    </form>
  );
}

/**
 * Fallback for a mock that was never logged: just enough to make a real record —
 * attempted and correct per section, plus the write-up. Totals come from the CAT
 * pattern, so skipped falls out without being asked for.
 */
function ManualEntry({ onClose }) {
  const [saving, setSaving] = useState(false);
  const [examType, setExamType] = useState('CAT Full');
  const [section, setSection] = useState('');
  const [meta, setMeta] = useState({ date: moment().format('YYYY-MM-DD'), platform: '' });
  const [counts, setCounts] = useState({});
  const [form, setForm] = useState({ key_mistakes: '', strategy_notes: '', time_analysis: '' });

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setCount = (prefix, kind, v) =>
    setCounts(prev => ({ ...prev, [prefix]: { ...prev[prefix], [kind]: v } }));

  const rows = useMemo(() => {
    if (examType === 'CAT Full') return CAT_SECTIONS;
    if (examType === 'CAT Sectional') {
      const found = CAT_SECTIONS.find(([lbl]) => lbl === section);
      return found ? [found] : [];
    }
    return [['Overall', 'cfa']];
  }, [examType, section]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const data = { ...meta, exam_type: examType, ...form };
    if (examType === 'CAT Sectional' && section) data.section = section;

    for (const [, prefix] of rows) {
      const att = Number(counts[prefix]?.att);
      const correct = Number(counts[prefix]?.correct);
      if (!Number.isFinite(att) || counts[prefix]?.att === '' || counts[prefix]?.att == null) continue;

      const total = CAT_TOTALS[prefix];
      data[`${prefix}_correct`] = Number.isFinite(correct) ? correct : 0;
      data[`${prefix}_incorrect`] = Math.max(0, att - (Number.isFinite(correct) ? correct : 0));
      if (total != null) {
        data[`${prefix}_total`] = total;
        data[`${prefix}_skipped`] = Math.max(0, total - att);
      }
    }

    await db.entities.MockTest.create(data);
    setSaving(false);
    onClose();
  }

  const ready = examType && (examType !== 'CAT Sectional' || section);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Enough to make a real record. Percentiles and per-section marks can be filled in later from
        the mock's Edit form.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Exam Type</Label>
          <Select value={examType} onValueChange={v => { setExamType(v); setSection(''); }}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {['CAT Full', 'CAT Sectional', 'CFA Full', 'CFA Qbank'].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Date</Label>
          <Input type="date" value={meta.date}
            onChange={e => setMeta(p => ({ ...p, date: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Platform</Label>
          <Select value={meta.platform} onValueChange={v => setMeta(p => ({ ...p, platform: v }))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {examType === 'CAT Sectional' && (
          <div>
            <Label className="text-xs">Section</Label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger><SelectValue placeholder="Which?" /></SelectTrigger>
              <SelectContent>
                {CAT_SECTIONS.map(([lbl]) => <SelectItem key={lbl} value={lbl}>{lbl}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-2">
            <span />
            <span className="text-[9px] text-muted-foreground text-center font-bold uppercase">Attempted</span>
            <span className="text-[9px] text-emerald-400 text-center font-bold uppercase">Correct</span>
          </div>
          {rows.map(([label, prefix]) => (
            <div key={prefix} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {label}
                {CAT_TOTALS[prefix] && (
                  <span className="font-normal normal-case"> /{CAT_TOTALS[prefix]}</span>
                )}
              </span>
              <Input type="number" className="h-8 text-xs" placeholder="0"
                value={counts[prefix]?.att ?? ''}
                onChange={e => setCount(prefix, 'att', e.target.value)} />
              <Input type="number" className="h-8 text-xs" placeholder="0"
                value={counts[prefix]?.correct ?? ''}
                onChange={e => setCount(prefix, 'correct', e.target.value)} />
            </div>
          ))}
        </div>
      )}

      <NoteFields form={form} setField={setField} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving || !ready}>
          {saving ? 'Saving…' : 'Save Mock & Analysis'}
        </Button>
      </div>
    </form>
  );
}
