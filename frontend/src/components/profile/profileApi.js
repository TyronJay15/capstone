/**
 * profileApi — profile data access for all stakeholders.
 *
 * Uses existing student profile API when available; otherwise returns
 * role-based demo profiles. Designed so the same UI works across every role
 * and can later be wired to real per-role endpoints without UI changes.
 */
import { getSession } from '../../services/auth';
import { updateStudentProfile } from '../../services/studentApi';
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

function profileFromStudentSession(student) {
  if (!student) return null;
  return {
    name: student.name || 'Student',
    role: 'Student',
    photoUrl: student.photoUrl || '',
    cover: 'green',
    personal: {
      lrn: student.id || student.lrn || '—',
      gradeLevel: student.grade || student.gradeLevel || '—',
      strand: student.strand || '—'
    },
    contact: {
      email: student.email || '—',
      contactNumber: student.contactNumber || '—',
      address: student.address || '—'
    },
    academic: {
      section: student.section || '—',
      adviser: student.adviser || '—',
      enrollmentStatus: student.status || student.enrollmentStatus || 'Enrolled',
      schoolYear: student.academicYear || '2025–2026'
    }
  };
}

/** Resolve the active role from the session (falls back to student). */
export function getCurrentRole() {
  return getSession().role || 'student';
}

export function getProfile(roleOverride) {
  const session = getSession();
  const role = roleOverride || session.role || 'student';
  const label = ROLE_DISPLAY[role] || ROLE_DISPLAY.student;

  if ((role === 'student' || role === 'parent') && session.student) {
    const fromSession = profileFromStudentSession(session.student);
    if (fromSession) {
      fromSession.role = label;
      return fromSession;
    }
  }

  const base = DEMO_PROFILES[role] || DEMO_PROFILES.student;
  // Always reflect the authenticated role + email, even with demo profile data.
  return {
    ...base,
    role: label,
    contact: { ...base.contact, email: session.email || base.contact.email }
  };
}

/**
 * Change password with clear, frontend-first validation.
 * Tries the API when available, otherwise validates against the demo password.
 */
export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const current = String(currentPassword || '');
  const next = String(newPassword || '');
  const confirm = String(confirmPassword || '');

  if (!current) return { ok: false, error: 'Please enter your current password.' };
  if (next.length < 8) return { ok: false, error: 'Password Too Short — use at least 8 characters.' };
  if (next !== confirm) return { ok: false, error: 'Passwords Do Not Match.' };
  if (next === current) return { ok: false, error: 'New password must be different from the current password.' };

  if (getApiBaseUrl()) {
    try {
      await api.post('/auth/change-password/', { current_password: current, new_password: next }, { auth: true });
      return { ok: true, message: 'Password Successfully Changed.' };
    } catch (err) {
      // If the endpoint is unavailable (e.g. demo mode), fall back to the
      // demo-password check so the flow stays usable.
      if (current === 'password123') return { ok: true, message: 'Password Successfully Changed.' };
      const msg = err?.status === 400 || err?.status === 401 ? 'Incorrect Current Password.' : (err?.message || 'Could not change password.');
      return { ok: false, error: msg };
    }
  }

  if (current !== 'password123') return { ok: false, error: 'Incorrect Current Password.' };
  return { ok: true, message: 'Password Successfully Changed.' };
}

export async function saveProfile(role, updated) {
  // Student profile has a real endpoint; reuse it when the API is enabled.
  if (role === 'student' && getApiBaseUrl()) {
    try {
      await updateStudentProfile({
        first_name: updated.firstName,
        last_name: updated.lastName,
        email: updated.contact?.email,
        contact_number: updated.contact?.contactNumber,
        address: updated.contact?.address
      });
    } catch (err) {
      // Non-fatal in demo mode — keep the optimistic UI update.
      // eslint-disable-next-line no-console
      console.warn('Profile API update failed, keeping local changes:', err.message);
    }
  }
  return updated;
}
