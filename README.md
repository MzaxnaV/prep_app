# PrepApp

CAT / CFA prep tracker. **Currently dormant**: no exam date set, so nothing counts down and
nothing is diagnosed.

```
npm run dev      # vite dev server
npm run build    # production build to dist/
python serve.py  # serve dist/ on :5173 (SPA routing, no-store on index/sw/manifest)
```

## Starting a campaign

1. Set the exam date in **Settings**. `src/lib/examDates.js` is the only source. Empty is a real
   state: no countdown, no diagnosis, no adherence deficit.
2. Refill `PHASE2_BLOCKS` in `studyPlanData.js`, built backwards from that date. Empty means
   `getCurrentBlock()` is null and nothing is ever due.
3. Fill `targets` in `actionPlan.js` and drop `dormant: true`. While dormant the page shows the
   authored headline and makes no diagnosis, because empty targets read every section as
   "converting".
4. Optional: set `BUILD_START` in `drill.js` to schedule the calculation build week.

## Who owns what

| File | Owns | Changes |
|---|---|---|
| `studyPlanData.js` | Structured data the app acts on: timetables, block grid, targets, non-negotiables, risks, CFA sequencing | Rarely |
| `planContent.js` | Durable method only. **No dates, scores or status**, since anything dated here goes stale where nobody looks | Rarely |
| `actionPlan.js` | What to do now: headline claim, dated actions, gates, indicators, don'ts | After every mock |

**Neither duplicates the other.** Where prose would restate a table the app renders, leave a
pointer: `> **→ [Targets & Rules](/targets)** rendered there (\`MOCK_TARGETS\`)`. New prose goes
in `planContent.js`, new actionable data in `studyPlanData.js`. The data side is the one that goes
stale, because prose gets reread and tables do not.

The plan lives **in the app**, never in a markdown file beside it. A previous `timeline.md` drifted
from the app and lost. Section strategy and marks→questions tables come from the read-only Obsidian
vault at `C:\Misc\Obsidian_CFA_Vault\CAT`. Derived content belongs here.

## Data

Browser `localStorage`, one collection per entity, via `localStore.js`. `COLLECTION_NAMES` is the
single source of truth, so adding an entity there includes it in exports. Exam dates are a single
blob rather than a collection, so `DataBackup` handles them explicitly under `_settings`.

**Reset** sits in Settings behind a typed confirmation. Clears every collection plus settings. No
undo, no server copy, so export first. `initializeDefaultData()` re-seeds the CFA `SubjectProgress`
rows on next load. Nothing else returns.

`scripts/migrate-activity-types.mjs` rewrites an old backup whose sessions hold display labels
instead of keys. Idempotent, never in place. Restore the result through the app.

| Page | Purpose |
|------|---------|
| Dashboard | Countdown, quick stats, adherence card (tests due vs logged), action-plan nudge |
| Action Plan | What to do now, dated |
| Today's Plan | Block-aware daily schedule |
| Lab | DILR set-type heatmap and triage accuracy, QA confidence and time bleed, VARC domains and pace |
| Mock Tests | Mock log, percentile trend split by provider, written analysis |
| Calculation Drill | Fraction and multiplication grids, Zetamac tracking |
| Targets & Rules | Non-negotiables, targets in questions, provider guide, calculation reference |
| Master Plan | Method, split into CAT / CFA / Everything tracks |
| CFA Progress | Module completion |
| Settings | Exam dates, backup / restore, reset |

## Conventions

**`activities.js` is the single vocabulary for what kind of work a session was.** A schedule block's
`type` *is* an activity key, and `StudySession.activity_type` stores the key, never a label, so
renaming one is not a migration. Each entry declares `exams`, `subject` (required / optional / none)
and `metric` (full / basic / none), which is what the log dialog derives its dropdown, Subject rule
and numeric fields from. Adding an activity is one entry and nothing else. A dev-only check warns if
a block's `type` has no matching activity or names an exam it does not offer.

**A block may carry an `alt`**, a second version of itself for one branch of the day. Mock days use
it: most series return a score report and nothing else, so the score-only version is what renders by
default and planning for the paper is the exception. `mockDayBranch.js` makes that one toggle that
swaps every `alt`-carrying block at once, instead of hand-editing into a `Custom` day. `alt` holds
only the fields that differ. Time, duration and exam are inherited, positions stay fixed (the
completion map is keyed by position), and the dev check validates **both** branches. Adding a fork
anywhere else is one `alt`.

**`planContent.js` exports `PLAN`**, an array rendered by `PlanBody.jsx`. Adding or removing a
section is editing that array, no component changes:

```js
{ id: 'kebab-anchor', title: 'WHAT IT IS', track: 'cat' | 'cfa' | 'both',
  archived: true, body: `markdown-ish`, children: [ /* inherits track */ ] }
```

Body lines must be **flush left**, since indentation reads as a list continuation. A dev-only check
warns on duplicate ids and on `[link](#anchor)` pointing at a missing section. `PlanBody` is not
markdown: it handles tables, lists, blockquotes, `#### headings`, bold, italic, strikethrough,
`code` and `[links](/route)`, and degrades anything else to a paragraph. A blockquote opening with
`→` renders as a dashed callout, and a bare-path link routes in-app.

## The action-plan headline is chosen, never generated

`mockState.js` reads the latest full CAT mock and diagnoses each section, so the card carries no
typed numbers. Its predecessor did, and quoted a stale paper for weeks after a newer one was logged.

| | | |
|---|---|---|
| `coverage` | attempted ÷ total | how much of the paper you touched |
| `accuracy` | right ÷ attempted | what you did with what you touched |
| `yield` | right ÷ total | the only one that becomes marks |

Accuracy is judged against an absolute floor. **Attempts are judged against `ACTION_PLAN.targets`,
not an absolute**, because interim targets are deliberately low and a fixed coverage floor would
permanently fail a section sitting exactly where the plan wants it. That gives four states
(`not-functional`, `overreaching`, `underreaching`, `converting`), and the app renders whichever
hand-written claim matches the most serious one present. **Every claim is authored. The app only
picks.** Composing a sentence from the numbers would read like a dashboard and stop being trusted.

Three rules keep the derivation honest:

- **Full mocks only.** A sectional is fresh, single-section and unpressured, so it is an upper bound.
- **Same platform, or no delta.** Series differ in difficulty, so a source switch must never render
  as a change in performance. The mock chart keeps each series on its own line for the same reason.
- **Void sections excluded.** `void_sections` marks a section whose conditions made its numbers
  meaningless. Without it the diagnosis reads an interruption as a weakness and prescribes content
  work for something never measured.

Two comparable mocks is a comparison, not a trend, and the card says so. The Dashboard card stays
shallow (headline plus next three actions) and must never become a second copy of the page.

## Backlog

- **Edit / delete for mock records.** No UI exists, so a mislogged platform cannot be corrected, and
  platform is what the chart splits its series on.
- **Error taxonomy on wrong answers** (conceptual, calculation slip, misread, trap, time pressure)
  aggregated across mocks. Worth adding once 3 to 4 mocks exist to check the categories against.
- **Score→percentile simulator** on Targets: attempts × accuracy per section, implied net and
  percentile. Most useful late, when attempt counts get locked in.

**Not doing: LLM integration.** Generated distractors are eliminable on surface cues, which trains
the wrong instinct.
