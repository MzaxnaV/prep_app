import { useState, useEffect } from "react";
import { db } from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModulePicker } from "@/components/LogSessionDialog";
import { CFA_SUBJECT_NAMES } from "@/lib/studyPlanData";
import { getModulesForSubject } from "@/lib/cfaCurriculum";

export default function EditProgressDialog({ onClose }) {
  const [subject, setSubject] = useState('');
  const [moduleSelections, setModuleSelections] = useState({});
  const [questionsDone, setQuestionsDone] = useState('');
  const [accuracy, setAccuracy] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current data whenever subject changes
  useEffect(() => {
    if (!subject) return;
    setLoading(true);
    setModuleSelections({});
    setQuestionsDone('');
    setAccuracy('');

    Promise.all([
      db.entities.ModuleProgress.list(),
      db.entities.SubjectProgress.filter({ exam: 'CFA', subject }),
    ]).then(([allModules, subjectRows]) => {
      const selections = {};
      for (const m of allModules) {
        if (m.subject !== subject) continue;
        const lessons = JSON.parse(m.completed_lessons || '[]');
        if (lessons.length > 0) selections[m.module_id] = lessons;
      }
      setModuleSelections(selections);

      if (subjectRows.length > 0) {
        const sp = subjectRows[0];
        setQuestionsDone(sp.total_questions_done ?? '');
        setAccuracy(sp.current_accuracy ?? '');
      }
      setLoading(false);
    });
  }, [subject]);

  async function handleSave() {
    if (!subject) return;
    setSaving(true);

    const allModules = await db.entities.ModuleProgress.list();
    const subjectModules = allModules.filter(m => m.subject === subject);

    // Update all module records in parallel
    await Promise.all(
      subjectModules.map(record => {
        const lessons = (moduleSelections[record.module_id] || []).sort((a, b) => a - b);
        const status = lessons.length === record.total_lessons ? 'Complete'
          : lessons.length > 0 ? 'In Progress' : 'Not Started';
        return db.entities.ModuleProgress.update(record.id, {
          completed_lessons: JSON.stringify(lessons),
          status,
        });
      })
    );

    // Override question stats directly
    const subjectRows = await db.entities.SubjectProgress.filter({ exam: 'CFA', subject });
    if (subjectRows.length > 0) {
      const updates = {};
      if (questionsDone !== '') updates.total_questions_done = Number(questionsDone);
      if (accuracy !== '') updates.current_accuracy = Number(accuracy);
      if (Object.keys(updates).length > 0) {
        await db.entities.SubjectProgress.update(subjectRows[0].id, updates);
      }
    }

    setSaving(false);
    onClose();
  }

  const selectedCount = Object.keys(moduleSelections).length;
  const totalModules = getModulesForSubject(subject).length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Progress</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="Select subject to edit" /></SelectTrigger>
              <SelectContent>
                {CFA_SUBJECT_NAMES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {subject && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Total Questions Done</Label>
                  <Input
                    type="number"
                    placeholder="—"
                    value={questionsDone}
                    onChange={e => setQuestionsDone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label className="text-xs">Current Accuracy (%)</Label>
                  <Input
                    type="number"
                    placeholder="—"
                    min={0}
                    max={100}
                    value={accuracy}
                    onChange={e => setAccuracy(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">
                  Module / Lesson Completion
                  {!loading && totalModules > 0 && (
                    <span className="ml-2 text-muted-foreground font-mono">
                      {selectedCount}/{totalModules} modules
                    </span>
                  )}
                </Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>
                ) : (
                  <ModulePicker
                    subjectFull={subject}
                    moduleSelections={moduleSelections}
                    onChange={setModuleSelections}
                  />
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !subject || loading}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
