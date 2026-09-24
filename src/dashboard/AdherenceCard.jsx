import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/client";
import moment from "moment";
import { AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";
import { PHASE2_BLOCKS, getCurrentBlock } from "@/lib/studyPlanData";
import { EXAMS, useExamDates, daysUntil } from "@/lib/examDates";

/**
 * Counts tests DUE by today against tests LOGGED, per the recalibrated block grid.
 *
 * A plan fails silently when nothing measures whether it is being followed — the
 * app shows "0 taken" and that reads as a fresh start rather than a deficit.
 * This card exists to make drift visible in week one rather than month five.
 */
function dueByToday(today, key) {
  let due = 0;
  for (const block of PHASE2_BLOCKS) {
    const start = moment(block.start);
    if (today.isBefore(start, 'day')) break;
    const end = moment.min(moment(block.end), today);
    // Inclusive day count — diff() alone undercounts a completed block by a day
    // (a 21-day block reads as 2.86 weeks, not 3), under-reporting the deficit.
    const elapsedDays = end.diff(start, 'days') + 1;
    const weeks = elapsedDays / 7;
    due += Math.floor(weeks * block[key] + 1e-9);
    // Credit the first test of a block's opening week once that week has begun.
    if (block[key] > 0 && weeks < 1 && elapsedDays >= 2) due += 1;
  }
  return due;
}

export default function AdherenceCard() {
  const today = moment();
  const dates = useExamDates();

  const { data: mocks = [] } = useQuery({
    queryKey: ['mockTests'],
    queryFn: () => db.entities.MockTest.list('-date', 200),
  });

  const catMocks = mocks.filter(m => m.exam_type === 'CAT Full');
  const sectionals = mocks.filter(m => m.exam_type === 'CAT Sectional');

  const block = getCurrentBlock(today);
  const mocksDue = dueByToday(today, 'mocksPerWeek');
  const sectionalsDue = dueByToday(today, 'sectionalsPerWeek');

  const lastTest = [...mocks].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const daysSince = lastTest ? today.diff(moment(lastTest.date), 'days') : null;

  // Soonest exam that hasn't happened yet, from the settable dates.
  const nextExam = EXAMS.map(e => ({ ...e, days: daysUntil(dates[e.key], today) }))
    .filter(e => e.days != null && e.days >= 0)
    .sort((a, b) => a.days - b.days)[0] ?? null;

  // No block grid means no campaign, so there is nothing to be behind on.
  if (!PHASE2_BLOCKS.length) return <DormantCard daysSince={daysSince} />;

  const rows = [
    { label: 'Full mocks', taken: catMocks.length, due: mocksDue },
    { label: 'Sectionals', taken: sectionals.length, due: sectionalsDue },
  ];
  const behind = rows.some(r => r.taken < r.due);

  return (
    <div className={`rounded-xl border p-4 ${
      behind ? 'bg-red-500/5 border-red-500/30' : 'bg-card border-border'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {behind
            ? <AlertTriangle className="w-4 h-4 text-red-500" />
            : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plan adherence
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {block ? block.label : 'Pre-plan'}
          {nextExam && ` · ${nextExam.days}d to ${nextExam.label}`}
        </span>
      </div>

      <div className="space-y-2">
        {rows.map(r => {
          const gap = r.due - r.taken;
          return (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold">{r.taken}<span className="text-muted-foreground font-normal"> / {r.due} due</span></span>
                {gap > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500">
                    {gap} behind
                  </span>
                )}
                {gap <= 0 && r.due > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                    on track
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <CalendarClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className={`text-[11px] ${daysSince != null && daysSince > 7 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
          {daysSince == null
            ? 'No test ever logged. The diagnostic is the whole plan right now.'
            : daysSince > 7
              ? `${daysSince} days since your last test — a week with none is a red alert, not a scheduling hiccup.`
              : `Last test ${daysSince === 0 ? 'today' : `${daysSince}d ago`}.`}
        </span>
      </div>

      {block && (
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{block.focus}</p>
      )}
    </div>
  );
}

/**
 * With an empty block grid the deficit maths is vacuous — every row reads "0 / 0
 * due" and the card claims you are on track for a plan that does not exist. This
 * says the truthful thing instead, and still reports when the last test was, so
 * a restart is visible the moment one is logged.
 */
function DormantCard({ daysSince }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="w-4 h-4 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plan adherence
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        No campaign running — no tests are due.
      </p>
      <p className="text-[11px] text-muted-foreground mt-2">
        {daysSince == null
          ? 'No test ever logged.'
          : `Last test ${daysSince === 0 ? 'today' : `${daysSince}d ago`}.`}
      </p>
    </div>
  );
}
