// QA topics and analysis. Taxonomy follows the vault's QA.md: questions are
// rated comfortable / unsure / uncomfortable BEFORE solving, and the diagnosis
// depends on which bucket the wrong answer came from.

export const QA_AREAS = ['Arithmetic', 'Algebra', 'Number System', 'Geometry', 'Modern Math'];

// Arithmetic is ~40% of the section — weight effort accordingly.
export const AREA_WEIGHT = {
  'Arithmetic': '~40%',
  'Algebra': '~25%',
  'Number System': '~15%',
  'Geometry': '~15%',
  'Modern Math': '~5%',
};

export const QA_TOPICS = {
  'Arithmetic': [
    'Percentages', 'Profit & Loss', 'SI & CI', 'Ratio & Proportion',
    'Averages', 'Mixtures & Alligation', 'Time-Speed-Distance', 'Time & Work',
  ],
  'Algebra': [
    'Linear Equations', 'Quadratic Equations', 'Inequalities', 'Functions',
    'Logarithms', 'Progressions', 'Surds & Indices', 'Maxima & Minima',
  ],
  'Number System': [
    'Factors & Divisibility', 'Remainders', 'HCF & LCM', 'Base Systems', 'Last Digit & Cyclicity',
  ],
  'Geometry': [
    'Triangles', 'Circles', 'Quadrilaterals & Polygons', 'Mensuration', 'Coordinate Geometry',
  ],
  'Modern Math': [
    'Permutation & Combination', 'Probability', 'Set Theory',
  ],
};

export const ALL_TOPICS = Object.entries(QA_TOPICS).flatMap(
  ([area, topics]) => topics.map(t => ({ topic: t, area }))
);

export const areaOf = topic => ALL_TOPICS.find(t => t.topic === topic)?.area ?? null;

export const CONFIDENCE = ['Comfortable', 'Unsure', 'Uncomfortable'];

export const ERROR_TYPES = [
  'None', 'Concept Gap', 'Calculation Error', 'Misread Question',
  'Ego Question', 'Ran Out Of Time', 'Careless Marking',
];

export const ERROR_FIX = {
  'Concept Gap': 'Read the chapter. Practice alone will not close this one.',
  'Calculation Error': 'Zetamac, and stop computing what you can estimate.',
  'Misread Question': 'Process, not ability. Re-read the question before touching the options.',
  'Ego Question': 'Time discipline. You knew by 2 minutes — the cost was the two questions you never reached.',
  'Ran Out Of Time': 'Selection failure. This should have been skipped at the 15-second evaluate step.',
  'Careless Marking': 'Transcription discipline. Check what you entered against what you solved.',
};

/**
 * The vault's core QA diagnosis — a wrong answer means something different
 * depending on how confident you were going in:
 *   Comfortable + wrong  -> not proficient      -> practice
 *   Unsure + wrong       -> competence gap      -> revision + practice
 *   Uncomfortable + wrong-> competence gap      -> read the theory
 * Without this split, "I got 14/25" tells you nothing about what to do next.
 */
export const CONFIDENCE_DIAGNOSIS = {
  'Comfortable': { label: 'Not proficient', fix: 'Practice. You know the concept; execution is the gap.' },
  'Unsure': { label: 'Competence gap', fix: 'Revision + practice. Half-known concepts fail under time.' },
  'Uncomfortable': { label: 'Competence gap', fix: 'Read the theory first. Drilling blind wastes the hours.' },
};

export function summariseByTopic(questions) {
  const groups = new Map();
  for (const q of questions) {
    if (!q.topic) continue;
    const g = groups.get(q.topic) || {
      topic: q.topic, area: q.area || areaOf(q.topic),
      seen: 0, correct: 0, incorrect: 0, skipped: 0, times: [],
    };
    g.seen += 1;
    if (q.result === 'Correct') g.correct += 1;
    else if (q.result === 'Incorrect') g.incorrect += 1;
    else g.skipped += 1;
    if (q.time_seconds) g.times.push(q.time_seconds);
    groups.set(q.topic, g);
  }
  return [...groups.values()]
    .map(g => {
      const attempted = g.correct + g.incorrect;
      return {
        ...g,
        accuracy: attempted > 0 ? Math.round((g.correct / attempted) * 100) : null,
        medianTime: g.times.length ? median(g.times) : null,
      };
    })
    .sort((a, b) => (a.accuracy ?? 999) - (b.accuracy ?? 999));
}

/** Confidence buckets crossed with outcome — drives the diagnosis panel. */
export function confidenceBreakdown(questions) {
  return CONFIDENCE.map(level => {
    const inLevel = questions.filter(q => q.confidence === level);
    const attempted = inLevel.filter(q => q.result !== 'Skipped');
    const wrong = inLevel.filter(q => q.result === 'Incorrect').length;
    return {
      level,
      total: inLevel.length,
      wrong,
      accuracy: attempted.length
        ? Math.round((attempted.filter(q => q.result === 'Correct').length / attempted.length) * 100)
        : null,
      ...CONFIDENCE_DIAGNOSIS[level],
    };
  }).filter(b => b.total > 0);
}

/**
 * Time bleed — minutes spent on questions that scored nothing.
 * The vault asks for exactly this split (correct / incorrect / left, each with
 * time and % of the 40-minute section).
 */
export function timeBleed(questions) {
  const sum = pred => questions.filter(pred).reduce((t, q) => t + (q.time_seconds || 0), 0);
  const correct = sum(q => q.result === 'Correct');
  const incorrect = sum(q => q.result === 'Incorrect');
  const skipped = sum(q => q.result === 'Skipped');
  const total = correct + incorrect + skipped;
  const pct = v => (total > 0 ? Math.round((v / total) * 100) : 0);
  return {
    total, correct, incorrect, skipped,
    correctPct: pct(correct), incorrectPct: pct(incorrect), skippedPct: pct(skipped),
    wastedPct: pct(incorrect + skipped),
  };
}

/** Questions that ate 3+ minutes and still scored nothing — the vault's "ego Q". */
export function egoQuestions(questions) {
  return questions.filter(q => (q.time_seconds || 0) >= 180 && q.result !== 'Correct');
}

export function errorTypeCounts(questions) {
  const counts = new Map();
  for (const q of questions) {
    if (!q.error_type || q.error_type === 'None') continue;
    counts.set(q.error_type, (counts.get(q.error_type) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count, fix: ERROR_FIX[type] }))
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

export function fmtMinutes(seconds) {
  return `${Math.round((seconds || 0) / 60)}m`;
}
