// VARC analysis. Follows the vault's VARC.md: RC and VA are analysed separately,
// time wastage is tracked explicitly (re-reading is the named #1 waste), and the
// 3-line summary from memory is a discipline worth measuring.

// Domain rotation exists to prevent blind spots — so accuracy by domain is the
// measurement that tells you whether the rotation is working.
export const RC_DOMAINS = [
  'Philosophy', 'Psychology / Cognitive Science', 'Economics', 'Sociology',
  'History', 'Science / Technology', 'Literature / Art Criticism',
  'Politics / Law', 'Environment', 'Business / Management',
];

export const VA_TYPES = ['Para Jumble', 'Odd Sentence Out', 'Para Summary'];

// Para Jumble and Odd Sentence Out are TITA — no negative marking, so a blank is
// strictly worse than a guess. Para Summary is MCQ and does carry a penalty.
export const VA_NO_PENALTY = { 'Para Jumble': true, 'Odd Sentence Out': true, 'Para Summary': false };

export const DIFFICULTY = ['Easy', 'Medium', 'Difficult'];

export const VARC_ERRORS = [
  'None', 'Comprehension Failure', 'Inference Error', 'Trap Option',
  'Re-read Passage', 'Ran Out Of Time', 'Careless Marking',
];

export const VARC_ERROR_FIX = {
  'Comprehension Failure': 'You misread the argument. Slow the first pass slightly — re-reading later costs more than reading properly once.',
  'Inference Error': 'You understood but concluded wrong. Practise stating the author\'s claim in one sentence before looking at options.',
  'Trap Option': 'Two options looked right. Find the word that makes the wrong one wrong — scope, degree, or tense. Usually one word.',
  'Re-read Passage': 'The vault\'s named #1 time waste. One pass, then answer. Going back means the first pass was passive.',
  'Ran Out Of Time': 'Pacing. ~8 min per RC set: 2–2.5 min reading, the rest answering.',
  'Careless Marking': 'Transcription discipline. Check what you entered against what you chose.',
};

const rc = items => items.filter(i => i.kind === 'RC Passage');
const va = items => items.filter(i => i.kind === 'VA Question');

function acc(list) {
  const total = list.reduce((s, i) => s + (i.questions_total || 0), 0);
  const correct = list.reduce((s, i) => s + (i.questions_correct || 0), 0);
  return total > 0 ? Math.round((correct / total) * 100) : null;
}

/** Accuracy by RC domain — this is the blind-spot detector. */
export function summariseByDomain(items) {
  const groups = new Map();
  for (const i of rc(items)) {
    if (!i.domain) continue;
    groups.set(i.domain, [...(groups.get(i.domain) || []), i]);
  }
  return [...groups.entries()]
    .map(([domain, list]) => ({
      domain,
      passages: list.length,
      accuracy: acc(list),
      medianRead: median(list.map(i => i.read_time_seconds).filter(Boolean)),
    }))
    .sort((a, b) => (a.accuracy ?? 999) - (b.accuracy ?? 999));
}

/** VA accuracy by type, flagging the two that carry no penalty. */
export function summariseVA(items) {
  return VA_TYPES.map(type => {
    const list = va(items).filter(i => i.va_type === type);
    return {
      type,
      count: list.length,
      accuracy: acc(list),
      noPenalty: VA_NO_PENALTY[type],
    };
  }).filter(r => r.count > 0);
}

/** Reading speed — the vault targets ~2–2.5 min for a ~500-word passage. */
export function readingStats(items) {
  const times = rc(items).map(i => i.read_time_seconds).filter(Boolean);
  const med = median(times);
  return {
    passages: rc(items).length,
    medianRead: med,
    onPace: med != null ? med <= 165 : null, // 2:45 ceiling
  };
}

/**
 * Summary discipline — % of RC passages where the 3-line summary was written
 * from memory before answering. The vault prescribes it; nothing measured it.
 */
export function summaryDiscipline(items) {
  const passages = rc(items);
  if (!passages.length) return { rate: null, written: 0, total: 0, accWith: null, accWithout: null };
  const written = passages.filter(p => p.summary_written);
  return {
    total: passages.length,
    written: written.length,
    rate: Math.round((written.length / passages.length) * 100),
    accWith: acc(written),
    accWithout: acc(passages.filter(p => !p.summary_written)),
  };
}

/**
 * The vault's observation: a difficult passage usually carries easy questions,
 * and an easy passage carries difficult ones. Worth checking against your data —
 * if it holds, a hard-reading passage is an opportunity, not a warning.
 */
export function difficultyPairing(items) {
  const pairs = rc(items).filter(i => i.passage_difficulty && i.question_difficulty);
  if (!pairs.length) return null;
  return {
    n: pairs.length,
    hardPassageAccuracy: acc(pairs.filter(p => p.passage_difficulty === 'Difficult')),
    easyPassageAccuracy: acc(pairs.filter(p => p.passage_difficulty === 'Easy')),
  };
}

export function varcErrorCounts(items) {
  const counts = new Map();
  for (const i of items) {
    if (!i.error_type || i.error_type === 'None') continue;
    counts.set(i.error_type, (counts.get(i.error_type) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count, fix: VARC_ERROR_FIX[type] }))
    .sort((a, b) => b.count - a.count);
}

export function overallAccuracy(items) {
  return { rc: acc(rc(items)), va: acc(va(items)), all: acc(items) };
}

function median(xs) {
  if (!xs.length) return null;
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
