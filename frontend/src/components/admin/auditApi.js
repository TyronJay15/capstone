/**
 * auditApi — categorized audit trail rows (Activity, User, Date, Module, Status).
 * Frontend-only demo data shaped for a future audit endpoint. Supports search,
 * category/status filtering and date ranges.
 */

export const CATEGORIES = [
  { id: 'all', label: 'All Activity', icon: '📋' },
  { id: 'student', label: 'Student Activity', icon: '🎓' },
  { id: 'parent', label: 'Parent Activity', icon: '👪' },
  { id: 'adviser', label: 'Adviser Activity', icon: '🧑‍🏫' },
  { id: 'teacher', label: 'Subject Teacher Activity', icon: '📚' },
  { id: 'head_teacher', label: 'Head Teacher Activity', icon: '🏛️' },
  { id: 'system', label: 'System Activity', icon: '⚙️' }
];

export const STATUSES = ['all', 'success', 'pending', 'failed'];

const ROWS = [
  { id: 'e1', category: 'student', activity: 'Signed in', user: 'Juan Dela Cruz', date: '2026-06-25', module: 'Authentication', status: 'success' },
  { id: 'e2', category: 'student', activity: 'Viewed grades', user: 'Juan Dela Cruz', date: '2026-06-25', module: 'Grades', status: 'success' },
  { id: 'e3', category: 'student', activity: 'Updated contact number', user: 'Bianca Cruz', date: '2026-06-24', module: 'Profile', status: 'success' },
  { id: 'e4', category: 'parent', activity: 'Signed in', user: 'Rosa Dela Cruz', date: '2026-06-25', module: 'Authentication', status: 'success' },
  { id: 'e5', category: 'parent', activity: 'Replied to notification', user: 'Rosa Dela Cruz', date: '2026-06-24', module: 'Notifications', status: 'success' },
  { id: 'e6', category: 'adviser', activity: 'Submitted grades', user: 'Maria Santos', date: '2026-06-23', module: 'Grade Encoding', status: 'pending' },
  { id: 'e7', category: 'adviser', activity: 'Notified parents', user: 'Maria Santos', date: '2026-06-22', module: 'Notifications', status: 'success' },
  { id: 'e8', category: 'teacher', activity: 'Encoded grade', user: 'Jose Rizal', date: '2026-06-25', module: 'Grade Encoding', status: 'success' },
  { id: 'e9', category: 'teacher', activity: 'Failed login attempt', user: 'unknown@dampol.edu.ph', date: '2026-06-21', module: 'Authentication', status: 'failed' },
  { id: 'e10', category: 'head_teacher', activity: 'Approved grade summary', user: 'Andres Bonifacio', date: '2026-06-24', module: 'Grade Validation', status: 'success' },
  { id: 'e11', category: 'head_teacher', activity: 'Assigned adviser', user: 'Andres Bonifacio', date: '2026-06-23', module: 'Assignments', status: 'success' },
  { id: 'e12', category: 'system', activity: 'Nightly backup completed', user: 'System', date: '2026-06-25', module: 'Maintenance', status: 'success' },
  { id: 'e13', category: 'system', activity: 'Forecast generation job', user: 'System', date: '2026-06-24', module: 'Forecasting', status: 'success' },
  { id: 'e14', category: 'system', activity: 'Email delivery error', user: 'System', date: '2026-06-22', module: 'Notifications', status: 'failed' }
];

export function getAuditRows({ category = 'all', status = 'all', search = '', from = '', to = '' } = {}) {
  const q = search.trim().toLowerCase();
  return ROWS.filter((r) => {
    if (category !== 'all' && r.category !== category) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    if (q) {
      const hay = `${r.activity} ${r.user} ${r.module}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getAuditSummary(rows) {
  return {
    total: rows.length,
    success: rows.filter((r) => r.status === 'success').length,
    pending: rows.filter((r) => r.status === 'pending').length,
    failed: rows.filter((r) => r.status === 'failed').length
  };
}
