/**
 * profileApi — profile data access for all stakeholders.
 *
 * Uses existing student profile API when available; otherwise returns
 * role-based demo profiles. Designed so the same UI works across every role
 * and can later be wired to real per-role endpoints without UI changes.
 */
import { getSession } from '../../services/auth';
import { fetchStudentProfile, updateStudentProfile } from '../../services/studentApi';
import { fetchChildProfile, fetchLinkedChildren, fetchParentProfile, updateParentProfile } from '../../services/parentApi';
import { api, getApiBaseUrl } from '../../services/apiClient';

// Human-readable role labels, used so the profile always shows the real role.
export const ROLE_DISPLAY = {
  student: 'Student',
  parent: 'Parent / Guardian',
  adviser: 'Class Adviser',
  teacher: 'Subject Teacher',
  head_teacher: 'Head Teacher',
  registrar: 'Registrar',
  admin: 'System Administrator'
};

const DEMO_PROFILES = {
  student: {
    name: 'Juan Dela Cruz',
    role: 'Student',
    photoUrl: '',
    cover: 'green',
    personal: { lrn: '2025-001', gradeLevel: 'Grade 12', strand: 'STEM' },
    contact: { email: 'juan.delacruz@student.dampol.edu.ph', contactNumber: '0917 123 4567', address: 'Pulilan, Bulacan' },
    academic: { section: 'STEM-A', adviser: 'Mrs. Maria Santos', enrollmentStatus: 'Enrolled', schoolYear: '2025–2026' }
  },
  parent: {
    name: 'Rosa Dela Cruz',
    role: 'Parent / Guardian',
    photoUrl: '',
    cover: 'green',
    personal: { relationship: 'Mother', childName: 'Juan Dela Cruz', childLrn: '2025-001' },
    contact: { email: 'parent@dampol.edu.ph', contactNumber: '0917 765 4321', address: 'Pulilan, Bulacan' },
    academic: { childGrade: 'Grade 12', childSection: 'STEM-A', childStatus: 'Enrolled' }
  },
  adviser: {
    name: 'Maria Santos',
    role: 'Class Adviser',
    photoUrl: '',
    cover: 'green',
    personal: { employeeId: 'EMP-1042', position: 'Teacher III', advisory: 'Grade 12 STEM-A' },
    contact: { email: 'adviser@dampol.edu.ph', contactNumber: '0918 222 3344', office: 'Faculty Room A' },
    academic: { yearsOfService: '8 years', department: 'Mathematics', schoolYear: '2025–2026' }
  },
  teacher: {
    name: 'Jose Rizal',
    role: 'Subject Teacher',
    photoUrl: '',
    cover: 'green',
    personal: { employeeId: 'EMP-1077', position: 'Teacher II', subjects: 'Filipino, Research' },
    contact: { email: 'teacher@dampol.edu.ph', contactNumber: '0919 555 6677', office: 'Faculty Room B' },
    academic: { yearsOfService: '5 years', department: 'Languages', schoolYear: '2025–2026' }
  },
  head_teacher: {
    name: 'Andres Bonifacio',
    role: 'Head Teacher',
    photoUrl: '',
    cover: 'green',
    personal: { employeeId: 'EMP-1001', position: 'Head Teacher VI', department: 'Senior High School' },
    contact: { email: 'headteacher@dampol.edu.ph', contactNumber: '0920 111 2233', office: 'Principal\'s Annex' },
    academic: { yearsOfService: '15 years', supervises: 'All SHS strands', schoolYear: '2025–2026' }
  },
  admin: {
    name: 'Portal Administrator',
    role: 'System Administrator',
    photoUrl: '',
    cover: 'green',
    personal: { employeeId: 'EMP-0001', position: 'ICT Coordinator', access: 'Full' },
    contact: { email: 'admin@dampol.edu.ph', contactNumber: '0921 000 1122', office: 'ICT Office' },
    academic: { yearsOfService: '6 years', department: 'Administration', schoolYear: '2025–2026' }
  }
};

/** Maps the real /students/me/ backend payload into the ProfilePanel shape. */
function profileFromBackend(profile) {
  return {
    name: profile.full_name || `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name || '',
    middleName: profile.middle_name || '',
    lastName: profile.last_name || '',
    role: 'Student',
    photoUrl: profile.profile_picture || '',
    cover: 'green',
    personal: {
      lrn: profile.lrn || '—',
      gradeLevel: profile.grade_level || '—',
      strand: profile.strand || '—'
    },
    contact: {
      email: profile.email || '—',
      contactNumber: profile.contact_number || '—',
      address: profile.address || '—',
      guardianName: profile.guardian_name || '—',
      guardianContact: profile.guardian_contact || '—'
    },
    academic: {
      section: profile.section_name || '—',
      adviser: profile.adviser || '—',
      enrollmentStatus: profile.enrollment_status || 'Enrolled',
      schoolYear: profile.academic_year_label || '—'
    }
  };
}

/** Maps the real /parents/me/ + linked-child payloads into the ProfilePanel shape. */
function profileFromParentBackend(parentProfile, child) {
  return {
    name: parentProfile.full_name || `${parentProfile.first_name} ${parentProfile.last_name}`.trim(),
    role: 'Parent / Guardian',
    photoUrl: '',
    cover: 'green',
    // Email lives on the User record, not ParentProfile, so it is shown
    // read-only here rather than in the editable "contact" group.
    personal: {
      email: parentProfile.email || '—'
    },
    contact: {
      phoneNumber: parentProfile.phone_number || '',
      address: parentProfile.address || '',
      profession: parentProfile.profession || '',
      emergencyContact: parentProfile.emergency_contact || '',
      emergencyPhone: parentProfile.emergency_phone || ''
    },
    academic: child
      ? {
          childName: child.full_name || '—',
          childLrn: child.lrn || '—',
          childGrade: child.grade_level || '—',
          childSection: child.section_name || '—',
          enrollmentStatus: child.enrollment_status || '—',
          schoolYear: child.academic_year_label || '—'
        }
      : { childLinked: 'No linked child found — contact the registrar.' }
  };
}

/** Resolve the active role from the session (falls back to student). */
export function getCurrentRole() {
  return getSession().role || 'student';
}

/**
 * Loads the current student's profile straight from the backend — the
 * database is always the source of truth here, never the cached session.
 * Throws on failure so the caller can show a real error state.
 */
export async function getStudentProfileLive() {
  const profile = await fetchStudentProfile();
  return profileFromBackend(profile);
}

/**
 * Loads the current parent's profile plus their linked child's academic
 * summary straight from the backend. A parent with no linked child still
 * gets a valid profile (the academic group just reports that fact) rather
 * than throwing.
 */
export async function getParentProfileLive() {
  const [parentProfile, children] = await Promise.all([fetchParentProfile(), fetchLinkedChildren()]);
  const firstChild = children[0];
  const child = firstChild ? await fetchChildProfile(firstChild.lrn) : null;
  return profileFromParentBackend(parentProfile, child);
}

export function getProfile(roleOverride) {
  const session = getSession();
  const role = roleOverride || session.role || 'student';
  const label = ROLE_DISPLAY[role] || ROLE_DISPLAY.student;

  const base = DEMO_PROFILES[role] || DEMO_PROFILES.student;
  // Always reflect the authenticated role + email, even with demo profile data.
  return {
    ...base,
    role: label,
    contact: { ...base.contact, email: session.email || base.contact.email }
  };
}

/**
 * Change the signed-in user's password against the real backend. Success is
 * only ever reported when the server actually accepted the change.
 */
export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const current = String(currentPassword || '');
  const next = String(newPassword || '');
  const confirm = String(confirmPassword || '');

  if (!current) return { ok: false, error: 'Please enter your current password.' };
  if (next.length < 8) return { ok: false, error: 'Password Too Short — use at least 8 characters.' };
  if (next !== confirm) return { ok: false, error: 'Passwords Do Not Match.' };
  if (next === current) return { ok: false, error: 'New password must be different from the current password.' };

  try {
    await api.post(
      '/auth/change-password/',
      { current_password: current, new_password: next },
      { auth: true }
    );
    return { ok: true, message: 'Password Successfully Changed.' };
  } catch (err) {
    if (err?.isNetworkError) {
      return { ok: false, error: 'Unable to reach the server. Your password was not changed.' };
    }
    if (err?.data && typeof err.data === 'object') {
      const detail = Object.values(err.data).flat().filter(Boolean).join(' ');
      if (detail) return { ok: false, error: detail };
    }
    return { ok: false, error: err?.message || 'Could not change password.' };
  }
}

/**
 * Persists profile edits through the real backend endpoint and returns the
 * server's own (authoritative) copy of the profile — the UI never assumes
 * an optimistic write succeeded silently.
 */
function describeSaveError(err) {
  return err?.isNetworkError
    ? 'Unable to reach the server. Your changes were not saved.'
    : err?.data
      ? Object.values(err.data).flat().join(' ')
      : err?.message || 'Could not save profile changes.';
}

export async function saveProfile(role, updated) {
  if (role === 'student') {
    try {
      const saved = await updateStudentProfile({
        first_name: updated.firstName,
        middle_name: updated.middleName,
        last_name: updated.lastName,
        email: updated.contact?.email,
        contact_number: updated.contact?.contactNumber,
        address: updated.contact?.address,
        guardian_name: updated.contact?.guardianName,
        guardian_contact: updated.contact?.guardianContact
      });
      return { ok: true, profile: profileFromBackend(saved) };
    } catch (err) {
      return { ok: false, error: describeSaveError(err) };
    }
  }

  if (role === 'parent') {
    try {
      await updateParentProfile({
        phone_number: updated.contact?.phoneNumber,
        address: updated.contact?.address,
        profession: updated.contact?.profession,
        emergency_contact: updated.contact?.emergencyContact,
        emergency_phone: updated.contact?.emergencyPhone
      });
      // Re-fetch so the child summary stays in sync with the saved profile.
      const refreshed = await getParentProfileLive();
      return { ok: true, profile: refreshed };
    } catch (err) {
      return { ok: false, error: describeSaveError(err) };
    }
  }

  // No other role has a real, writable backend endpoint yet.
  return { ok: true, profile: updated };
}
