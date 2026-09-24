/**
 * EXAM DATES — settable, and allowed to be unset.
 *
 * These used to be two literals in studyPlanData.js plus three more copies
 * hard-coded into AdherenceCard, Targets and MasterPlan. Moving one date meant
 * editing five places, and the copies had already drifted a day apart from each
 * other — which is the whole argument for a single settable source.
 *
 * `null` is a first-class value and means **no date set**: the exam is dormant,
 * the countdown does not render, and nothing downstream may invent a deadline.
 * An app whose whole top bar is a countdown needs a way to say "there is nothing
 * to count down to" rather than quietly counting to a date nobody believes.
 *
 * Stored as one settings object rather than a COLLECTION_NAMES entity: those are
 * arrays of records that backup/restore iterates. This is a single blob, so
 * DataBackup handles it explicitly under `_settings`.
 */

import { useSyncExternalStore } from 'react';
import moment from 'moment';
import { STORAGE_PREFIX } from './localStore';

export const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;

/** The exams the app can count down to. Order is the order they render in. */
export const EXAMS = [
  { key: 'cat', label: 'CAT', color: 'text-emerald-400' },
  { key: 'cfa', label: 'CFA L1', color: 'text-amber-400' },
];

const EMPTY = Object.freeze({ cat: null, cfa: null });

/**
 * Snapshot cache. useSyncExternalStore compares snapshots by identity, so
 * re-parsing localStorage on every render would loop forever.
 */
let cache = null;
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    const dates = parsed?.examDates ?? {};
    return Object.freeze({
      cat: normalise(dates.cat),
      cfa: normalise(dates.cfa),
    });
  } catch {
    return EMPTY;
  }
}

/** Anything that isn't a real YYYY-MM-DD becomes null — an unset date, not NaN days. */
function normalise(value) {
  if (!value) return null;
  const m = moment(value, 'YYYY-MM-DD', true);
  return m.isValid() ? m.format('YYYY-MM-DD') : null;
}

export function getExamDates() {
  if (cache === null) cache = read();
  return cache;
}

export function getExamDate(key) {
  return getExamDates()[key] ?? null;
}

/** Set a date, or pass null/'' to clear it and make the exam dormant again. */
export function setExamDate(key, value) {
  const next = { ...getExamDates(), [key]: normalise(value) };
  let settings = {};
  try {
    settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {};
  } catch {
    settings = {};
  }
  settings.examDates = next;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  cache = Object.freeze(next);
  for (const fn of listeners) fn();
  return cache;
}

/** Used by the reset in DataBackup, which clears storage out from under us. */
export function refreshExamDates() {
  cache = read();
  for (const fn of listeners) fn();
  return cache;
}

function subscribe(fn) {
  listeners.add(fn);
  // Another tab writing the same key should move this one too.
  const onStorage = e => {
    if (e.key === SETTINGS_KEY) refreshExamDates();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

/** Re-renders on every set, from anywhere. */
export function useExamDates() {
  return useSyncExternalStore(subscribe, getExamDates, () => EMPTY);
}

/**
 * Days remaining, or null when the exam has no date. Callers must render the
 * null case rather than coercing — `moment(null).diff()` is NaN, which is how
 * "NaN days to CAT" would have reached the top bar.
 */
export function daysUntil(date, from = moment()) {
  if (!date) return null;
  return moment(date).diff(moment(from).startOf('day'), 'days');
}
