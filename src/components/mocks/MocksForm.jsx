import { useState, useMemo, useEffect } from "react";
import { db } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import moment from "moment";

const PLATFORMS = ['IMS SimCAT', 'TIME AIMCAT', 'Career Launcher', 'Cracku', '2IIM', 'CFA Institute', 'Kaplan Schweser', 'Other'];
// label -> field prefix. A sectional covers exactly one of these.
const CAT_SECTIONS = [['VARC', 'varc'], ['DILR', 'dilr'], ['QA', 'quant']];
const DIFF_CATS = ['Easy', 'Easy-Med', 'Medium', 'Hard'];
const emptyDiff = () => Object.fromEntries(DIFF_CATS.map(c => [c, { c: '', i: '', s: '' }]));

// Per-section counts + the score straight off the report. Score is typed rather
// than derived: CAT papers mix MCQs (negative marking) with TITA questions that
// carry none, so correct/wrong counts alone can't reproduce it.
function SectionQA({ label, prefix, form, onChange }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 items-center">
      <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
      <Input type="number" className="h-7 text-xs px-1.5" placeholder="Total"
        value={form[`${prefix}_total`] ?? ''} onChange={e => onChange(`${prefix}_total`, e.target.value)} />
      <Input type="number" className="h-7 text-xs px-1.5" placeholder="Correct"
        value={form[`${prefix}_correct`] ?? ''} onChange={e => onChange(`${prefix}_correct`, e.target.value)} />
      <Input type="number" className="h-7 text-xs px-1.5" placeholder="Wrong"
        value={form[`${prefix}_incorrect`] ?? ''} onChange={e => onChange(`${prefix}_incorrect`, e.target.value)} />
      <Input type="number" className="h-7 text-xs px-1.5" placeholder="Skip"
        value={form[`${prefix}_skipped`] ?? ''} onChange={e => onChange(`${prefix}_skipped`, e.target.value)} />
      <Input type="number" step="0.01" className="h-7 text-xs px-1.5 text-amber-400" placeholder="Score"
        value={form[`${prefix}_score`] ?? ''} onChange={e => onChange(`${prefix}_score`, e.target.value)} />
    </div>
  );
}

// A section can be written under conditions that make its numbers meaningless —
// an interruption, a technical failure, a section abandoned for a reason that has
// nothing to do with ability. The record and its notes are still worth keeping;
// the numbers are not, and the Action Plan's diagnosis would otherwise read an
// interruption as a weakness. Excluded sections drop out of that derivation.
function VoidSections({ sections, voided, onToggle }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
        Doesn&rsquo;t count as a measurement
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {sections.map(([label, prefix]) => (
          <label key={prefix} className="flex items-center gap-1.5 cursor-pointer select-none">
            <Checkbox checked={voided.includes(prefix)} onCheckedChange={() => onToggle(prefix)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </label>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
        Interrupted or invalid. Kept in the record, left out of the Action Plan diagnosis and deltas.
      </p>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="grid grid-cols-6 gap-1.5 mb-0.5">
      <span />
      <span className="text-[9px] text-muted-foreground text-center font-bold uppercase">Total</span>
      <span className="text-[9px] text-emerald-400 text-center font-bold uppercase">Correct</span>
      <span className="text-[9px] text-red-400 text-center font-bold uppercase">Wrong</span>
      <span className="text-[9px] text-muted-foreground text-center font-bold uppercase">Skip</span>
      <span className="text-[9px] text-amber-400 text-center font-bold uppercase">Score</span>
    </div>
  );
}

function DifficultyBreakup({ enabled, onToggle, breakup, onChange }) {
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
        <Checkbox checked={enabled} onCheckedChange={v => onToggle(!!v)} />
        <span className="text-xs text-muted-foreground">Add difficulty breakup</span>
      </label>
      {enabled && (
        <div className="rounded-lg border border-border bg-muted/20 p-2 space-y-1.5">
          <div className="grid grid-cols-4 gap-1 mb-1">
            <span className="text-[10px] text-muted-foreground font-bold">Category</span>
            <span className="text-[10px] text-emerald-400 font-bold text-center">Correct</span>
            <span className="text-[10px] text-red-400 font-bold text-center">Wrong</span>
            <span className="text-[10px] text-muted-foreground font-bold text-center">Skipped</span>
          </div>
          {DIFF_CATS.map(cat => (
            <div key={cat} className="grid grid-cols-4 gap-1 items-center">
              <span className="text-[10px] font-medium text-muted-foreground">{cat}</span>
              <Input type="number" className="h-7 text-xs px-1.5" placeholder="0"
                value={breakup[cat]?.c ?? ''} onChange={e => onChange(cat, 'c', e.target.value)} />
              <Input type="number" className="h-7 text-xs px-1.5" placeholder="0"
                value={breakup[cat]?.i ?? ''} onChange={e => onChange(cat, 'i', e.target.value)} />
              <Input type="number" className="h-7 text-xs px-1.5" placeholder="0"
                value={breakup[cat]?.s ?? ''} onChange={e => onChange(cat, 's', e.target.value)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const BLANK_FORM = {
  date: moment().format('YYYY-MM-DD'),
  platform: '',
  overall_percentile: '',
  varc_percentile: '',
  varc_total: '', varc_correct: '', varc_incorrect: '', varc_skipped: '', varc_score: '',
  dilr_percentile: '',
  dilr_total: '', dilr_correct: '', dilr_incorrect: '', dilr_skipped: '', dilr_score: '',
  quant_percentile: '',
  quant_total: '', quant_correct: '', quant_incorrect: '', quant_skipped: '', quant_score: '',
  cfa_score_pct: '',
  cfa_total: '', cfa_correct: '', cfa_incorrect: '', cfa_skipped: '', cfa_score: '',
  key_mistakes: '', strategy_notes: '', time_analysis: '', sets_skipped: '',
};

// Inputs are controlled by strings; a stored record holds numbers and may be
// missing keys entirely. Normalise so every field is a defined string.
function formFromMock(mock) {
  const out = { ...BLANK_FORM };
  for (const key of Object.keys(BLANK_FORM)) {
    const v = mock[key];
    out[key] = v == null ? '' : String(v);
  }
  return out;
}

// blockIndex — plan block this mock is being logged against (TodayPlan only),
// so the block can be ticked off the same way a linked session is.
// mock       — existing record to edit; omitted when logging a new one.
export default function MockForm({ onClose, blockIndex, mock }) {
  const isEdit = !!mock;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [examType, setExamType] = useState(isEdit ? (mock.exam_type || '') : '');
  // Which section a 'CAT Sectional' covers. Empty for every other exam type.
  const [section, setSection] = useState(isEdit ? (mock.section || '') : '');

  const [form, setForm] = useState(() => (isEdit ? formFromMock(mock) : BLANK_FORM));

  const [voidSections, setVoidSections] = useState(() => {
    if (isEdit && mock.void_sections) {
      try {
        const parsed = JSON.parse(mock.void_sections);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }
    return [];
  });

  const [diffEnabled, setDiffEnabled] = useState(() => isEdit && !!mock.difficulty_breakup);
  const [diffBreakup, setDiffBreakup] = useState(() => {
    if (isEdit && mock.difficulty_breakup) {
      try { return JSON.parse(mock.difficulty_breakup); } catch { /* fall through */ }
    }
    return emptyDiff();
  });

  // Overall score is the sum of whatever section scores were entered
  const overallScore = useMemo(() => {
    if (examType !== 'CAT Full') return null;
    let total = 0, any = false;
    for (const [, p] of CAT_SECTIONS) {
      const raw = form[`${p}_score`];
      if (raw === '' || raw == null) continue;
      total += Number(raw) || 0;
      any = true;
    }
    return any ? total : null;
  }, [form, examType]);

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function toggleVoid(prefix) {
    setVoidSections(prev =>
      prev.includes(prefix) ? prev.filter(p => p !== prefix) : [...prev, prefix],
    );
  }

  function setDiff(cat, metric, val) {
    setDiffBreakup(prev => ({ ...prev, [cat]: { ...prev[cat], [metric]: val } }));
  }

  const NUM_FIELDS = [
    'overall_percentile',
    'varc_percentile',  'varc_total',  'varc_correct',  'varc_incorrect',  'varc_skipped',  'varc_score',
    'dilr_percentile',  'dilr_total',  'dilr_correct',  'dilr_incorrect',  'dilr_skipped',  'dilr_score',
    'quant_percentile', 'quant_total', 'quant_correct', 'quant_incorrect', 'quant_skipped', 'quant_score',
    'cfa_score_pct',    'cfa_total',   'cfa_correct',   'cfa_incorrect',   'cfa_skipped',   'cfa_score',
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = { ...form, exam_type: examType };

    // update() merges into the stored record, so a field the user cleared has to
    // be sent as null — dropping the key would silently keep the old value.
    NUM_FIELDS.forEach(f => {
      if (data[f] !== '' && data[f] != null) data[f] = Number(data[f]);
      else if (isEdit) data[f] = null;
      else delete data[f];
    });

    // Section scores come straight from NUM_FIELDS now — nothing to derive.
    if (overallScore !== null) data.overall_score = overallScore;
    else if (isEdit) data.overall_score = null;

    if (isCATSectional && section) data.section = section;
    else if (isEdit) data.section = null;

    // Only meaningful for CAT papers; a cleared list has to be sent as null on an
    // edit or update() would merge and silently keep the old exclusions.
    const applicableVoids = isCATMock ? voidSections : [];
    if (applicableVoids.length) data.void_sections = JSON.stringify(applicableVoids);
    else if (isEdit) data.void_sections = null;
    else delete data.void_sections;

    if (blockIndex !== undefined) data.block_index = blockIndex;

    if (diffEnabled) {
      const converted = {};
      for (const cat of DIFF_CATS) {
        converted[cat] = { c: Number(diffBreakup[cat]?.c) || 0, i: Number(diffBreakup[cat]?.i) || 0, s: Number(diffBreakup[cat]?.s) || 0 };
      }
      data.difficulty_breakup = JSON.stringify(converted);
    } else if (isEdit) {
      data.difficulty_breakup = null;
    }

    if (isEdit) await db.entities.MockTest.update(mock.id, data);
    else await db.entities.MockTest.create(data);
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    await db.entities.MockTest.delete(mock.id);
    setDeleting(false);
    onClose();
  }

  const isCATFull = examType === 'CAT Full';
  const isCATSectional = examType === 'CAT Sectional';
  const isCATMock = isCATFull || isCATSectional;
  const sectionPrefix = CAT_SECTIONS.find(([lbl]) => lbl === section)?.[1];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Mock Test' : 'Log Mock Test'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Platform</Label>
            <Select value={form.platform} onValueChange={v => setField('platform', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isCATFull && (
            <>
              {/* Percentiles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Overall %ile</Label>
                  <Input type="number" step="0.01" value={form.overall_percentile} onChange={e => setField('overall_percentile', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {CAT_SECTIONS.map(([lbl, p]) => (
                  <div key={p}>
                    <Label className="text-xs">{lbl} %ile</Label>
                    <Input type="number" step="0.01" value={form[`${p}_percentile`]} onChange={e => setField(`${p}_percentile`, e.target.value)} />
                  </div>
                ))}
              </div>

              {/* Q/A + marks per section */}
              <div className="space-y-3">
                <SectionHeader />
                {CAT_SECTIONS.map(([lbl, p]) => (
                  <SectionQA key={p} label={lbl} prefix={p} form={form} onChange={setField} />
                ))}
              </div>

              {/* Overall score preview */}
              {overallScore !== null && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 flex items-center gap-3">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Overall Score</span>
                  <span className="text-sm font-mono font-bold text-amber-400">{overallScore}</span>
                </div>
              )}

              <VoidSections sections={CAT_SECTIONS} voided={voidSections} onToggle={toggleVoid} />

              <DifficultyBreakup
                enabled={diffEnabled}
                onToggle={v => { setDiffEnabled(v); if (!v) setDiffBreakup(emptyDiff()); }}
                breakup={diffBreakup}
                onChange={setDiff}
              />
            </>
          )}

          {/* A sectional covers one section, so ask which and show only that one.
              No overall percentile -- a sectional doesn't have one. */}
          {isCATSectional && (
            <>
              <div>
                <Label className="text-xs">Section</Label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue placeholder="Which section?" /></SelectTrigger>
                  <SelectContent>
                    {CAT_SECTIONS.map(([lbl]) => <SelectItem key={lbl} value={lbl}>{lbl}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {sectionPrefix && (
                <>
                  <div>
                    <Label className="text-xs">{section} %ile</Label>
                    <Input type="number" step="0.01"
                      value={form[`${sectionPrefix}_percentile`]}
                      onChange={e => setField(`${sectionPrefix}_percentile`, e.target.value)} />
                  </div>

                  <div className="space-y-3">
                    <SectionHeader />
                    <SectionQA label={section} prefix={sectionPrefix} form={form} onChange={setField} />
                  </div>

                  <VoidSections
                    sections={CAT_SECTIONS.filter(([lbl]) => lbl === section)}
                    voided={voidSections}
                    onToggle={toggleVoid}
                  />

                  <DifficultyBreakup
                    enabled={diffEnabled}
                    onToggle={v => { setDiffEnabled(v); if (!v) setDiffBreakup(emptyDiff()); }}
                    breakup={diffBreakup}
                    onChange={setDiff}
                  />
                </>
              )}
            </>
          )}

          {!isCATMock && examType && (
            <>
              <div>
                <Label className="text-xs">Score % <span className="text-muted-foreground font-normal text-[10px]">(from platform)</span></Label>
                <Input type="number" step="0.1" value={form.cfa_score_pct} onChange={e => setField('cfa_score_pct', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <SectionHeader />
                <SectionQA label="Overall" prefix="cfa" form={form} onChange={setField} />
              </div>
              <DifficultyBreakup
                enabled={diffEnabled}
                onToggle={v => { setDiffEnabled(v); if (!v) setDiffBreakup(emptyDiff()); }}
                breakup={diffBreakup}
                onChange={setDiff}
              />
            </>
          )}

          <div>
            <Label className="text-xs">Key Mistakes & Learnings</Label>
            <Textarea rows={2} value={form.key_mistakes} onChange={e => setField('key_mistakes', e.target.value)} placeholder="What went wrong? What to remember..." />
          </div>
          <div>
            <Label className="text-xs">Strategy Notes</Label>
            <Textarea rows={2} value={form.strategy_notes} onChange={e => setField('strategy_notes', e.target.value)} placeholder="Set selection, time allocation decisions..." />
          </div>
          <div>
            <Label className="text-xs">Time Analysis</Label>
            <Textarea rows={1} value={form.time_analysis} onChange={e => setField('time_analysis', e.target.value)} placeholder="Time per section, where did you run out?" />
          </div>

          <div className="flex justify-between gap-2">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-1.5 text-red-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving || !examType || (isCATSectional && !section)}>
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Log Mock'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
