/**
 * Teacher API — roster and assignments.
 */
import { api } from './apiClient';

export async function fetchTeacherRoster(academicYearLabel) {
  const qs = academicYearLabel
    ? `?academic_year_label=${encodeURIComponent(academicYearLabel)}`
    : '';
  const path = qs ? `/teachers/roster/${qs}` : '/teachers/roster/';
  const data = await api.get(path);
  return Array.isArray(data) ? data : [];
}

export async function fetchTeacherAssignments() {
  const data = await api.get('/teachers/assignments/');
  return Array.isArray(data) ? data : [];
}
