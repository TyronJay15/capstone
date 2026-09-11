/**
 * headteacherApi — teachers/advisers directory + assignment/validation/sectioning history.
 * Frontend-only demo data with in-memory history that can later be backed by APIs.
 */

const TEACHERS = [
  { id: 't1', name: 'Apolinario Mabini', subject: 'English', grade: 'Grade 12', strand: 'HUMSS', section: '12-HUMSS-A', assigned: true },
  { id: 't2', name: 'Gregoria de Jesus', subject: 'Mathematics', grade: 'Grade 11', strand: 'STEM', section: '11-A', assigned: true },
  { id: 't3', name: 'Jose Rizal', subject: 'Filipino', grade: 'Grade 12', strand: 'STEM', section: '12-STEM-A', assigned: true },
  { id: 't4', name: 'Juan Luna', subject: 'Science', grade: 'Grade 11', strand: 'STEM', section: '', assigned: false },
  { id: 't5', name: 'Melchora Aquino', subject: 'Research', grade: 'Grade 11', strand: 'ABM', section: '11-B', assigned: true },
  { id: 't6', name: 'Marcelo del Pilar', subject: 'Mathematics', grade: 'Grade 12', strand: 'ABM', section: '', assigned: false }
];

const ADVISERS = [
  { id: 'a1', name: 'Andres Bonifacio', strand: 'ABM', section: '11-B', assigned: true },
  { id: 'a2', name: 'Gabriela Silang', strand: 'STEM', section: '12-STEM-A', assigned: true },
  { id: 'a3', name: 'Maria Santos', strand: 'STEM', section: '11-A', assigned: true },
  { id: 'a4', name: 'Tandang Sora', strand: 'HUMSS', section: '', assigned: false }
];

let ASSIGNMENT_HISTORY = [
  { id: 'ah1', type: 'Subject Teacher', who: 'Jose Rizal', subject: 'Filipino', section: '12-STEM-A', date: '2026-06-10' },
  { id: 'ah2', type: 'Adviser', who: 'Maria Santos', section: '11-A', date: '2026-06-08' },
  { id: 'ah3', type: 'Subject Teacher', who: 'Gregoria de Jesus', subject: 'Mathematics', section: '11-A', date: '2026-06-05' }
];

let VALIDATION_HISTORY = [
  { id: 'vh1', student: 'Mateo Reyes', subject: 'Mathematics', submittedAt: '2026-06-20', validatedAt: '2026-06-21', approvedBy: 'Head Teacher', rejectedBy: '', status: 'approved' },
  { id: 'vh2', student: 'Bianca Cruz', subject: 'Filipino', submittedAt: '2026-06-22', validatedAt: '', approvedBy: '', rejectedBy: '', status: 'pending' },
  { id: 'vh3', student: 'Liam Santos', subject: 'Science', submittedAt: '2026-06-18', validatedAt: '2026-06-19', approvedBy: '', rejectedBy: 'Head Teacher', status: 'rejected' }
];

const SECTIONING_HISTORY = [
  { id: 'sh1', student: 'Mateo Reyes', action: 'Assigned to section', from: '—', to: '12-STEM-A', date: '2026-06-09' },
  { id: 'sh2', student: 'Ella Aquino', action: 'Section transfer', from: '11-A', to: '11-B', date: '2026-06-12' },
  { id: 'sh3', student: 'Noah Lim', action: 'Assigned to section', from: '—', to: '11-A', date: '2026-06-07' }
];

let SECTION_CREATIONS = [
  { id: 'sc1', name: '12-STEM-A', strand: 'STEM', totalStudents: 8, adviser: 'Gabriela Silang', date: '2026-06-09' }
];

let FORECAST_HISTORY = [
  { id: 'fh1', label: 'SY 2026–2027 Enrollment Forecast', generatedBy: 'Head Teacher', date: '2026-06-15' }
];

export function getTeachers() {
  return TEACHERS;
}

export function getAdvisers() {
  return ADVISERS;
}

export function getAssignmentHistory() {
  return ASSIGNMENT_HISTORY;
}

export function getValidationHistory() {
  return VALIDATION_HISTORY;
}

export function getSectioningHistory() {
  return SECTIONING_HISTORY;
}

export function recordAssignment(entry) {
  ASSIGNMENT_HISTORY = [{ id: `ah-${Date.now()}`, date: new Date().toISOString().slice(0, 10), ...entry }, ...ASSIGNMENT_HISTORY];
  return ASSIGNMENT_HISTORY[0];
}

export function getSectionCreations() {
  return SECTION_CREATIONS;
}

export function recordSectionCreation(entry) {
  SECTION_CREATIONS = [{ id: `sc-${Date.now()}`, date: new Date().toISOString().slice(0, 10), ...entry }, ...SECTION_CREATIONS];
  return SECTION_CREATIONS[0];
}

export function getForecastHistory() {
  return FORECAST_HISTORY;
}

export function recordForecast(entry) {
  FORECAST_HISTORY = [{ id: `fh-${Date.now()}`, date: new Date().toISOString().slice(0, 10), ...entry }, ...FORECAST_HISTORY];
  return FORECAST_HISTORY[0];
}
