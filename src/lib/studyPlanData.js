import moment from 'moment';
import { validateScheduleActivities } from './activities';

/**
 * Campaign anchors. Null until a campaign starts — the week and phase counters
 * are derived from these, and a counter anchored to a date nobody is working
 * towards reports a number that looks meaningful and isn't.
 *
 * Exam dates are NOT here: they are user-set in lib/examDates.js and edited on
 * the Settings page.
 */
export const START_DATE = null;
export const PHASE2_START = null;

/**
 * The block grid is EMPTY because no campaign is running.
 *
 * It is not deleted — the shape is what Today's Plan and the adherence card read,
 * and the next campaign refills it. Empty means `getCurrentBlock()` returns null
 * and "tests due" is 0, so the adherence card stops reporting a deficit against a
 * schedule nobody is on. A stale grid reports "behind" every day of a period in
 * which no test was ever meant to be taken.
 *
 * Shape, when refilled — build it backwards from the exam date:
 *
 *   { id: 'A', label: 'Block A — Foundations', start: 'YYYY-MM-DD', end: 'YYYY-MM-DD',
 *     mocksPerWeek: 1, sectionalsPerWeek: 3, focus: 'What this block is for.' }
 */
export const PHASE2_BLOCKS = [];

export function getCurrentBlock(date = moment()) {
  const d = moment(date);
  return PHASE2_BLOCKS.find(b => d.isSameOrAfter(b.start, 'day') && d.isSameOrBefore(b.end, 'day')) || null;
}

/**
 * These four all return null with no campaign anchor set. Callers must render
 * the null rather than coerce it: `moment(null).diff()` is NaN, which is how a
 * "Week NaN" would reach the page.
 */
export function getCurrentPhase(date = moment()) {
  if (!PHASE2_START) return null;
  return moment(date).isBefore(PHASE2_START) ? 1 : 2;
}

export function getCurrentWeek(date = moment()) {
  if (!START_DATE) return null;
  const d = moment(date);
  const start = moment(START_DATE);
  if (d.isBefore(start)) return 0;
  return Math.floor(d.diff(start, 'days') / 7) + 1;
}

export function getDaysRemaining(examDate, date = moment()) {
  if (!examDate) return null;
  return moment(examDate).diff(moment(date), 'days');
}

export function getPhase1Week(date = moment()) {
  if (!START_DATE) return null;
  return Math.floor(moment(date).diff(moment(START_DATE), 'days') / 7) + 1;
}

export function getPhase2Week(date = moment()) {
  if (!PHASE2_START) return null;
  return Math.floor(moment(date).diff(moment(PHASE2_START), 'days') / 7) + 1;
}

export function getCFASubjectForWeek(week) {
  if (week <= 2) return { subject: 'Corporate Issuers', detail: 'Capital budgeting (NPV/IRR), WACC, leverage, dividends' };
  if (week <= 5) return { subject: 'Fixed Income', detail: 'Bond pricing, yields, duration/convexity, term structure, credit' };
  if (week <= 7) return { subject: 'Equity Investments', detail: 'Market structure, industry analysis, DDM, relative valuation' };
  if (week <= 9) return { subject: 'Portfolio Mgmt + Derivatives', detail: 'CAPM, diversification, IPS, forwards/futures/options/swaps' };
  if (week <= 10) return { subject: 'Alternative Investments', detail: 'Real estate, PE, commodities, fees' };
  if (week <= 13) return { subject: 'Ethics', detail: 'Standards of Practice Handbook, EOC questions' };
  if (week <= 16) return { subject: 'Full Syllabus Revision', detail: 'Topic-by-topic, 80-100 Qbank questions/day' };
  return { subject: 'Mock Exam Phase', detail: 'Full mock every 3 days, daily Ethics review' };
}

export function getGapFillRotation(date = moment()) {
  const start = moment(START_DATE);
  const daysSinceStart = moment(date).diff(start, 'days');
  const rotation = daysSinceStart % 3;
  if (rotation === 0) return { subject: 'FSA', label: 'Day A — FSA Gap-Fill', topics: 'Balance sheet, Cash flows, Ratios, Inventories, Long-lived assets' };
  if (rotation === 1) return { subject: 'Quant', label: 'Day B — Quant Gap-Fill', topics: 'Hypothesis testing, Regression, Probability' };
  return { subject: 'Econ', label: 'Day C — Econ Gap-Fill', topics: 'FX quotes & parity, Monetary/fiscal policy, Inflation, Growth models' };
}

export function getPhase1Schedule(date = moment()) {
  const week = getPhase1Week(date);
  const cfaSubject = getCFASubjectForWeek(week);
  const gapFill = getGapFillRotation(date);
  const dayOfWeek = moment(date).day();

  if (dayOfWeek === 0 && week >= 5) {
    return [
      { time: '9:30 – 12:30', duration: 180, activity: 'Full CAT Mock', exam: 'CAT', type: 'mock' },
      { time: '12:30 – 1:00', duration: 30, activity: 'Break', exam: 'Break', type: 'break' },
      { time: '1:00 – 3:00', duration: 120, activity: 'Written Mock Analysis', exam: 'CAT', type: 'analysis' },
      { time: '3:00 – 3:45', duration: 45, activity: 'Lunch', exam: 'Break', type: 'break' },
      { time: '3:45 – 6:00', duration: 135, activity: 'CFA Revision / Weak Area Review', exam: 'CFA', type: 'revision' },
    ];
  }

  return [
    { time: '9:30 – 10:00', duration: 30, activity: 'VARC Maintenance', exam: 'CAT', type: 'practice' },
    { time: '10:00 – 11:15', duration: 75, activity: 'DILR Focused Practice', exam: 'CAT', type: 'practice' },
    { time: '11:15 – 11:30', duration: 15, activity: 'Break', exam: 'Break', type: 'break' },
    { time: '11:30 – 2:30', duration: 180, activity: `CFA — ${cfaSubject.subject}`, exam: 'CFA', type: 'new-material', detail: cfaSubject.detail },
    { time: '2:30 – 3:15', duration: 45, activity: 'Lunch', exam: 'Break', type: 'break' },
    { time: '3:15 – 4:15', duration: 60, activity: `CFA — ${gapFill.label}`, exam: 'CFA', type: 'gap-fill', detail: gapFill.topics },
    { time: '4:15 – 5:15', duration: 60, activity: 'CFA — Qbank Mixed Practice', exam: 'CFA', type: 'practice' },
    { time: '5:15 – 6:00', duration: 45, activity: 'CAT — QA Practice', exam: 'CAT', type: 'practice' },
  ];
}

/**
 * Mock days by block id. Live proctored windows override this — a mock scored
 * against a real concurrent cohort is worth more than one taken on the day the
 * grid happens to name.
 *
 *   0 — Mon (diagnostic) · A — Sun · B — Sun + Wed · C — Sun + Tue + Thu · D — Mon
 */
export function isMockDay(date = moment()) {
  const day = moment(date).day(); // 0 = Sun
  const block = getCurrentBlock(date);
  if (!block) return false;
  switch (block.id) {
    case '0': return day === 1;
    case 'A': return day === 0;
    case 'B': return day === 0 || day === 3;
    case 'C': return day === 0 || day === 2 || day === 4;
    case 'D': return day === 1;
    default: return false;
  }
}

// Mock days fork on whether you get the paper back. Many series return a score
// report and nothing else, which is the normal case, not the exception — yet
// both afternoon blocks were written assuming the questions were in front of
// you: the analysis block needs the wrong answers, the practice block needs to
// know which ones they were. A block's `alt` is the score-only version of that
// block, and it is what renders by default; see lib/mockDayBranch.js for how one
// choice swaps the whole day. `alt` carries only what differs — time, duration
// and exam are inherited.
const MOCK_DAY_SCHEDULE = [
  { time: '9:30 – 12:30', duration: 180, activity: 'Full CAT Mock', exam: 'CAT', type: 'mock', detail: 'Strict exam conditions. Phone away, and tell the house before you start.' },
  { time: '12:30 – 1:00', duration: 30, activity: 'Break', exam: 'Break', type: 'break' },
  {
    time: '1:00 – 3:00', duration: 120, activity: 'Deep Written Mock Analysis', exam: 'CAT', type: 'analysis',
    detail: 'The mock is not the work — this is. No new test until this is done.',
    alt: {
      activity: 'Mock Debrief, then Act On It',
      type: 'analysis',
      detail: '~45 min: write the debrief into the mock record while it is fresh — every attempt/skip call, where the clock actually went, why you left what you left. No paper is coming, so your memory of writing it is the entire dataset and it is gone in 48 hours. Then ~75 min on whatever the debrief just named, untimed. Reviewing questions is not an option; acting on what you remember is.',
    },
  },
  { time: '3:00 – 3:45', duration: 45, activity: 'Lunch', exam: 'Break', type: 'break' },
  {
    time: '3:45 – 6:00', duration: 135, activity: 'Targeted Practice on Weak Spots', exam: 'CAT', type: 'practice',
    detail: 'CFA gets zero on mock days.',
    alt: {
      activity: 'Coverage Drill — What You Never Opened',
      type: 'practice',
      detail: 'No paper means no wrong-answer drilling — but unopened questions need no paper to identify: the passages you skipped, the QA topics you never reached, the DILR set types you walked past. Coverage is the one weakness a score report still tells you about. CFA gets zero on mock days.',
    },
  },
];

// Blocks 0 & A — content-building weighting for a cold start.
const FOUNDATION_SCHEDULE = [
  { time: '9:30 – 9:40', duration: 10, activity: 'Calculation Speed Drill', exam: 'CAT', type: 'practice', detail: 'Zetamac 120s, then fractions, on the Calculation Drill page. Non-negotiable.' },
  { time: '9:40 – 11:45', duration: 125, activity: 'QA — Concepts + Drills', exam: 'CAT', type: 'new-material', detail: 'Arithmetic first — ~40% of CAT QA. Short topic tests fit here.' },
  { time: '11:45 – 12:00', duration: 15, activity: 'Break', exam: 'Break', type: 'break' },
  { time: '12:00 – 2:00', duration: 120, activity: 'DILR — Set-Type Fundamentals', exam: 'CAT', type: 'new-material', detail: 'Untimed → timed. Cycle the set-type sequence.' },
  { time: '2:00 – 2:45', duration: 45, activity: 'Lunch', exam: 'Break', type: 'break' },
  { time: '2:45 – 4:15', duration: 90, activity: 'VARC — Timed RC + VA', exam: 'CAT', type: 'timed-practice', detail: 'Accuracy before volume. Two eliminations before marking an answer.' },
  { time: '4:15 – 4:30', duration: 15, activity: 'Break', exam: 'Break', type: 'break' },
  { time: '4:30 – 6:00', duration: 90, activity: 'Rotating — Weak Topic / DILR Review / Error Journal', exam: 'CAT', type: 'revision' },
];

// Blocks B & C — DILR-dominant once pattern vocabulary exists.
const INTENSIVE_SCHEDULE = [
  { time: '9:30 – 11:00', duration: 90, activity: 'DILR — Timed Sets + Review', exam: 'CAT', type: 'timed-practice', detail: '60-second triage on every set. Log the decision.' },
  { time: '11:00 – 11:15', duration: 15, activity: 'Break', exam: 'Break', type: 'break' },
  { time: '11:15 – 12:45', duration: 90, activity: 'VARC — Timed RC + VA', exam: 'CAT', type: 'timed-practice' },
  { time: '12:45 – 1:00', duration: 15, activity: 'Break', exam: 'Break', type: 'break' },
  { time: '1:00 – 2:30', duration: 90, activity: 'Quant — Timed Sectional Practice', exam: 'CAT', type: 'timed-practice', detail: '2 min per question, hard cap.' },
  { time: '2:30 – 3:15', duration: 45, activity: 'Lunch', exam: 'Break', type: 'break' },
  { time: '3:15 – 4:45', duration: 90, activity: 'DILR — Weak Set Types', exam: 'CAT', type: 'practice', detail: 'Driven by the set-type heatmap, not by feel.' },
  { time: '4:45 – 6:00', duration: 75, activity: 'Weak Section Focus + Strategy Journal', exam: 'CAT', type: 'revision', detail: 'Rotate by mock data, not feeling. Journal is what keeps the plan closed-loop.' },
];

// Block D — taper.
const TAPER_SCHEDULE = [
  { time: '9:30 – 11:00', duration: 90, activity: 'DILR — Light Sets, Familiar Types', exam: 'CAT', type: 'practice', detail: 'Confidence, not stretch. No new set types.' },
  { time: '11:00 – 11:15', duration: 15, activity: 'Break', exam: 'Break', type: 'break' },
  { time: '11:15 – 12:15', duration: 60, activity: 'VARC — 2 RC Passages', exam: 'CAT', type: 'timed-practice' },
  { time: '12:15 – 1:15', duration: 60, activity: 'QA — Formula + Shortcut Review', exam: 'CAT', type: 'revision', detail: 'Review only. No new concepts this late.' },
  { time: '1:15 – 2:00', duration: 45, activity: 'Lunch', exam: 'Break', type: 'break' },
  { time: '2:00 – 3:00', duration: 60, activity: 'Exam-Day Strategy Rehearsal', exam: 'CAT', type: 'revision', detail: 'Section order, time splits, skip rules. Make them automatic.' },
  { time: '3:00 – 6:00', duration: 180, activity: 'Rest — deliberately unscheduled', exam: 'Break', type: 'break', detail: 'Sleep and calm are the deliverable this week.' },
];

// A block's `type` is an activity key from lib/activities.js. This warns in dev
// if one drifts — the failure the old BLOCK_TYPE_TO_ACTIVITY map made silently.
validateScheduleActivities({
  MOCK_DAY_SCHEDULE,
  FOUNDATION_SCHEDULE,
  INTENSIVE_SCHEDULE,
  TAPER_SCHEDULE,
});

export function getPhase2Schedule(date = moment()) {
  const block = getCurrentBlock(date);
  if (isMockDay(date)) return MOCK_DAY_SCHEDULE;
  if (!block) return INTENSIVE_SCHEDULE;
  if (block.id === '0' || block.id === 'A') return FOUNDATION_SCHEDULE;
  if (block.id === 'D') return TAPER_SCHEDULE;
  return INTENSIVE_SCHEDULE;
}

export function getTodaySchedule(date = moment()) {
  const phase = getCurrentPhase(date);
  if (phase === 1) return getPhase1Schedule(date);
  return getPhase2Schedule(date);
}

// Ordered subject name list for dropdowns (matches SubjectProgress.subject values)
export const CFA_SUBJECT_NAMES = [
  'Ethics', 'Financial Statement Analysis', 'Fixed Income', 'Equity Investments',
  'Quantitative Methods', 'Economics', 'Corporate Issuers', 'Derivatives',
  'Portfolio Management', 'Alternative Investments',
];

export const CFA_SUBJECTS = [
  { name: 'Ethics', weight: '15-20%', target: 300, status: 'Not Started' },
  { name: 'Financial Statement Analysis', weight: '13-17%', target: 400, status: 'Gap-Filling', pending: 'Balance sheet, Cash flows, Ratios/DuPont, Inventories, Long-lived assets' },
  { name: 'Fixed Income', weight: '10-14%', target: 250, status: 'Not Started' },
  { name: 'Equity Investments', weight: '10-13%', target: 150, status: 'Not Started' },
  { name: 'Quantitative Methods', weight: '6-9%', target: 250, status: 'Gap-Filling', pending: 'Hypothesis testing' },
  { name: 'Economics', weight: '6-9%', target: 200, status: 'Gap-Filling', pending: 'Inflation, Monetary/fiscal policy, FX quotes & parity, Growth models' },
  { name: 'Corporate Issuers', weight: '6-9%', target: 150, status: 'Not Started' },
  { name: 'Derivatives', weight: '5-8%', target: 120, status: 'Not Started' },
  { name: 'Portfolio Management', weight: '5-8%', target: 80, status: 'Not Started' },
  { name: 'Alternative Investments', weight: '5-8%', target: 60, status: 'Not Started' },
];

/**
 * A 20-week L1 sequence, by week number rather than by date — dates would need
 * rewriting every sitting, week offsets never do.
 */
export const CFA_WEEK_PLAN = [
  { weeks: '1-2', subject: 'Corporate Issuers', detail: 'Capital budgeting, WACC, leverage, dividends' },
  { weeks: '3-5', subject: 'Fixed Income', detail: 'Bond pricing, yields, duration/convexity, credit' },
  { weeks: '6-7', subject: 'Equity Investments', detail: 'Market structure, DDM, relative valuation' },
  { weeks: '8-9', subject: 'Portfolio Mgmt + Derivatives', detail: 'CAPM, diversification, options, swaps' },
  { weeks: '10', subject: 'Alternative Investments', detail: 'Real estate, PE, commodities, fees' },
  { weeks: '11-13', subject: 'Ethics', detail: 'Standards of Practice Handbook' },
  { weeks: '14-16', subject: 'Full Syllabus Revision', detail: '80-100 Qbank questions/day, mistake journal' },
  { weeks: '17-20', subject: 'Mock Exam Phase', detail: 'Full mock every 3 days' },
];

/**
 * Milestone percentile targets, per block. Empty until a campaign sets them,
 * because a milestone is a date plus a number and there is no date.
 *
 * Shape: { milestone: 'End Block A', overall: '85+', varc: '90+', dilr: '70+', qa: '80+' }
 *
 * Missing one by a little is information — it says which block to reweight, not
 * that the plan failed.
 */
export const MOCK_TARGETS = [];

/**
 * Marks -> questions per percentile, CAT '21 data. Copied read-only from the
 * per-section notes in the Obsidian CAT vault, which are the authority.
 * Questions are the useful unit: they are what you decide about in the hall.
 */
export const QUESTION_TARGETS = [
  { pct: '90',   varc: '28 / 9',     dilr: '20 / 7 · 1–2 sets', qa: '18 / 6' },
  { pct: '95',   varc: '34 / 11–12', dilr: '24 / 8 · 2 sets',   qa: '24 / 8' },
  { pct: '97',   varc: '38 / —',     dilr: '29 / 10 · 2–3 sets', qa: '28 / 9–10' },
  { pct: '99',   varc: '45 / 14–15', dilr: '34 / 12 · 3 sets',  qa: '34 / 11–12' },
  { pct: '99.5', varc: '49 / 17–18', dilr: '37 / 13+ · 3–4 sets', qa: '40 / 14+' },
];

/**
 * CALCULATION REFERENCE — the fraction sight-reading asset, rendered on the
 * Calculation Drill page, which also builds its cards from these tables.
 *
 * Data, not prose: the reasoning for why this is worth 10 minutes a day, and the
 * decision to freeze the Zetamac config, live in planContent.js under
 * `calculation-speed`. Do not restate either here.
 *
 * Tiers are learning order, not difficulty. 1 = instant first, 2 = solid next,
 * 3 = recognised on sight only, never produced from memory. Do NOT extend the
 * grid — a decimal outside it is a signal to approximate, not a gap to fill.
 */
export const FRACTION_GRID = [
  {
    family: 'Terminating', tier: 1,
    cue: 'Denominators of only 2s and 5s. Halving chain: .5 → .25 → .125 → .0625.',
    cells: [
      ['1/2', '.5', '50'], ['1/4', '.25', '25'], ['3/4', '.75', '75'],
      ['1/5', '.2', '20'], ['2/5', '.4', '40'], ['3/5', '.6', '60'], ['4/5', '.8', '80'],
      ['1/8', '.125', '12.5'], ['3/8', '.375', '37.5'], ['5/8', '.625', '62.5'], ['7/8', '.875', '87.5'],
      ['1/20', '.05', '5'], ['1/25', '.04', '4'], ['1/40', '.025', '2.5'],
    ],
  },
  {
    family: 'Sixteenths', tier: 1,
    cue: 'Odd multiples of .0625 — every one ends in 25 or 75. That trailing pair is the tell.',
    cells: [
      ['1/16', '.0625', '6.25'], ['3/16', '.1875', '18.75'], ['5/16', '.3125', '31.25'], ['7/16', '.4375', '43.75'],
      ['9/16', '.5625', '56.25'], ['11/16', '.6875', '68.75'], ['13/16', '.8125', '81.25'], ['15/16', '.9375', '93.75'],
    ],
  },
  {
    family: 'Sevenths', tier: 1,
    cue: 'The highest-yield family. All rotations of one cycle — 1→4→2→8→5→7. Index on the leading pair: 14 · 28 · 42 · 57 · 71 · 85, which nothing else opens with.',
    cells: [
      ['1/7', '.142857', '14.29'], ['2/7', '.285714', '28.57'], ['3/7', '.428571', '42.86'],
      ['4/7', '.571428', '57.14'], ['5/7', '.714285', '71.43'], ['6/7', '.857142', '85.71'],
      ['1/14', '.0714285', '7.14'], ['3/14', '.2142857', '21.43'], ['5/14', '.3571428', '35.71'],
      ['9/14', '.6428571', '64.29'], ['11/14', '.7857142', '78.57'], ['13/14', '.9285714', '92.86'],
    ],
  },
  {
    family: 'Thirds & ninths', tier: 1,
    cue: 'One repeating digit — the giveaway. Ninths repeat the numerator: 7/9 = .777…',
    cells: [
      ['1/3', '.333…', '33.33'], ['2/3', '.666…', '66.67'],
      ['1/9', '.111…', '11.11'], ['2/9', '.222…', '22.22'], ['4/9', '.444…', '44.44'],
      ['5/9', '.555…', '55.56'], ['7/9', '.777…', '77.78'], ['8/9', '.888…', '88.89'],
    ],
  },
  {
    family: 'Sixths & twelfths', tier: 1,
    cue: 'One settled digit, then a repeat: .1|666, .08|333. That shape means a 2 or 4 sits alongside the 3.',
    cells: [
      ['1/6', '.1666…', '16.67'], ['5/6', '.8333…', '83.33'],
      ['1/12', '.08333…', '8.33'], ['5/12', '.41666…', '41.67'],
      ['7/12', '.58333…', '58.33'], ['11/12', '.91666…', '91.67'],
      ['1/18', '.0555…', '5.56'], ['1/24', '.041666…', '4.17'],
    ],
  },
  {
    family: 'Elevenths', tier: 2,
    cue: 'Multiples of 09 in two-digit blocks: n/11 repeats 9n.',
    cells: [
      ['1/11', '.0909', '9.09'], ['2/11', '.1818', '18.18'], ['3/11', '.2727', '27.27'],
      ['4/11', '.3636', '36.36'], ['5/11', '.4545', '45.45'], ['6/11', '.5454', '54.55'],
      ['7/11', '.6363', '63.64'], ['8/11', '.7272', '72.73'], ['9/11', '.8181', '81.82'],
      ['10/11', '.9090', '90.91'],
    ],
  },
  {
    family: 'Thirteenths', tier: 2,
    cue: 'Two cycles only — 076923 and 153846. Six fractions rotate through each.',
    cells: [
      ['1/13', '.076923', '7.69'], ['2/13', '.153846', '15.38'], ['3/13', '.230769', '23.08'],
      ['4/13', '.307692', '30.77'], ['5/13', '.384615', '38.46'], ['6/13', '.461538', '46.15'],
      ['7/13', '.538461', '53.85'], ['8/13', '.615384', '61.54'], ['9/13', '.692307', '69.23'],
      ['10/13', '.769230', '76.92'], ['11/13', '.846153', '84.62'], ['12/13', '.923076', '92.31'],
    ],
  },
  {
    family: 'Fifteenths', tier: 2,
    cue: 'Two settled digits, then a repeat: .06|66, .13|33. Fifths crossed with thirds.',
    cells: [
      ['1/15', '.0666', '6.67'], ['2/15', '.1333', '13.33'], ['4/15', '.2666', '26.67'],
      ['7/15', '.4666', '46.67'], ['8/15', '.5333', '53.33'], ['11/15', '.7333', '73.33'],
      ['13/15', '.8666', '86.67'], ['14/15', '.9333', '93.33'],
    ],
  },
  {
    family: 'The long tail', tier: 3,
    cue: 'Unit fractions only. Recognise on sight; never drill for production. These turn up as rates and per-unit costs.',
    cells: [
      ['1/17', '.0588', '5.88'], ['1/19', '.0526', '5.26'], ['1/21', '.047619', '4.76'],
      ['1/22', '.04545', '4.55'], ['1/23', '.043478', '4.35'], ['1/26', '.03846', '3.85'],
      ['1/28', '.035714', '3.57'], ['1/30', '.0333', '3.33'], ['1/32', '.03125', '3.125'],
      ['1/36', '.0277', '2.78'], ['1/45', '.0222', '2.22'], ['1/50', '.02', '2'],
      ['1/60', '.01666', '1.67'], ['1/80', '.0125', '1.25'],
    ],
  },
];

/** An increase of 1/n is undone by a decrease of 1/(n+1). Answers the whole "price rose, consumption must fall" family with no formula. */
export const PERCENT_PAIRS = [
  { up: '+100%', upF: '1/1', down: '−50%', downF: '1/2' },
  { up: '+50%', upF: '1/2', down: '−33.33%', downF: '1/3' },
  { up: '+33.33%', upF: '1/3', down: '−25%', downF: '1/4' },
  { up: '+25%', upF: '1/4', down: '−20%', downF: '1/5' },
  { up: '+20%', upF: '1/5', down: '−16.67%', downF: '1/6' },
  { up: '+16.67%', upF: '1/6', down: '−14.29%', downF: '1/7' },
  { up: '+14.29%', upF: '1/7', down: '−12.5%', downF: '1/8' },
  { up: '+12.5%', upF: '1/8', down: '−11.11%', downF: '1/9' },
  { up: '+11.11%', upF: '1/9', down: '−10%', downF: '1/10' },
  { up: '+10%', upF: '1/10', down: '−9.09%', downF: '1/11' },
  { up: '+9.09%', upF: '1/11', down: '−8.33%', downF: '1/12' },
];

/** A rate as a fraction you can square — compound interest stops needing a formula. */
export const GROWTH_MULTIPLIERS = [
  { rate: '5%', y1: '21/20', y2: '441/400' },
  { rate: '6.25%', y1: '17/16', y2: '289/256' },
  { rate: '8.33%', y1: '13/12', y2: '169/144' },
  { rate: '10%', y1: '11/10', y2: '121/100' },
  { rate: '12.5%', y1: '9/8', y2: '81/64' },
  { rate: '16.67%', y1: '7/6', y2: '49/36' },
  { rate: '20%', y1: '6/5', y2: '36/25' },
  { rate: '25%', y1: '5/4', y2: '25/16' },
  { rate: '33.33%', y1: '4/3', y2: '16/9' },
  { rate: '50%', y1: '3/2', y2: '9/4' },
];

/** Pie-chart sectors are fractions of 360. 1% = 3.6°. */
export const PIE_ANGLES = [
  ['1/2', '180°'], ['1/3', '120°'], ['1/4', '90°'], ['1/5', '72°'], ['1/6', '60°'],
  ['1/7', '51.4°'], ['1/8', '45°'], ['1/9', '40°'], ['1/10', '36°'], ['1/12', '30°'],
  ['1/15', '24°'], ['1/16', '22.5°'], ['1/18', '20°'], ['1/20', '18°'], ['1/24', '15°'],
  ['1/36', '10°'], ['1/40', '9°'], ['1/72', '5°'],
];

/** Not fractions, but the same kind of asset and the same drill slot. */
export const MATH_CONSTANTS = [
  ['√2', '1.414'], ['√3', '1.732'], ['√5', '2.236'], ['√6', '2.449'],
  ['√7', '2.646'], ['√10', '3.162'], ['1/√2', '.7071'], ['√3/2', '.8660'],
  ['π', '3.1416'], ['22/7', '3.1429'], ['log 2', '.3010'], ['log 3', '.4771'],
  ['log 5', '.6990'], ['log 7', '.8451'],
];

/**
 * MULTIPLICATION RECALL — the evening half of the calculation drill, and the
 * usual Zetamac bottleneck: tables being worked out rather than recalled.
 *
 * Same tier meaning as FRACTION_GRID: 1 = instant both ways, 2 = solid,
 * 3 = recognised on sight only. Cells are numbers; the Drill page and its
 * reference format them.
 *
 *   kind 'table'  — [a, b], a ≤ b, each product once. ×10 is left out: it is free.
 *   kind 'square' / 'cube' — n
 *   kind 'power'  — [base, exponent]
 */
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const tableCells = (bs, as) => bs.flatMap(b => as(b).map(a => [a, b]));

export const MULTIPLICATION_GRID = [
  {
    family: 'Tables ×2–×6', kind: 'table', tier: 1,
    cue: 'Should already be instant. Any that take thought are the Zetamac gap, directly.',
    cells: tableCells(range(2, 6), b => range(2, b)),
  },
  {
    family: 'Tables ×7–×9', kind: 'table', tier: 1,
    cue: 'The slow ones are nearly always 6×7, 7×8, 6×8, 8×9. ×9: tens digit one less than the multiplier, digits sum to 9.',
    cells: tableCells(range(7, 9), b => range(2, b)),
  },
  {
    family: 'Tables ×11–×12', kind: 'table', tier: 1,
    cue: '×12 = ×10 + ×2: 12×7 = 70 + 14. Zetamac multiplies by up to 12, and divides by it.',
    cells: tableCells([11, 12], b => [...range(2, 9), ...range(11, b)]),
  },
  {
    family: 'Tables ×13–×16', kind: 'table', tier: 2,
    cue: 'Build from ×10 until it is recall: 14×7 = 70 + 28 = 98. Most people stop at 12 — this is where time is won.',
    cells: tableCells(range(13, 16), () => range(2, 9)),
  },
  {
    family: 'Tables ×17–×20', kind: 'table', tier: 2,
    cue: 'Round down from 20: 19×7 = 140 − 7 = 133, 18×6 = 120 − 12 = 108.',
    cells: tableCells(range(17, 20), () => range(2, 9)),
  },
  {
    family: 'Squares 11–20', kind: 'square', tier: 2,
    cue: '(10 + n)² = 100 + 20n + n². Anything ending in 5: n(n+1), then 25 — 15² = 225.',
    cells: range(11, 20),
  },
  {
    family: 'Squares 21–30', kind: 'square', tier: 2,
    cue: 'Anchor on 25² = 625: (25 ± k)² = 625 ± 50k + k². 23² = 625 − 100 + 4 = 529.',
    cells: range(21, 30),
  },
  {
    family: 'Cubes 2–10', kind: 'cube', tier: 2,
    cue: 'The last digit of a cube names its root: 8 → 2, 7 → 3, 3 → 7, 2 → 8; 1, 4, 5, 6, 9 map to themselves.',
    cells: range(2, 10),
  },
  {
    family: 'Cubes 11–20', kind: 'cube', tier: 3,
    cue: 'Recognise, never produce. Last digit plus the bracket: 2197 sits between 12³ and 14³ and ends in 7, so 13.',
    cells: range(11, 20),
  },
  {
    family: 'Powers of 2 & 3', kind: 'power', tier: 2,
    cue: '2¹⁰ = 1024 is the anchor; count up or down from it. 3⁵ = 243, 3⁶ = 729.',
    cells: [...range(2, 12).map(e => [2, e]), ...range(2, 6).map(e => [3, e])],
  },
];

export const NON_NEGOTIABLES = [
  {
    title: 'Every scheduled mock gets taken, on its day.',
    detail: 'A mock skipped is a week of blind practice. A plan whose diagnostics never run is a plan running open-loop, and it fails silently rather than loudly.',
  },
  {
    title: 'Written mock analysis after every mock.',
    detail: 'Not mental review — written. Which sets did you attempt? Which should you have skipped? Where did you bleed time? No new test until the last one is written up.',
  },
  {
    title: 'DILR every single morning.',
    detail: "No skipping. No 'I'll do it later.'",
  },
  {
    title: 'No decimal gets written in QA practice.',
    detail: 'Convert it to a fraction or leave it. This is what moves the fraction grid from a memorised list into a reflex — a table you know but never use under pressure is worth nothing on the day.',
  },
  {
    title: 'No calculator during DILR practice.',
    detail: "Not even where it's allowed. The on-screen calculator is mouse-driven and costs several seconds a use; every click in practice trains the slow path instead of recognition. It stays a fallback in mocks, never a first move.",
  },
  {
    title: 'One exam at a time.',
    detail: 'A second exam never displaces the first by decision — it does so by expansion, an hour at a time, until the first one has no hours left. Zero means zero.',
  },
];

export const KEY_RISKS = [
  { risk: 'Second-exam creep', action: 'The classic failure: the dormant exam expands into the live one an hour at a time. Results day, or any emotionally loud moment, is when this will feel most negotiable. It is not.' },
  { risk: 'The open-loop relapse', action: 'A plan whose diagnostics never run disappears silently, because nothing measures it. A week with no test logged is a red alert, not a scheduling hiccup.' },
  { risk: 'Material glut → fake progress', action: 'Taking tests feels like working; only analysing them is working. Buying more of them is neither.' },
  { risk: 'Comparing percentiles across series', action: 'A 97 on three different series is three different claims. Compare like to like, always.' },
  { risk: 'Cold-start panic after the diagnostic', action: 'The first mock is the worst number of a campaign by construction — hardest cohort, zero prep. A coordinate, not a prediction. No plan rewrite, no target change, no day off.' },
  { risk: 'Front-loading the clock', action: 'Time per question is far more lopsided than it feels. One question eating a third of a section is common and invisible from the inside — it is why the scan before question 1 exists.' },
  { risk: 'DILR plateau', action: 'If scores stagnate, change approach — switch sources, study partner, or targeted coaching. More of the same will not fix it.' },
];

export const DAILY_ROUTINE = [
  { time: '8:30 AM', activity: 'Wake up' },
  { time: '8:30 – 9:15', activity: 'Morning routine, breakfast. No phone.' },
  { time: '9:15 – 9:30', activity: "Review today's plan" },
  { time: '9:30 – 6:00', activity: 'Study blocks (see schedule)' },
  { time: '6:00 – 10:00 PM', activity: 'Work (~4 hrs, with dinner break)' },
  { time: '10:00 – 10:45', activity: 'Exercise (30–45 min)' },
  { time: '10:45 – 11:30', activity: 'Light reading (Aeon / fiction) + flashcard review' },
  { time: '11:30 – 12:30 AM', activity: 'Free time, wind down. No screens after 12:00.' },
  { time: '12:30 AM', activity: 'Lights out. 8 hours sleep.' },
];