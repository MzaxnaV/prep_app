# PrepApp

A CAT / CFA preparation tracker. **Currently dormant** — no exam date is set, so nothing counts
down and nothing is diagnosed.

Exam dates are set in the app (**Settings**), and an empty date is a real state: no countdown,
no diagnosis, no adherence deficit. `src/lib/examDates.js` is the only source — the dates were
previously constants plus hard-coded copies that had drifted apart from each other.

**Starting a campaign** is four edits, in this order:

1. Set the exam date in **Settings**.
2. Refill `PHASE2_BLOCKS` in `src/lib/studyPlanData.js`, built backwards from that date. Empty
   means `getCurrentBlock()` is null and nothing is ever "due", which is correct while dormant
   and wrong the moment you start.
3. Fill `targets` in `src/lib/actionPlan.js` and drop `dormant: true`.
4. Optionally set `BUILD_START` in `src/lib/drill.js` to schedule the calculation build week.

`src/lib/planContent.js` carries **no dates, scores or status** by design — only method that
stays true whenever you sit the exam. Anything time-bound belongs in `actionPlan.js`.

**The plan lives entirely in the app**, never in a markdown file alongside it — a previous
`timeline.md` and the app drifted apart, and the file lost. `src/lib/planContent.js` holds the
reasoning (method, cut lists) rendered on the **Master Plan** page; `src/lib/studyPlanData.js`
holds the structured data the app acts on.

Section strategy and the marks→questions score tables come from the Obsidian vault at
`C:\Misc\Obsidian_CFA_Vault\CAT`, which is **read-only** — derived content belongs here.

## Running it

```
npm run dev      # vite dev server
npm run build    # production build to dist/
python serve.py  # serve dist/ on :5173 (SPA routing, no-store on index/sw/manifest)
```

## Structure

Data is browser `localStorage`, one collection per entity, via `src/lib/localStore.js`.
`COLLECTION_NAMES` there is the single source of truth — backup/restore derives from it,
so adding an entity is enough to include it in exports. Settings (the exam dates) are a
single blob rather than a collection, so `DataBackup` handles them explicitly under
`_settings`; without that an export/restore round trip dropped them silently.

**Reset** lives in Settings behind a typed confirmation. It clears every collection and the
settings blob, cannot be undone, and there is no server copy — export first. Note that
`initializeDefaultData()` re-seeds the CFA `SubjectProgress` records on the next load, so
those come back; nothing else does.

`src/lib/activities.js` is the single vocabulary for **what kind of work a session was**. A schedule
block's `type` *is* an activity key, and `StudySession.activity_type` stores that key, never a display
label — so renaming one is not a migration. Each entry declares its own behaviour (`exams`, `subject`
required/optional/none, `metric` full/basic/none), which is what the log dialog derives its dropdown,
its Subject rule and its numeric fields from. **Adding an activity is one entry there and nothing else.**

This replaced two parallel lists joined by a hand-maintained map, which had drifted twice: CAT blocks of
type `practice`/`revision` prefilled the CFA-only `Qbank Practice` so the dropdown rendered blank, and the
Full CAT Mock block prefilled as a *sectional*. A dev-only check in `studyPlanData.js` now warns if a
block's `type` has no matching activity, or names an exam that activity doesn't offer.

A schedule block may carry an **`alt`** — a second version of itself for one branch of the day. Mock
days use it: many series return a score report and nothing else, no questions and no solutions, yet both
afternoon blocks were written assuming the paper was in front of you. **`alt` is the score-only version
and it is what renders by default**, because score-only is the normal case — planning for the paper is
planning for the exception. `src/lib/mockDayBranch.js` turns that into one choice at the top of Today's
Plan that swaps every `alt`-carrying block at once, instead of hand-editing the schedule and losing the
default to a `Custom` day. `alt` holds only the fields that differ; time, duration and exam are
inherited, positions don't move (the completion map is keyed by position), and the dev-only activity
check validates **both** branches — the branch you rarely pick is the one whose drift goes unnoticed.
**Adding a fork anywhere else is one `alt` and nothing else**; the toggle renders on any schedule that
has one.

`scripts/migrate-activity-types.mjs` rewrites an old backup JSON whose sessions hold display labels
rather than keys (idempotent, never in place); restore the result through the app's own backup/restore.

| Page | Purpose |
|------|---------|
| Dashboard | Countdown, quick stats, **adherence card** (tests due vs logged), action-plan nudge |
| Action Plan | What to do now, dated. Rewritten after every checkpoint |
| Today's Plan | Block-aware daily schedule from `studyPlanData.js` |
| DILR Lab | Set-level logging → set-type heatmap, triage accuracy, intuition calibration |
| QA Lab | CAT quant only. Confidence→diagnosis, time bleed, topic heatmap |
| VARC Lab | RC domains, reading pace, VA by type, 3-line summary discipline |
| Mock Tests | Mock/sectional log, percentile trend **split by provider** |
| Targets & Rules | Non-negotiables, targets in questions, three-cohort guide, **calculation reference** (collapsed) |
| Master Plan | The campaign's reasoning, split into **CAT / CFA / Everything** tracks. CAT sections are archived |
| CFA Progress | Module completion. Dormant, no date |
| Settings | Exam dates, backup/restore, and the **reset** that clears all logged data |

### Master Plan page — editing the plan

`src/lib/planContent.js` is the plan. It exports one array, `PLAN`, of section objects rendered
by `src/components/plan/PlanBody.jsx`. **Adding or removing a section is editing that array** —
no component changes:

```js
{
  id: 'kebab-case-anchor',   // unique; used for deep links
  title: 'WHAT IT IS',
  track: 'cat' | 'cfa' | 'both',
  archived: true,            // optional — collapsed by default, badged "for the record"
  body: `markdown-ish text`,
  children: [ /* same shape; inherits `track` if omitted */ ],
}
```

Two rules keep the file from rotting, both documented at the top of it:

1. **Body lines are flush left.** Indented lines read as list continuations, so leading
   whitespace changes the meaning.
2. **No duplication** — see the ownership split below.

Removal is a one-line delete, and a dev-only check in `planContent.js` warns on the two ways
that can go wrong quietly: a duplicate `id`, or a `[link](#anchor)` left pointing at a section
that no longer exists.

`PlanBody` is deliberately **not** a markdown implementation. It handles only what `PLAN` uses —
tables, lists, blockquotes, `#### headings`, `**bold**`, `~~struck~~`, `*italic*`, `` `code` ``
and `[links](/route)` — and degrades anything else to a paragraph. No renderer dependency.
Strikethrough matters: superseded decisions are struck rather than deleted, and that history is
the point.

### Who owns what — read this before editing either side

| | Owns | Changes | Because |
|---|---|---|---|
| **`studyPlanData.js`** | Structured, recurring data — timetables, block grid, milestone targets, question targets, non-negotiables, risk register, CFA sequencing | Rarely | The app *acts* on it: Today's Plan renders it, the adherence card measures against it |
| **`planContent.js`** | Durable method — how to drill, how to work each section, what not to study, how to read percentiles. **No dates, scores or status** | Rarely | Prose can't be rendered into a schedule or measured; and anything dated here goes stale where nobody looks |
| **`actionPlan.js`** | What to do **now** — the headline claim, dated actions, decision gates, leading indicators, don'ts | After every mock / review | Mixing "what to do this fortnight" into the standing plan is how a plan goes stale without anyone noticing |

### Revising the Action Plan

`src/lib/actionPlan.js`, rendered on `/action` with a shallow nudge card on the Dashboard. The file's
header block carries the revision checklist; the short version:

0. Drop `dormant: true` — while it is set, the page shows the authored headline and makes no
   diagnosis at all, because with empty `targets` every section would read as "converting".
1. Bump `updated` and `basis` (what evidence this version rests on).
2. Move `horizon.until` to the next checkpoint. **Past that date the page and the Dashboard card both
   flag the plan as due for review** — so a stale action plan announces itself instead of rotting quietly.
3. Move `targets` to where the next checkpoint should land, and replace `actions` (dated; anything
   before today renders dimmed under "Passed" rather than disappearing). **Never type the latest mock's
   numbers** — see below.
4. `sections[]` are free prose in the same shape and renderer as `planContent.js`.

### The headline is chosen, not written — and never generated

`src/lib/mockState.js` reads the latest logged **full** CAT mock and diagnoses each section, so the top
card on `/action` carries no typed numbers at all. This exists because its predecessor didn't: it
quoted an old paper's figures long after a newer one was in the database. The numbers were hand-copied,
so they rotted exactly as the ⚠ below predicts.

The model is **marks = coverage × accuracy**, and the two need opposite fixes:

| | | |
|---|---|---|
| `coverage` | attempted ÷ total | how much of the paper you touched |
| `accuracy` | right ÷ attempted | what you did with what you touched |
| `yield` | right ÷ total | the only one that becomes marks |

Accuracy is judged against an absolute floor; **attempts are judged against `ACTION_PLAN.targets`, not
an absolute**, because interim targets are deliberately low — an early QA target might be 8 of 22, so a
fixed coverage floor would permanently fail a section sitting exactly where the plan wants it. That yields
four states — `not-functional`, `overreaching`, `underreaching`, `converting` — and the app renders
whichever of the hand-written `ACTION_PLAN.claims` matches the most serious one present.

**Every claim is written by a human; the app only picks.** No sentence is composed from the numbers —
that would read like a dashboard and stop being trusted. The test of the model is that it reproduces the
calls a human would make from the same numbers — cut attempts on a section attempting freely at low
accuracy, expand one converting well on few.

Three rules keep the derivation honest, and each one exists because ignoring it would make the card lie:

- **Full mocks only.** A sectional is fresh, single-section and unpressured — the plan already treats it
  as an upper bound, never as "the number".
- **Same platform, or no delta.** Test series sit at different difficulties, so a source switch
  must never render as a change in performance.
- **Void sections are excluded.** A section can be written under conditions that make its numbers
  meaningless — an interruption that ends it after one set, say. The mock form has a
  per-section *doesn't count* toggle (`void_sections`); without it the diagnosis reads an interruption
  as a weakness and prescribes content work for a section that was never measured. Two comparable mocks
  is a comparison, not a trend — the card says so rather than drawing an arrow through n=2.

The Dashboard card is deliberately shallow — headline claim plus the next three dated actions. **It must
never grow into a second copy of the page.**

**Neither side duplicates the other.** Where the plan would otherwise restate a table the app
renders, it carries a pointer instead:

```js
> **→ [Targets & Rules](/targets)** — rendered there (`MOCK_TARGETS`).
```

A blockquote opening with `→` renders as a dashed callout, and a bare-path link becomes a
react-router `Link`, so pointers navigate in-app. **New prose goes in `planContent.js`; a new
table or list the app should act on goes in `studyPlanData.js` with a pointer left behind.**

⚠ **The data side is the side that goes stale**, because prose gets reread and tables don't. When a
decision changes, update both in the same pass.

**Providers are not comparable.** The mock chart keeps each series on its own line deliberately —
a source switch must never read as improvement.

## Backlog

Roughly in priority order:

- **Edit/delete for mock records.** No UI exists, so a mislogged platform cannot be corrected —
  and platform is what the chart splits its series on.
- **Error taxonomy on mock wrong-answers** (conceptual / calculation slip / misread / trap /
  time pressure), aggregated across mocks. Worth adding once 3–4 mocks exist and the
  categories can be checked against real data.
- **Score→percentile simulator** on Targets: set attempts × accuracy per section, see implied
  net score and percentile. Most useful late, when attempt counts get locked in.

**Not doing: LLM integration.** Question generation is actively harmful — generated distractors are
eliminable on surface cues, which trains the wrong instinct.
