/**
 * Admin API — account statistics and login activity.
 * Both endpoints are backed by real database aggregates; nothing here is
 * computed or faked client-side.
 */
import { api } from './apiClient';

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

/**
 * GET /api/v1/auth/statistics/
 * Admin + registrar only (enforced server-side).
 */
export async function fetchUserStatistics() {
  const data = await api.get('/auth/statistics/', { auth: true });
  const byRole = data?.by_role || {};
  const totals = data?.totals || {};

  return {
    totalUsers: totals.users ?? 0,
    activeUsers: totals.active ?? 0,
    inactiveUsers: totals.inactive ?? 0,
    students: byRole.student ?? 0,
    teachers: byRole.teacher ?? 0,
    parents: byRole.parent ?? 0,
    registrars: byRole.registrar ?? 0,
    admins: byRole.admin ?? 0,
    advisers: byRole.adviser ?? 0,
    headTeachers: byRole.head_teacher ?? 0,
    activeByRole: data?.active_by_role || {},
    loginsLast7Days: data?.logins_last_7_days ?? 0,
    generatedAt: data?.generated_at || ''
  };
}

/**
 * GET /api/v1/auth/login-activity/
 * Admin only (enforced server-side). `role` filters to a single role.
 */
export async function fetchLoginActivity({ role = '', search = '', pageSize = 50 } = {}) {
  const params = new URLSearchParams();
  if (role && role !== 'all') params.set('role', role);
  if (search) params.set('search', search);
  params.set('page_size', String(pageSize));

  const data = await api.get(`/auth/login-activity/?${params.toString()}`, { auth: true });
  return unwrapList(data).map((row) => ({
    id: row.id,
    role: row.role,
    email: row.email,
    fullName: row.full_name,
    displayName: row.display_name,
    studentLrn: row.student_lrn || '',
    ipAddress: row.ip_address || '',
    loggedInAt: row.logged_in_at
  }));
}
