/**
 * THE PLAN — method reference, not a campaign.
 *
 * This file holds technique that stays true regardless of when an exam is sat:
 * how to drill calculation, how to work DILR and VARC, what not to study, how to
 * read percentiles across providers. It carries **no dates, no scores and no
 * status**, because those go stale and a stale plan is worse than none.
 *
 * Anything time-bound belongs elsewhere: what to do now in actionPlan.js, the
 * schedule and targets in studyPlanData.js, exam dates in examDates.js.
 *
 * ── HOW TO ADD OR CHANGE SOMETHING ────────────────────────────────────────
 *
 * Every section is one object. To add one, append to PLAN (or to a section's
 * `children`) and it appears on /plan immediately — no component changes:
 *
 *   {
 *     id: 'kebab-case-anchor',      // must be unique; used for deep links
 *     title: 'WHAT IT IS',
 *     track: 'cat' | 'cfa' | 'both',
 *     archived: true,               // optional — collapsed by default
 *     body: `markdown-ish text`,
 *     children: [ ...same shape ],  // optional; inherits `track` if omitted
 *   }
 *
 * `body` is rendered by components/plan/PlanBody.jsx, which supports tables,
 * bullet/numbered lists, blockquotes, #### headings, **bold**, ~~struck~~,
 * *italic*, `code` and [links](/route). Anything else degrades to a paragraph.
 *
 * Two rules that keep this file from rotting:
 *
 *   1. WRITE BODY LINES FLUSH LEFT. Indented lines are read as list
 *      continuations, so leading whitespace changes the meaning.
 *   2. NO DUPLICATION. Structured data the app acts on — timetables, the block
 *      grid, targets, non-negotiables, risks — lives in studyPlanData.js and is
 *      rendered on its own page. Here, leave a pointer instead:
 *
 *        > **→ [Targets & Rules](/targets)** — rendered there (`MOCK_TARGETS`).
 *
 *      A blockquote opening with → renders as a dashed callout, and a bare-path
 *      link routes in-app. This file holds *reasoning*; the app holds *data*.
 */

export const TRACKS = {
  cat: { id: 'cat', label: 'CAT' },
  cfa: { id: 'cfa', label: 'CFA' },
  all: { id: 'all', label: 'Everything' },
};

export const PLAN_STATUS = `
**Method reference.** Durable technique only — no dates, no targets, no status. Set an exam date in
[Settings](/settings) and put what to do next on the [Action Plan](/action); this page is what stays
true either way.
`.trim();

export const PLAN = [
  {
    id: 'calculation-speed',
    title: 'CALCULATION SPEED',
    track: 'cat',
    body: `
Slow arithmetic taxes every question in QA *and* every caselet in DILR, which makes it the highest
return-per-hour fix available — and it is fully closable in about three weeks of ten minutes a day. It
does not need, and must not get, more than that.

**Know what the exam actually gives you.** There is a basic on-screen four-function calculator, so don't
over-invest in exotic shortcuts. The real cost is that it is *mouse-driven and slow*: reaching for it to
compute 17 × 6 costs several seconds, and in a caselet where you compare twenty quantities that is the
whole set. **The goal isn't to beat the calculator on hard sums — it's to never need it for easy ones.**

Two separate skills live in this slot, and they are not the same thing. **Zetamac** trains integer
arithmetic. **Fraction sight-reading** trains reading a decimal or a percentage as a fraction on sight,
which is what the exam actually hands you. Zetamac generates no fractions at all, so the second skill
will never show in the first one's score.
`.trim(),
    children: [
      {
        id: 'zetamac',
        title: 'The Zetamac drill',
        body: `
Ten minutes at the start of the QA block, daily.
[arithmetic.zetamac.com](https://arithmetic.zetamac.com), 120-second rounds.

**Use the stock defaults** — addition 2–100 + 2–100, subtraction (inverse), multiplication 2–12 × 2–100,
division (inverse) — and then **freeze them for the whole campaign.** Published benchmarks assume this
config, so changing the ranges mid-run reads as a score change when nothing about you changed. It is the
same trap as switching test-series providers.

What moves the number: times tables to instant recall *in both directions*, round-and-subtract for large
units digits (7 × 68 → 490 − 14), and the ×4 / ×5 / ×9 / ×11 / ×12 shortcuts. Division is always exact and
always the inverse of a multiplication it already generated, so it is a reverse table lookup, never a
division.

Its blind spot is two-digit × two-digit, which the exam does ask for. Once the tracked score is strong,
run that as a **separate, unlogged** config (multiplication 10–99 × 10–99, everything else off) — never by
editing the tracked one.
`.trim(),
      },
      {
        id: 'multiplication-recall',
        title: 'Multiplication recall',
        body: `
A low Zetamac score usually means the tables are being *worked out* rather than recalled, and nothing else
moves that number as much. Drill it in a short evening slot, with the same reveal-and-mark method as
fractions, so the morning slot stays Zetamac plus fractions.

> **→ [Calculation Drill](/drill)** — Multiplication tab. The tables are rendered there
(\`MULTIPLICATION_GRID\`) and every card is drawn from them.

**Both directions, always:** 7 × 8 and 56 ÷ 7 are one fact, and Zetamac asks for both.

| Tier | Content | Standard |
|------|---------|----------|
| 1 | Tables ×2 to ×12 | Instant — this is what Zetamac multiplies and divides by |
| 2 | Tables ×13 to ×20, squares 11–30, cubes 2–10, powers of 2 to 4096 and 3 to 729 | Solid |
| 3 | Cubes 11–20 | Recognised on sight only |

Most people stop at 12. **13–20 is where the time is won.** ×10 is left out — it is free.
`.trim(),
      },
      {
        id: 'fraction-sight-reading',
        title: 'Fraction sight-reading',
        body: `
A decimal is inert; a fraction cancels. That is the whole of it. \`0.4285 × 49\` is a two-line
multiplication you will get wrong under pressure; \`3/7 × 49\` is 21, seen.

**This is a lookup table indexed by the first two digits, not a conversion procedure** — if you are
working the fraction out, the entry isn't learned yet. Percent → fraction is the half that earns marks,
because it turns arithmetic into cancellation and compound interest into a power of a small fraction.

> **→ [Calculation Drill](/drill)** — the grid itself is rendered there (\`FRACTION_GRID\`,
\`PERCENT_PAIRS\`, \`GROWTH_MULTIPLIERS\`), and every drill card is drawn from it.

**It is not to be extended.** The exam builds its numbers from small denominators, so a decimal outside
the grid is a signal to approximate, not a gap to fill.

#### Reading a decimal you don't recognise

1. **Index on two digits.** The default move, under a second. .28 → sevenths. .27 → elevenths.
2. **Reciprocal snap.** For small decimals: 1 ÷ .0526 ≈ 19, so 1/19. Works because the denominators are
small integers.
3. **Period fingerprint** — the *length* of the repeat names the family. Terminates → only 2s and 5s.
Repeats every 1 → 3 or 9. Every 2 → 11. Every 3 → 27 or 37. Every 6 → 7 or 13. Every 16 or 18 → 17 or 19.
A settled prefix before the repeat means a factor of 2 or 5 riding along.
4. **Anchor and adjust** — for the ragged ratios that are most of DILR. Don't convert, bracket: 137/948,
and 7 × 137 = 959 > 948, so it is *just above* 1/7 = 14.29% → ≈14.4%. **The direction of the error is what
keeps approximation honest**, and it is what people lose when they round to a decimal instead.
`.trim(),
      },
      {
        id: 'drill-shape',
        title: 'The shape of the drill',
        body: `
**The load shrinks as the campaign goes on — that shape is the point.** If it ever grows, it has stopped
being a drill and become a hiding place.

| Phase | Time | What it is |
|-------|------|------------|
| Build | ~10 min/day | One or two families a day; the families already built come back as recall calls |
| To reflex | ~6 min/day | Bolt fraction calls onto the end of the Zetamac run. Rotate one family a day through a cold write-out, weighted to the cells missed. Weekly full cold grid, count errors |
| To application | ~4 min/day | No new memorising. Fraction-first pass on every percentage, ratio, interest and work question |
| Maintenance | ~3 min/day | Half the grid on alternating days. Nothing new |

**The measures**, all already tracked: Zetamac score climbing · cold-grid errors trending to zero · share
of QA questions inside 2 min rising ([QA Lab](/lab?tab=qa)) · sets abandoned on arithmetic rather than
logic trending to zero ([DILR Lab](/lab?tab=dilr)).

> **→ [Targets & Rules](/targets)** — the two practice rules this introduces are rendered there
(\`NON_NEGOTIABLES\`): no decimal written in QA practice, no calculator in DILR practice.

#### Failure modes

- **One-directional memory.** Recognising .4285 but not producing 3/7 when a question says 42.86% is half
a skill, and the missing half is the one arithmetic needs.
- **Over-approximating.** Read the option spacing *first*. Two options within ~2% cannot be separated by
estimation, and fluency doesn't change that.
- **Counting round the sevenths cycle.** Slower than long division. The cycle is a learning aid; the
lookup is six separate leading-pair facts.
- **Treating this as a project.** The likeliest failure, because building a table feels productive and is
measurable, which makes it a perfect hiding place from VARC. **Ten minutes, capped.**
- **A clean grid that doesn't move QA conversion.** Then it is knowledge, not reflex — the fix is the
no-written-decimals rule, not more memorising. If the grid keeps getting cleaner while conversion sits
still, calculation speed was never the bottleneck and this drops to three minutes.
`.trim(),
      },
    ],
  },

  {
    id: 'dilr-method',
    title: 'DILR — METHOD',
    track: 'cat',
    body: `
**Resources:** PYQs 2017 onward (2iim.com) · Nishit Sinha *LR & DI* · Elites Grid and Aptitude Jab
playlists · sectionals from any owned series.

**Stage 1 — fundamentals, untimed.** One set type at a time: watch the video or read the section, then
attempt two sets from older PYQs with no timer. Focus entirely on approach: how to set up the table or
diagram, what to infer first, how to eliminate systematically. Review both against the solution and write
down the pattern. Cycle: linear/circular arrangements → grouping and distribution → data caselets and
graphs → logical puzzles and hybrids.

**Stage 2 — timed.** 60 seconds to decide attempt-or-skip, then a 12-minute cap; stop if 8 minutes pass
with no progress. **The 60-second triage is the single most important DILR skill** — if you can't see a
clear entry point in 60 seconds, skip it in a real exam. Review every set on triage quality, not just
accuracy: *was the decision right?*

**Stage 3 — exam pace.** 3–4 sets at 10 minutes each, strict. Then review for set selection, approach
efficiency, and whether errors were silly mistakes or conceptual gaps. One full sectional a week under
exam conditions, tracked by set type in the [DILR Lab](/lab?tab=dilr) — that heatmap is what makes
weak-type targeting possible.

**Daily, once past fundamentals:** scan 4 sets and tag each easy/medium/hard/skip (~45s each) before
solving any of them; solve the three you tagged easiest at 10 min apiece; spend the back half of the block
on deep review — *was my triage correct, did I use the fastest path, where did I get stuck and why*. Then
a second block on weak set types only, driven by the heatmap rather than by feel.

**The target shape is two or three clean sets, not four attempted.** Cracking three cleanly is a 99%ile
section, and that is a completely different task from "attempt as much as possible".
`.trim(),
  },

  {
    id: 'varc-method',
    title: 'VARC — METHOD',
    track: 'cat',
    body: `
**Resources:** PYQs (2iim.com) · VARC1000 · Aeon Essays · Nishit Sinha *Verbal Ability*.

**RC, timed.** 5 passages at ~14 minutes each (~8 min reading + ~6 min answering for a 4-question set).
**Read once — no re-reading.** Going back means the first pass was passive; go to the question and then
back to the relevant paragraph, never re-read a whole passage. If a question takes more than 90 seconds,
mark it and move on. Rotate domains weekly so there are no blind spots: week A = 2 humanities + 2 social
science + 1 abstract/philosophy; week B = 2 science/tech + 2 economics/business + 1 literature/art
criticism.

**Classify every wrong answer** as comprehension failure (misread the passage), inference failure
(understood it, drew the wrong conclusion), or trap (two options looked right). **Each needs a different
fix**, and without the classification you cannot know which one you have.

**VA, timed.** 5–8 questions per session — para-jumbles, odd-sentence-out, para-summary — under a minute
each. Para-jumbles have patterns: opening sentences carry no backward reference; follow chronological or
logical flow and pronoun chains. Odd-sentence-out: find the theme, spot the outlier in topic or tone.

**Deep reading, untimed.** One long Aeon essay (1500–3000 words), read once, then write the central
argument in 2–3 sentences from memory. Deliberately pick domains you're weaker in.

**Evening passive reading** — long-form anything, no questions, no timer. Builds speed and vocabulary over
months. If you don't feel like it, it becomes free time; don't force it.

#### The elimination rule

> **Do not mark an answer unless you can name why two of the other options are wrong.**

Random guessing on a 4-option MCQ scores 25%, and negative marking makes a sub-25% section worse than
blank. If accuracy is near the guessing floor, the attempts past the first handful are carrying no
information — and no amount of reading speed fixes that. The rule costs nothing and needs no new skill.
`.trim(),
  },

  {
    id: 'not-studying',
    title: 'WHAT TO DELIBERATELY NOT STUDY',
    track: 'cat',
    body: `
On a compressed timeline the cut list matters as much as the study list. Skipping these is a decision, not
neglect — revisit only at 90%+ accuracy everywhere else.

- **Hard geometry / mensuration.** Learn the standard ~20 formulas, drill PYQs, stop. Lowest
marks-per-hour in QA.
- **Deep number theory.** Remainders, factors, divisibility, HCF/LCM — stop there. No cyclicity exotica,
no advanced modular arithmetic.
- **PnC / probability beyond standard patterns.** High effort, ~2 questions.
- **Vocabulary lists.** The exam no longer tests them; reading does this passively.
- **Multiple QA sources.** One book plus PYQs. Source-collecting is procrastination.
- **New concepts in the final three weeks.** Anything not learned by then will not be reliable on the day.

**Acquiring more material is the most convincing form of procrastination.** The urge to buy another series
is a signal to go and analyse the last mock instead.
`.trim(),
  },

  {
    id: 'reading-percentiles',
    title: 'READING PERCENTILES ACROSS PROVIDERS',
    track: 'cat',
    body: `
> **→ [Mock Tests](/mocks)** — the chart keeps providers on separate lines deliberately, so a source
switch can never read as improvement.

**Test series sit at different difficulties and draw different cohorts, so their percentiles are not
comparable.** The same paper-shaped performance can read as a 95 on the hardest series and a 99 on the
most generous one. The gap is cohort and difficulty, not you.

**The only comparison that ever means anything is same-source to same-source.** Trust the series closest
to the real exam for *level*; trust any series for *direction*.

Take mocks on their **live national dates** wherever possible — a proctored mock scored against a real
concurrent cohort is the most trustworthy percentile available short of the exam itself. Self-serve
replays afterwards are worth far less. Put the live dates in the calendar first and build the week around
them.

Leave spare capacity in the schedule deliberately — it absorbs a bad week, a repeat diagnostic on a
section that stalls, or extra volume at a plateau. **Do not treat the leftovers as a target to hit.**
`.trim(),
  },

  {
    id: 'exam-day',
    title: 'THE PAPER, AND WHAT A SCORE ACTUALLY NEEDS',
    track: 'cat',
    body: `
**Recent pattern:** 24 VARC + 22 DILR + 22 QA = 68 questions, 40 minutes per section, +3 / −1 with no
negative marking on TITA.

| Percentile | Overall | VARC | DILR | QA |
|------------|---------|------|------|----|
| 99.9 | ~123 | ~50 | ~45 | ~40 |
| 99.99 | ~140+ | ~48+ | ~47+ | ~45+ |
| 100 | ~150+ | ~55+ | ~50+ | ~48+ |

**The three key skills.** VARC — one pass, then answer. DILR — **set selection is 50% of the battle**;
skip trap sets ruthlessly. QA — know when to skip, two minutes maximum per question.

**What the marks→questions conversion reframes:**

- **DILR 99%ile is three sets, cracked cleanly** — about 12 questions. Not four, not five. The section
becomes: pick the right three, solve them near-perfectly.
- **VARC 99%ile is 14–15 of 24.** You can leave 8–9 untouched and still hit 99. Attempting 20–22 is only
correct if accuracy holds; if it doesn't, fewer and cleaner wins.
- **QA 99%ile is 11–12 of 22.** Roughly half. Secure arithmetic, skip without guilt.

These are the sanity check whenever a mock feels catastrophic: **count what you'd have needed, not what
you got.**

#### Marks = coverage × accuracy

The two need opposite fixes, and confusing them is the most common way a mock gets misread:

| | | |
|---|---|---|
| Coverage | attempted ÷ total | how much of the paper you touched |
| Accuracy | right ÷ attempted | what you did with what you touched |
| Yield | right ÷ total | the only one that becomes marks |

Low accuracy with high coverage means **cut attempts** — the marginal attempt is losing marks. High
accuracy with low coverage means **expand**; the marks you are missing are on questions you never opened,
and accuracy should be expected to fall a little as you reach further. The test is whether total marks
rise, not whether the percentage holds.

> **→ [Action Plan](/action)** — this is the model the headline diagnosis is derived from.
`.trim(),
  },

  {
    id: 'analysis-discipline',
    title: 'ANALYSING A MOCK',
    track: 'both',
    body: `
**Never take a test before the previous one is written up.** A mock you did not analyse cost you the
morning and taught you nothing; the analysis is the entire return on it.

> **→ [Mock Tests](/mocks)** — the write-up form asks the three questions that matter, and a mock counts
as analysed once any of them is answered.

**Answer the question you will not remember in a week:** not *what did I score*, but *why did I attempt
what I attempted*. Set selection and time allocation are decisions, and they are the ones that repeat.

Three things worth checking against the score report rather than memory, because memory is reliably wrong
about all three:

1. **Where the clock actually went.** Time per question is usually far more lopsided than it felt. One
question eating a third of a section is common and invisible from the inside.
2. **What you never opened.** Cross-reference the unattempted questions against the cohort's success rate
on them. Questions most people got right, that you never looked at, are the cheapest marks available and
they are a *selection* failure, not a knowledge one.
3. **Questions you worked and then left blank.** Time spent with nothing banked is pure loss, and it shows
up nowhere in the accuracy figure.

**A sectional is an upper bound, never "the number".** It is fresh, single-section and has no
cross-section clock. Only a full mock settles anything.
`.trim(),
  },
];

const matches = (track, view) => view === 'all' || track === 'both' || track === view;

/**
 * Sections visible in a track view. A section is kept when its own prose belongs
 * to the track or any child does — so a CAT-tracked section can still surface a
 * CFA child, and vice versa. Children inherit their parent's track.
 */
export function sectionsForTrack(view) {
  return PLAN.map(s => {
    const children = (s.children ?? [])
      .map(c => ({ ...c, track: c.track ?? s.track }))
      .filter(c => matches(c.track, view));
    return { ...s, showBody: matches(s.track, view), children };
  }).filter(s => s.showBody || s.children.length > 0);
}

/**
 * Removing a section is meant to be a one-line delete, so this catches the two
 * ways that can go wrong quietly: an id used twice, or a `[link](#anchor)` left
 * pointing at a section that no longer exists. Dev-only — it never ships.
 */
if (import.meta.env?.DEV) {
  const ids = new Set();
  const dupes = [];
  const anchors = [];

  for (const s of PLAN) {
    for (const node of [s, ...(s.children ?? [])]) {
      if (ids.has(node.id)) dupes.push(node.id);
      ids.add(node.id);
      for (const [, href] of node.body.matchAll(/\]\((#[^)]+)\)/g)) {
        anchors.push({ from: node.id, to: href.slice(1) });
      }
    }
  }

  const orphans = anchors.filter(a => !ids.has(a.to));
  if (dupes.length) console.warn('[planContent] duplicate section ids:', dupes);
  if (orphans.length) {
    console.warn(
      '[planContent] links point at sections that do not exist:',
      orphans.map(o => `${o.from} → #${o.to}`)
    );
  }
}
