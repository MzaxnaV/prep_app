/**
 * ACTIVITIES — the one vocabulary for "what kind of work was this".
 *
 * Plan blocks (studyPlanData.js) and logged sessions (StudySession.activity_type)
 * both speak these keys. There used to be two lists and a hand-maintained map
 * between them (BLOCK_TYPE_TO_ACTIVITY), which drifted twice: CAT blocks of type
 * `practice`/`revision` prefilled the CFA-only 'Qbank Practice', so the dropdown
 * rendered blank; and the Full CAT Mock block prefilled as a *sectional*. One
 * vocabulary is what stops that recurring.
 *
 * ── STORED VALUE IS THE KEY, NOT THE LABEL ────────────────────────────────
 *
 * `activity_type` holds 'practice', never 'Practice'. Labels are display only,
 * so renaming one is not a data migration.
 *
 * ── ADDING ONE ────────────────────────────────────────────────────────────
 *
 * Append an entry. Nothing else: the dialog's dropdown, which numeric fields
 * appear, and whether Subject is required all derive from these flags.
 *
 *   exams    — which exams offer it in the log dialog
 *   subject  — 'required' | 'optional' | 'none'  ('none' hides the field)
 *   metric   — what numeric fields to show:
 *                'full'  — total/correct/wrong/skipped + %ile + difficulty breakup
 *                'basic' — attempted/correct only
 *                'none'  — no numeric fields
 *   loggable — false for schedule filler (breaks); no Log button, never in the
 *              dropdown
 */

export const ACTIVITIES = {
  'new-material': {
    label: 'New Material',
    exams: ['CAT', 'CFA'],
    subject: 'required',
    metric: 'basic',
  },
  'gap-fill': {
    label: 'Gap-Filling',
    exams: ['CAT', 'CFA'],
    subject: 'required',
    metric: 'basic',
  },
  // Subject is optional here for one specific reason: the 10-minute calculation
  // drill is a `practice` block that belongs to no section. Everything else of
  // this type should still name one — see the caveat in the dialog.
  practice: {
    label: 'Practice',
    exams: ['CAT', 'CFA'],
    subject: 'optional',
    metric: 'full',
  },
  'timed-practice': {
    label: 'Timed Practice',
    exams: ['CAT'],
    subject: 'required',
    metric: 'full',
  },
  revision: {
    label: 'Revision',
    exams: ['CAT', 'CFA'],
    subject: 'optional',
    metric: 'none',
  },
  sectional: {
    label: 'Sectional Test',
    exams: ['CAT'],
    subject: 'required',
    metric: 'full',
  },
  // A full mock spans every section at once, so there is no one subject to
  // attribute it to — same reason analysis has none.
  mock: {
    label: 'Full Mock',
    exams: ['CAT', 'CFA'],
    subject: 'none',
    metric: 'full',
  },
  analysis: {
    label: 'Mock Analysis',
    exams: ['CAT', 'CFA'],
    subject: 'none',
    metric: 'basic',
  },
  break: {
    label: 'Break',
    loggable: false,
  },
};

/** Old display-string values → keys. Used by the migration and by readers of legacy rows. */
export const LEGACY_ACTIVITY_LABELS = {
  'New Material': 'new-material',
  'Gap-Filling': 'gap-fill',
  'Qbank Practice': 'practice',
  'Timed Practice': 'timed-practice',
  'Sectional Test': 'sectional',
  'Mock Analysis': 'analysis',
};

/** Accepts a key or a legacy label; returns a key, or '' if neither. */
export function activityKey(value) {
  if (!value) return '';
  if (ACTIVITIES[value]) return value;
  return LEGACY_ACTIVITY_LABELS[value] || '';
}

/** Keys offered in the log dialog for an exam, in declaration order. */
export function activitiesForExam(exam) {
  return Object.entries(ACTIVITIES)
    .filter(([, a]) => a.loggable !== false && a.exams?.includes(exam))
    .map(([key, a]) => ({ key, label: a.label }));
}

export const activityLabel = key => ACTIVITIES[activityKey(key)]?.label || '';
export const subjectMode = key => ACTIVITIES[activityKey(key)]?.subject || 'required';
export const metricMode = key => ACTIVITIES[activityKey(key)]?.metric || 'basic';
export const isLoggable = key => ACTIVITIES[key]?.loggable !== false;

/**
 * Dev-only: catch the two failures the old map made silently — a schedule block
 * whose `type` no activity defines, and one used for an exam that doesn't offer
 * it. Import-time, so it surfaces before the dialog does.
 */
export function validateScheduleActivities(schedules) {
  if (!import.meta.env?.DEV) return;
  const unknown = [];
  const wrongExam = [];
  for (const [name, blocks] of Object.entries(schedules)) {
    for (const b of blocks) {
      // A forked block is two blocks in practice, and the branch the user never
      // picks is exactly the one whose drift nobody notices — so check both.
      const variants = b.alt ? [b, { ...b, ...b.alt }] : [b];
      for (const v of variants) {
        const a = ACTIVITIES[v.type];
        if (!a) {
          unknown.push(`${name}: "${v.activity}" → type '${v.type}'`);
          continue;
        }
        if (a.loggable === false) continue;
        if (v.exam !== 'Break' && !a.exams?.includes(v.exam)) {
          wrongExam.push(`${name}: "${v.activity}" is ${v.exam} but '${v.type}' offers ${a.exams?.join('/')}`);
        }
      }
    }
  }
  if (unknown.length) console.warn('[activities] schedule blocks with no matching activity:', unknown);
  if (wrongExam.length) console.warn('[activities] blocks whose exam does not offer their activity:', wrongExam);
}
