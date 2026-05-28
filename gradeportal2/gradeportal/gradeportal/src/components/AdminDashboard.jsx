import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import FlashBanner from './ui/FlashBanner';
import { downloadMockPdf, parseCsvText } from '../utils/mockDownloads';
import { clearSession, registerStaffAccount } from '../services/auth';
import {
  ACADEMIC_YEARS,
  SECTION_OPTIONS,
  getAdminIncomingStudents,
  getAdminStudentRoster,
  getCurrentAcademicYear,
  getEnrollmentCounts,
  getSectionAssignments,
  saveSectionAssignments,
  setCurrentAcademicYear,
  setParentConsent,
  subscribeEnrollmentStore,
  updateAdminStatus
} from '../services/enrollmentStore';
import CmsManager from './cms/CmsManager';
import EnrollmentForecasting from './forecasting/EnrollmentForecasting';
import { getRecommendationHistory } from '../services/recommendationStore';
import StaffMobileHeader from './ui/StaffMobileHeader';
import { useMobileNav } from '../hooks/useMobileNav';
import './AdminDashboard.css';

const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase();
  const cls =
    s === 'active' || s === 'approved'
      ? 'admin-badge admin-badge-active'
      : s === 'pending'
        ? 'admin-badge admin-badge-pending'
        : s === 'inactive' || s === 'rejected'
          ? 'admin-badge admin-badge-inactive'
          : 'admin-badge admin-badge-neutral';

  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown';
  return <span className={cls}>{label}</span>;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { navOpen, toggleNav, closeNav } = useMobileNav();

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [search, setSearch] = useState('');

  const [flash, setFlash] = useState({ kind: 'success', message: '' });

  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    role: 'Student',
    password: ''
  });
  const [createError, setCreateError] = useState('');

  const [bulkRows, setBulkRows] = useState([]);
  const [bulkHeaders, setBulkHeaders] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkError, setBulkError] = useState('');

  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [students, setStudents] = useState(() => getAdminStudentRoster());
  const [sectionAssignments, setSectionAssignments] = useState(() => getSectionAssignments());
  const [incomingStudents, setIncomingStudents] = useState(() => getAdminIncomingStudents());

  const refreshFromStore = useCallback(() => {
    setStudents(getAdminStudentRoster(academicYear));
    setSectionAssignments(getSectionAssignments(academicYear));
    setIncomingStudents(getAdminIncomingStudents(academicYear));
  }, [academicYear]);

  useEffect(() => {
    refreshFromStore();
    return subscribeEnrollmentStore(refreshFromStore);
  }, [refreshFromStore]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const pending = students.filter((s) => (s.status || '').toLowerCase() === 'pending').length;

    const now = new Date();
    const newEnrollees = students.filter((s) => {
      const d = new Date(s.dateRegistered);
      if (Number.isNaN(d.getTime())) return false;
      const diffDays = (now - d) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    const activeTeachers = 12;
    const totalSections = new Set(sectionAssignments.map((s) => s.section)).size;

    return {
      totalStudents,
      newEnrollees,
      pending,
      activeTeachers,
      totalSections
    };
  }, [students, sectionAssignments]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const haystack = `${s.name} ${s.gradeLevel} ${s.status} ${s.dateRegistered}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [search, students]);

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  const handleAcademicYearChange = (year) => {
    setAcademicYear(year);
    setCurrentAcademicYear(year);
    refreshFromStore();
  };

  const handleCreateAccountSubmit = (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Please complete all fields (mock validation).');
      return;
    }

    const email = createForm.email.trim();
    try {
      registerStaffAccount({
        fullName: createForm.fullName.trim(),
        email,
        role: createForm.role,
        password: createForm.password
      });
      setCreateOpen(false);
      setCreateForm({ fullName: '', email: '', role: 'Student', password: '' });
      showFlash('success', `Staff account registered: ${email}`);
    } catch (err) {
      setCreateError(err.message || 'Unable to create account.');
    }
  };

  const loadBulkSample = () => {
    setBulkError('');
    setBulkFileName('sample-students.csv');
    setBulkHeaders(['LRN', 'Last Name', 'First Name', 'Grade']);
    setBulkRows([
      { LRN: '2026-101', 'Last Name': 'Ramos', 'First Name': 'Luis', Grade: 'Grade 7' },
      { LRN: '2026-102', 'Last Name': 'Navarro', 'First Name': 'Paula', Grade: 'Grade 7' },
      { LRN: '2026-103', 'Last Name': 'Flores', 'First Name': 'Diego', Grade: 'Grade 8' }
    ]);
    showFlash('success', 'Loaded a sample CSV preview (mock).');
  };

  const handleBulkUploadClick = async () => {
    setBulkError('');

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setBulkError('Select a CSV file first (or load the sample preview).');
      return;
    }

    const text = await file.text();
    const parsed = parseCsvText(text);
    const rowsForLog =
      parsed.headers.length && parsed.records.length
        ? parsed.records
        : [
            { LRN: '2026-201', 'Last Name': 'Cruz', 'First Name': 'Miguel', Grade: 'Grade 9' },
            { LRN: '2026-202', 'Last Name': 'Diaz', 'First Name': 'Rina', Grade: 'Grade 9' }
          ];

    console.log('[mock] bulk upload students', { fileName: file.name, rows: rowsForLog });
    setBulkOpen(false);
    showFlash('success', 'Bulk upload queued (mock). Check console for payload.');
  };

  const persistSectionAssignments = () => {
    saveSectionAssignments(sectionAssignments, academicYear);
    refreshFromStore();
    showFlash('success', 'Section assignments saved.');
  };

  const setIncomingStatus = (id, next) => {
    updateAdminStatus(id, next);
    refreshFromStore();
    showFlash('success', `Admin approval saved: ${next}.`);
  };

  const toggleParentConsent = (lrn, current) => {
    setParentConsent(lrn, !current, 'Admin');
    refreshFromStore();
    showFlash('success', `Parent consent ${!current ? 'granted' : 'revoked'} for LRN ${lrn}.`);
  };

  const downloadStudentListPdf = () => {
    downloadMockPdf({
      filename: 'student-list.pdf',
      title: `Student List — S.Y. ${academicYear}`,
      lines: filteredStudents.map((s) => `- ${s.name} | ${s.gradeLevel} | ${s.status} | ${s.dateRegistered}`)
    });
    showFlash('success', 'Download started (mock PDF / text file).');
  };

  const downloadSectionListPdf = () => {
    downloadMockPdf({
      filename: 'section-list.pdf',
      title: `Section List — S.Y. ${academicYear}`,
      lines: SECTION_OPTIONS.map((sec) => {
        const names = sectionAssignments.filter((s) => s.section === sec).map((s) => s.name);
        return `${sec}: ${names.length ? names.join(', ') : '(no students assigned)'}`;
      })
    });
    showFlash('success', 'Download started (mock PDF / text file).');
  };

  const renderStudentTable = () => (
    <div className="admin-table-card">
      <div className="admin-table-header">
        <div>
          <h2 className="admin-table-title">Students</h2>
          <p className="admin-table-subtitle">Search and review student status.</p>
        </div>

        <div className="admin-search">
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, grade, status, date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>LRN</th>
              <th>Grade Level</th>
              <th>Status</th>
              <th>Parent Consent</th>
              <th>Date Registered</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.lrn}</td>
                <td>{s.gradeLevel}</td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
                <td>
                  <button
                    type="button"
                    className={`admin-consent-btn ${s.parentConsent ? 'is-granted' : 'is-missing'}`}
                    onClick={() => toggleParentConsent(s.lrn, s.parentConsent)}
                  >
                    {s.parentConsent ? 'Granted' : 'Not granted'}
                  </button>
                </td>
                <td>{s.dateRegistered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMain = () => {
    if (activeTab === 'Dashboard') {
      return (
        <>
          <div className="admin-top-cards">
            <div className="admin-card">
              <div className="admin-card-label">Total Students</div>
              <div className="admin-card-value">{stats.totalStudents}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Sections</div>
              <div className="admin-card-value admin-card-value-approved">{stats.totalSections}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Teachers</div>
              <div className="admin-card-value admin-card-value-approved">{stats.activeTeachers}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">New Enrollees</div>
              <div className="admin-card-value">{stats.newEnrollees}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Pending Enrollments</div>
              <div className="admin-card-value admin-card-value-pending">{stats.pending}</div>
            </div>
            <div className="admin-card">
              <div className="admin-card-label">Active Students</div>
              <div className="admin-card-value admin-card-value-approved">
                {students.filter((s) => (s.status || '').toLowerCase() === 'active').length}
              </div>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-toolbar-title">Quick actions</div>
            <div className="admin-toolbar-actions">
              <button type="button" className="admin-primary-btn" onClick={() => setCreateOpen(true)}>
                Create Account
              </button>
              <button type="button" className="admin-secondary-btn" onClick={() => setBulkOpen(true)}>
                Bulk Upload Students
              </button>
              <button type="button" className="admin-secondary-btn" onClick={() => setActiveTab('Section Assignment')}>
                Assign Section
              </button>
              <button type="button" className="admin-secondary-btn" onClick={() => setActiveTab('Incoming Students')}>
                Incoming Students
              </button>
              <button type="button" className="admin-secondary-btn" onClick={() => setActiveTab('Reports')}>
                Download Reports
              </button>
            </div>
            <div className="admin-toolbar-note">Enrollment data is saved locally and shared with the registrar portal.</div>
          </div>

          <div className="admin-charts-grid">
            <div className="admin-chart-card">
              <div className="admin-chart-title">Charts (Placeholder)</div>
              <div className="admin-chart-subtitle">Add chart library later. This area is intentionally blank.</div>
            </div>
            <div className="admin-chart-card">
              <div className="admin-chart-title">Enrollment Overview (S.Y. {academicYear})</div>
              <div className="admin-chart-subtitle">
                Pending: {getEnrollmentCounts(academicYear).overall.pending} | Awaiting admin:{' '}
                {getEnrollmentCounts(academicYear).overall.pending_admin} | Approved:{' '}
                {getEnrollmentCounts(academicYear).overall.approved} | Rejected:{' '}
                {getEnrollmentCounts(academicYear).overall.rejected}
              </div>
            </div>
          </div>

          {renderStudentTable()}
        </>
      );
    }

    if (activeTab === 'Students') {
      return renderStudentTable();
    }

    if (activeTab === 'Users') {
      return (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div>
              <h2 className="admin-table-title">Accounts</h2>
              <p className="admin-table-subtitle">Create accounts and simulate bulk student imports.</p>
            </div>
            <div className="admin-active-badge">{activeTab}</div>
          </div>

          <div className="admin-inline-actions">
            <button type="button" className="admin-primary-btn" onClick={() => setCreateOpen(true)}>
              Create Account
            </button>
            <button type="button" className="admin-secondary-btn" onClick={() => setBulkOpen(true)}>
              Bulk Upload Students
            </button>
            <button
              type="button"
              className="admin-ghost-btn"
              onClick={() => showFlash('error', 'Mock error: account directory sync unavailable (no backend).')}
            >
              Simulate Error
            </button>
          </div>

          <div className="admin-table-wrapper" style={{ padding: '0 18px 18px' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>registrar@school.edu</td>
                  <td>Registrar</td>
                  <td>
                    <StatusBadge status="active" />
                  </td>
                  <td>2026-04-10</td>
                </tr>
                <tr>
                  <td>teacher@school.edu</td>
                  <td>Teacher</td>
                  <td>
                    <StatusBadge status="active" />
                  </td>
                  <td>2026-04-12</td>
                </tr>
                <tr>
                  <td>admin@school.edu</td>
                  <td>Admin</td>
                  <td>
                    <StatusBadge status="active" />
                  </td>
                  <td>2026-04-17</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'Section Assignment') {
      return (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div>
              <h2 className="admin-table-title">Assign Section</h2>
              <p className="admin-table-subtitle">Pick a section per student, then save (mock).</p>
            </div>
            <div className="admin-active-badge">{activeTab}</div>
          </div>

          <div className="admin-inline-actions">
            <button type="button" className="admin-primary-btn" onClick={persistSectionAssignments}>
              Save Assignments
            </button>
            <button
              type="button"
              className="admin-ghost-btn"
              onClick={() => showFlash('error', 'Mock error: section roster lock is enabled (placeholder).')}
            >
              Simulate Error
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Grade Level</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                {sectionAssignments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.gradeLevel}</td>
                    <td>
                      <select
                        className="admin-select"
                        value={row.section}
                        onChange={(e) =>
                          setSectionAssignments((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, section: e.target.value } : r))
                          )
                        }
                      >
                        {SECTION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'Incoming Students') {
      return (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div>
              <h2 className="admin-table-title">Incoming Students</h2>
              <p className="admin-table-subtitle">Approve or reject applications (UI state only).</p>
            </div>
            <div className="admin-active-badge">{activeTab}</div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Submitted Info</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomingStudents.map((r) => {
                  const st = (r.status || '').toLowerCase();
                  const isPending = st === 'pending';
                  return (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.submittedInfo}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-mini-approve"
                            disabled={!isPending}
                            onClick={() => setIncomingStatus(r.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="admin-mini-reject"
                            disabled={!isPending}
                            onClick={() => setIncomingStatus(r.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'Reports') {
      return (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div>
              <h2 className="admin-table-title">Reports</h2>
              <p className="admin-table-subtitle">Download common registrar/admin exports (mock).</p>
            </div>
            <div className="admin-active-badge">{activeTab}</div>
          </div>

          <div className="admin-download">
            <div className="admin-download-title">Download Reports</div>
            <div className="admin-download-actions">
              <button type="button" className="admin-primary-btn" onClick={downloadStudentListPdf}>
                Download Student List (PDF)
              </button>
              <button type="button" className="admin-primary-btn" onClick={downloadSectionListPdf}>
                Download Section List (PDF)
              </button>
              <button
                type="button"
                className="admin-ghost-btn"
                onClick={() => showFlash('error', 'Mock error: report generator offline (placeholder).')}
              >
                Simulate Error
              </button>
            </div>
            <div className="admin-download-note">Exports include saved enrollment records for S.Y. {academicYear}.</div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Enrollment') {
      const counts = getEnrollmentCounts(academicYear);
      return (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div>
              <h2 className="admin-table-title">Enrollment Management</h2>
              <p className="admin-table-subtitle">
                Registrar reviews applications first; admin gives final approval on registrar-approved records.
              </p>
            </div>
            <div className="admin-active-badge">S.Y. {academicYear}</div>
          </div>
          <div className="admin-enrollment-stats">
            <div className="admin-enrollment-stat">
              <span>Registrar pending</span>
              <strong>{counts.registrar.pending}</strong>
            </div>
            <div className="admin-enrollment-stat">
              <span>Registrar approved</span>
              <strong>{counts.registrar.approved}</strong>
            </div>
            <div className="admin-enrollment-stat">
              <span>Awaiting admin</span>
              <strong>{counts.overall.pending_admin}</strong>
            </div>
            <div className="admin-enrollment-stat">
              <span>Fully enrolled</span>
              <strong>{counts.overall.approved}</strong>
            </div>
          </div>
          <div className="admin-enrollment-actions">
            <button type="button" className="admin-secondary-btn" onClick={() => setActiveTab('Incoming Students')}>
              Review incoming (admin approval)
            </button>
            <button type="button" className="admin-secondary-btn" onClick={() => setActiveTab('Students')}>
              View student roster
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === 'Forecasting') {
      return <EnrollmentForecasting />;
    }

    if (activeTab === 'ML Insights') {
      const history = getRecommendationHistory().slice(0, 15);
      return (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div>
              <h2 className="admin-table-title">ML Recommendation History</h2>
              <p className="admin-table-subtitle">Stored advisory strand and college recommendations.</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>SHS strand</th>
                  <th>College</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No recommendation history yet.</td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.createdAt).toLocaleString()}</td>
                      <td>{h.studentName}</td>
                      <td>
                        {h.jhsToShs?.topRecommendation} ({h.jhsToShs?.topConfidence}%)
                      </td>
                      <td>
                        {h.shsToCollege?.topRecommendation} ({h.shsToCollege?.topConfidence}%)
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'Website CMS') {
      return (
        <div className="admin-cms-wrap">
          <CmsManager />
        </div>
      );
    }

    if (activeTab === 'Settings') {
      return (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <div>
              <h2 className="admin-table-title">Settings</h2>
              <p className="admin-table-subtitle">Academic year applies across registrar and admin workflows.</p>
            </div>
          </div>
          <label className="admin-field">
            <span className="admin-field-label">Active academic year</span>
            <select
              className="form-input"
              value={academicYear}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
            >
              {ACADEMIC_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }

    return (
      <div className="admin-placeholder">
        <div className="admin-placeholder-title">{activeTab}</div>
        <div className="admin-placeholder-body">
          This section is not available.
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard-page">
      <button
        type="button"
        className={`staff-sidebar-overlay ${navOpen ? 'is-visible' : ''}`}
        onClick={closeNav}
        aria-label="Close navigation menu"
      />
      <aside className={`admin-sidebar ${navOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">AD</div>
          <div>
            <div className="admin-sidebar-title">Admin Dashboard</div>
            <div className="admin-sidebar-subtitle">Dampol 1st National High School</div>
          </div>
        </div>

        <nav className="admin-side-nav">
          {[
            'Dashboard',
            'Students',
            'Incoming Students',
            'Section Assignment',
            'Users',
            'Enrollment',
            'Forecasting',
            'ML Insights',
            'Website CMS',
            'Reports',
            'Settings'
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-side-item ${activeTab === tab ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                closeNav();
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-account-btn" onClick={() => navigate('/account')}>
            My Account
          </button>
          <button type="button" className="admin-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <StaffMobileHeader
          title="Admin Dashboard"
          subtitle="Dampol 1st National High School"
          onMenuClick={toggleNav}
        />
        <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />
        {activeTab !== 'Website CMS' ? (
          <div className="admin-year-bar">
            <label htmlFor="admin-academic-year" className="admin-year-label">
              Academic Year
            </label>
            <select
              id="admin-academic-year"
              className="form-input admin-year-select"
              value={academicYear}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
            >
              {ACADEMIC_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {renderMain()}
      </main>

      <Modal
        open={createOpen}
        title="Create Account"
        onClose={() => {
          setCreateOpen(false);
          setCreateError('');
        }}
      >
        <form className="admin-modal-form" onSubmit={handleCreateAccountSubmit}>
          {createError ? <div className="admin-modal-error">{createError}</div> : null}

          <div className="admin-modal-grid">
            <label className="admin-field">
              <span className="admin-field-label">Full Name</span>
              <input
                className="admin-field-input"
                value={createForm.fullName}
                onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Juan Dela Cruz"
                autoComplete="name"
              />
            </label>

            <label className="admin-field">
              <span className="admin-field-label">Email</span>
              <input
                className="admin-field-input"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@school.edu"
                autoComplete="email"
              />
            </label>

            <label className="admin-field">
              <span className="admin-field-label">Role</span>
              <select
                className="admin-field-input"
                value={createForm.role}
                onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option>Admin</option>
                <option>Teacher</option>
                <option>Registrar</option>
                <option>Student</option>
              </select>
            </label>

            <label className="admin-field">
              <span className="admin-field-label">Password</span>
              <input
                className="admin-field-input"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Temporary password"
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-ghost-btn" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-primary-btn">
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={bulkOpen}
        title="Bulk Upload Students (CSV)"
        onClose={() => {
          setBulkOpen(false);
          setBulkError('');
        }}
      >
        <div className="admin-bulk">
          <div className="admin-bulk-row">
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="admin-file-input" />
            <button type="button" className="admin-secondary-btn" onClick={loadBulkSample}>
              Load sample preview
            </button>
          </div>

          {bulkError ? <div className="admin-modal-error">{bulkError}</div> : null}

          <div className="admin-bulk-meta">
            {bulkFileName ? (
              <span>
                Selected file: <strong>{bulkFileName}</strong>
              </span>
            ) : (
              <span>Select a CSV to preview columns and rows (mock).</span>
            )}
          </div>

          <div className="admin-table-wrapper" style={{ border: '1px solid #e5e7eb', borderRadius: 14 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {(bulkHeaders.length ? bulkHeaders : ['Preview']).map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(bulkRows.length ? bulkRows : [{ Preview: 'No rows yet — pick a CSV or load the sample.' }]).map((row, idx) => (
                  <tr key={idx}>
                    {(bulkHeaders.length ? bulkHeaders : ['Preview']).map((h) => (
                      <td key={`${idx}-${h}`}>{String(row[h] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-ghost-btn" onClick={() => setBulkOpen(false)}>
              Close
            </button>
            <button type="button" className="admin-primary-btn" onClick={handleBulkUploadClick}>
              Upload
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
