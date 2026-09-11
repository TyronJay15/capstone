/**
 * recommendationStore — shared, frontend-only store for generated college
 * course recommendations.
 *
 * A student generates a recommendation; it is persisted to localStorage keyed by
 * the student's LRN so that the Parent, Adviser and Admin views can read the same
 * result. This is a placeholder for a future backend endpoint — the shape mirrors
 * what an API would return, so the UI won't need to change once wired up.
 */

const STORAGE_KEY = 'gradeportal_recommendations';

const COURSE_POOL = {
  STEM: [
    { name: 'BS Information Technology', base: 88 },
    { name: 'BS Computer Science', base: 84 },
    { name: 'BS Civil Engineering', base: 78 },
    { name: 'BS Data Science', base: 74 }
  ],
  ABM: [
    { name: 'BS Accountancy', base: 86 },
    { name: 'BS Business Administration', base: 82 },
    { name: 'BS Management Accounting', base: 77 },
    { name: 'BS Economics', base: 72 }
  ],
  HUMSS: [
    { name: 'AB Communication', base: 85 },
    { name: 'BS Psychology', base: 81 },
    { name: 'AB Political Science', base: 76 },
    { name: 'BS Education', base: 71 }
  ],
  DEFAULT: [
    { name: 'BS Information Technology', base: 80 },
    { name: 'BS Business Administration', base: 76 },
    { name: 'AB Communication', base: 72 },
    { name: 'BS Education', base: 68 }
  ]
};

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

export function getRecommendation(studentKey) {
  if (!studentKey) return null;
  return readAll()[studentKey] || null;
}

export function getAllRecommendations() {
  return readAll();
}

/**
 * Build + persist a recommendation for a student.
 * @param {string} studentKey - LRN or stable id.
 * @param {object} student - { name, strand, grades:[{grade}] }
 */
export function generateRecommendation(studentKey, student = {}) {
  const strand = (student.strand || 'DEFAULT').toUpperCase();
  const pool = COURSE_POOL[strand] || COURSE_POOL.DEFAULT;

  const grades = Array.isArray(student.grades) ? student.grades : [];
  const avg = grades.length ? grades.reduce((s, g) => s + (g.grade || 0), 0) / grades.length : 85;
  // Nudge confidence by the student's average performance.
  const adjust = Math.round((avg - 85) * 0.6);

  const ranked = pool
    .map((c) => ({ name: c.name, confidence: Math.max(40, Math.min(99, c.base + adjust)) }))
    .sort((a, b) => b.confidence - a.confidence);

  const top = ranked[0];
  const recommendation = {
    studentKey,
    studentName: student.name || 'Student',
    strand: student.strand || '—',
    topCourse: top.name,
    confidence: top.confidence,
    recommendationScore: Number(((top.confidence / 100) * 10).toFixed(1)),
    explanation: `Based on a running average of ${avg.toFixed(1)} and consistent performance aligned with the ${
      student.strand || 'chosen'
    } strand, ${top.name} is the strongest college course match.`,
    alternatives: ranked.slice(1),
    trend: grades.length ? grades.slice(-6).map((g) => g.grade) : [82, 84, 83, 87, 90, 92],
    generatedAt: new Date().toISOString()
  };

  const map = readAll();
  map[studentKey] = recommendation;
  writeAll(map);
  return recommendation;
}
