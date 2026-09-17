/**
 * Parent API — own profile and linked children.
 */
import { api } from './apiClient';

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

/** GET /api/v1/parents/me/ — the authenticated parent's own profile. */
export async function fetchParentProfile() {
  return api.get('/parents/me/', { auth: true });
}

/** PATCH /api/v1/parents/me/ — update contact-type fields only. */
export async function updateParentProfile(payload) {
  return api.patch('/parents/me/', payload, { auth: true });
}

/**
 * GET /api/v1/parents/children/ — students actually linked to this parent
 * via ParentStudentLink. This is the only source of truth for "which child
 * may this parent view" — never trust an LRN typed at login or cached
 * client-side for authorization purposes.
 */
export async function fetchLinkedChildren() {
  const data = await api.get('/parents/children/', { auth: true });
  return unwrapList(data);
}

/**
 * Full profile for one linked child (contact info, guardian, enrollment
 * status, section, academic year). Backed by the same StudentProfileViewSet
 * used by students/staff — already scoped server-side so a parent can only
 * ever retrieve a student actually linked to them, regardless of the lrn
 * passed here.
 */
export async function fetchChildProfile(lrn) {
  const data = await api.get(`/students/?lrn=${encodeURIComponent(lrn)}`, { auth: true });
  const list = unwrapList(data);
  return list[0] || null;
}
