// DILR set archetypes and the analysis that turns logged sets into a skip list.
// See the Master Plan page — set selection is ~50% of the DILR battle, so triage quality
// is scored separately from solving quality.

export const SET_TYPES = [
  'Linear Arrangement',
  'Circular Arrangement',
  'Grouping / Selection',
  'Distribution / Allocation',
  'Data Caselet',
  'Graphs / Charts',
  'Tables',
  'Logical Puzzle',
  'Games / Tournaments',
  'Venn Diagrams',
  'Quant-based DI',
  'Hybrid / Mixed',
];

export const DIFFICULTY = ['Easy', 'Medium', 'Difficult'];

/**
 * Intuition calibration — the vault's core DILR question, "What makes S easy?".
 * Perceived difficulty is rated before solving, actual after. The gap between
 * them is why set selection goes wrong: you can't skip trap sets if traps read
 * as easy. Tracked apart from accuracy because it fails for different reasons.
 */
export function calibrationStats(sets) {
  const rated = sets.filter(s => s.perceived_difficulty && s.actual_difficulty);
  const idx = d => DIFFICULTY.indexOf(d);
  const right = rated.filter(s => s.perceived_difficulty === s.actual_difficulty).length;
  // Underestimated = looked easier than it was. These are the sets that eat your section.
  const under = rated.filter(s => idx(s.perceived_difficulty) < idx(s.actual_difficulty)).length;
  const over = rated.filter(s => idx(s.perceived_difficulty) > idx(s.actual_difficulty)).length;
  return {
    rated: rated.length,
    right,
    under,
    over,
    rate: rated.length ? Math.round((right / rated.length) * 100) : null,
  };
}

export const FAILURE_MODES = [
  'None',
  'No Entry Point',
  'Wrong Approach',
  'Misread Constraint',
  'Arithmetic Slip',
  'Ran Out Of Time',
  'Careless Marking',
];

// What each failure mode actually calls for — so the fix matches the cause
// instead of defaulting to "do more sets".
export const FAILURE_FIX = {
  'No Entry Point': 'Pattern exposure. Watch solutions for this type until openings are obvious.',
  'Wrong Approach': 'Study the efficient setup. Rework the set from scratch before reading further.',
  'Misread Constraint': 'Process, not ability. Re-read constraints twice before drawing anything.',
  'Arithmetic Slip': 'Calculation drill — Zetamac, and stop computing what you can estimate.',
  'Ran Out Of Time': 'Triage failure, not solving failure. This set should have been skipped.',
  'Careless Marking': 'Transcription discipline. Answer straight from the grid, not from memory.',
};

/** Accuracy + median time per set type — this is the exam-day skip list, derived. */
export function summariseByType(sets) {
  const groups = new Map();
  for (const s of sets) {
    if (!s.set_type) continue;
    const g = groups.get(s.set_type) || { type: s.set_type, seen: 0, attempted: 0, correct: 0, total: 0, times: [], solved: 0 };
    g.seen += 1;
    if (s.triage_decision === 'Attempted') {
      g.attempted += 1;
      g.correct += s.questions_correct || 0;
      g.total += s.questions_total || 0;
      if (s.time_seconds) g.times.push(s.time_seconds);
      if (s.solved_fully) g.solved += 1;
    }
    groups.set(s.set_type, g);
  }

  return [...groups.values()]
    .map(g => ({
      ...g,
      accuracy: g.total > 0 ? Math.round((g.correct / g.total) * 100) : null,
      solveRate: g.attempted > 0 ? Math.round((g.solved / g.attempted) * 100) : null,
      medianTime: g.times.length ? median(g.times) : null,
    }))
    .sort((a, b) => (a.accuracy ?? 999) - (b.accuracy ?? 999));
}

/** Triage skill: how often the 60-second attempt/skip call held up. */
export function triageStats(sets) {
  const judged = sets.filter(s => s.triage_was_correct != null);
  const right = judged.filter(s => s.triage_was_correct).length;
  return {
    judged: judged.length,
    right,
    rate: judged.length ? Math.round((right / judged.length) * 100) : null,
  };
}

export function failureModeCounts(sets) {
  const counts = new Map();
  for (const s of sets) {
    if (!s.failure_mode || s.failure_mode === 'None') continue;
    counts.set(s.failure_mode, (counts.get(s.failure_mode) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([mode, count]) => ({ mode, count, fix: FAILURE_FIX[mode] }))
    .sort((a, b) => b.count - a.count);
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function fmtTime(seconds) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
