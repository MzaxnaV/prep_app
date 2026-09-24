import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import { db } from "@/api/client";
import { getTodaySchedule, getCurrentPhase, getCurrentWeek } from "../lib/studyPlanData";
import { activityLabel } from "../lib/activities";
import {
  defaultToEditable,
  editableToDisplay,
  getScheduleOverride,
  saveScheduleOverride,
  clearScheduleOverride,
  newBlock,
} from "../lib/scheduleOverride";
import {
  BRANCHES,
  applyBranch,
  getMockDayBranch,
  hasBranch,
  setMockDayBranch,
} from "../lib/mockDayBranch";
import ScheduleBlock from "../components/schedule/ScheduleBlock";
import LogSessionDialog from "../components/LogSessionDialog";
import MockForm from "../components/mocks/MocksForm";
import { Sun, Moon, Dumbbell, Pencil, Check, RotateCcw, Plus, Trash2, ChevronUp, ChevronDown, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TODAY = moment().format('YYYY-MM-DD');

const EXAMS = ['CFA', 'CAT', 'Break'];
const BLOCK_TYPES = [
  { value: 'new-material', label: 'New Material' },
  { value: 'gap-fill', label: 'Gap-Fill' },
  { value: 'practice', label: 'Practice' },
  { value: 'revision', label: 'Revision' },
  { value: 'mock', label: 'Mock' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'break', label: 'Break' },
  { value: 'planning', label: 'Planning' },
];

// Stable IDs for editable blocks so React doesn't lose input state on reorder
let _nextId = 0;
function withIds(blocks) {
  return blocks.map(b => ({ ...b, _id: ++_nextId }));
}

function loadDisplaySchedule() {
  const override = getScheduleOverride(TODAY);
  if (override) return override.map(editableToDisplay);
  return getTodaySchedule();
}

// Editing starts from what's on screen, so the branch is applied first —
// otherwise editing a score-only day silently reverts it to the with-paper text.
function loadEditableSchedule(branch) {
  const override = getScheduleOverride(TODAY);
  return withIds(override ?? defaultToEditable(applyBranch(getTodaySchedule(), branch)));
}

// Derive completion map { [blockIndex]: true } from today's session records.
// Sessions logged from TodayPlan have block_index — use those exactly.
// Sessions logged from CFAProgress/CATProgress have no block_index — fill the
// first unlinked block of matching exam type in display order.
function completedFromSessions(sessions, mocks, blocks) {
  const map = {};
  const unlinkedCounts = { CFA: 0, CAT: 0 };

  for (const s of sessions) {
    if (s.block_index != null) {
      map[s.block_index] = true;
    } else if (s.exam === 'CFA' || s.exam === 'CAT') {
      unlinkedCounts[s.exam]++;
    }
  }

  // Mock blocks are logged as MockTest records, not sessions, so they have to be
  // counted separately or a logged mock leaves its block showing as undone.
  let unlinkedMocks = 0;
  for (const m of mocks) {
    if (m.block_index != null) map[m.block_index] = true;
    else unlinkedMocks++;
  }

  // A mock logged from the Mock Tests page has no block_index — claim the first
  // mock block for it, before the generic session fill below can take it.
  blocks.forEach((b, i) => {
    if (map[i] || b.type !== 'mock' || unlinkedMocks === 0) return;
    map[i] = true;
    unlinkedMocks--;
  });

  // Fill unlinked sessions into the first uncompleted block of matching exam
  const filled = { CFA: 0, CAT: 0 };
  blocks.forEach((b, i) => {
    if (map[i] || !b.exam || b.exam === 'Break' || b.type === 'break') return;
    const exam = b.exam;
    if (filled[exam] < unlinkedCounts[exam]) {
      map[i] = true;
      filled[exam]++;
    }
  });
  return map;
}

// Inline row editor for one block
function EditRow({ block, index, total, onChange, onDelete, onMove }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl border border-border bg-card">
      {/* Reorder */}
      <div className="flex flex-col gap-0.5 mt-0.5 shrink-0">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="p-0.5 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          className="p-0.5 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Times */}
      <div className="flex items-center gap-1 shrink-0">
        <Input
          type="time"
          value={block.startTime}
          onChange={e => onChange(index, 'startTime', e.target.value)}
          className="h-8 w-24 text-xs font-mono px-2"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <Input
          type="time"
          value={block.endTime}
          onChange={e => onChange(index, 'endTime', e.target.value)}
          className="h-8 w-24 text-xs font-mono px-2"
        />
      </div>

      {/* Activity */}
      <Input
        value={block.activity}
        onChange={e => onChange(index, 'activity', e.target.value)}
        placeholder="Activity…"
        className="h-8 text-xs flex-1 min-w-0"
      />

      {/* Exam */}
      <Select value={block.exam} onValueChange={v => onChange(index, 'exam', v)}>
        <SelectTrigger className="h-8 w-20 text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EXAMS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Type */}
      <Select value={block.type} onValueChange={v => onChange(index, 'type', v)}>
        <SelectTrigger className="h-8 w-28 text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BLOCK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(index)}
        className="mt-0.5 p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 shrink-0 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// A single row in the session history list
function SessionRow({ session, onEdit }) {
  const accuracy = session.questions_attempted
    ? Math.round((session.questions_correct || 0) / session.questions_attempted * 100)
    : null;
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:border-accent/20 cursor-pointer transition-colors"
      onClick={onEdit}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{session.subject}</span>
          <ExamPill exam={session.exam} />
          {activityLabel(session.activity_type) && (
            <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
              {activityLabel(session.activity_type)}
            </span>
          )}
        </div>
        {session.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{session.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-right">
        {session.duration_minutes && (
          <span className="text-xs font-mono text-muted-foreground">{session.duration_minutes}m</span>
        )}
        {accuracy !== null && (
          <span className={`text-xs font-mono font-bold ${accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {accuracy}%
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/50">edit</span>
      </div>
    </div>
  );
}

// Mocks live in a different collection and have no edit form, so they render as
// a read-only row — visible in the day's log, just not clickable.
function MockRow({ mock }) {
  const exam = mock.exam_type?.startsWith('CFA') ? 'CFA' : 'CAT';
  const pct = mock.overall_percentile
    ?? mock.varc_percentile ?? mock.dilr_percentile ?? mock.quant_percentile;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {mock.exam_type}{mock.section ? ` — ${mock.section}` : ''}
          </span>
          <ExamPill exam={exam} />
          {mock.platform && (
            <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
              {mock.platform}
            </span>
          )}
        </div>
        {mock.key_mistakes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{mock.key_mistakes}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-right">
        {mock.overall_score != null && (
          <span className="text-xs font-mono text-muted-foreground">{mock.overall_score}</span>
        )}
        {pct != null && (
          <span className="text-xs font-mono font-bold text-amber-400">{pct}%ile</span>
        )}
        <span className="text-[10px] text-muted-foreground/50">mock</span>
      </div>
    </div>
  );
}

// One choice for the whole day. Rendering is driven by the blocks themselves —
// any schedule carrying an `alt` gets this, so a future fork needs no change here.
function BranchToggle({ branch, onChange }) {
  const active = BRANCHES.find(b => b.value === branch);
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium">Did you get the paper back?</p>
          <p className="text-xs text-muted-foreground mt-0.5">{active?.hint}</p>
        </div>
        <div className="flex shrink-0 rounded-lg border border-border overflow-hidden">
          {BRANCHES.map(b => (
            <button
              key={b.value}
              type="button"
              onClick={() => onChange(b.value)}
              className={`text-xs font-medium px-3 py-1.5 transition-colors ${
                b.value === branch
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamPill({ exam }) {
  if (!exam || exam === 'Break') return null;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
      exam === 'CFA' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
    }`}>
      {exam}
    </span>
  );
}

export default function TodayPlan() {
  const phase = getCurrentPhase();
  const week = getCurrentWeek();

  const [editing, setEditing] = useState(false);
  const [displayBlocks, setDisplayBlocks] = useState(loadDisplaySchedule);
  const [editBlocks, setEditBlocks] = useState([]);
  const [hasOverride, setHasOverride] = useState(() => !!getScheduleOverride(TODAY));
  const [branch, setBranch] = useState(() => getMockDayBranch(TODAY));

  // Sessions for today (source of truth for completion)
  const [todaysSessions, setTodaysSessions] = useState([]);
  // Mock blocks are logged as MockTest records, so completion needs these too
  const [todaysMocks, setTodaysMocks] = useState([]);

  // Dialog state: null | { blockIndex, exam } for new log | { session } for editing
  const [logDialog, setLogDialog] = useState(null);

  const loadSessions = useCallback(async () => {
    const [sessions, mocks] = await Promise.all([
      db.entities.StudySession.filter({ date: TODAY }, 'created_date', 500),
      db.entities.MockTest.filter({ date: TODAY }, 'created_date', 100),
    ]);
    setTodaysSessions(sessions);
    setTodaysMocks(mocks);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // What actually renders: the day's blocks with the chosen branch applied.
  // Positions are unchanged by the swap, so the completion map stays valid.
  const shownBlocks = applyBranch(displayBlocks, branch);

  // Completion derived from session count per exam type — works for sessions
  // logged from any page (CFAProgress, CATProgress, TodayPlan).
  const completed = completedFromSessions(todaysSessions, todaysMocks, shownBlocks);

  const now = moment();
  const nowMinutes = now.hours() * 60 + now.minutes();
  function isCurrentBlock(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const [, sh, sm, eh, em] = match.map(Number);
    return nowMinutes >= sh * 60 + sm && nowMinutes < eh * 60 + em;
  }

  function enterEdit() {
    setEditBlocks(loadEditableSchedule(branch));
    setEditing(true);
  }

  function handleChange(index, field, value) {
    setEditBlocks(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  }

  function handleDelete(index) {
    setEditBlocks(prev => prev.filter((_, i) => i !== index));
  }

  function handleMove(index, dir) {
    setEditBlocks(prev => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleAddBlock() {
    setEditBlocks(prev => {
      const last = prev[prev.length - 1];
      const start = last ? last.endTime : '09:00';
      const [sh, sm] = start.split(':').map(Number);
      const endMin = sh * 60 + sm + 60;
      const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
      return [...prev, { ...newBlock(), startTime: start, endTime, _id: ++_nextId }];
    });
  }

  function handleSave() {
    saveScheduleOverride(TODAY, editBlocks);
    setDisplayBlocks(editBlocks.map(editableToDisplay));
    setHasOverride(true);
    setEditing(false);
  }

  function handleReset() {
    clearScheduleOverride(TODAY);
    const fresh = getTodaySchedule();
    setDisplayBlocks(fresh);
    setHasOverride(false);
    setEditing(false);
  }

  function openLogDialog(blockIndex, block) {
    if (!block.exam || block.exam === 'Break') return;
    setLogDialog({ blockIndex, exam: block.exam, block });
  }

  function openEditDialog(session) {
    setLogDialog({ session });
  }

  function closeDialog() {
    setLogDialog(null);
    loadSessions();
  }

  function handleBranchChange(value) {
    setBranch(value);
    setMockDayBranch(TODAY, value);
  }

  const studyBlocks = shownBlocks.filter(b => b.type !== 'break');
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = studyBlocks.length > 0 ? Math.round((completedCount / studyBlocks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Today's Plan</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {moment().format('dddd, MMMM D')} · Phase {phase} · Week {week}
              {hasOverride && !editing && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase">
                  Custom
                </span>
              )}
            </p>
          </div>
          {!editing ? (
            <div className="flex gap-2">
              {hasOverride && (
                <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 text-muted-foreground">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={enterEdit} className="gap-2">
                <Pencil className="w-4 h-4" /> Edit Schedule
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleReset} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" /> Reset to default
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-2">
                <Check className="w-4 h-4" /> Done
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Progress Bar — only in view mode */}
      {!editing && (
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Day Progress</span>
            <span className="text-sm font-bold font-mono text-accent">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              className="h-full bg-accent rounded-full"
              transition={{ type: "spring", stiffness: 100 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completedCount} of {studyBlocks.length} study blocks logged
          </p>
        </div>
      )}

      {/* Schedule */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {editing ? 'Edit Schedule' : 'Study Blocks'}
        </h2>

        {/* Editing produces a fixed custom day, so the fork only applies to a
            default schedule — which is also when `alt` survives. */}
        {!editing && hasBranch(displayBlocks) && (
          <BranchToggle branch={branch} onChange={handleBranchChange} />
        )}

        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {editBlocks.map((block, i) => (
                <EditRow
                  key={block._id}
                  block={block}
                  index={i}
                  total={editBlocks.length}
                  onChange={handleChange}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBlock}
                className="w-full gap-2 border-dashed mt-1"
              >
                <Plus className="w-4 h-4" /> Add Block
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {shownBlocks.map((block, i) => (
                <ScheduleBlock
                  key={i}
                  block={block}
                  index={i}
                  isCurrent={isCurrentBlock(block.time)}
                  isCompleted={!!completed[i]}
                  onLog={() => openLogDialog(i, block)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Session Log History — only in view mode */}
      {!editing && (
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Today's Sessions
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {todaysSessions.length + todaysMocks.length} logged
            </span>
          </div>
          {todaysSessions.length + todaysMocks.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-4">
              No sessions logged yet. Hit <strong>Log</strong> on a block above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {todaysMocks.map(m => (
                <MockRow key={m.id} mock={m} />
              ))}
              {todaysSessions.map(s => (
                <SessionRow key={s.id} session={s} onEdit={() => openEditDialog(s)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evening Routine — only in view mode */}
      {!editing && (
        <div className="rounded-xl bg-card border border-border p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Evening Routine
          </h2>
          <div className="space-y-3">
            {[
              { icon: Sun, time: '6:00 – 10:00 PM', label: 'Work (~4 hrs, with dinner break)', color: 'text-orange-400' },
              { icon: Dumbbell, time: '10:00 – 10:45', label: 'Exercise (30–45 min)', color: 'text-emerald-400' },
              { icon: Moon, time: '10:45 – 11:30', label: 'Light reading (Aeon / fiction) + multiplication drill (Calculation Drill page)', color: 'text-blue-400' },
              { icon: Moon, time: '11:30 – 12:30 AM', label: 'Free time, wind down. No screens after 12:00.', color: 'text-purple-400' },
              { icon: Moon, time: '12:30 AM', label: 'Lights out. 8 hours sleep.', color: 'text-slate-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                <span className="text-[11px] font-mono text-muted-foreground w-28 shrink-0">{item.time}</span>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log / Edit session dialog */}
      {logDialog && (
        logDialog.session ? (
          <LogSessionDialog
            exam={logDialog.session.exam}
            session={logDialog.session}
            onClose={closeDialog}
          />
        ) : logDialog.block?.type === 'mock' ? (
          // A mock block records a MockTest, not a study session — the session
          // dialog has no percentile or per-section fields, and forcing a single
          // Subject on a full mock would skew that subject's progress stats.
          <MockForm
            blockIndex={logDialog.blockIndex}
            onClose={closeDialog}
          />
        ) : (
          <LogSessionDialog
            exam={logDialog.exam}
            blockIndex={logDialog.blockIndex}
            block={logDialog.block}
            onClose={closeDialog}
          />
        )
      )}
    </div>
  );
}
