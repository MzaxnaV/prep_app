// Per-day schedule overrides stored in localStorage.
// Blocks are stored in editable format; helpers convert to/from display format.

const storageKey = date => `schedule-override-${date}`;

/** Parse 'H:MM – H:MM' → { startTime: 'HH:MM', endTime: 'HH:MM' } */
function parseTimeRange(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  const pad = n => String(n).padStart(2, '0');
  if (!match) return { startTime: '09:00', endTime: '10:00' };
  return {
    startTime: `${pad(match[1])}:${match[2]}`,
    endTime: `${pad(match[3])}:${match[4]}`,
  };
}

/**
 * Convert a default schedule block (from studyPlanData) to editable format:
 * { startTime, endTime, activity, exam, type, detail }
 */
export function defaultToEditable(blocks) {
  return blocks.map(b => {
    const { startTime, endTime } = parseTimeRange(b.time);
    return {
      startTime,
      endTime,
      activity: b.activity,
      exam: b.exam,
      type: b.type,
      detail: b.detail || '',
    };
  });
}

/**
 * Convert an editable block back to display format (what ScheduleBlock expects):
 * adds `time` string and `duration` in minutes.
 */
export function editableToDisplay(block) {
  const [sh, sm] = block.startTime.split(':').map(Number);
  const [eh, em] = block.endTime.split(':').map(Number);
  const duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  // Format without leading zero for hours
  const fmtH = h => String(h);
  const fmtM = m => String(m).padStart(2, '0');
  return {
    ...block,
    time: `${fmtH(sh)}:${fmtM(sm)} – ${fmtH(eh)}:${fmtM(em)}`,
    duration,
  };
}

/** Returns the override for a given date string (YYYY-MM-DD), or null */
export function getScheduleOverride(date) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(date)) || 'null');
  } catch {
    return null;
  }
}

/** Save an array of editable blocks as the override for the given date */
export function saveScheduleOverride(date, editableBlocks) {
  localStorage.setItem(storageKey(date), JSON.stringify(editableBlocks));
}

/** Remove the override for the given date (revert to default) */
export function clearScheduleOverride(date) {
  localStorage.removeItem(storageKey(date));
}

/** New blank block template */
export function newBlock() {
  return {
    startTime: '09:00',
    endTime: '10:00',
    activity: 'Study Block',
    exam: 'CFA',
    type: 'practice',
    detail: '',
  };
}
