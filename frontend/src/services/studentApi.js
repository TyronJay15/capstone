/**
 * Student dashboard and grades API.
 */
import { api } from './apiClient';

export async function fetchStudentDashboard(childLrn) {
  const query = childLrn ? `?lrn=${encodeURIComponent(childLrn)}` : '';
  return api.get(`/students/dashboard/${query}`);
}

export async function loginStudent(lrn, password) {
  return api.post('/auth/login/student/', { lrn, password }, { auth: false });
}

export async function loginParent(email, password, childLrn) {
  return api.post(
    '/auth/login/parent/',
    { email, password, child_lrn: childLrn },
    { auth: false }
  );
}

/**
 * GET /api/v1/students/me/
 * Fetch current student's profile (JWT authenticated).
 */
export async function fetchStudentProfile() {
  return api.get('/students/me/', { auth: true });
}

/**
 * PATCH /api/v1/students/me/
 * Update current student's profile (JWT authenticated).
 * Fields: first_name, middle_name, last_name, email, contact_number, address, profile_picture
 */
export async function updateStudentProfile(profileData) {
  return api.patch('/students/me/', profileData, { auth: true });
}

/**
 * Normalizes the /students/me/ profile payload and the /students/dashboard/
 * payload into a single flat shape the Student Dashboard renders. Both
 * endpoints are the source of truth — no localStorage fallback.
 */
export function mapStudentBundle({ profile, dashboard }) {
  const grades = dashboard?.grades || [];
  return {
    // Identity
    lrn: profile?.lrn || dashboard?.id || '',
    id: profile?.lrn || dashboard?.id || '',
    firstName: profile?.first_name || '',
    middleName: profile?.middle_name || '',
    lastName: profile?.last_name || '',
    name: profile?.full_name || dashboard?.name || '',
    email: profile?.email || dashboard?.email || '',
    contactNumber: profile?.contact_number || '',
    address: profile?.address || '',
    profilePicture: profile?.profile_picture || '',
    guardianName: profile?.guardian_name || '',
    guardianContact: profile?.guardian_contact || '',

    // Academic
    grade: profile?.grade_level || dashboard?.grade || '',
    section: profile?.section_name || dashboard?.section || '',
    strand: profile?.strand || '',
    adviser: profile?.adviser || '',
    academicYear: profile?.academic_year_label || '',
    term: dashboard?.term || '',
    grades,

    // Enrollment
    enrollmentStatus: profile?.enrollment_status || '',
    isActive: profile?.is_active ?? true,
    status: profile?.enrollment_status || ''
  };
}

/**
 * GET /api/v1/students/
 * Fetch all student profiles (admin only).
 */
export async function fetchStudentProfiles(filters = {}) {
  const params = new URLSearchParams();
  if (filters.academicYear) {
    params.append('academic_year', filters.academicYear);
  }
  if (filters.gradeLevel) {
    params.append('grade_level', filters.gradeLevel);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get(`/students/${query}`, { auth: true });
}
