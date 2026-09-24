// Mock-day fork: is the paper reviewable yet?
//
// Many series give back a score report and nothing else — no questions, no
// solutions, often never — but the afternoon of a mock day was planned as though
// you could sit down with the paper. Rather than hand-editing the schedule every
// time (which produces a `Custom` day and loses the default), a mock day carries
// ONE choice and every block with an `alt` swaps to its score-only version.
//
// Adding a fork elsewhere is one `alt` on a block in studyPlanData.js and
// nothing here: the toggle appears on any schedule where a block has one.

const storageKey = date => `mock-day-branch-${date}`;

export const WITH_PAPER = 'with-paper';
export const SCORE_ONLY = 'score-only';

// A block's `alt` is its SCORE_ONLY version, whichever way the default points.
const ALT_BRANCH = SCORE_ONLY;

// Score-only is the default because it is the normal case — a mock day that
// assumes you can review the questions is planning for the exception.
export const DEFAULT_BRANCH = SCORE_ONLY;

export const BRANCHES = [
  { value: SCORE_ONLY, label: 'Score only', hint: 'No questions to review — the analysis is whatever you can reconstruct, and it perishes fast.' },
  { value: WITH_PAPER, label: 'Paper available', hint: 'Questions and solutions in hand — full written analysis, wrong answers classified.' },
];

export function getMockDayBranch(date) {
  try {
    const stored = localStorage.getItem(storageKey(date));
    return BRANCHES.some(b => b.value === stored) ? stored : DEFAULT_BRANCH;
  } catch {
    return DEFAULT_BRANCH;
  }
}

export function setMockDayBranch(date, branch) {
  try {
    localStorage.setItem(storageKey(date), branch);
  } catch {
    /* private mode / storage disabled — the choice just won't persist */
  }
}

/** Does this schedule fork at all? Drives whether the toggle renders. */
export function hasBranch(blocks) {
  return blocks.some(b => b.alt);
}

/**
 * Swap each forked block for its alternate. `alt` is kept on the result so the
 * toggle stays visible after switching, and block indices are untouched — the
 * completion map in TodayPlan is keyed by position.
 */
export function applyBranch(blocks, branch) {
  if (branch !== ALT_BRANCH) return blocks;
  return blocks.map(b => (b.alt ? { ...b, ...b.alt, alt: b.alt } : b));
}
