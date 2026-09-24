/**
 * THE CALCULATION DRILL — cards, today's rotation, and logging, for two tracks:
 *
 *   fractions       — the morning slot, after Zetamac. FRACTION_GRID and friends.
 *   multiplication  — the evening flashcard slot. MULTIPLICATION_GRID.
 *
 * The content is not defined here: every card is derived from the reference
 * tables in studyPlanData.js, so editing a table edits the drill. The reasoning
 * lives in planContent.js under `calculation-speed`.
 *
 * ── HOW A RUN IS SCORED ───────────────────────────────────────────────────
 *
 * Reveal-and-mark. The clock runs from the prompt appearing to the reveal. A
 * card marked "knew it" but revealed after SLOW_MS still counts as a miss: if you
 * were working it out, the entry isn't learned yet.
 *
 * ── WHERE IT IS LOGGED ────────────────────────────────────────────────────
 *
 *   DrillSession  — one row per finished run, per-card results included, tagged
 *                   with its track (rows without one predate multiplication and
 *                   are fractions). Misses are read back to front-load the next run.
 *   ZetamacScore  — one row per day, the first round's score.
 *   StudySession  — one per day, linked to today's Calculation Speed Drill block
 *                   so Today's Plan ticks it. Zetamac and the fractions track
 *                   only: the multiplication track is evening work and has no
 *                   block. Notes only, deliberately no question counts —
 *                   flashcards would inflate the question totals on the Dashboard.
 */

import moment from 'moment';
import { db } from '@/api/client';
import { queryClientInstance } from '@/lib/query-client';
import {
  getTodaySchedule, FRACTION_GRID, PERCENT_PAIRS, GROWTH_MULTIPLIERS, PIE_ANGLES, MULTIPLICATION_GRID,
} from './studyPlanData';
import { getScheduleOverride, editableToDisplay } from './scheduleOverride';

export const SLOW_MS = 2000;
export const CALLS_PER_RUN = 20;

const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── Cards ───────────────────────────────────────────────────────────────────
//
// A card either has a fixed prompt/answer, or `options` — equivalent prompts, one
// picked per run (a percentage or its decimal; 56 ÷ 7 or 56 ÷ 8). `cell` groups
// the cards of one table entry, so a full grid asks each entry once.

/** Tier 1–2 cells are drilled both ways. Tier 3 is "recognise on sight": reverse only. */
function fractionCards() {
  const cards = [];
  for (const { family, tier, cue, cells } of FRACTION_GRID) {
    for (const [f, d, p] of cells) {
      const base = { family, tier, cue, cell: `frac:${f}` };
      if (tier < 3) {
        cards.push({ ...base, id: `grid:${f}:f2p`, prompt: f, ask: 'as a %', answer: `${p}%`, detail: d });
      }
      cards.push({
        ...base, id: `grid:${f}:p2f`, ask: 'as a fraction', answer: f,
        options: [{ prompt: `${p}%`, detail: d }, { prompt: d, detail: `${p}%` }],
      });
    }
  }
  return cards;
}

const FRACTION_EXTRAS = [
  ...PERCENT_PAIRS.map(p => ({
    id: `pair:${p.upF}`, family: 'Percent pairs', prompt: p.up, ask: 'what fall undoes it?',
    answer: p.down, detail: `${p.upF} up → ${p.downF} down`,
  })),
  ...GROWTH_MULTIPLIERS.map(g => ({
    id: `growth:${g.rate}`, family: 'Growth multipliers', prompt: g.rate, ask: '1-year and 2-year multipliers',
    answer: `${g.y1} · ${g.y2}`,
  })),
  ...PIE_ANGLES.map(([k, v]) => ({
    id: `pie:${k}`, family: 'Pie angles', prompt: k, ask: 'of a pie chart, in degrees', answer: v,
  })),
];

const SUPERSCRIPT = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = n => String(n).split('').map(d => SUPERSCRIPT[d]).join('');

/** One table entry → its forward and reverse card. Exported for the reference view. */
export function multiplicationEntry(kind, cell) {
  switch (kind) {
    case 'table': {
      const [a, b] = cell;
      const p = a * b;
      return {
        key: `${a}x${b}`, label: `${a} × ${b}`, value: p,
        fwd: { prompt: `${a} × ${b}`, ask: 'multiply', answer: String(p) },
        rev: {
          ask: 'divide',
          options: a === b
            ? [{ prompt: `${p} ÷ ${a}`, answer: String(a) }]
            : [{ prompt: `${p} ÷ ${a}`, answer: String(b) }, { prompt: `${p} ÷ ${b}`, answer: String(a) }],
        },
      };
    }
    case 'square':
      return {
        key: `sq${cell}`, label: `${cell}²`, value: cell ** 2,
        fwd: { prompt: `${cell}²`, ask: 'square', answer: String(cell ** 2) },
        rev: { prompt: `√${cell ** 2}`, ask: 'square root', answer: String(cell) },
      };
    case 'cube':
      return {
        key: `cu${cell}`, label: `${cell}³`, value: cell ** 3,
        fwd: { prompt: `${cell}³`, ask: 'cube', answer: String(cell ** 3) },
        rev: { prompt: `∛${cell ** 3}`, ask: 'cube root', answer: String(cell) },
      };
    case 'power': {
      const [base, e] = cell;
      return {
        key: `pow${base}^${e}`, label: `${base}${sup(e)}`, value: base ** e,
        fwd: { prompt: `${base}${sup(e)}`, ask: 'value', answer: String(base ** e) },
        rev: { prompt: String(base ** e), ask: `as a power of ${base}`, answer: `${base}${sup(e)}` },
      };
    }
    default:
      throw new Error(`unknown multiplication kind: ${kind}`);
  }
}

function multiplicationCards() {
  const cards = [];
  for (const { family, kind, tier, cue, cells } of MULTIPLICATION_GRID) {
    for (const cell of cells) {
      const { key, fwd, rev } = multiplicationEntry(kind, cell);
      const base = { family, tier, cue, cell: `mul:${key}` };
      if (tier < 3) cards.push({ ...base, id: `mul:${key}:fwd`, ...fwd });
      cards.push({ ...base, id: `mul:${key}:rev`, ...rev });
    }
  }
  return cards;
}

// ── Tracks ──────────────────────────────────────────────────────────────────

/**
 * The build week is **relative to BUILD_START**, not pinned to calendar dates.
 * Each entry is one day: an array adds families, `[]` is a calls-only day (for a
 * mock day, where nothing new goes in), and 'grid' is the first full cold grid.
 * After the build ends, `rotation` takes over by weekday (0 = Sunday, which is
 * always the grid).
 *
 * `BUILD_START` is null while no campaign is running — the drill then runs
 * rotation-only, which is the right behaviour for picking it up cold. Set it to
 * a 'YYYY-MM-DD' to schedule a build week from that date; nothing else changes,
 * because every lookup below is by day offset.
 */
const BUILD_START = null;

const FRACTION_GRID_CARDS = fractionCards();
const MULTIPLICATION_CARDS = multiplicationCards();

export const TRACKS = {
  fractions: {
    label: 'Fractions',
    slot: 'Morning slot, after Zetamac',
    gridCards: FRACTION_GRID_CARDS,
    allCards: [...FRACTION_GRID_CARDS, ...FRACTION_EXTRAS],
    build: [
      ['Terminating', 'Sixteenths'],
      ['Sevenths'],
      ['Thirds & ninths', 'Sixths & twelfths'],
      ['Elevenths', 'Thirteenths'],
      [],
      ['Fifteenths', 'The long tail', 'Percent pairs', 'Growth multipliers', 'Pie angles'],
      'grid',
    ],
    rotation: {
      1: ['Terminating', 'Sixteenths'],
      2: ['Sevenths'],
      3: ['Thirds & ninths', 'Sixths & twelfths'],
      4: ['Elevenths', 'Fifteenths'],
      5: ['Thirteenths'],
      6: ['Percent pairs', 'Growth multipliers', 'Pie angles'],
    },
  },
  multiplication: {
    label: 'Multiplication',
    slot: 'Evening flashcard slot',
    gridCards: MULTIPLICATION_CARDS,
    allCards: MULTIPLICATION_CARDS,
    build: [
      ['Tables ×2–×6', 'Tables ×7–×9'],
      ['Tables ×11–×12', 'Squares 11–20'],
      ['Tables ×13–×16'],
      ['Tables ×17–×20'],
      [],
      ['Squares 21–30', 'Cubes 2–10', 'Cubes 11–20', 'Powers of 2 & 3'],
      'grid',
    ],
    rotation: {
      1: ['Tables ×7–×9', 'Powers of 2 & 3'],
      2: ['Tables ×11–×12', 'Squares 11–20'],
      3: ['Tables ×13–×16'],
      4: ['Tables ×17–×20'],
      5: ['Squares 21–30', 'Cubes 2–10'],
      6: ['Tables ×7–×9', 'Cubes 11–20'],
    },
  },
};

export const trackOf = session => session.track || 'fractions';

const CARD_BY_ID = Object.fromEntries(
  Object.values(TRACKS).flatMap(t => t.allCards).map(c => [c.id, c]),
);
export const cardById = id => CARD_BY_ID[id];

/** A card as shown on screen: fixed prompt, or one of its options. */
function withPrompt(card) {
  if (!card.options) return card;
  const pick = card.options[Math.floor(Math.random() * card.options.length)];
  return { ...card, ...pick };
}

/** A stable face for lists — the first option where a card has several. */
export const faceOf = card => (card.options ? { ...card, ...card.options[0] } : card);

// ── Rotation ────────────────────────────────────────────────────────────────

const BUILD_LENGTH = TRACKS.fractions.build.length;

/**
 * 0-based day offset into the build, or null when outside it — which includes
 * every day when BUILD_START is null and no build is scheduled at all.
 */
function buildIndex(date) {
  if (!BUILD_START) return null;
  const i = moment(date).startOf('day').diff(moment(BUILD_START).startOf('day'), 'days');
  return i >= 0 && i < BUILD_LENGTH ? i : null;
}

/** 1-based day number during the build week, else null. */
export function buildDay(date = moment()) {
  const i = buildIndex(date);
  return i === null ? null : i + 1;
}

export function todaysFamilies(track, date = moment()) {
  const t = TRACKS[track];
  const i = buildIndex(date);
  if (i !== null) {
    const day = t.build[i];
    return Array.isArray(day) && day.length ? day : null;
  }
  return t.rotation[moment(date).day()] || null;
}

export const isGridDay = (track, date = moment()) => {
  const i = buildIndex(date);
  return i === null ? moment(date).day() === 0 : TRACKS[track].build[i] === 'grid';
};

/**
 * Grid families the calls can draw on. During the build, only families built on
 * an earlier day — today's family has its own run, and unbuilt ones aren't learned
 * yet. Afterwards (including when no build is scheduled), everything.
 */
function callableFamilies(track, date) {
  const i = buildIndex(date);
  if (i === null) return null;
  return TRACKS[track].build
    .slice(0, i)
    .filter(Array.isArray)
    .flat();
}

export function hasCalls(track, date = moment()) {
  const fams = callableFamilies(track, date);
  return !fams || fams.length > 0;
}

// ── Building a run ──────────────────────────────────────────────────────────

/** Latest result per card, oldest session first so later runs overwrite. */
function lastResults(sessions) {
  const last = {};
  const ordered = [...sessions].sort((a, b) => a.created_date.localeCompare(b.created_date));
  for (const s of ordered) {
    for (const r of s.results || []) last[r.card] = { ok: r.ok, at: s.created_date };
  }
  return last;
}

/**
 * 20 calls from the grid: cards missed last time first, then ones never seen,
 * then whatever has gone longest without being asked.
 */
function buildCalls(track, sessions, date) {
  const fams = callableFamilies(track, date);
  const cards = TRACKS[track].gridCards;
  const pool = fams ? cards.filter(c => fams.includes(c.family)) : cards;
  const last = lastResults(sessions);
  const missed = shuffle(pool.filter(c => last[c.id] && !last[c.id].ok));
  const unseen = shuffle(pool.filter(c => !last[c.id]));
  const stale = pool
    .filter(c => last[c.id]?.ok)
    .sort((a, b) => last[a.id].at.localeCompare(last[b.id].at));
  return shuffle([...missed, ...unseen, ...stale].slice(0, CALLS_PER_RUN));
}

function buildFamily(track, families) {
  return shuffle(TRACKS[track].allCards.filter(c => families.includes(c.family)));
}

/** Every entry once, in a random direction where it has two. */
function buildGrid(track) {
  const byCell = {};
  for (const c of TRACKS[track].gridCards) (byCell[c.cell] ||= []).push(c);
  return shuffle(Object.values(byCell).map(cs => cs[Math.floor(Math.random() * cs.length)]));
}

export const MODES = {
  calls: { label: `${CALLS_PER_RUN} calls` },
  family: { label: 'Family of the day' },
  grid: { label: 'Full grid' },
};

export function buildRun(track, mode, sessions, date = moment()) {
  const cards = mode === 'calls' ? buildCalls(track, sessions, date)
    : mode === 'family' ? buildFamily(track, todaysFamilies(track, date) || [])
    : buildGrid(track);
  return cards.map(withPrompt);
}

// ── Logging ─────────────────────────────────────────────────────────────────

const todayStr = (date = moment()) => moment(date).format('YYYY-MM-DD');

export async function saveRun({ track, mode, results, durationSeconds }) {
  const date = todayStr();
  const known = results.filter(r => r.ok).length;
  const session = await db.entities.DrillSession.create({
    date,
    track,
    mode,
    families: mode === 'family' ? todaysFamilies(track) : null,
    results,
    total: results.length,
    known,
    grid_errors: mode === 'grid' ? results.length - known : null,
    duration_seconds: durationSeconds,
  });
  if (track === 'fractions') await syncStudySession(date);
  queryClientInstance.invalidateQueries({ queryKey: ['drillSessions'] });
  return session;
}

/** One score per day — saving again replaces it rather than adding a second point. */
export async function saveZetamac(score) {
  const date = todayStr();
  const [existing] = await db.entities.ZetamacScore.filter({ date });
  if (existing) await db.entities.ZetamacScore.update(existing.id, { score });
  else await db.entities.ZetamacScore.create({ date, score });
  await syncStudySession(date);
  queryClientInstance.invalidateQueries({ queryKey: ['zetamacScores'] });
}

/** Index of the drill block in today's schedule as Today's Plan shows it, overrides included. */
export function drillBlockIndex(date = moment()) {
  const override = getScheduleOverride(todayStr(date));
  const blocks = override ? override.map(editableToDisplay) : getTodaySchedule(date);
  return blocks.findIndex(b => /calculation/i.test(b.activity || ''));
}

const MODE_NOTE = { calls: 'calls', family: 'family', grid: 'full grid' };

/**
 * Upserts the day's StudySession for the drill block. A session logged by hand
 * from Today's Plan is left alone — only one this module created is rewritten.
 */
async function syncStudySession(date) {
  const blockIndex = drillBlockIndex(date);
  if (blockIndex < 0) return;

  const [runs, [zetamac]] = await Promise.all([
    db.entities.DrillSession.filter({ date }, 'created_date', 100),
    db.entities.ZetamacScore.filter({ date }),
  ]);
  const parts = [];
  if (zetamac) parts.push(`Zetamac ${zetamac.score}`);
  for (const r of runs.filter(r => trackOf(r) === 'fractions')) parts.push(`${MODE_NOTE[r.mode]} ${r.known}/${r.total}`);
  const notes = parts.join(' · ');

  const sessions = await db.entities.StudySession.filter({ date, block_index: blockIndex });
  const existing = sessions[0];
  if (existing && existing.source !== 'drill') return;
  if (existing) {
    await db.entities.StudySession.update(existing.id, { notes });
  } else {
    await db.entities.StudySession.create({
      date, exam: 'CAT', subject: '', activity_type: 'practice',
      duration_minutes: 10, notes, block_index: blockIndex, source: 'drill',
    });
  }
  queryClientInstance.invalidateQueries({ queryKey: ['catSessions'] });
}

/** Entries missed most often over the last `days`, for the page's "keep missing" list. */
export function frequentMisses(sessions, days = 7, limit = 8) {
  const since = moment().subtract(days, 'days').format('YYYY-MM-DD');
  const counts = {};
  for (const s of sessions) {
    if (s.date < since) continue;
    for (const r of s.results || []) {
      if (!r.ok) counts[r.card] = (counts[r.card] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([id, misses]) => ({ card: cardById(id), misses }))
    .filter(m => m.card)
    .sort((a, b) => b.misses - a.misses)
    .slice(0, limit);
}
