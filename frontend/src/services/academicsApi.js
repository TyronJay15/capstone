/**
 * Academics API — grades, subjects, terms.
 */
import { api } from './apiClient';

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function listGrades(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const qs = search.toString();
  const suffix = qs ? `?${qs}` : '';
  const data = await api.get(`/academics/grades/${suffix}`);
  return unwrapList(data);
}

export async function createGrade(payload) {
  return api.post('/academics/grades/', payload);
}

export async function updateGrade(id, payload) {
  return api.patch(`/academics/grades/${id}/`, payload);
}

export async function deleteGrade(id) {
  return api.delete(`/academics/grades/${id}/`);
}

export async function bulkEncodeGrades({ term, entries }) {
  return api.post('/academics/grades/bulk/', { term, entries });
}

export async function fetchStudentGradesForTeacher(lrn) {
  return api.get(`/academics/grades/by-student/?lrn=${encodeURIComponent(lrn)}`);
}

export async function listSubjects() {
  const data = await api.get('/academics/subjects/');
  return unwrapList(data);
}

export async function listTerms(academicYearId) {
  const qs = academicYearId ? `?academic_year=${academicYearId}` : '';
  const data = await api.get(`/academics/terms/${qs}`);
  return unwrapList(data);
}
