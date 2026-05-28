import { sampleStudents } from '../data/students';

const DB_KEY = 'gradeportal_enrollment_db';
const ACADEMIC_YEAR_KEY = 'gradeportal_academic_year';
const STORE_EVENT = 'gradeportal-store-updated';

export const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027'];
export const DEFAULT_ACADEMIC_YEAR = '2025-2026';
export const SECTION_OPTIONS = ['Unassigned', 'Einstein', 'Curie', 'Newton', 'Turing'];

const SEED_ENROLLMENTS = [
  {
    id: 'enr-1',
    lrn: '2025-001',
    firstName: 'Maria',
    middleName: '',
    lastName: 'Santos',
    fullName: 'Maria Santos',
    previousSchool: 'Pulilan Elementary School',
    gradeLevelEnrollment: 'Grade 10',
    gradeLevelCurrent: 'Grade 9',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    section: 'Einstein',
    registrarStatus: 'approved',
    adminStatus: 'approved',
    submittedInfo: 'LRN + SF9 + birth certificate',
    submittedAt: '2026-01-10T08:00:00.000Z',
    parentConsent: true
  },
  {
    id: 'enr-2',
    lrn: '2025-002',
    firstName: 'Juan',
    middleName: '',
    lastName: 'Dela Cruz',
    fullName: 'Juan Dela Cruz',
    previousSchool: 'Sta. Maria High School',
    gradeLevelEnrollment: 'Grade 10',
    gradeLevelCurrent: 'Grade 9',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    section: 'Einstein',
    registrarStatus: 'approved',
    adminStatus: 'approved',
    submittedInfo: 'Good moral + report card',
    submittedAt: '2026-02-05T08:00:00.000Z',
    parentConsent: false
  },
  {
    id: 'enr-3',
    lrn: '2025-003',
    firstName: 'Ana',
    middleName: '',
    lastName: 'Rodriguez',
    fullName: 'Ana Rodriguez',
    previousSchool: 'Bulacan National High School',
    gradeLevelEnrollment: 'Grade 9',
    gradeLevelCurrent: 'Grade 8',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    section: 'Curie',
    registrarStatus: 'approved',
    adminStatus: 'pending',
    submittedInfo: 'Complete packet',
    submittedAt: '2026-03-01T08:00:00.000Z',
    parentConsent: true
  },
  {
    id: 'enr-4',
    lrn: '2025-004',
    firstName: 'Carlos',
    middleName: '',
    lastName: 'Mendoza',
    fullName: 'Carlos Mendoza',
    previousSchool: 'San Jose School',
    gradeLevelEnrollment: 'Grade 8',
    gradeLevelCurrent: 'Grade 7',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    section: 'Unassigned',
    registrarStatus: 'rejected',
    adminStatus: 'pending',
    submittedInfo: 'Missing LRN',
    submittedAt: '2026-03-12T08:00:00.000Z',
    parentConsent: false
  },
  {
    id: 'enr-5',
    lrn: '2026-901',
    firstName: 'Luis',
    middleName: '',
    lastName: 'Ramos',
    fullName: 'Luis Ramos',
    previousSchool: 'Transfer applicant',
    gradeLevelEnrollment: 'Grade 7',
    gradeLevelCurrent: '',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    section: 'Unassigned',
    registrarStatus: 'pending',
    adminStatus: 'pending',
    submittedInfo: 'LRN + birth certificate uploaded',
    submittedAt: '2026-03-20T08:00:00.000Z',
    parentConsent: false
  },
  {
    id: 'enr-6',
    lrn: '2026-902',
    firstName: 'Paula',
    middleName: '',
    lastName: 'Navarro',
    fullName: 'Paula Navarro',
    previousSchool: 'Transfer applicant',
    gradeLevelEnrollment: 'Grade 7',
    gradeLevelCurrent: '',
    academicYear: DEFAULT_ACADEMIC_YEAR,
    section: 'Unassigned',
    registrarStatus: 'approved',
    adminStatus: 'pending',
    submittedInfo: 'Report card + good moral',
    submittedAt: '2026-03-22T08:00:00.000Z',
    parentConsent: false
  }
];

function notifyStoreChange() {
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  notifyStoreChange();
}

function buildSectionAssignmentsFromEnrollments(enrollments) {
  return enrollments
    .filter((e) => e.registrarStatus === 'approved')
    .map((e) => ({
      id: e.id,
      lrn: e.lrn,
      name: e.fullName,
      gradeLevel: e.gradeLevelEnrollment,
      section: e.section || 'Unassigned'
    }));
}

function initDbIfNeeded() {
  if (loadDb()) return;

  const enrollments = SEED_ENROLLMENTS.map((e) => ({ ...e }));
  const db = {
    enrollments,
    sectionAssignments: buildSectionAssignmentsFromEnrollments(enrollments)
  };
  saveDb(db);

  if (!localStorage.getItem(ACADEMIC_YEAR_KEY)) {
    localStorage.setItem(ACADEMIC_YEAR_KEY, DEFAULT_ACADEMIC_YEAR);
  }
}

initDbIfNeeded();

export function subscribeEnrollmentStore(callback) {
  const handler = () => callback();
  window.addEventListener(STORE_EVENT, handler);
  return () => window.removeEventListener(STORE_EVENT, handler);
}

export function getCurrentAcademicYear() {
  return localStorage.getItem(ACADEMIC_YEAR_KEY) || DEFAULT_ACADEMIC_YEAR;
}

export function setCurrentAcademicYear(year) {
  localStorage.setItem(ACADEMIC_YEAR_KEY, year);
  notifyStoreChange();
}

export function getEnrollments({ academicYear } = {}) {
  const db = loadDb();
  if (!db) return [];
  let list = db.enrollments || [];
  if (academicYear) {
    list = list.filter((e) => e.academicYear === academicYear);
  }
  return list.map((e) => ({
    ...e,
    status: deriveOverallStatus(e)
  }));
}

export function deriveOverallStatus(enrollment) {
  const reg = (enrollment.registrarStatus || 'pending').toLowerCase();
  const adm = (enrollment.adminStatus || 'pending').toLowerCase();
  if (reg === 'rejected' || adm === 'rejected') return 'rejected';
  if (reg === 'approved' && adm === 'approved') return 'approved';
  if (reg === 'approved' && adm === 'pending') return 'pending_admin';
  return 'pending';
}

export function getRegistrarRequests(academicYear = getCurrentAcademicYear()) {
  return getEnrollments({ academicYear }).map((e) => ({
    id: e.id,
    lrn: e.lrn,
    name: e.fullName,
    previousSchool: e.previousSchool || '—',
    gradeLevel: e.gradeLevelEnrollment,
    status: e.registrarStatus || 'pending',
    adminStatus: e.adminStatus || 'pending',
    overallStatus: e.status,
    academicYear: e.academicYear,
    section: e.section || 'Unassigned',
    submittedInfo: e.submittedInfo || 'Enrollment application',
    submittedAt: e.submittedAt
  }));
}

export function getAdminIncomingStudents(academicYear = getCurrentAcademicYear()) {
  return getEnrollments({ academicYear })
    .filter((e) => (e.registrarStatus || '').toLowerCase() === 'approved')
    .map((e) => ({
      id: e.id,
      lrn: e.lrn,
      name: e.fullName,
      gradeLevel: e.gradeLevelEnrollment,
      submittedInfo: e.submittedInfo || 'Enrollment application',
      status: e.adminStatus || 'pending',
      registrarStatus: e.registrarStatus,
      academicYear: e.academicYear,
      section: e.section || 'Unassigned'
    }));
}

export function getAdminStudentRoster(academicYear = getCurrentAcademicYear()) {
  return getEnrollments({ academicYear }).map((e) => ({
    id: e.id,
    lrn: e.lrn,
    name: e.fullName,
    gradeLevel: e.gradeLevelEnrollment,
    status: mapRosterStatus(e),
    dateRegistered: (e.submittedAt || '').slice(0, 10),
    parentConsent: Boolean(e.parentConsent)
  }));
}

function mapRosterStatus(enrollment) {
  const overall = deriveOverallStatus(enrollment);
  if (overall === 'approved') return 'active';
  if (overall === 'rejected') return 'inactive';
  return 'pending';
}

export function getSectionAssignments(academicYear = getCurrentAcademicYear()) {
  const db = loadDb();
  if (!db) return [];
  const fromDb = (db.sectionAssignments || []).filter(
    (row) => !row.academicYear || row.academicYear === academicYear
  );
  if (fromDb.length > 0) return fromDb;

  return buildSectionAssignmentsFromEnrollments(
    getEnrollments({ academicYear }).filter((e) => e.registrarStatus === 'approved')
  );
}

export function saveSectionAssignments(assignments, academicYear = getCurrentAcademicYear()) {
  const db = loadDb() || { enrollments: [], sectionAssignments: [] };

  db.sectionAssignments = assignments.map((row) => ({
    ...row,
    academicYear
  }));

  db.enrollments = (db.enrollments || []).map((enrollment) => {
    const match = assignments.find((a) => a.id === enrollment.id || a.lrn === enrollment.lrn);
    if (!match) return enrollment;
    return { ...enrollment, section: match.section || 'Unassigned' };
  });

  saveDb(db);
}

export function createEnrollmentFromSignup(formData) {
  const db = loadDb() || { enrollments: [], sectionAssignments: [] };
  const lrn = String(formData.lrn || '').trim();

  const duplicate = (db.enrollments || []).find(
    (e) => e.lrn === lrn && e.academicYear === (formData.academicYear || getCurrentAcademicYear())
  );
  if (duplicate) {
    throw new Error('An enrollment application for this LRN already exists for the selected school year.');
  }

  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const enrollment = {
    id: `enr-${Date.now()}`,
    lrn,
    firstName: formData.firstName,
    middleName: formData.middleName || '',
    lastName: formData.lastName,
    fullName,
    birthdate: formData.birthdate,
    age: formData.age,
    gender: formData.gender,
    address: formData.address,
    contactNumber: formData.contactNumber,
    previousSchool: formData.previousSchool || '',
    gradeLevelCurrent: formData.gradeLevelCurrent || '',
    gradeLevelEnrollment: formData.gradeLevelEnrollment,
    schoolName: formData.schoolName,
    academicYear: formData.academicYear || getCurrentAcademicYear(),
    section: 'Unassigned',
    registrarStatus: 'pending',
    adminStatus: 'pending',
    submittedInfo: 'Online admission registration form',
    submittedAt: new Date().toISOString(),
    parentConsent: false
  };

  db.enrollments = [...(db.enrollments || []), enrollment];
  saveDb(db);
  return enrollment;
}

function updateEnrollment(id, patch) {
  const db = loadDb();
  if (!db) return null;

  let updated = null;
  db.enrollments = (db.enrollments || []).map((e) => {
    if (e.id !== id) return e;
    updated = { ...e, ...patch };
    return updated;
  });

  if (updated) {
    saveDb(db);
  }
  return updated;
}

export function updateRegistrarStatus(id, registrarStatus) {
  const patch = { registrarStatus };
  if (registrarStatus === 'approved') {
    const current = (loadDb()?.enrollments || []).find((e) => e.id === id);
    if (current && (!current.section || current.section === 'Unassigned')) {
      patch.section = 'Unassigned';
    }
  }
  return updateEnrollment(id, patch);
}

export function updateAdminStatus(id, adminStatus) {
  return updateEnrollment(id, { adminStatus });
}

export function updateEnrollmentSection(id, section) {
  return updateEnrollment(id, { section });
}

export function setParentConsent(lrn, granted, parentName = '') {
  const db = loadDb();
  if (!db) return;

  db.enrollments = (db.enrollments || []).map((e) =>
    e.lrn === lrn
      ? {
          ...e,
          parentConsent: Boolean(granted),
          parentConsentBy: parentName || e.parentConsentBy || '',
          parentConsentAt: granted ? new Date().toISOString() : ''
        }
      : e
  );
  saveDb(db);
}

export function hasParentConsent(lrn) {
  const record = (loadDb()?.enrollments || []).find((e) => e.lrn === lrn);
  return Boolean(record?.parentConsent);
}

export function getTeacherRoster(academicYear = getCurrentAcademicYear()) {
  return getEnrollments({ academicYear })
    .filter((e) => deriveOverallStatus(e) === 'approved')
    .map((e) => {
      const sample = sampleStudents.find((s) => s.id === e.lrn);
      return {
        id: e.lrn,
        enrollmentId: e.id,
        name: e.fullName,
        grade: e.gradeLevelEnrollment,
        section: e.section || 'Unassigned',
        status: 'Active',
        hasGrades: Boolean(sample?.grades?.length),
        parentConsent: Boolean(e.parentConsent)
      };
    });
}

export function getStudentGradesForTeacher(lrn) {
  if (!hasParentConsent(lrn)) {
    return { blocked: true, reason: 'Parent consent is required before teachers can view student grades.' };
  }
  const student = sampleStudents.find((s) => s.id === lrn);
  if (!student) {
    return { blocked: true, reason: 'No grade records found for this student.' };
  }
  return { blocked: false, student };
}

export function enrollmentToStudentRecord(enrollment) {
  const sample = sampleStudents.find((s) => s.id === enrollment.lrn);
  if (sample) return sample;

  if (deriveOverallStatus(enrollment) !== 'approved') return null;

  return {
    id: enrollment.lrn,
    name: enrollment.fullName,
    email: `${enrollment.lrn}@dampol.edu.ph`,
    grade: enrollment.gradeLevelEnrollment,
    section: enrollment.section || 'Unassigned',
    semester: '1st Semester',
    grades: []
  };
}

export function getStudentRecordById(id) {
  const sample = sampleStudents.find((s) => s.id === id);
  if (sample) return sample;

  const enrollment = (loadDb()?.enrollments || []).find((e) => e.lrn === id);
  if (!enrollment) return null;
  return enrollmentToStudentRecord(enrollment);
}

export function getEnrollmentCounts(academicYear = getCurrentAcademicYear()) {
  const list = getEnrollments({ academicYear });
  const result = { pending: 0, approved: 0, rejected: 0, pending_admin: 0 };
  for (const e of list) {
    const s = deriveOverallStatus(e);
    if (s in result) result[s] += 1;
    else result.pending += 1;
  }
  const registrar = { pending: 0, approved: 0, rejected: 0 };
  for (const e of list) {
    const s = (e.registrarStatus || 'pending').toLowerCase();
    if (s in registrar) registrar[s] += 1;
  }
  return { overall: result, registrar };
}
