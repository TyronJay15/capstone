import { getStudentRecordById } from './enrollmentStore';

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

export function getSession() {
  const role = localStorage.getItem('currentRole');
  const email = localStorage.getItem('currentUserEmail') || '';
  let student = null;
  try {
    const raw = localStorage.getItem('currentStudent');
    if (raw) student = JSON.parse(raw);
  } catch {
    student = null;
  }
  return { role, email, student };
}

export function setSession({ role, email, student }) {
  localStorage.setItem('currentRole', role);
  localStorage.setItem('currentUserEmail', email || '');
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
}

export function isAuthenticated() {
  return Boolean(getSession().role);
}

export function hasRole(allowedRoles = []) {
  const { role } = getSession();
  return allowedRoles.includes(role);
}

export function authenticate({ loginAs, identifier, password, childLrn }) {
  if (!password || password !== DEMO_PASSWORD) {
    return { ok: false, error: 'Invalid password.' };
  }

  if (loginAs === ROLES.STUDENT) {
    const student = getStudentRecordById(String(identifier || '').trim());
    if (!student) {
      return { ok: false, error: 'Invalid LRN or student account is not yet approved for portal access.' };
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
      return { ok: false, error: 'Child LRN not found or not yet approved for portal access.' };
    }
    setSession({ role: ROLES.PARENT, email, student });
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

export function registerStaffAccount({ fullName, email, role, password }) {
  const accounts = loadStaffAccounts();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (accounts.some((a) => a.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const roleKey = String(role || '').trim().toLowerCase();
  const allowed = [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.TEACHER];
  if (!allowed.includes(roleKey)) {
    throw new Error('Only Admin, Registrar, or Teacher accounts can be created here.');
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
