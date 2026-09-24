/**
 * WHERE YOU ACTUALLY ARE — derived from logged mocks, never typed.
 *
 * The Action Plan's headline used to carry the latest mock's numbers as literals,
 * and they rotted exactly as hand-copied numbers do — the card went on quoting an
 * old paper while a newer one sat in the database. Numbers are derived here;
 * judgement (the targets, the prose) stays authored in actionPlan.js.
 *
 * ── THE MODEL ─────────────────────────────────────────────────────────────
 *
 * Marks = coverage × accuracy, and the two need opposite fixes:
 *
 *   coverage = attempted / total    how much of the paper you touched
 *   accuracy = right / attempted    what you did with what you touched
 *   yield    = right / total        the only one that becomes marks
 *
 * Accuracy is judged against an absolute floor — below it the marginal attempt
 * stops paying. Attempts are judged against the plan's own target, NOT against
 * an absolute, because interim targets are deliberately set low. A fixed
 * coverage floor would permanently label a section that is exactly where the
 * plan wants it as failing.
 *
 * That gives four states. The test of the model is that it reproduces calls a
 * human would make by hand from the same numbers — cut attempts on a section
 * attempting freely at low accuracy, expand one converting well on few.
 */

export const SECTIONS = [
  { key: 'varc', label: 'VARC' },
  { key: 'dilr', label: 'DILR' },
  { key: 'quant', label: 'QA' },
];

// CAT pays +3 / −1, so a 4-option guess breaks even at 25%. This floor is much
// higher deliberately: it is not "do attempts lose marks" but "is this section
// converting well enough that adding attempts is the right next move".
export const ACCURACY_FLOOR = 0.6;

// Worst first. The headline addresses the most serious state present.
export const STATE_ORDER = ['not-functional', 'overreaching', 'underreaching', 'converting'];

export const STATE_META = {
  'not-functional': {
    label: 'Not functional',
    gloss: 'Below the attempt target and not converting what you do attempt. Neither a rule nor more attempts fixes this — it needs content.',
    tone: 'red',
  },
  overreaching: {
    label: 'Overreaching',
    gloss: 'Attempting at or past target, converting below it. The marginal attempt is losing marks — cut attempts before anything else.',
    tone: 'amber',
  },
  underreaching: {
    label: 'Underreaching',
    gloss: 'Converting well, attempting under target. You are leaving marks you would have won — expand.',
    tone: 'blue',
  },
  converting: {
    label: 'Converting',
    gloss: 'At or past target on both. Hold it, protect it, and raise the target.',
    tone: 'emerald',
  },
};

const num = v => (v == null || v === '' ? null : Number(v));

/** Sections marked as not-a-measurement on a record. Stored like difficulty_breakup. */
export function parseVoidSections(mock) {
  if (!mock?.void_sections) return [];
  try {
    const parsed = JSON.parse(mock.void_sections);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Full CAT mocks only, newest first. Sectionals are excluded on purpose: a
 * sectional is fresh, single-section and has no cross-section clock, which is
 * why the plan treats it as an upper bound rather than "the number".
 */
export function fullMocks(mocks = []) {
  return mocks
    .filter(m => m.exam_type === 'CAT Full')
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/**
 * Attempted is derived from correct + incorrect rather than read from the
 * skipped field, which is hand-entered and has been wrong in practice — records
 * have been logged with skip counts that do not reconcile against the section
 * size. Correct and incorrect come off the score report and are the trustworthy
 * pair.
 */
export function sectionFigures(mock, key) {
  const right = num(mock[`${key}_correct`]);
  const wrong = num(mock[`${key}_incorrect`]);
  if (right == null && wrong == null) return null;

  const att = (right ?? 0) + (wrong ?? 0);
  const stated = num(mock[`${key}_total`]);
  const skipped = num(mock[`${key}_skipped`]);
  // Prefer the stated section size; fall back only if it is missing entirely.
  const total = stated ?? (skipped == null ? null : att + skipped);

  return {
    att,
    right: right ?? 0,
    total,
    score: num(mock[`${key}_score`]),
    coverage: total ? att / total : null,
    accuracy: att ? (right ?? 0) / att : null,
    yield: total ? (right ?? 0) / total : null,
  };
}

/** Four states from two comparisons. `target` is { att: [min, max], ... } or null. */
export function diagnose(figures, target) {
  if (!figures || figures.accuracy == null) return null;
  const converting = figures.accuracy >= ACCURACY_FLOOR;
  // With no target to measure against, attempts can't be called short.
  const atTarget = target?.att ? figures.att >= target.att[0] : true;

  if (converting && atTarget) return 'converting';
  if (converting) return 'underreaching';
  if (atTarget) return 'overreaching';
  return 'not-functional';
}

/**
 * The previous mock to compare against MUST be the same platform. Test series
 * sit at different difficulties, so a source switch would otherwise render as a
 * change in your performance — the one reading the plan explicitly forbids.
 */
function previousComparable(ordered, latest) {
  return ordered.find(m => m !== latest && m.platform && m.platform === latest.platform) ?? null;
}

/**
 * Everything the Action Plan headline needs. Returns null when there is no full
 * mock to read, so callers fall back to the authored default rather than
 * rendering an empty diagnosis.
 */
export function deriveMockState(mocks = [], targets = {}) {
  const ordered = fullMocks(mocks);
  const latest = ordered[0];
  if (!latest) return null;

  const previous = previousComparable(ordered, latest);
  const latestVoid = parseVoidSections(latest);
  const previousVoid = previous ? parseVoidSections(previous) : [];

  const sections = SECTIONS.map(({ key, label }) => {
    const voided = latestVoid.includes(key);
    const figures = voided ? null : sectionFigures(latest, key);
    const target = targets[key] ?? null;

    // A delta needs both ends to be real measurements of the same thing.
    const prevFigures =
      previous && !voided && !previousVoid.includes(key) ? sectionFigures(previous, key) : null;

    return {
      key,
      label,
      voided,
      figures,
      target,
      state: diagnose(figures, target),
      delta:
        figures && prevFigures && prevFigures.accuracy != null
          ? { att: figures.att - prevFigures.att, right: figures.right - prevFigures.right }
          : null,
    };
  });

  const measured = sections.filter(s => s.state);
  const headlineState = STATE_ORDER.find(st => measured.some(s => s.state === st)) ?? null;

  // Same-platform full mocks with at least one section that counts. Two points
  // is a comparison; a trend needs three, and saying so is the honest version.
  const comparable = ordered.filter(
    m => m.platform === latest.platform && SECTIONS.some(s => !parseVoidSections(m).includes(s.key)),
  );

  return {
    latest,
    previous,
    sections,
    headlineState,
    sectionsInHeadlineState: measured.filter(s => s.state === headlineState).map(s => s.label),
    voidedLabels: sections.filter(s => s.voided).map(s => s.label),
    sampleSize: comparable.length,
    canClaimTrend: comparable.length >= 3,
    totals: measured.reduce(
      (a, s) => ({ att: a.att + s.figures.att, right: a.right + s.figures.right }),
      { att: 0, right: 0 },
    ),
  };
}
