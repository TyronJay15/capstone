/**
 * Enrollment API — Django REST Framework (/api/v1/enrollment/)
 */
import { api, getApiBaseUrl } from './apiClient';

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function mapEnrollment(row) {
  return {
    id: row.id,
    lrn: row.lrn,
    firstName: row.first_name,
    middleName: row.middle_name || '',
    lastName: row.last_name,
    fullName: row.full_name,
    previousSchool: row.previous_school || '',
    gradeLevelEnrollment: row.grade_level_enrollment,
    gradeLevelCurrent: row.grade_level_current || '',
    academicYear: row.academic_year_label || row.academic_year,
    academicYearId: row.academic_year,
    section: row.section_name || 'Unassigned',
    sectionId: row.section,
    registrarStatus: row.registrar_status,
    adminStatus: row.admin_status,
    status: row.status,
    submittedInfo: row.submitted_info || '',
    submittedAt: row.submitted_at,
    parentConsent: Boolean(row.parent_consent),
    parentConsentBy: row.parent_consent_by || '',
    parentConsentAt: row.parent_consent_at || '',
    birthdate: row.birthdate,
    age: row.age,
    gender: row.gender,
    address: row.address,
    contactNumber: row.contact_number,
    schoolName: row.school_name
  };
}

function mapRegistrarRequest(row) {
  return {
    id: row.id,
    lrn: row.lrn,
    name: row.name,
    previousSchool: row.previous_school || '—',
    gradeLevel: row.grade_level,
    status: row.status,
    adminStatus: row.admin_status,
    overallStatus: row.overall_status,
    academicYear: row.academic_year,
    section: row.section || 'Unassigned',
    submittedInfo: row.submitted_info || 'Enrollment application',
    submittedAt: row.submitted_at
  };
}

function mapSectionAssignment(row) {
  return {
    id: row.id,
    lrn: row.lrn,
    name: row.name,
    gradeLevel: row.grade_level,
    section: row.section || 'Unassigned'
  };
}

export function isEnrollmentApiEnabled() {
  return Boolean(getApiBaseUrl());
}

export async function fetchAcademicYears() {
  const data = await api.get('/enrollment/academic-years/', { auth: false });
  return unwrapList(data);
}

export async function fetchCurrentAcademicYear() {
  const data = await api.get('/enrollment/current-academic-year/', { auth: false });
  return data;
}

export async function setCurrentAcademicYear(label) {
  return api.put('/enrollment/current-academic-year/', { label }, { auth: true });
}

export async function fetchEnrollments({ academicYearLabel } = {}) {
  const query = academicYearLabel
    ? `?academic_year_label=${encodeURIComponent(academicYearLabel)}`
    : '';
  const data = await api.get(`/enrollment/${query}`, { auth: true });
  return unwrapList(data).map(mapEnrollment);
}

export async function fetchRegistrarRequests(academicYearLabel) {
  const query = academicYearLabel
    ? `?academic_year_label=${encodeURIComponent(academicYearLabel)}`
    : '';
  const data = await api.get(`/enrollment/registrar-requests/${query}`, { auth: true });
  return unwrapList(data).map(mapRegistrarRequest);
}

export async function fetchSectionAssignments(academicYearLabel) {
  const query = academicYearLabel
    ? `?academic_year_label=${encodeURIComponent(academicYearLabel)}`
    : '';
  const data = await api.get(`/enrollment/section-assignments/${query}`, { auth: true });
  return unwrapList(data).map(mapSectionAssignment);
}

export async function fetchEnrollmentCounts(academicYearLabel) {
  const query = academicYearLabel
    ? `?academic_year_label=${encodeURIComponent(academicYearLabel)}`
    : '';
  return api.get(`/enrollment/counts/${query}`, { auth: true });
}

export async function createEnrollment(payload) {
  console.log('[EnrollmentAPI] createEnrollment called with:', payload);
  
  try {
    console.log('[EnrollmentAPI] Fetching academic years...');
    const years = await fetchAcademicYears();
    console.log('[EnrollmentAPI] Academic years available:', years);
    
    const yearLabel = payload.academicYear || payload.academic_year;
    const year = years.find((y) => y.label === yearLabel);
    if (!year) {
      throw new Error('Invalid academic year selected.');
    }
    console.log('[EnrollmentAPI] Selected year:', year);

    const body = {
      lrn: payload.lrn,
      first_name: payload.firstName,
      middle_name: payload.middleName || '',
      last_name: payload.lastName,
      academic_year: year.id,
      previous_school: payload.previousSchool || '',
      grade_level_enrollment: payload.gradeLevelEnrollment,
      grade_level_current: payload.gradeLevelCurrent || '',
      birthdate: payload.birthdate || null,
      age: payload.age || null,
      gender: payload.gender || '',
      address: payload.address || '',
      contact_number: payload.contactNumber || '',
      school_name: payload.schoolName || '',
      submitted_info: payload.submittedInfo || 'Online admission registration form'
    };

    console.log('[EnrollmentAPI] Posting enrollment:', body);
    const data = await api.post('/enrollment/', body, { auth: false });
    console.log('[EnrollmentAPI] ✅ Enrollment created:', data);
    // Don't refresh the full store for unauthenticated users (signup); just return the created enrollment
    return mapEnrollment(data);
  } catch (err) {
    console.error('[EnrollmentAPI] ❌ Error:', err);
    throw err;
  }
}

export async function updateRegistrarStatus(id, registrarStatus) {
  const data = await api.post(
    `/enrollment/${id}/registrar-status/`,
    { status: registrarStatus },
    { auth: true }
  );
  return mapEnrollment(data);
}

export async function updateAdminStatus(id, adminStatus) {
  const data = await api.post(
    `/enrollment/${id}/admin-status/`,
    { status: adminStatus },
    { auth: true }
  );
  return mapEnrollment(data);
}

export async function saveSectionAssignments(assignments, academicYearLabel) {
  return api.post(
    '/enrollment/bulk-section-assignments/',
    {
      academic_year_label: academicYearLabel,
      assignments: assignments.map((row) => ({
        id: row.id,
        lrn: row.lrn,
        section: row.section
      }))
    },
    { auth: true }
  );
}

export async function setParentConsent(lrn, granted, parentName = '') {
  const data = await api.post(
    '/enrollment/parent-consent/',
    { lrn, granted, parent_name: parentName },
    { auth: true }
  );
  return mapEnrollment(data);
}
