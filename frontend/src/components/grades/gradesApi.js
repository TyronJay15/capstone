/**
 * gradesApi — sections, students, subjects, terms and grade submissions.
 *
 * Frontend-only demo data with an in-memory submission store shared across the
 * adviser, subject teacher and head-teacher views. Mirrors a structure that can
 * later be backed by the grading API.
 */

export const TERMS = ['1st Term', '2nd Term', '3rd Term'];

export const SECTIONS = [
  { id: '11-A', name: '11-A', grade: 'Grade 11', strand: 'STEM' },
  { id: '11-B', name: '11-B', grade: 'Grade 11', strand: 'ABM' },
  { id: '12-STEM-A', name: '12-STEM-A', grade: 'Grade 12', strand: 'STEM' }
];

export const SUBJECTS = ['Mathematics', 'Science', 'English', 'Filipino', 'Research'];

const FIRST = ['Mateo', 'Bianca', 'Liam', 'Sofia', 'Noah', 'Mia', 'Ethan', 'Ava', 'Lucas', 'Ella'];
const LAST = ['Reyes', 'Cruz', 'Santos', 'Garcia', 'Lim', 'Tan', 'Ramos', 'Flores', 'Diaz', 'Aquino'];

const STUDENTS_BY_SECTION = SECTIONS.reduce((acc, sec, sIdx) => {
  acc[sec.id] = Array.from({ length: 8 }).map((_, i) => {
    const idx = (sIdx * 8 + i) % FIRST.length;
    const enrollment = ['Enrolled', 'In Progress', 'Not Enrolled'][(sIdx + i) % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0];
    return {
      id: `${2025}-${String(sIdx * 30 + 101 + i)}`,
      name: `${FIRST[idx]} ${LAST[(idx + 3) % LAST.length]}`,
      grade: sec.grade,
      section: sec.name,
      strand: sec.strand,
      enrollmentStatus: enrollment
    };
  });
  return acc;
}, {});

let _submissions = [
  {
    id: 'sub-1',
    section: '12-STEM-A',
    studentName: 'Mateo Reyes',
    lrn: '2025-161',
    subject: 'Mathematics',
    term: '1st Term',
    grade: 90,
    submittedAt: '2026-06-20',
    lastModified: '2026-06-20',
    status: 'approved',
    sharedWithStudent: false,
    by: 'adviser'
  },
  {
    id: 'sub-2',
    section: '12-STEM-A',
    studentName: 'Bianca Cruz',
    lrn: '2025-162',
    subject: 'Filipino',
    term: '1st Term',
    grade: 87,
    submittedAt: '2026-06-22',
    lastModified: '2026-06-23',
    status: 'pending',
    sharedWithStudent: false,
    by: 'teacher'
  }
];

export function getSections() {
  return SECTIONS;
}

export function getStudents(sectionId) {
  return STUDENTS_BY_SECTION[sectionId] || [];
}

export function getSubjects() {
  return SUBJECTS;
}

export function getSubmissions(filter = {}) {
  return _submissions.filter((s) => {
    if (filter.by && s.by !== filter.by) return false;
    if (filter.section && s.section !== filter.section) return false;
    return true;
  });
}

export function submitGrade(entry) {
  const today = new Date().toISOString().slice(0, 10);
  const record = {
    id: `sub-${Date.now()}`,
    submittedAt: today,
    lastModified: today,
    status: 'pending',
    sharedWithStudent: false,
    ...entry
  };
  _submissions = [record, ..._submissions];
  return record;
}

export function setSubmissionStatus(id, status) {
  _submissions = _submissions.map((s) =>
    s.id === id ? { ...s, status, lastModified: new Date().toISOString().slice(0, 10) } : s
  );
  return _submissions.find((s) => s.id === id);
}

export function shareWithStudent(id) {
  _submissions = _submissions.map((s) => (s.id === id ? { ...s, sharedWithStudent: true } : s));
  return _submissions.find((s) => s.id === id);
}
