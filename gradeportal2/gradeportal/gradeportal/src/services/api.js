

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}

export function saveTokens({ access, refresh }) {
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Try to refresh once on 401
  if (res.status === 401 && getRefreshToken() && !options._retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, { ...options, _retried: true });
    }
  }

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { detail: `HTTP ${res.status}` };
    }
    const error = new Error(
      errorData.detail ||
      errorData.non_field_errors?.[0] ||
      JSON.stringify(errorData)
    );
    error.status = res.status;
    error.data = errorData;
    throw error;
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ─── Auth endpoints ──────────────────────────────────────────────────────────

// Staff / admin / registrar / teacher login (email + password)
export async function loginStaff({ email, password }) {
  return apiFetch('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Student login (LRN + password)
export async function loginStudent({ lrn, password }) {
  return apiFetch('/auth/login/student/', {
    method: 'POST',
    body: JSON.stringify({ lrn, password }),
  });
}

// Parent login (email + password + child_lrn)
export async function loginParent({ email, password, child_lrn }) {
  return apiFetch('/auth/login/parent/', {
    method: 'POST',
    body: JSON.stringify({ email, password, child_lrn }),
  });
}

// ─── Enrollment / signup endpoint ────────────────────────────────────────────

// POST /enrollment/ — no auth required (AllowAny on the backend)
export async function submitEnrollment(formData) {
  return apiFetch('/enrollment/', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

// GET /enrollment/academic-year/current/ — get the current academic year id
export async function getCurrentAcademicYear() {
  return apiFetch('/enrollment/academic-year/current/');
}

// GET /enrollment/sections/?academic_year=<id>
export async function getSections(academicYearId) {
  return apiFetch(`/enrollment/sections/?academic_year=${academicYearId}`);
}

// ─── Enrollment management (staff only) ─────────────────────────────────────

export async function getEnrollments(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/enrollment/${qs ? '?' + qs : ''}`);
}

export async function updateEnrollmentStatus(id, patch) {
  return apiFetch(`/enrollment/${id}/status/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function assignSection(id, sectionId) {
  return apiFetch(`/enrollment/${id}/assign-section/`, {
    method: 'PATCH',
    body: JSON.stringify({ section: sectionId }),
  });
}

export async function setParentConsent(id, { granted, parent_name }) {
  return apiFetch(`/enrollment/${id}/parent-consent/`, {
    method: 'POST',
    body: JSON.stringify({ granted, parent_name }),
  });
}

// ─── Grades (teacher / registrar / admin) ────────────────────────────────────

export async function getGrades(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/grades/${qs ? '?' + qs : ''}`);
}

export async function bulkSaveGrades(grades) {
  return apiFetch('/grades/bulk/', {
    method: 'POST',
    body: JSON.stringify({ grades }),
  });
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getMyStudentProfile() {
  return apiFetch('/students/me/');
}

export async function getStudents(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/students/${qs ? '?' + qs : ''}`);
}

// ─── Teacher roster ──────────────────────────────────────────────────────────

export async function getTeacherRoster(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/teachers/roster/${qs ? '?' + qs : ''}`);
}

export async function getTeacherAssignments() {
  return apiFetch('/teachers/assignments/');
}