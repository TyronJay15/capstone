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
