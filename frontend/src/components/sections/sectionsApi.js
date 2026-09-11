/**
 * sectionsApi — section + roster access for adviser / subject teacher views.
 * Wraps the shared grades demo data so sections and students stay consistent.
 */
import { getSections as gradesSections, getStudents as gradesStudents, SUBJECTS } from '../grades/gradesApi';

export function getSections() {
  return gradesSections();
}

export function getSectionStudents(sectionId, { subject } = {}) {
  return gradesStudents(sectionId).map((s) => ({
    ...s,
    assignedSubject: subject || SUBJECTS[(s.id.charCodeAt(s.id.length - 1) || 0) % SUBJECTS.length]
  }));
}

export const ENROLLMENT_STATUSES = ['Enrolled', 'In Progress', 'Not Enrolled'];
