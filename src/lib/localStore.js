// localStorage-backed entity store
import { CFA_SUBJECTS } from './studyPlanData';
import { CFA_CURRICULUM } from './cfaCurriculum';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getCollection(name) {
  try {
    return JSON.parse(localStorage.getItem(`prepapp_${name}`) || '[]');
  } catch {
    return [];
  }
}

function setCollection(name, data) {
  localStorage.setItem(`prepapp_${name}`, JSON.stringify(data));
}

function applySortAndLimit(items, sort, limit) {
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    items = [...items].sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (av === bv) return 0;
      return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
    });
  }
  return limit ? items.slice(0, limit) : items;
}

function createEntityStore(name) {
  return {
    list(sort = '-created_date', limit = 100) {
      const items = applySortAndLimit(getCollection(name), sort, limit);
      return Promise.resolve(items);
    },
    filter(criteria, sort = '-created_date', limit = 100) {
      const filtered = getCollection(name).filter(item =>
        Object.entries(criteria).every(([k, v]) => item[k] === v)
      );
      return Promise.resolve(applySortAndLimit(filtered, sort, limit));
    },
    create(data) {
      const items = getCollection(name);
      const newItem = { ...data, id: generateId(), created_date: new Date().toISOString() };
      items.push(newItem);
      setCollection(name, items);
      return Promise.resolve(newItem);
    },
    update(id, changes) {
      const items = getCollection(name);
      const idx = items.findIndex(item => item.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...changes };
        setCollection(name, items);
        return Promise.resolve(items[idx]);
      }
      return Promise.resolve(null);
    },
    delete(id) {
      const items = getCollection(name);
      const filtered = items.filter(item => item.id !== id);
      setCollection(name, filtered);
      return Promise.resolve();
    },
  };
}

// Single source of truth for what exists. Backup/restore derives from this, so
// adding an entity here is enough — it can't be silently left out of an export.
export const COLLECTION_NAMES = [
  'StudySession',
  'MockTest',
  'SubjectProgress',
  'ModuleProgress',
  'DILRSet',
  'QAQuestion',
  'VARCItem',
  'DrillSession',
  'ZetamacScore',
  'TimedSection',
];

export const STORAGE_PREFIX = 'prepapp_';

export const localStore = {
  entities: Object.fromEntries(
    COLLECTION_NAMES.map(name => [name, createEntityStore(name)])
  ),
};

// Seeds CFA subject progress records on first run
export function initializeDefaultData() {
  const existing = getCollection('SubjectProgress');
  const hasCFA = existing.some(s => s.exam === 'CFA');
  if (!hasCFA) {
    const seeded = CFA_SUBJECTS.map(s => ({
      id: generateId(),
      created_date: new Date().toISOString(),
      exam: 'CFA',
      subject: s.name,
      exam_weight: s.weight,
      question_target: s.target,
      status: s.status || 'Not Started',
      pending_topics: s.pending || '',
      total_questions_done: 0,
      current_accuracy: 0,
    }));
    setCollection('SubjectProgress', [...existing, ...seeded]);
  }

  // Seed module progress records (one per CFA module)
  const existingModules = getCollection('ModuleProgress');
  if (existingModules.length === 0) {
    const seeded = CFA_CURRICULUM.map(m => ({
      id: generateId(),
      created_date: new Date().toISOString(),
      module_id: m.id,
      module_name: m.name,
      subject: m.subjectFull,
      total_lessons: m.lessons.length,
      completed_lessons: '[]',   // JSON array of completed lesson numbers
      status: 'Not Started',     // 'Not Started' | 'In Progress' | 'Complete'
    }));
    setCollection('ModuleProgress', seeded);
  }
}
