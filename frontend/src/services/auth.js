import { api, clearAuthTokens, getApiBaseUrl, setAccessToken, setRefreshToken } from './apiClient';
import { fetchStudentDashboard, loginParent, loginStudent } from './studentApi';

export const ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  REGISTRAR: 'registrar',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  ADVISER: 'adviser',
  HEAD_TEACHER: 'head_teacher'
};

export const ROLE_HOME_ROUTES = {
  [ROLES.STUDENT]: '/dashboard',
  [ROLES.PARENT]: '/parent',
  [ROLES.REGISTRAR]: '/registrar',
  [ROLES.ADMIN]: '/admin',
  [ROLES.TEACHER]: '/teacher',
  [ROLES.ADVISER]: '/adviser',
  [ROLES.HEAD_TEACHER]: '/head-teacher'
};

// Human-readable labels for the login account-type selector.
export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.PARENT]: 'Parent',
  [ROLES.ADVISER]: 'Adviser',
  [ROLES.TEACHER]: 'Subject Teacher',
  [ROLES.HEAD_TEACHER]: 'Head Teacher',
  [ROLES.ADMIN]: 'Admin'
};

function splitFullName(fullName = '') {
  const parts = String(fullName).trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1]
  };
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function mapUserAccount(row) {
  const fullName = row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email;
  return {
    id: row.id,
    email: row.email,
    fullName,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    role: row.role,
    studentLrn: row.student_lrn || '',
    isActive: Boolean(row.is_active),
    status: row.status || (row.is_active ? 'active' : 'inactive'),
    lastLogin: row.last_login || '',
    dateJoined: row.date_joined || ''
  };
}

export function getSession() {
  const role = localStorage.getItem('currentRole');
  const email = localStorage.getItem('currentUserEmail') || '';
  const childLrn = localStorage.getItem('childLrn') || '';
  let student = null;
  try {
    const raw = localStorage.getItem('currentStudent');
    if (raw) student = JSON.parse(raw);
  } catch {
    student = null;
  }
  return { role, email, student, childLrn };
}

export function setSession({ role, email, student, childLrn }) {
  localStorage.setItem('currentRole', role);
  localStorage.setItem('currentUserEmail', email || '');
  if (childLrn) {
    localStorage.setItem('childLrn', childLrn);
  } else {
    localStorage.removeItem('childLrn');
  }
  if (student) {
    localStorage.setItem('currentStudent', JSON.stringify(student));
  } else {
    localStorage.removeItem('currentStudent');
  }
}

export function clearSession() {
  localStorage.removeItem('currentRole');
  localStorage.removeItem('currentUserEmail');
  localStorage.removeItem('currentStudent');
  localStorage.removeItem('childLrn');
  clearAuthTokens();
}

/**
 * Logs the user out: asks the backend to blacklist the current refresh
 * token (so it can't be replayed even if a copy leaked) and always clears
 * local session state regardless of whether that call succeeds.
 */
export async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken && getApiBaseUrl()) {
    try {
      await api.post('/auth/logout/', { refresh: refreshToken }, { auth: true });
    } catch {
      // Token may already be expired/invalid — local cleanup still proceeds.
    }
  }
  clearSession();
}

export function isAuthenticated() {
  return Boolean(getSession().role);
}

export function hasRole(allowedRoles = []) {
  const { role } = getSession();
  return allowedRoles.includes(role);
}

/**
 * Turns a thrown apiClient error into a user-facing message without leaking
 * whether a specific account exists (invalid credentials always read the
 * same regardless of email/LRN vs password being wrong).
 */
function describeAuthError(err, fallbackMessage) {
  if (err?.isNetworkError) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  if (err?.status >= 500) {
    return 'Server error. Please try again in a moment.';
  }
  if (err?.status === 400 || err?.status === 401) {
    return fallbackMessage;
  }
  return err?.message || fallbackMessage;
}

async function authenticateStaffWithJwt(email, password, loginAs) {
  try {
    const data = await api.post('/auth/login/', { email, password }, { auth: false });
    const user = data.user || {};
    if (user.role && user.role !== loginAs) {
      return { ok: false, error: 'Invalid email or password.' };
    }
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    setSession({ role: loginAs, email: user.email || email, student: null });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[loginAs] };
  } catch (err) {
    return { ok: false, error: describeAuthError(err, 'Invalid email or password.') };
  }
}

async function authenticateStudentWithJwt(lrn, password) {
  try {
    const data = await loginStudent(lrn, password);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    let dashboard = null;
    try {
      dashboard = await fetchStudentDashboard();
    } catch {
      dashboard = null;
    }
    setSession({
      role: ROLES.STUDENT,
      email: data.user?.email || lrn,
      student: dashboard
    });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[ROLES.STUDENT] };
  } catch (err) {
    return { ok: false, error: describeAuthError(err, 'Invalid LRN or password.') };
  }
}

async function authenticateParentWithJwt(email, password, childLrn) {
  try {
    const data = await loginParent(email, password, childLrn);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    let dashboard = null;
    try {
      dashboard = await fetchStudentDashboard(childLrn);
    } catch {
      dashboard = null;
    }
    setSession({
      role: ROLES.PARENT,
      email: data.user?.email || email,
      childLrn,
      student: dashboard
    });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[ROLES.PARENT] };
  } catch (err) {
    return { ok: false, error: describeAuthError(err, 'Invalid parent credentials or child LRN.') };
  }
}

/**
 * Reload student dashboard from API (after login or refresh).
 */
export async function refreshStudentSession() {
  const { role, childLrn } = getSession();
  if (!getApiBaseUrl() || !localStorage.getItem('accessToken')) return null;
  const lrn = role === ROLES.PARENT ? childLrn : undefined;
  const dashboard = await fetchStudentDashboard(lrn);
  setSession({ role, email: getSession().email, childLrn, student: dashboard });
  return dashboard;
}

// Roles that authenticate via the shared email+password endpoint
// (StudentTokenObtainPairSerializer and ParentTokenObtainPairSerializer
// handle student/parent separately since they take different fields).
const STAFF_JWT_ROLES = [
  ROLES.REGISTRAR,
  ROLES.ADMIN,
  ROLES.TEACHER,
  ROLES.ADVISER,
  ROLES.HEAD_TEACHER
];

/**
 * Authenticates against the real Django backend only. There is no offline
 * or demo fallback — an unreachable API or unseeded account both surface as
 * a clear, real error rather than granting a fake local session.
 */
export async function authenticate({ loginAs, identifier, password, childLrn }) {
  if (loginAs === ROLES.STUDENT) {
    return authenticateStudentWithJwt(String(identifier || '').trim(), password);
  }

  if (loginAs === ROLES.PARENT) {
    const email = String(identifier || '').trim().toLowerCase();
    const lrn = String(childLrn || '').trim();
    return authenticateParentWithJwt(email, password, lrn);
  }

  if (STAFF_JWT_ROLES.includes(loginAs)) {
    const email = String(identifier || '').trim().toLowerCase();
    return authenticateStaffWithJwt(email, password, loginAs);
  }

  return { ok: false, error: 'Unknown account type selected.' };
}

/**
 * Loads the full account directory from the backend. The endpoint is
 * paginated server-side, so every page is walked — otherwise roles that sort
 * last (teachers, ordered after students) would silently disappear from the
 * admin user-management table once the school passes one page of accounts.
 */
export async function fetchUserAccounts({ search = '', role = '' } = {}) {
  const collected = [];
  let page = 1;

  for (;;) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role && role !== 'all') params.set('role', role);
    params.set('page_size', '100');
    params.set('page', String(page));

    const data = await api.get(`/auth/users/?${params.toString()}`, { auth: true });
    const rows = unwrapList(data);
    collected.push(...rows);

    const total = typeof data?.count === 'number' ? data.count : collected.length;
    if (rows.length === 0 || collected.length >= total) break;
    page += 1;
  }

  return collected.map(mapUserAccount);
}

export async function updateUserAccountStatus(id, isActive) {
  return mapUserAccount(await api.patch(`/auth/users/${id}/`, { is_active: isActive }, { auth: true }));
}

export async function deleteUserAccount(id) {
  await api.delete(`/auth/users/${id}/`, { auth: true });
}

export async function registerStaffAccount({ fullName, email, role, password }) {
  const roleKey = String(role || '').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const allowed = [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.TEACHER, ROLES.PARENT];

  if (!allowed.includes(roleKey)) {
    throw new Error('Only Admin, Registrar, Teacher, or Parent accounts can be created here.');
  }

  const { firstName, lastName } = splitFullName(fullName);
  return mapUserAccount(await api.post('/auth/register/', {
    email: normalizedEmail,
    first_name: firstName,
    last_name: lastName,
    role: roleKey,
    password
  }, { auth: true }));
}
