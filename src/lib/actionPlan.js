/**
 * THE ACTION PLAN — what to do right now, derived from the latest diagnostic.
 *
 * This is deliberately separate from planContent.js. The plan is the campaign's
 * standing reasoning and changes rarely; this changes after every mock and every
 * review, and is expected to be rewritten wholesale each block.
 *
 * ── CURRENTLY DORMANT ─────────────────────────────────────────────────────
 *
 * No campaign is running, so there is nothing to prescribe. `dormant: true` is
 * what says so, and the page honours it by showing the authored headline instead
 * of a diagnosis: with no targets to measure against, `diagnose()` would read any
 * logged mock as "converting" and the card would congratulate you on hitting
 * targets that do not exist. A dormant plan has to be able to say nothing rather
 * than say something false.
 *
 * ── HOW TO REVISE IT WHEN A CAMPAIGN RESTARTS ─────────────────────────────
 *
 *   0. Drop `dormant`, and refill `targets` — the diagnosis needs them.
 *   1. Bump `updated` and `basis` — what evidence this version rests on.
 *   2. Set `horizon.until` to the next checkpoint. Past that date the app
 *      starts flagging the plan as due for review, so this must not be left
 *      stale. `null` means dormant and disables the flag entirely.
 *   3. Refill `targets` to where the next checkpoint should land. Do NOT type
 *      the latest mock's numbers anywhere — lib/mockState.js derives them from
 *      the logged record, picks the matching claim from `claims`, and measures
 *      the gap against these targets. That half of the card cannot go stale.
 *   4. Replace `actions` — dated, in order. Anything before today renders as
 *      passed; the Dashboard shows what's next.
 *   5. Edit `sections` freely: same shape and same renderer as planContent.js
 *      (PlanBody), so tables, lists, **bold**, [links](/route) all work, and
 *      BODY LINES MUST BE FLUSH LEFT.
 *
 * `gates`, `indicators` and `donts` are small structured lists so the page can
 * render them consistently — keep them short, they are meant to be scannable.
 */

import moment from 'moment';

export const ACTION_PLAN = {
  dormant: true,
  updated: null,
  basis: null,
  horizon: { label: 'No campaign running', until: null },

  /**
   * While dormant this is the headline, unconditionally. The claims below are
   * kept for the restart, not because anything is choosing between them now.
   */
  headline: {
    claim: 'No campaign running. Set a date to start one.',
    detail: `
No exam has a date, so there is no deadline to count down to and no diagnosis to make.

To start: set the date in [Settings](/settings), rebuild the block grid in \`studyPlanData.js\` from that
date backwards, fill in \`targets\` below, and drop \`dormant\` from this file. A countdown without a block
grid measures nothing.

The method that does not depend on a date is on the [Master Plan](/plan). The labs, the mock log and the
calculation drill all work regardless.
`.trim(),
  },

  /**
   * Unused while dormant, kept for the restart. Every claim is written by a
   * human; lib/mockState.js only picks which one fits the latest mock.
   */
  claims: {
    'not-functional': {
      claim: 'This section is not yet doing anything. Build it.',
      detail: `
Below the attempt target *and* below the accuracy floor. There is no strategy fix available here — a
rule cannot help a section you cannot solve, and more attempts at this accuracy actively lose marks.
This is the one state that costs content hours rather than a change of approach.
`.trim(),
    },
    overreaching: {
      claim: 'Attempt the same. Convert twice as many.',
      detail: `
You are attempting at or past the target and converting below it, which means the marginal attempt is
worth close to nothing — and on the questions you were least sure of, worse than nothing. **You are not
short of attempts. You are short of conversion.** Cut attempts before you do anything else; the
accuracy that follows is the real number.
`.trim(),
    },
    underreaching: {
      claim: 'You convert what you touch. Touch more of the paper.',
      detail: `
Accuracy is above the floor and attempts are under target, so the binding constraint has moved: the
marks you are missing are on questions you never opened. **Expand carefully.** The next attempt is the
one you were least confident about, so accuracy should be expected to fall somewhat — the test is
whether total marks rise, not whether the percentage holds.
`.trim(),
    },
    converting: {
      claim: 'Targets met. Raise them.',
      detail: `
At or past target on both attempts and accuracy. The targets are interim and were set low on purpose,
so hitting them is a signal to move them, not to stop. Protect what is working first — whatever
discipline produced this is now load-bearing and is the easiest thing to lose.
`.trim(),
    },
  },

  /**
   * Empty on purpose. Targets are judgement about where a campaign should be by
   * a date, and there is neither. Shape when refilled, in questions:
   *
   *   varc: { att: [12, 13], right: [9, 10] }
   *
   * Set them low and deliberately — they are interim markers, not the goal.
   */
  targets: {},

  // No campaign, no calendar. The gates below are what put dates back here.
  actions: [],

  // Leading indicators measure a campaign. There isn't one.
  indicators: [],

  /**
   * While dormant these are restart conditions rather than course corrections —
   * the honest version of "what would change this plan" when the plan is to stop.
   */
  /** While dormant these are start conditions, not course corrections. */
  gates: [
    { trigger: 'Committing to an exam', then: 'Set the date in Settings, rebuild PHASE2_BLOCKS from that date backwards, refill targets here and drop `dormant`. A countdown with no block grid measures nothing.' },
    { trigger: 'A first diagnostic is logged', then: 'Rewrite this file against it. Set targets low and deliberately — the point of the first mock is a baseline, not a verdict.' },
    { trigger: 'The urge to "just keep ticking over"', then: 'Not a gate. A couple of hours a week against no date is how a plan disappears without anyone noticing. Either a campaign is on with a date, or it is off.' },
  ],

  donts: [
    'Start on a feeling. A date in Settings and a block grid, or it is not a campaign.',
    'Take a test before the previous one is written up.',
    'Rewrite the plan off one data point.',
    'Buy material for an exam with no date. Acquiring is the most convincing form of procrastination.',
  ],

  sections: [],
};

/**
 * Past its horizon, the plan is stale and should be rewritten against new data.
 * A dormant plan has no horizon: `until: null` means there is no checkpoint to
 * expire against, and nagging to "rewrite this against the latest mock" when the
 * decision was to stop taking mocks is exactly the noise that gets a warning
 * ignored when it does matter.
 */
export function reviewStatus(date = moment()) {
  const { until } = ACTION_PLAN.horizon;
  if (!until) return { days: null, due: false, until: null };
  const target = moment(until);
  const days = target.diff(moment(date), 'days');
  return { days, due: days <= 0, until: target };
}

/**
 * Actions split around today. `next` is what the Dashboard nags about; anything
 * dated before today is `past` and rendered dimmed rather than hidden — a
 * skipped step should stay visible.
 */
export function splitActions(date = moment()) {
  const today = moment(date).startOf('day');
  const past = [];
  const next = [];
  for (const a of ACTION_PLAN.actions) {
    (moment(a.date).isBefore(today) ? past : next).push(a);
  }
  return { past, next };
}
