/**
 * THE SECTION TIMER — timed QA / DILR / VARC practice. Every item runs two clocks:
 *
 *   decide — from the item opening to the attempt-or-skip call. The item is a
 *            question in QA, a set in DILR, a passage or a VA question in VARC.
 *   solve  — from the call to done or left. RC splits the read off the front.
 *
 * Targets are the vault's section notes, with the Master Plan's methods
 * (planContent.js, `dilr-method`) where the vault is silent. The VARC decide
 * targets are the one guess here — neither source gives one.
 *
 * ── HOW TIME IS COUNTED ───────────────────────────────────────────────────
 *
 * There is always a current item, so every second of the section lands on
 * exactly one item's clock and the buckets add up to the section. Clocks are
 * wall-clock: a running section is a draft in localStorage, and a reload or a
 * trip to another page carries on where it was, time included.
 *
 * ── WHERE IT IS LOGGED ────────────────────────────────────────────────────
 *
 *   TimedSection — one row per saved section, per-item times and results
 *                  included. The lab logs (QAQuestion, DILRSet, VARCItem) stay
 *                  hand-logged: each item offers its dialog pre-filled, since the
 *                  timer can't know the topic or the set type.
 */

import moment from 'moment';
import { db } from '@/api/client';
import { queryClientInstance } from '@/lib/query-client';

// Seconds. `warn` and `cap` apply to reading + solving together.
export const KINDS = {
  q: {
    label: 'Question', plural: 'Questions', unit: 'question', expected: 22,
    decide: 40, warn: 120, cap: 180,
    rule: '25s read + 15s evaluate. 2 min is the aim, 3 min the ceiling even when confident.',
    capNote: '3 minutes. If it isn\'t coming, this is the ego question — leave it.',
  },
  set: {
    label: 'Set', plural: 'Sets', unit: 'set', expected: 4,
    decide: 60, warn: 480, cap: 720,
    rule: '60-second triage. 12-minute cap; stop at 8 if there\'s no progress.',
    warnNote: '8 minutes. Real progress? If not, leave it and come back.',
    capNote: '12-minute cap. Leave it.',
  },
  rc: {
    label: 'RC passage', plural: 'RC passages', unit: 'set', expected: 4,
    decide: 60, read: 150, warn: 420, cap: 480,
    rule: 'Read 2–2.5 min, once. About 8 min a passage, questions included.',
    readNote: 'Past 2:30 reading. Read once — go to the questions.',
    capNote: '8 minutes on this passage. Leave the confusing ones and move on.',
  },
  va: {
    label: 'VA question', plural: 'VA questions', unit: 'question', expected: 8,
    decide: 30, warn: 90, cap: 240,
    rule: 'About 1.5 min. PJ and odd-sentence can run 3–4 — and carry no negative mark.',
    capNote: '4 minutes. Put an answer in and move on.',
  },
};

export const SECTIONS = {
  qa: { label: 'QA', minutes: 40, kinds: ['q'] },
  dilr: { label: 'DILR', minutes: 40, kinds: ['set'] },
  varc: { label: 'VARC', minutes: 40, kinds: ['rc', 'va'] },
};

export const fmtClock = seconds => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ── The draft ───────────────────────────────────────────────────────────────

const DRAFT_KEY = 'prepapp_timer_draft';

export function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
}

export function storeDraft(draft) {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage unavailable: the section still runs, it just won't survive a reload.
  }
}

const newItem = (n, kind) => ({
  n, kind, decision: null, status: 'open', phase: 'decide',
  decide_ms: 0, read_ms: 0, solve_ms: 0, visits: 1,
});

export function startDraft(section, limitMin, now) {
  return {
    section,
    limit_min: limitMin,
    started_at: new Date(now).toISOString(),
    stage: 'running',
    paused: false,
    sound: true,
    mark: now,
    elapsed_ms: 0,
    current: 0,
    items: [newItem(1, SECTIONS[section].kinds[0])],
  };
}

/** Brings the clocks up to `now`: the section's, and the current item's current phase. */
export function settle(d, now) {
  const dt = d.paused || d.stage !== 'running' ? 0 : Math.max(0, now - d.mark);
  if (dt === 0) return { ...d, mark: now };
  const items = d.current == null ? d.items : d.items.map((it, i) =>
    i === d.current ? { ...it, [`${it.phase}_ms`]: it[`${it.phase}_ms`] + dt } : it);
  return { ...d, items, elapsed_ms: d.elapsed_ms + dt, mark: now };
}

const patchItem = (d, i, patch) => ({ ...d, items: d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
const patchCurrent = (d, patch) => patchItem(d, d.current, patch);
const firstPhase = kind => (KINDS[kind].read ? 'read' : 'solve');

/** The next item: one opened but left undecided to go back to another, else a new one of the same kind. */
function advance(d) {
  const pending = d.items.findIndex((it, i) => i !== d.current && it.status === 'open' && !it.decision);
  if (pending >= 0) return { ...d, current: pending };
  const last = d.items[d.items.length - 1];
  return { ...d, current: d.items.length, items: [...d.items, newItem(d.items.length + 1, last.kind)] };
}

export const attempt = (d, now) => {
  const s = settle(d, now);
  return patchCurrent(s, { decision: 'attempt', phase: firstPhase(s.items[s.current].kind) });
};
export const skip = (d, now) => advance(patchCurrent(settle(d, now), { decision: 'skip', status: 'skipped' }));
export const doneReading = (d, now) => patchCurrent(settle(d, now), { phase: 'solve' });
export const finish = (d, now) => advance(patchCurrent(settle(d, now), { status: 'done' }));
export const leave = (d, now) => advance(patchCurrent(settle(d, now), { status: 'left' }));
export const setKind = (d, kind) => patchCurrent(d, { kind });
export const togglePause = (d, now) => ({ ...settle(d, now), paused: !d.paused });

/**
 * Back to an item left mid-way or skipped. What was on screen: an undecided
 * item waits its turn, one mid-attempt counts as left.
 */
export function returnTo(d, i, now) {
  let s = settle(d, now);
  const cur = s.items[s.current];
  if (cur?.status === 'open' && cur.decision) s = patchCurrent(s, { status: 'left' });
  const it = s.items[i];
  return patchItem({ ...s, current: i }, i, {
    status: 'open',
    decision: 'attempt',
    phase: it.phase === 'decide' ? firstPhase(it.kind) : it.phase,
    visits: it.visits + 1,
    ...(it.decision === 'skip' ? { reversed: true } : {}),
  });
}

/**
 * Stops the clocks. The item on screen, if still undecided, is dropped: Done on
 * the last item opens the next, and End follows. One left undecided to go back
 * to another counts as skipped. Mid-attempt counts as done — the review decides
 * right, wrong or blank.
 */
export function endSection(d, now) {
  const s = settle(d, now);
  const items = s.items
    .filter((it, i) => !(i === s.current && it.status === 'open' && !it.decision))
    .map(it => (it.status !== 'open' ? it
      : it.decision ? { ...it, status: 'done' }
      : { ...it, decision: 'skip', status: 'skipped' }))
    .map((it, i) => ({ ...it, n: i + 1 }));
  return { ...s, items, current: null, stage: 'review', ended_at: new Date(now).toISOString() };
}

/** Results entered at review: `result` for questions, answered/correct counts for sets. */
export const setResult = (d, i, patch) => patchItem(d, i, patch);

// ── The record ──────────────────────────────────────────────────────────────

const secs = ms => Math.round(ms / 1000);

export function toRecord(d) {
  return {
    date: moment(d.started_at).format('YYYY-MM-DD'),
    section: d.section,
    limit_min: d.limit_min,
    started_at: d.started_at,
    ended_at: d.ended_at ?? null,
    elapsed_seconds: secs(d.elapsed_ms),
    items: d.items.map(it => ({
      n: it.n,
      kind: it.kind,
      decision: it.decision,
      status: it.status,
      visits: it.visits,
      reversed: !!it.reversed,
      decide_seconds: secs(it.decide_ms),
      read_seconds: secs(it.read_ms),
      solve_seconds: secs(it.solve_ms),
      result: it.result ?? null,
      questions_answered: it.questions_answered ?? null,
      questions_correct: it.questions_correct ?? null,
      logged: false,
    })),
  };
}

export const workSeconds = it => it.read_seconds + it.solve_seconds;
export const itemSeconds = it => it.decide_seconds + workSeconds(it);

export async function saveSection(draft) {
  const row = await db.entities.TimedSection.create(toRecord(draft));
  queryClientInstance.invalidateQueries({ queryKey: ['timedSections'] });
  return row;
}

export async function deleteSection(id) {
  await db.entities.TimedSection.delete(id);
  queryClientInstance.invalidateQueries({ queryKey: ['timedSections'] });
}

export async function markLogged(id, n) {
  const [row] = await db.entities.TimedSection.filter({ id });
  if (!row) return;
  await db.entities.TimedSection.update(id, {
    items: row.items.map(it => (it.n === n ? { ...it, logged: true } : it)),
  });
  queryClientInstance.invalidateQueries({ queryKey: ['timedSections'] });
}

// ── Analysis ────────────────────────────────────────────────────────────────

const sum = (arr, f) => arr.reduce((t, x) => t + f(x), 0);

export function median(values) {
  const v = values.filter(x => x != null).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
}

const MARKED = ['Correct', 'Incorrect', 'Blank'];

/**
 * The vault's time analysis: where the minutes went, as a share of the section.
 * Questions split correct / incorrect / left; sets split by how they ended,
 * with the question counts alongside.
 */
export function analyse(record) {
  const { items } = record;
  const limit = record.limit_min ? record.limit_min * 60 : record.elapsed_seconds;
  const pct = s => (limit ? Math.round((s / limit) * 100) : 0);
  const bucket = (label, arr, tone) => ({ label, tone, count: arr.length, seconds: sum(arr, itemSeconds), pct: pct(sum(arr, itemSeconds)) });
  const attempted = items.filter(it => it.decision === 'attempt');
  const deciding = sum(items, it => it.decide_seconds);

  const byKind = SECTIONS[record.section].kinds
    .filter(kind => items.some(it => it.kind === kind))
    .map(kind => {
      const K = KINDS[kind];
      const ks = items.filter(it => it.kind === kind);
      const att = ks.filter(it => it.decision === 'attempt');
      let rows, answered, correct;
      if (K.unit === 'question') {
        const unmarked = att.filter(it => !MARKED.includes(it.result));
        rows = [
          bucket('Correct', ks.filter(it => it.result === 'Correct'), 'good'),
          bucket('Incorrect', ks.filter(it => it.result === 'Incorrect'), 'bad'),
          bucket('Left', ks.filter(it => it.decision === 'skip' || it.result === 'Blank'), 'muted'),
          ...(unmarked.length ? [bucket('Not marked yet', unmarked, 'warn')] : []),
        ];
        answered = ks.filter(it => it.result === 'Correct' || it.result === 'Incorrect').length;
        correct = ks.filter(it => it.result === 'Correct').length;
      } else {
        rows = [
          bucket('Finished', att.filter(it => it.status === 'done'), 'good'),
          bucket('Left mid-way', att.filter(it => it.status === 'left'), 'warn'),
          bucket('Skipped', ks.filter(it => it.decision === 'skip'), 'muted'),
        ];
        answered = sum(att, it => it.questions_answered || 0);
        correct = sum(att, it => it.questions_correct || 0);
      }
      return {
        kind,
        label: K.plural,
        total: ks.length,
        attempted: att.length,
        rows,
        answered,
        correct,
        accuracy: answered ? Math.round((correct / answered) * 100) : null,
        medianDecide: median(ks.map(it => it.decide_seconds)),
        medianRead: K.read ? median(att.filter(it => it.read_seconds > 0).map(it => it.read_seconds)) : null,
        medianWork: median(att.map(workSeconds)),
        slowDecides: ks.filter(it => it.decide_seconds > K.decide).length,
        overCap: att.filter(it => workSeconds(it) > K.cap).length,
      };
    });

  return {
    total: items.length,
    attempted: attempted.length,
    attemptPct: items.length ? Math.round((attempted.length / items.length) * 100) : 0,
    elapsed: record.elapsed_seconds,
    limit: record.limit_min ? record.limit_min * 60 : null,
    deciding: { seconds: deciding, pct: pct(deciding) },
    // The item on screen at End, dropped undecided (rounding aside).
    unaccounted: Math.max(0, record.elapsed_seconds - sum(items, itemSeconds)),
    byKind,
  };
}

// ── Into the lab logs ───────────────────────────────────────────────────────

/** The lab's own logging rules: QA logs the wrong, the skipped and the slow; DILR logs every set. */
export function worthLogging(item) {
  switch (item.kind) {
    case 'q': return item.result !== 'Correct' || itemSeconds(item) > KINDS.q.warn;
    case 'set': return true;
    default: return item.decision === 'attempt';
  }
}

const minutes = s => (s ? String(Math.round((s / 60) * 100) / 100) : '');
const count = v => (v == null ? '' : String(v));

/** Which lab dialog an item opens, with what the timer already knows filled in. */
export function logTarget(record, item) {
  const base = { date: record.date, timed_section_id: record.id, timed_item: item.n, decide_seconds: item.decide_seconds };
  switch (item.kind) {
    case 'q':
      return {
        dialog: 'qa',
        defaults: {
          ...base,
          result: item.result === 'Correct' || item.result === 'Incorrect' ? item.result : 'Skipped',
          time_seconds: minutes(itemSeconds(item)),
        },
      };
    case 'set':
      return {
        dialog: 'dilr',
        defaults: {
          ...base,
          triage_decision: item.decision === 'skip' ? 'Skipped' : 'Attempted',
          time_seconds: minutes(workSeconds(item)),
          questions_total: count(item.questions_answered),
          questions_correct: count(item.questions_correct),
        },
      };
    case 'rc':
      return {
        dialog: 'varc',
        defaults: {
          ...base,
          kind: 'RC Passage',
          read_time_seconds: minutes(item.read_seconds),
          solve_time_seconds: minutes(item.solve_seconds),
          questions_total: count(item.questions_answered),
          questions_correct: count(item.questions_correct),
        },
      };
    default:
      return {
        dialog: 'varc',
        defaults: {
          ...base,
          kind: 'VA Question',
          solve_time_seconds: minutes(workSeconds(item)),
          questions_total: '1',
          questions_correct: item.result === 'Correct' ? '1' : item.result === 'Incorrect' ? '0' : '',
        },
      };
  }
}
