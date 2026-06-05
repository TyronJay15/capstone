import { api, clearAuthTokens, getApiBaseUrl, setAccessToken, setRefreshToken } from './apiClient';
import { getStudentRecordById } from './enrollmentStore';
import { fetchStudentDashboard, loginParent, loginStudent } from './studentApi';

export const ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  REGISTRAR: 'registrar',
  ADMIN: 'admin',
  TEACHER: 'teacher'
};

export const ROLE_HOME_ROUTES = {
  [ROLES.STUDENT]: '/dashboard',
  [ROLES.PARENT]: '/dashboard',
  [ROLES.REGISTRAR]: '/registrar',
  [ROLES.ADMIN]: '/admin',
  [ROLES.TEACHER]: '/teacher'
};

const DEMO_PASSWORD = 'password123';

const STAFF_ACCOUNTS_KEY = 'gradeportal_staff_accounts';

const DEFAULT_STAFF = [
  { email: 'registrar@dampol.edu.ph', role: ROLES.REGISTRAR, password: DEMO_PASSWORD },
  { email: 'admin@dampol.edu.ph', role: ROLES.ADMIN, password: DEMO_PASSWORD },
  { email: 'teacher@dampol.edu.ph', role: ROLES.TEACHER, password: DEMO_PASSWORD },
  { email: 'parent@dampol.edu.ph', role: ROLES.PARENT, password: DEMO_PASSWORD }
];

function loadStaffAccounts() {
  try {
    const raw = localStorage.getItem(STAFF_ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(DEFAULT_STAFF));
  return DEFAULT_STAFF;
}

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

export function isAuthenticated() {
  return Boolean(getSession().role);
}

export function hasRole(allowedRoles = []) {
  const { role } = getSession();
  return allowedRoles.includes(role);
}

async function authenticateStaffWithJwt(email, password, loginAs) {
  if (!getApiBaseUrl()) return null;
  try {
    const data = await api.post('/auth/login/', { email, password }, { auth: false });
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    const user = data.user || {};
    if (user.role && user.role !== loginAs) {
      clearAuthTokens();
      return { ok: false, error: `Account is registered as ${user.role}, not ${loginAs}.` };
    }
    setSession({ role: loginAs, email: user.email || email, student: null });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[loginAs] };
  } catch (err) {
    return { ok: false, error: err.message || 'Invalid email or password.' };
  }
}

async function authenticateStudentWithJwt(lrn, password) {
  if (!getApiBaseUrl()) return null;
  try {
    const data = await loginStudent(lrn, password);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    const dashboard = await fetchStudentDashboard();
    setSession({
      role: ROLES.STUDENT,
      email: data.user?.email || lrn,
      student: dashboard
    });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[ROLES.STUDENT] };
  } catch (err) {
    return { ok: false, error: err.message || 'Invalid LRN or password.' };
  }
}

async function authenticateParentWithJwt(email, password, childLrn) {
  if (!getApiBaseUrl()) return null;
  try {
    const data = await loginParent(email, password, childLrn);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    const dashboard = await fetchStudentDashboard(childLrn);
    setSession({
      role: ROLES.PARENT,
      email: data.user?.email || email,
      childLrn,
      student: dashboard
    });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[ROLES.PARENT] };
  } catch (err) {
    return { ok: false, error: err.message || 'Invalid parent credentials or child LRN.' };
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

export async function authenticate({ loginAs, identifier, password, childLrn }) {
  const staffRoles = [ROLES.REGISTRAR, ROLES.ADMIN, ROLES.TEACHER, ROLES.PARENT];
  if (loginAs === ROLES.STUDENT && getApiBaseUrl()) {
    const jwtResult = await authenticateStudentWithJwt(
      String(identifier || '').trim(),
      password
    );
    if (jwtResult) return jwtResult;
  }

  if (loginAs === ROLES.PARENT && getApiBaseUrl()) {
    const email = String(identifier || '').trim().toLowerCase();
    const lrn = String(childLrn || '').trim();
    const jwtResult = await authenticateParentWithJwt(email, password, lrn);
    if (jwtResult) return jwtResult;
  }

  if (staffRoles.includes(loginAs) && getApiBaseUrl()) {
    const email = String(identifier || '').trim().toLowerCase();
    const jwtResult = await authenticateStaffWithJwt(email, password, loginAs);
    if (jwtResult) return jwtResult;
  }

  if (!password || password !== DEMO_PASSWORD) {
    return { ok: false, error: 'Invalid password.' };
  }

  if (loginAs === ROLES.STUDENT) {
    const student = getStudentRecordById(String(identifier || '').trim());
    if (!student) {
      return {
        ok: false,
        error: 'Invalid LRN or student account is not yet approved for portal access.'
      };
    }
    setSession({ role: ROLES.STUDENT, email: student.id, student });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[ROLES.STUDENT] };
  }

  if (loginAs === ROLES.PARENT) {
    const email = String(identifier || '').trim().toLowerCase();
    const lrn = String(childLrn || '').trim();
    const staffAccounts = loadStaffAccounts();
    const parentAccount = staffAccounts.find(
      (a) => a.email.toLowerCase() === email && a.role === ROLES.PARENT
    );
    if (!parentAccount) {
      return { ok: false, error: 'Parent account not found. Use parent@dampol.edu.ph for demo.' };
    }
    const student = getStudentRecordById(lrn);
    if (!student) {
      return {
        ok: false,
        error: 'Child LRN not found or not yet approved for portal access.'
      };
    }
    setSession({ role: ROLES.PARENT, email, childLrn: lrn, student });
    return { ok: true, redirectTo: ROLE_HOME_ROUTES[ROLES.PARENT] };
  }

  const email = String(identifier || '').trim().toLowerCase();
  const staffAccounts = loadStaffAccounts();
  const account = staffAccounts.find(
    (a) => a.email.toLowerCase() === email && a.role === loginAs
  );

  if (!account) {
    return {
      ok: false,
      error: `No ${loginAs} account found for this email. Use a registered staff email (e.g. ${loginAs}@dampol.edu.ph).`
    };
  }

  const linkedStudent = getStudentRecordById(identifier);
  setSession({
    role: loginAs,
    email: account.email,
    student: linkedStudent || null
  });

  return { ok: true, redirectTo: ROLE_HOME_ROUTES[loginAs] };
}

export async function fetchUserAccounts({ search = '', role = '' } = {}) {
  if (getApiBaseUrl()) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role && role !== 'all') params.set('role', role);
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await api.get(`/auth/users/${query}`, { auth: true });
    return unwrapList(data).map(mapUserAccount);
  }

  return loadStaffAccounts().map((account, idx) => ({
    id: `local-${idx}`,
    email: account.email,
    fullName: account.fullName || account.email,
    firstName: '',
    lastName: '',
    role: account.role,
    studentLrn: '',
    isActive: true,
    status: 'active',
    lastLogin: '',
    dateJoined: ''
  }));
}

export async function updateUserAccountStatus(id, isActive) {
  if (getApiBaseUrl()) {
    return mapUserAccount(await api.patch(`/auth/users/${id}/`, { is_active: isActive }, { auth: true }));
  }
  return null;
}

export async function deleteUserAccount(id) {
  if (getApiBaseUrl()) {
    await api.delete(`/auth/users/${id}/`, { auth: true });
  }
}

export async function registerStaffAccount({ fullName, email, role, password }) {
  const roleKey = String(role || '').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const allowed = [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.TEACHER, ROLES.PARENT];

  if (!allowed.includes(roleKey)) {
    throw new Error('Only Admin, Registrar, Teacher, or Parent accounts can be created here.');
  }

  if (getApiBaseUrl()) {
    const { firstName, lastName } = splitFullName(fullName);
    return mapUserAccount(await api.post('/auth/register/', {
      email: normalizedEmail,
      first_name: firstName,
      last_name: lastName,
      role: roleKey,
      password
    }, { auth: true }));
  }

  const accounts = loadStaffAccounts();

  if (accounts.some((a) => a.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  accounts.push({
    fullName,
    email: normalizedEmail,
    role: roleKey,
    password: password || DEMO_PASSWORD
  });

  localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(accounts));
  return accounts[accounts.length - 1];
}
