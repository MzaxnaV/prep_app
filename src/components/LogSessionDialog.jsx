import { useState, useEffect } from "react";
import { db } from "@/api/client";
import { queryClientInstance } from "@/lib/query-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import moment from "moment";
import { getModulesForSubject } from "@/lib/cfaCurriculum";
import { CFA_SUBJECT_NAMES } from "@/lib/studyPlanData";
import { isAnalysed } from "@/lib/mockAnalysis";
import { activitiesForExam, activityKey, subjectMode, metricMode } from "@/lib/activities";

const CAT_SUBJECTS = ['VARC', 'DILR', 'Quant'];
const DIFF_CATS = ['Easy', 'Easy-Med', 'Medium', 'Hard'];
const emptyDiff = () => Object.fromEntries(DIFF_CATS.map(c => [c, { c: '', i: '', s: '' }]));

// Sentinel for "the mock isn't logged" — Radix Select has no empty-string value,
// and this path deliberately keeps the manual attempted/correct fields in play.
const NO_MOCK = '__none__';
const CAT_PREFIXES = ['varc', 'dilr', 'quant'];

/** Roll a mock's per-section counts up into one attempted/correct pair. */
function mockTotals(mock) {
  const prefixes = mock.exam_type?.startsWith('CAT') ? CAT_PREFIXES : ['cfa'];
  let correct = 0, wrong = 0;
  for (const p of prefixes) {
    correct += Number(mock[`${p}_correct`]) || 0;
    wrong += Number(mock[`${p}_incorrect`]) || 0;
  }
  return { attempted: correct + wrong, correct };
}

// Reusable module/lesson picker — starts empty, caller manages selections state
// completedModuleIds: Set of module IDs already marked Complete (hidden from list)
export function ModulePicker({ subjectFull, moduleSelections, onChange, completedModuleIds = new Set() }) {
  const [expanded, setExpanded] = useState({});
  const modules = getModulesForSubject(subjectFull).filter(m => !completedModuleIds.has(m.id));

  if (!modules.length) return null;

  function toggleModuleExpand(moduleId) {
    setExpanded(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }

  function areAllLessonsChecked(module) {
    const sel = moduleSelections[module.id];
    return sel && sel.length === module.lessons.length;
  }

  function isLessonChecked(moduleId, lessonNum) {
    return (moduleSelections[moduleId] || []).includes(lessonNum);
  }

  function handleModuleCheck(module, checked) {
    if (checked) {
      onChange({ ...moduleSelections, [module.id]: module.lessons.map(l => l.num) });
    } else {
      const next = { ...moduleSelections };
      delete next[module.id];
      onChange(next);
    }
  }

  function handleLessonCheck(moduleId, lessonNum, checked) {
    const current = moduleSelections[moduleId] || [];
    const next = checked
      ? [...current, lessonNum].sort((a, b) => a - b)
      : current.filter(n => n !== lessonNum);

    if (next.length === 0) {
      const updated = { ...moduleSelections };
      delete updated[moduleId];
      onChange(updated);
    } else {
      onChange({ ...moduleSelections, [moduleId]: next });
    }
  }

  return (
    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
      {modules.map(module => {
        const allChecked = areAllLessonsChecked(module);
        const completedCount = (moduleSelections[module.id] || []).length;
        const partialChecked = completedCount > 0 && !allChecked;
        const open = expanded[module.id];

        return (
          <div key={module.id} className="rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 px-3 py-2">
              <Checkbox
                checked={allChecked ? true : partialChecked ? 'indeterminate' : false}
                onCheckedChange={() => handleModuleCheck(module, allChecked ? false : true)}
                id={`mod-${module.id}`}
              />
              <button
                type="button"
                className="flex-1 flex items-center justify-between text-left"
                onClick={() => toggleModuleExpand(module.id)}
              >
                <span className="text-xs font-medium leading-snug">
                  <span className="text-muted-foreground font-mono mr-1.5">{module.id}.</span>
                  {module.name}
                </span>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  {completedCount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      {completedCount}/{module.lessons.length}
                    </span>
                  )}
                  {open
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                </div>
              </button>
            </div>

            {open && (
              <div className="px-4 pb-2 space-y-1.5 border-t border-border pt-2">
                {module.lessons.map(lesson => (
                  <div key={lesson.num} className="flex items-start gap-2">
                    <Checkbox
                      checked={isLessonChecked(module.id, lesson.num)}
                      onCheckedChange={c => handleLessonCheck(module.id, lesson.num, !!c)}
                      id={`mod-${module.id}-lesson-${lesson.num}`}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`mod-${module.id}-lesson-${lesson.num}`}
                      className="text-[11px] text-muted-foreground leading-tight cursor-pointer"
                    >
                      <span className="font-mono mr-1">{lesson.num}.</span>
                      {lesson.title}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// A block's `type` IS its activity key — see lib/activities.js. There is
// deliberately no translation step here any more.

// Props:
//   exam        — 'CFA' | 'CAT'  (required for new sessions; ignored in edit mode)
//   onClose     — called after save or cancel
//   session     — existing session object (edit mode)
//   blockIndex  — plan block index to link this session to (new mode only)
//   block       — plan block object to pre-fill duration & activity type (new mode only)
export default function LogSessionDialog({ exam: examProp, onClose, session, blockIndex, block }) {
  const isEdit = !!session;
  const resolvedExam = isEdit ? session.exam : examProp;

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markComplete, setMarkComplete] = useState(isEdit ? (session.mark_complete ?? true) : true);

  // moduleSelections: { [moduleId]: lessonNum[] }
  const [moduleSelections, setModuleSelections] = useState(() => {
    if (isEdit && session.module_selections) {
      try { return JSON.parse(session.module_selections); } catch { return {}; }
    }
    return {};
  });

  // IDs of modules already marked Complete — hidden from the picker
  const [completedModuleIds, setCompletedModuleIds] = useState(new Set());
  useEffect(() => {
    if (resolvedExam !== 'CFA') return;
    db.entities.ModuleProgress.list().then(records => {
      setCompletedModuleIds(new Set(records.filter(r => r.status === 'Complete').map(r => r.module_id)));
    });
  }, [resolvedExam]);

  const [form, setForm] = useState({
    date: isEdit ? session.date : moment().format('YYYY-MM-DD'),
    exam: resolvedExam,
    subject: isEdit ? session.subject : '',
    activity_type: isEdit ? activityKey(session.activity_type) : activityKey(block?.type),
    duration_minutes: isEdit ? (session.duration_minutes || '') : (block?.duration || ''),
    questions_attempted: isEdit ? (session.questions_attempted || '') : '',
    questions_correct: isEdit ? (session.questions_correct || '') : '',
    questions_incorrect: isEdit ? (session.questions_incorrect || '') : '',
    questions_skipped: isEdit ? (session.questions_skipped || '') : '',
    percentile: isEdit ? (session.percentile || '') : '',
    notes: isEdit ? (session.notes || '') : '',
  });

  // Mock Analysis sessions are about a specific paper, so let one be picked and
  // pull its numbers across rather than retyping them.
  const [mocks, setMocks] = useState([]);
  const [mockId, setMockId] = useState(isEdit ? (session.mock_id || NO_MOCK) : NO_MOCK);
  const [pushNotes, setPushNotes] = useState(true);

  const [diffBreakupEnabled, setDiffBreakupEnabled] = useState(() => isEdit && !!session.difficulty_breakup);
  const [diffBreakup, setDiffBreakup] = useState(() => {
    if (isEdit && session.difficulty_breakup) {
      try { return JSON.parse(session.difficulty_breakup); } catch {}
    }
    return emptyDiff();
  });

  const subjects = resolvedExam === 'CFA' ? CFA_SUBJECT_NAMES : CAT_SUBJECTS;
  const activityTypes = activitiesForExam(resolvedExam);
  const showModulePicker = resolvedExam === 'CFA' && !!form.subject;
  const metric = metricMode(form.activity_type);
  const isPractice = metric === 'full';
  const showCounts = metric !== 'none';
  const subjectReq = subjectMode(form.activity_type);
  const subjectHidden = subjectReq === 'none';
  const subjectOptional = subjectReq === 'optional';
  const isMockAnalysis = form.activity_type === 'analysis';

  // Only load the list when it can actually be shown.
  useEffect(() => {
    if (!isMockAnalysis) return;
    db.entities.MockTest.list('-date', 100).then(all =>
      setMocks(all.filter(m => (m.exam_type || '').startsWith(resolvedExam)))
    );
  }, [isMockAnalysis, resolvedExam]);

  const selectedMock = mocks.find(m => m.id === mockId) || null;

  // Picking a mock fills in the counts from the record it came from. Left
  // editable — a sectional re-analysis might legitimately cover fewer questions.
  function handleMockChange(id) {
    setMockId(id);
    const mock = mocks.find(m => m.id === id);
    if (!mock) return;
    const { attempted, correct } = mockTotals(mock);
    setForm(prev => ({
      ...prev,
      questions_attempted: attempted ? String(attempted) : prev.questions_attempted,
      questions_correct: correct ? String(correct) : prev.questions_correct,
    }));
    // Don't offer to overwrite a write-up that already exists.
    setPushNotes(!isAnalysed(mock));
  }

  function handleSubjectChange(v) {
    setForm({ ...form, subject: v });
    setModuleSelections({});
  }

  // Switching to an activity that has no subject drops any subject already
  // picked, so a hidden field can't submit a stale value and credit the wrong
  // section in updateSubjectProgress.
  function handleActivityChange(v) {
    setForm(prev => ({
      ...prev,
      activity_type: v,
      subject: subjectMode(v) === 'none' ? '' : prev.subject,
    }));
  }

  async function updateSubjectProgress(data, exam) {
    if (!data.subject) return;
    const existing = await db.entities.SubjectProgress.filter({ exam, subject: data.subject });
    if (existing.length === 0) return;
    const sp = existing[0];
    const changes = {};

    // Always bump status to In Progress when a session is logged, unless already further along
    const STATUS_ORDER = ['Not Started', 'In Progress', 'Gap-Filling', 'Revision', 'Complete'];
    const currentRank = STATUS_ORDER.indexOf(sp.status);
    if (currentRank <= 0) changes.status = 'In Progress';

    // Update question stats if provided
    if (data.questions_attempted || data.questions_correct) {
      const newTotal = (sp.total_questions_done || 0) + (data.questions_attempted || 0);
      const totalCorrect = Math.round((sp.current_accuracy || 0) / 100 * (sp.total_questions_done || 0)) + (data.questions_correct || 0);
      changes.total_questions_done = newTotal;
      changes.current_accuracy = newTotal > 0 ? Math.round((totalCorrect / newTotal) * 100) : 0;
    }

    if (Object.keys(changes).length > 0) {
      await db.entities.SubjectProgress.update(sp.id, changes);
    }
  }

  // Recalculate module progress for a set of module IDs by replaying ALL sessions.
  // Called after edit or delete so the state stays consistent.
  async function recalculateModuleProgress(affectedModuleIds) {
    if (affectedModuleIds.size === 0) return;
    const [allSessions, allModuleProgress] = await Promise.all([
      db.entities.StudySession.list('created_date', 5000),
      db.entities.ModuleProgress.list(),
    ]);
    for (const moduleId of affectedModuleIds) {
      const record = allModuleProgress.find(r => r.module_id === moduleId);
      if (!record) continue;
      const mergedSet = new Set();
      for (const s of allSessions) {
        if (!s.module_selections) continue;
        let sel;
        try { sel = JSON.parse(s.module_selections); } catch { continue; }
        if (sel[moduleId]) {
          sel[moduleId].forEach(l => mergedSet.add(l));
        }
      }
      const merged = [...mergedSet].sort((a, b) => a - b);
      // Complete only when every lesson has been covered
      const status = (record.total_lessons > 0 && mergedSet.size >= record.total_lessons)
        ? 'Complete'
        : mergedSet.size > 0 ? 'In Progress' : 'Not Started';
      await db.entities.ModuleProgress.update(record.id, {
        completed_lessons: JSON.stringify(merged),
        status,
      });
    }
  }

  // Extract affected module IDs from a session's module_selections JSON
  function moduleIdsFromSession(s) {
    const ids = new Set();
    if (!s?.module_selections) return ids;
    try {
      Object.keys(JSON.parse(s.module_selections)).forEach(id => ids.add(Number(id)));
    } catch {}
    return ids;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const data = { ...form };
    if (data.duration_minutes) data.duration_minutes = Number(data.duration_minutes);
    if (data.questions_attempted) data.questions_attempted = Number(data.questions_attempted);
    if (data.questions_correct) data.questions_correct = Number(data.questions_correct);
    if (data.questions_incorrect) data.questions_incorrect = Number(data.questions_incorrect);
    if (data.questions_skipped) data.questions_skipped = Number(data.questions_skipped);
    if (data.percentile) data.percentile = Number(data.percentile);

    if (isPractice && diffBreakupEnabled) {
      const converted = {};
      for (const cat of DIFF_CATS) {
        converted[cat] = { c: Number(diffBreakup[cat]?.c) || 0, i: Number(diffBreakup[cat]?.i) || 0, s: Number(diffBreakup[cat]?.s) || 0 };
      }
      data.difficulty_breakup = JSON.stringify(converted);
    } else {
      delete data.difficulty_breakup;
    }

    if (showModulePicker) {
      data.module_selections = JSON.stringify(moduleSelections);
      data.mark_complete = markComplete;
    }

    // Link the write-up to the paper it is about, and — only when asked, and only
    // into an empty field — carry the notes onto the mock so it stops counting as
    // unanalysed. Never clobbers an existing write-up.
    if (isMockAnalysis && mockId !== NO_MOCK) {
      data.mock_id = mockId;
      if (pushNotes && selectedMock && data.notes?.trim() && !isAnalysed(selectedMock)) {
        await db.entities.MockTest.update(mockId, { key_mistakes: data.notes.trim() });
      }
    } else if (isEdit) {
      data.mock_id = null;
    }

    if (isEdit) {
      await db.entities.StudySession.update(session.id, data);
      const affected = new Set([...moduleIdsFromSession(session), ...moduleIdsFromSession(data)]);
      await recalculateModuleProgress(affected);
    } else {
      if (blockIndex !== undefined) data.block_index = blockIndex;
      await db.entities.StudySession.create(data);
      await updateSubjectProgress(data, resolvedExam);
      // Create the session first, then recalculate so it's included in the replay
      await recalculateModuleProgress(moduleIdsFromSession(data));
    }

    queryClientInstance.invalidateQueries({ queryKey: ['subjectProgress'] });
    queryClientInstance.invalidateQueries({ queryKey: ['moduleProgress'] });
    queryClientInstance.invalidateQueries({ queryKey: ['catSessions'] });
    queryClientInstance.invalidateQueries({ queryKey: ['mockTests'] });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    const affected = moduleIdsFromSession(session);
    await db.entities.StudySession.delete(session.id);
    await recalculateModuleProgress(affected);
    queryClientInstance.invalidateQueries({ queryKey: ['subjectProgress'] });
    queryClientInstance.invalidateQueries({ queryKey: ['moduleProgress'] });
    queryClientInstance.invalidateQueries({ queryKey: ['catSessions'] });
    setDeleting(false);
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Session' : `Log Study Session — ${resolvedExam}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={subjectHidden ? '' : 'grid grid-cols-2 gap-3'}>
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                disabled={isEdit}
              />
            </div>
            {!subjectHidden && (
              <div>
                <Label className="text-xs">
                  Subject
                  {subjectOptional && <span className="text-muted-foreground font-normal"> (optional)</span>}
                </Label>
                <Select value={form.subject} onValueChange={handleSubjectChange} disabled={isEdit}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Activity Type</Label>
              <Select value={form.activity_type} onValueChange={handleActivityChange}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {activityTypes.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Duration (min)</Label>
              <Input
                type="number"
                placeholder="90"
                value={form.duration_minutes}
                onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </div>
          </div>

          {isMockAnalysis && (
            <div className="space-y-2">
              <Label className="text-xs">Which mock?</Label>
              <Select value={mockId} onValueChange={handleMockChange}>
                <SelectTrigger><SelectValue placeholder="Select a mock" /></SelectTrigger>
                <SelectContent>
                  {mocks.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {moment(m.date).format('MMM D')}
                      {m.platform ? ` · ${m.platform}` : ''}
                      {m.section ? ` · ${m.section}` : ''}
                      {isAnalysed(m) ? '' : '  ·  not analysed'}
                    </SelectItem>
                  ))}
                  <SelectItem value={NO_MOCK}>Not logged — enter counts below</SelectItem>
                </SelectContent>
              </Select>

              {selectedMock ? (
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={pushNotes}
                    onCheckedChange={v => setPushNotes(!!v)}
                    disabled={isAnalysed(selectedMock)}
                    className="mt-0.5"
                  />
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {isAnalysed(selectedMock)
                      ? 'This mock already has a write-up — it will be left alone.'
                      : 'Also save these notes to the mock, so it stops showing as unanalysed.'}
                  </span>
                </label>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Nothing to select? Log the counts and notes below — the session still gets recorded.
                </p>
              )}
            </div>
          )}

          {showModulePicker && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  Modules / Lessons
                  {Object.keys(moduleSelections).length > 0 && (
                    <span className="ml-2 text-emerald-400 font-mono">
                      ({Object.keys(moduleSelections).length} selected)
                    </span>
                  )}
                </Label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <Checkbox
                    checked={markComplete}
                    onCheckedChange={v => setMarkComplete(!!v)}
                  />
                  <span className="text-xs text-muted-foreground">Mark as complete</span>
                </label>
              </div>
              <ModulePicker
                subjectFull={form.subject}
                moduleSelections={moduleSelections}
                onChange={setModuleSelections}
                completedModuleIds={isPractice ? new Set() : completedModuleIds}
              />
            </div>
          )}

          {isPractice ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px]">Total</Label>
                  <Input type="number" placeholder="30" value={form.questions_attempted} onChange={e => setForm({ ...form, questions_attempted: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] text-emerald-400">Correct</Label>
                  <Input type="number" placeholder="20" value={form.questions_correct} onChange={e => setForm({ ...form, questions_correct: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] text-red-400">Wrong</Label>
                  <Input type="number" placeholder="6" value={form.questions_incorrect} onChange={e => setForm({ ...form, questions_incorrect: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Skipped</Label>
                  <Input type="number" placeholder="4" value={form.questions_skipped} onChange={e => setForm({ ...form, questions_skipped: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">%ile <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input type="number" step="0.01" placeholder="85.5" value={form.percentile} onChange={e => setForm({ ...form, percentile: e.target.value })} />
                </div>
              </div>
              {/* Difficulty breakup */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                  <Checkbox checked={diffBreakupEnabled} onCheckedChange={v => { setDiffBreakupEnabled(!!v); if (!diffBreakup || Object.keys(diffBreakup).length === 0) setDiffBreakup(emptyDiff()); }} />
                  <span className="text-xs text-muted-foreground">Add difficulty breakup</span>
                </label>
                {diffBreakupEnabled && (
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
                        <Input type="number" className="h-7 text-xs px-1.5" placeholder="0" value={diffBreakup[cat]?.c ?? ''} onChange={e => setDiffBreakup(prev => ({ ...prev, [cat]: { ...prev[cat], c: e.target.value } }))} />
                        <Input type="number" className="h-7 text-xs px-1.5" placeholder="0" value={diffBreakup[cat]?.i ?? ''} onChange={e => setDiffBreakup(prev => ({ ...prev, [cat]: { ...prev[cat], i: e.target.value } }))} />
                        <Input type="number" className="h-7 text-xs px-1.5" placeholder="0" value={diffBreakup[cat]?.s ?? ''} onChange={e => setDiffBreakup(prev => ({ ...prev, [cat]: { ...prev[cat], s: e.target.value } }))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : showCounts ? (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Questions Attempted</Label>
                  <Input type="number" placeholder="30" value={form.questions_attempted} onChange={e => setForm({ ...form, questions_attempted: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Questions Correct</Label>
                  <Input type="number" placeholder="24" value={form.questions_correct} onChange={e => setForm({ ...form, questions_correct: e.target.value })} />
                </div>
              </div>
              {selectedMock && (
                <p className="text-[11px] text-muted-foreground">
                  Filled in from the selected mock. Edit if this session only covered part of it.
                </p>
              )}
            </div>
          ) : null}

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              placeholder="Key learnings, mistakes to review..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
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
              <Button type="submit" disabled={saving || !form.activity_type || (subjectReq === 'required' && !form.subject)}>
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Session'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
