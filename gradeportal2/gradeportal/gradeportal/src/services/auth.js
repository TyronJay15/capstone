// src/services/auth.js
// Replaces the old localStorage-only fake auth.
// Login now calls Django JWT. Session is stored as JWT tokens + a user object.
// The enrollmentStore localStorage "database" is still used for the legacy
// dashboard UI until those components are migrated to real API calls.

import {
  loginStaff,
  loginStudent,
  loginParent,
  saveTokens,
  clearTokens,
  getAccessToken,
} from './api';
import { getStudentRecordById } from './enrollmentStore';

export const ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  REGISTRAR: 'registrar',
  ADMIN: 'admin',
  TEACHER: 'teacher',
};

export const ROLE_HOME_ROUTES = {
  [ROLES.STUDENT]: '/dashboard',
  [ROLES.PARENT]: '/dashboard',
  [ROLES.REGISTRAR]: '/registrar',
  [ROLES.ADMIN]: '/admin',
  [ROLES.TEACHER]: '/teacher',
};

// ─── Session helpers ─────────────────────────────────────────────────────────
// We keep the same keys the existing dashboards already read from so they
// keep working without any changes to RegistrarDashboard, AdminDashboard, etc.

export function getSession() {
  const raw = localStorage.getItem('gradeportal_user');
  try {
    const user = raw ? JSON.parse(raw) : null;
    const role = user?.role || localStorage.getItem('currentRole');
    const email = user?.email || localStorage.getItem('currentUserEmail') || '';
    let student = null;
    try {
      const s = localStorage.getItem('currentStudent');
      if (s) student = JSON.parse(s);
    } catch {
      student = null;
    }
    return { role, email, student, user };
  } catch {
    return { role: null, email: '', student: null, user: null };
  }
}

function saveSession({ user, student }) {
  localStorage.setItem('gradeportal_user', JSON.stringify(user));
  // Also keep the old keys so legacy dashboard components still work
  localStorage.setItem('currentRole', user.role);
  localStorage.setItem('currentUserEmail', user.email || '');
  if (student) {
    localStorage.setItem('currentStudent', JSON.stringify(student));
  } else {
    localStorage.removeItem('currentStudent');
  }
}

export function clearSession() {
  clearTokens();
  localStorage.removeItem('gradeportal_user');
  localStorage.removeItem('currentRole');
  localStorage.removeItem('currentUserEmail');
  localStorage.removeItem('currentStudent');
}

export function isAuthenticated() {
  return Boolean(getAccessToken() && getSession().role);
}

export function hasRole(allowedRoles = []) {
  return allowedRoles.includes(getSession().role);
}

// ─── Login ───────────────────────────────────────────────────────────────────
// Returns { ok, redirectTo } on success or { ok: false, error } on failure.
// Signature matches what Login.jsx already expects from the old authenticate().

export async function authenticate({ loginAs, identifier, password, childLrn }) {
  try {
    let data;

    if (loginAs === ROLES.STUDENT) {
      data = await loginStudent({ lrn: identifier, password });
    } else if (loginAs === ROLES.PARENT) {
      data = await loginParent({
        email: identifier,
        password,
        child_lrn: childLrn,
      });
    } else {
      // staff: admin, registrar, teacher
      data = await loginStaff({ email: identifier, password });
    }

    // Persist JWT tokens
    saveTokens({ access: data.access, refresh: data.refresh });

    // Build student record for dashboards that read localStorage.currentStudent
    let student = null;
    if (loginAs === ROLES.STUDENT) {
      // Try the local store first (seed data), fall back to the API user object
      student = getStudentRecordById(data.user.student_lrn) || {
        id: data.user.student_lrn,
        name: `${data.user.first_name} ${data.user.last_name}`.trim(),
        email: data.user.email,
        grade: '',
        section: '',
        semester: '1st Semester',
        grades: [],
      };
    } else if (loginAs === ROLES.PARENT && data.child_lrn) {
      student = getStudentRecordById(data.child_lrn) || { id: data.child_lrn };
    }

    saveSession({ user: data.user, student });

    return { ok: true, redirectTo: ROLE_HOME_ROUTES[data.user.role] };
  } catch (err) {
    return { ok: false, error: err.message || 'Login failed. Please try again.' };
  }
}

// ─── Legacy staff registration (kept for AdminDashboard "Add Staff" flow) ────
// This now calls the Django backend instead of writing to localStorage.
// The backend must have a POST /auth/register/ endpoint.
// If that endpoint doesn't exist yet, it falls back to localStorage so the
// UI doesn't break — and logs a warning so you know it's still pending.

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export async function registerStaffAccount({ fullName, email, role, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const allowed = [ROLES.ADMIN, ROLES.REGISTRAR, ROLES.TEACHER];
  const roleKey = String(role || '').trim().toLowerCase();

  if (!allowed.includes(roleKey)) {
    throw new Error('Only Admin, Registrar, or Teacher accounts can be created here.');
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        first_name: fullName.split(' ')[0] || fullName,
        last_name: fullName.split(' ').slice(1).join(' ') || '',
        role: roleKey,
        password,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.email?.[0] || 'Registration failed.');
    }

    return await res.json();
  } catch (err) {
    if (err.message && (err.message.includes('Failed to fetch') || err.status === 404)) {
      console.warn(
        '[auth] /auth/register/ not found on backend — falling back to localStorage. ' +
        'Implement POST /api/v1/auth/register/ to persist staff accounts.'
      );
      const STAFF_KEY = 'gradeportal_staff_accounts';
      const accounts = (() => {
        try { return JSON.parse(localStorage.getItem(STAFF_KEY)) || []; } catch { return []; }
      })();
      if (accounts.some((a) => a.email === normalizedEmail)) {
        throw new Error('An account with this email already exists.');
      }
      const newAccount = { fullName, email: normalizedEmail, role: roleKey, password };
      accounts.push(newAccount);
      localStorage.setItem(STAFF_KEY, JSON.stringify(accounts));
      return newAccount;
    }
    throw err;
  }
}