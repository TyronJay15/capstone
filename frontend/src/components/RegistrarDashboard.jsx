import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import FlashBanner from './ui/FlashBanner';
import { downloadMockPdf, parseCsvText } from '../utils/mockDownloads';
import { clearSession } from '../services/auth';
import StaffMobileHeader from './ui/StaffMobileHeader';
import { useMobileNav } from '../hooks/useMobileNav';
import {
  SECTION_OPTIONS,
  getCurrentAcademicYear,
  getAcademicYearOptions,
  getRegistrarRequests,
  getSectionAssignments,
  refreshEnrollmentStore,
  saveSectionAssignments,
  setCurrentAcademicYear,
  subscribeEnrollmentStore,
  updateRegistrarStatus,
  updateEnrollmentSection
} from '../services/enrollmentStore';
import './RegistrarDashboard.css';

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  const humanStatus = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Pending';
  return (
    <span className="registrar-status-badge" data-status={normalized || 'pending'}>
      {humanStatus}
    </span>
  );
};

const RegistrarDashboard = () => {
  const navigate = useNavigate();
  const bulkInputRef = useRef(null);
  const { navOpen, toggleNav, closeNav } = useMobileNav();

  const [flash, setFlash] = useState({ kind: 'success', message: '' });
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [yearOptions, setYearOptions] = useState(getAcademicYearOptions());
  const [requests, setRequests] = useState(() => getRegistrarRequests());
  const [sectionAssignments, setSectionAssignments] = useState(() => getSectionAssignments());

  const refreshFromStore = useCallback(() => {
    setRequests(getRegistrarRequests(academicYear));
    setSectionAssignments(getSectionAssignments(academicYear));
  }, [academicYear]);

  useEffect(() => {
    refreshEnrollmentStore(academicYear).then(() => {
      setYearOptions(getAcademicYearOptions());
      refreshFromStore();
    });
    return subscribeEnrollmentStore(refreshFromStore);
  }, [refreshFromStore, academicYear]);

  const [sectionSearch, setSectionSearch] = useState('');
  const [sectionSortDirection, setSectionSortDirection] = useState('asc');
  const [collapsedSections, setCollapsedSections] = useState(() =>
    SECTION_OPTIONS.reduce((acc, sec) => ({ ...acc, [sec]: false }), {})
  );

  const getSortKey = (name) => {
    const trimmed = (name || '').trim();
    const parts = trimmed.split(' ');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : trimmed.toLowerCase();
  };

  const groupedAssignments = useMemo(() => {
    const normalizedQuery = sectionSearch.trim().toLowerCase();
    const filtered = sectionAssignments.filter((row) => row.name.toLowerCase().includes(normalizedQuery));

    const compareByLastName = (a, b) => {
      const left = getSortKey(a.name);
      const right = getSortKey(b.name);
      if (left === right) return a.name.localeCompare(b.name);
      return left.localeCompare(right);
    };

    const sorted = [...filtered].sort((a, b) =>
      sectionSortDirection === 'asc' ? compareByLastName(a, b) : compareByLastName(b, a)
    );

    return SECTION_OPTIONS.map((section) => ({
      section,
      rows: sorted.filter((row) => (row.section || 'Unassigned') === section)
    }));
  }, [sectionAssignments, sectionSearch, sectionSortDirection]);

  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [statusView, setStatusView] = useState('pending'); // pending | approved | rejected
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const counts = useMemo(() => {
    const result = { pending: 0, approved: 0, rejected: 0 };
    for (const r of requests) {
      const s = (r.status || 'pending').toLowerCase();
      if (s in result) result[s] += 1;
      else result.pending += 1;
    }
    return result;
  }, [requests]);

  const pendingRequests = useMemo(
    () => requests.filter((r) => (r.status || '').toLowerCase() === 'pending'),
    [requests]
  );
  const approvedRequests = useMemo(
    () => requests.filter((r) => (r.status || '').toLowerCase() === 'approved'),
    [requests]
  );
  const rejectedRequests = useMemo(
    () => requests.filter((r) => (r.status || '').toLowerCase() === 'rejected'),
    [requests]
  );

  const nextPending = useMemo(() => pendingRequests[0] || null, [pendingRequests]);

  const totalSections = useMemo(() => new Set(sectionAssignments.map((s) => s.section)).size, [sectionAssignments]);

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  const openView = (record) => {
    setSelected(record);
    setIsModalOpen(true);
  };

  const closeView = () => {
    setSelected(null);
    setIsModalOpen(false);
  };

  const setStatus = async (id, nextStatus) => {
    try {
      await updateRegistrarStatus(id, nextStatus);
      refreshFromStore();
      showFlash('success', `Registrar decision saved: ${nextStatus}.`);
    } catch (err) {
      showFlash('error', err.message || 'Unable to save registrar decision.');
    }
  };

  const handleAcademicYearChange = async (year) => {
    setAcademicYear(year);
    await setCurrentAcademicYear(year);
    refreshFromStore();
  };

  const handleSectionChange = (id, section) => {
    setSectionAssignments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, section } : row))
    );
    updateEnrollmentSection(id, section);
  };

  const jumpToStatusList = (nextStatus) => {
    setActiveMenu('Enrollment Requests');
    setStatusView(nextStatus);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const persistSectionAssignments = async () => {
    try {
      await saveSectionAssignments(sectionAssignments, academicYear);
      refreshFromStore();
      showFlash('success', 'Section assignments saved.');
    } catch (err) {
      showFlash('error', err.message || 'Unable to save section assignments.');
    }
  };

  const downloadStudentListPdf = () => {
    downloadMockPdf({
      filename: 'student-list.pdf',
      title: `Student List — S.Y. ${academicYear}`,
      lines: approvedRequests.map((s) => `- ${s.name} | ${s.gradeLevel} | ${s.previousSchool}`)
    });
    showFlash('success', 'Student list export started.');
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

  const loadBulkSample = () => {
    setBulkError('');
    setBulkFileName('sample-students.csv');
    setBulkHeaders(['LRN', 'Last Name', 'First Name', 'Grade']);
    setBulkRows([
      { LRN: '2026-301', 'Last Name': 'Reyes', 'First Name': 'Mika', Grade: 'Grade 7' },
      { LRN: '2026-302', 'Last Name': 'Torres', 'First Name': 'Ken', Grade: 'Grade 7' }
    ]);
    showFlash('success', 'Loaded a sample CSV preview (mock).');
  };

  const previewSelectedCsv = async () => {
    setBulkError('');
    const file = bulkInputRef.current?.files?.[0];
    if (!file) {
      setBulkError('Pick a CSV file first (or load the sample preview).');
      return;
    }

    setBulkFileName(file.name);
    const text = await file.text();
    const parsed = parseCsvText(text);

    if (!parsed.headers.length || !parsed.records.length) {
      setBulkHeaders(['LRN', 'Last Name', 'First Name', 'Grade']);
      setBulkRows([
        { LRN: '2026-401', 'Last Name': 'Cruz', 'First Name': 'Noel', Grade: 'Grade 8' },
        { LRN: '2026-402', 'Last Name': 'Diaz', 'First Name': 'Rina', Grade: 'Grade 8' }
      ]);
      showFlash('success', 'CSV parsed as empty — showing a fallback preview (mock).');
      return;
    }

    setBulkHeaders(parsed.headers);
    setBulkRows(parsed.records);
    showFlash('success', 'CSV preview loaded (mock).');
  };

  const uploadBulkStudents = async () => {
    setBulkError('');
    const file = bulkInputRef.current?.files?.[0];
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
            { LRN: '2026-401', 'Last Name': 'Cruz', 'First Name': 'Noel', Grade: 'Grade 8' },
            { LRN: '2026-402', 'Last Name': 'Diaz', 'First Name': 'Rina', Grade: 'Grade 8' }
          ];

    console.log('[mock] registrar bulk upload students', { fileName: file.name, rows: rowsForLog });
    setBulkOpen(false);
    showFlash('success', 'Bulk upload queued (mock). Check console for payload.');
  };

  const handleCreateAccountSubmit = (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('Please complete all fields (mock validation).');
      return;
    }

    const email = createForm.email.trim();
    console.log('[mock] registrar create account', createForm);
    setCreateOpen(false);
    setCreateForm({ fullName: '', email: '', role: 'Student', password: '' });
    showFlash('success', `Account created (mock): ${email}`);
  };

  const renderEnrollmentTableRows = (rows, { canDecide }) =>
    rows.map((r) => {
      const statusNormalized = (r.status || '').toLowerCase();
      const isPending = statusNormalized === 'pending';
      return (
        <tr key={r.id}>
          <td>{r.name}</td>
          <td>{r.previousSchool}</td>
          <td>{r.gradeLevel}</td>
          <td>
            <StatusBadge status={r.status} />
          </td>
          <td>
            <div className="registrar-actions">
              <button type="button" onClick={() => openView(r)} className="registrar-action-btn registrar-action-view">
                View
              </button>

              {canDecide && isPending ? (
                <>
                  <button type="button" onClick={() => setStatus(r.id, 'approved')} className="registrar-action-btn registrar-action-approve">
                    Approve
                  </button>
                  <button type="button" onClick={() => setStatus(r.id, 'rejected')} className="registrar-action-btn registrar-action-reject">
                    Reject
                  </button>
                </>
              ) : (
                <div className="registrar-no-actions">No actions</div>
              )}
            </div>
          </td>
        </tr>
      );
    });

  const renderMainCard = () => {
    if (activeMenu === 'Section Assignment') {
      return (
        <div className="registrar-table-card">
          <div className="registrar-table-header">
            <div>
              <h2 className="registrar-table-title">Assign Section</h2>
              <p className="registrar-table-subtitle">Group students by section and keep each roster sorted alphabetically.</p>
            </div>
            <div className="registrar-active-badge">{activeMenu}</div>
          </div>

          <div className="registrar-inline-actions">
            <button type="button" className="registrar-primary-btn" onClick={persistSectionAssignments}>
              Save Assignments
            </button>
            <button
              type="button"
              className="registrar-secondary-btn"
              onClick={() => setSectionSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            >
              Sort {sectionSortDirection === 'asc' ? 'A–Z' : 'Z–A'}
            </button>
            <div className="registrar-search-block">
              <input
                type="search"
                className="registrar-search-input"
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                placeholder="Search students..."
                aria-label="Search students by name"
              />
            </div>
          </div>

          <div className="registrar-section-groups">
            {groupedAssignments.map(({ section, rows }) => (
              <section key={section} className="registrar-section-group">
                <div className="registrar-section-header">
                  <div>
                    <div className="registrar-section-title">{section}</div>
                    <div className="registrar-section-count">{rows.length} student{rows.length === 1 ? '' : 's'}</div>
                  </div>
                  <button
                    type="button"
                    className="registrar-secondary-btn registrar-section-toggle"
                    onClick={() =>
                      setCollapsedSections((prev) => ({
                        ...prev,
                        [section]: !prev[section]
                      }))
                    }
                  >
                    {collapsedSections[section] ? 'Expand' : 'Collapse'}
                  </button>
                </div>
                <div className={`registrar-section-body ${collapsedSections[section] ? 'is-collapsed' : ''}`}>
                  {rows.length === 0 ? (
                    <div className="registrar-section-empty">No students assigned to this section.</div>
                  ) : (
                    <div className="registrar-table-wrapper">
                      <table className="registrar-table registrar-section-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Grade Level</th>
                            <th>Section</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.id}>
                              <td>{row.name}</td>
                              <td>{row.gradeLevel}</td>
                              <td>
                                <select
                                  className="registrar-select"
                                  value={row.section}
                                  onChange={(e) => handleSectionChange(row.id, e.target.value)}
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
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      );
    }

    if (activeMenu === 'Incoming Students') {
      return (
        <div className="registrar-table-card">
          <div className="registrar-table-header">
            <div>
              <h2 className="registrar-table-title">Incoming Students</h2>
              <p className="registrar-table-subtitle">Review submitted information and decide (UI only).</p>
            </div>
            <div className="registrar-active-badge">{activeMenu}</div>
          </div>

          <div className="registrar-table-wrapper">
            <table className="registrar-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Submitted Info</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const st = (r.status || '').toLowerCase();
                  const isPending = st === 'pending';
                  return (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.submittedInfo || '—'}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <div className="registrar-actions">
                          <button type="button" className="registrar-action-btn registrar-action-view" onClick={() => openView(r)}>
                            View
                          </button>
                          <button
                            type="button"
                            className="registrar-action-btn registrar-action-approve"
                            disabled={!isPending}
                            onClick={() => setStatus(r.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="registrar-action-btn registrar-action-reject"
                            disabled={!isPending}
                            onClick={() => setStatus(r.id, 'rejected')}
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

    if (activeMenu === 'Reports') {
      return (
        <div className="registrar-table-card">
          <div className="registrar-table-header">
            <div>
              <h2 className="registrar-table-title">Reports</h2>
              <p className="registrar-table-subtitle">Summary of enrollment decisions (dummy data).</p>
            </div>
            <div className="registrar-active-badge">{activeMenu}</div>
          </div>

          <div className="registrar-download">
            <div className="registrar-download-title">Download Reports</div>
            <div className="registrar-download-actions">
              <button type="button" className="registrar-primary-btn" onClick={downloadStudentListPdf}>
                Download Student List (PDF)
              </button>
              <button type="button" className="registrar-primary-btn" onClick={downloadSectionListPdf}>
                Download Section List (PDF)
              </button>
              <button
                type="button"
                className="registrar-ghost-btn"
                onClick={() => showFlash('error', 'Mock error: reports service unavailable (placeholder).')}
              >
                Simulate Error
              </button>
            </div>
            <div className="registrar-download-note">Downloads are simulated as small text files for demo purposes.</div>
          </div>

          <div className="registrar-reports">
            <div className="registrar-report-filter-actions">
              <button type="button" className="registrar-filter-btn" onClick={() => jumpToStatusList('pending')}>
                View Pending
              </button>
              <button type="button" className="registrar-filter-btn" onClick={() => jumpToStatusList('approved')}>
                View Approved
              </button>
              <button type="button" className="registrar-filter-btn" onClick={() => jumpToStatusList('rejected')}>
                View Rejected
              </button>
            </div>

            <div className="registrar-report-row">
              <div className="registrar-report-label">Pending</div>
              <div className="registrar-report-value">{counts.pending}</div>
            </div>
            <div className="registrar-report-row">
              <div className="registrar-report-label">Approved</div>
              <div className="registrar-report-value registrar-report-value-approved">{counts.approved}</div>
            </div>
            <div className="registrar-report-row">
              <div className="registrar-report-label">Rejected</div>
              <div className="registrar-report-value registrar-report-value-rejected">{counts.rejected}</div>
            </div>

            <div className="registrar-report-lists">
              <div className="registrar-report-list">
                <div className="registrar-report-list-title">Pending Requests</div>
                {pendingRequests.length === 0 ? (
                  <div className="registrar-report-empty">No pending requests.</div>
                ) : (
                  <ul className="registrar-report-ul">
                    {pendingRequests.map((r) => (
                      <li
                        key={r.id}
                        className="registrar-report-li registrar-report-li-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => openView(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openView(r);
                        }}
                      >
                        <span className="registrar-report-name">{r.name}</span>
                        <span className="registrar-report-meta">{r.gradeLevel}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="registrar-report-list registrar-report-list-approved">
                <div className="registrar-report-list-title">Approved Students</div>
                {approvedRequests.length === 0 ? (
                  <div className="registrar-report-empty">No approved students.</div>
                ) : (
                  <ul className="registrar-report-ul">
                    {approvedRequests.map((r) => (
                      <li
                        key={r.id}
                        className="registrar-report-li registrar-report-li-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => openView(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openView(r);
                        }}
                      >
                        <span className="registrar-report-name">{r.name}</span>
                        <span className="registrar-report-meta">{r.gradeLevel}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="registrar-report-list registrar-report-list-rejected">
                <div className="registrar-report-list-title">Rejected Students</div>
                {rejectedRequests.length === 0 ? (
                  <div className="registrar-report-empty">No rejected students.</div>
                ) : (
                  <ul className="registrar-report-ul">
                    {rejectedRequests.map((r) => (
                      <li
                        key={r.id}
                        className="registrar-report-li registrar-report-li-clickable"
                        role="button"
                        tabIndex={0}
                        onClick={() => openView(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openView(r);
                        }}
                      >
                        <span className="registrar-report-name">{r.name}</span>
                        <span className="registrar-report-meta">{r.gradeLevel}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="registrar-report-note">Reports use saved enrollment records for S.Y. {academicYear}.</div>
          </div>
        </div>
      );
    }

    const rowsForTable =
      activeMenu === 'Students'
        ? approvedRequests
        : statusView === 'pending'
          ? pendingRequests
          : statusView === 'approved'
            ? approvedRequests
            : rejectedRequests;

    const canDecide = activeMenu === 'Enrollment Requests' || activeMenu === 'Dashboard';

    return (
      <div className="registrar-table-card">
        {activeMenu === 'Dashboard' && nextPending && (
          <div className="registrar-dashboard-queue">
            <div className="registrar-dashboard-queue-title">Next Pending to Review</div>
            <div className="registrar-dashboard-queue-body">
              <div className="registrar-dashboard-queue-student">
                <div className="registrar-dashboard-queue-name">{nextPending.name}</div>
                <div className="registrar-dashboard-queue-meta">
                  {nextPending.previousSchool} · {nextPending.gradeLevel}
                </div>
              </div>
              <div className="registrar-dashboard-queue-actions">
                <button type="button" onClick={() => openView(nextPending)} className="registrar-action-btn registrar-action-view">
                  View
                </button>
                <button type="button" onClick={() => setStatus(nextPending.id, 'approved')} className="registrar-action-btn registrar-action-approve">
                  Approve
                </button>
                <button type="button" onClick={() => setStatus(nextPending.id, 'rejected')} className="registrar-action-btn registrar-action-reject">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="registrar-table-header">
          <div>
            <h2 className="registrar-table-title">
              {activeMenu === 'Students'
                ? 'Students'
                : activeMenu === 'Dashboard'
                  ? 'Dashboard'
                  : 'Enrollment Requests'}
            </h2>
            <p className="registrar-table-subtitle">
              {activeMenu === 'Students'
                ? 'Approved students only (dummy data).'
                : activeMenu === 'Dashboard'
                  ? 'Quick review of pending enrollment requests.'
                  : 'Review and update student enrollment status.'}
            </p>
          </div>
          <div className="registrar-active-badge">{activeMenu}</div>
        </div>

        {(activeMenu === 'Enrollment Requests' || activeMenu === 'Dashboard') && (
          <div className="registrar-status-filters">
            <button type="button" onClick={() => setStatusView('pending')} className={`registrar-filter-btn ${statusView === 'pending' ? 'is-active' : ''}`}>
              Pending
            </button>
            <button type="button" onClick={() => setStatusView('approved')} className={`registrar-filter-btn ${statusView === 'approved' ? 'is-active' : ''}`}>
              Approved
            </button>
            <button type="button" onClick={() => setStatusView('rejected')} className={`registrar-filter-btn ${statusView === 'rejected' ? 'is-active' : ''}`}>
              Rejected
            </button>
          </div>
        )}

        <div className="registrar-table-wrapper">
          <table className="registrar-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Previous School</th>
                <th>Grade Level (Enrollment)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{renderEnrollmentTableRows(rowsForTable, { canDecide })}</tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="registrar-dashboard-page">
      <button
        type="button"
        className={`staff-sidebar-overlay ${navOpen ? 'is-visible' : ''}`}
        onClick={closeNav}
        aria-label="Close navigation menu"
      />
      <aside className={`registrar-sidebar ${navOpen ? 'is-open' : ''}`}>
        <div className="registrar-sidebar-header">
          <div className="registrar-sidebar-logo">DP</div>
          <div>
            <div className="registrar-sidebar-title">Registrar Portal</div>
            <div className="registrar-sidebar-subtitle">Dampol 1st National High School</div>
          </div>
        </div>

        <nav className="registrar-side-nav">
          {[
            'Dashboard',
            'Incoming Students',
            'Enrollment Requests',
            'Students',
            'Section Assignment',
            'Reports'
          ].map((item) => {
            const isActive = activeMenu === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setActiveMenu(item);
                  if (item === 'Dashboard') setStatusView('pending');
                  if (item === 'Students') setStatusView('approved');
                  closeNav();
                }}
                className={`registrar-side-item ${isActive ? 'is-active' : ''}`}
              >
                {item}
              </button>
            );
          })}
        </nav>

        <div className="registrar-sidebar-footer">
          <div className="registrar-side-tools">
            <button type="button" className="registrar-tool-btn" onClick={() => setCreateOpen(true)}>
              Create Account
            </button>
            <button type="button" className="registrar-tool-btn" onClick={() => setBulkOpen(true)}>
              Bulk Upload
            </button>
            <button type="button" className="registrar-tool-btn" onClick={() => navigate('/account')}>
              My Account
            </button>
          </div>
          <button type="button" onClick={handleLogout} className="registrar-logout-btn">
            Logout
          </button>
        </div>
      </aside>

      <div className="registrar-main">
        <div className="registrar-main-inner">
          <StaffMobileHeader
            title="Registrar Portal"
            subtitle="Enrollment Management"
            onMenuClick={toggleNav}
          />

          <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />

          <div className="registrar-year-bar">
            <label htmlFor="registrar-academic-year" className="registrar-year-label">
              Academic Year
            </label>
            <select
              id="registrar-academic-year"
              className="registrar-select registrar-year-select"
              value={academicYear}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="registrar-top-cards">
            <div className="registrar-stat-card">
              <div className="registrar-stat-label">Pending Enrollments</div>
              <div className="registrar-stat-value registrar-stat-value-pending">{counts.pending}</div>
            </div>
            <div className="registrar-stat-card">
              <div className="registrar-stat-label">Approved</div>
              <div className="registrar-stat-value registrar-stat-value-approved">{counts.approved}</div>
            </div>
            <div className="registrar-stat-card">
              <div className="registrar-stat-label">Rejected</div>
              <div className="registrar-stat-value registrar-stat-value-rejected">{counts.rejected}</div>
            </div>
            <div className="registrar-stat-card">
              <div className="registrar-stat-label">Sections</div>
              <div className="registrar-stat-value">{totalSections}</div>
            </div>
          </div>

          {renderMainCard()}
        </div>
      </div>

      <Modal open={isModalOpen} title={selected ? `Student Details - ${selected.name}` : 'Student Details'} onClose={closeView}>
        {selected && (
          <div className="registrar-modal-content">
            <div className="registrar-modal-card">
              <div className="registrar-modal-label">Name</div>
              <div className="registrar-modal-value registrar-modal-value-strong">{selected.name}</div>
            </div>

            <div className="registrar-modal-grid">
              <div className="registrar-modal-card">
                <div className="registrar-modal-label">ID</div>
                <div className="registrar-modal-value registrar-modal-value-strong">{selected.id}</div>
              </div>
              <div className="registrar-modal-card">
                <div className="registrar-modal-label">Status</div>
                <div className="registrar-modal-value" style={{ marginTop: 8 }}>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            </div>

            <div className="registrar-modal-card">
              <div className="registrar-modal-label">Submitted Info</div>
              <div className="registrar-modal-value">{selected.submittedInfo || '—'}</div>
            </div>

            <div className="registrar-modal-card">
              <div className="registrar-modal-label">Previous School</div>
              <div className="registrar-modal-value">{selected.previousSchool}</div>
            </div>

            <div className="registrar-modal-card">
              <div className="registrar-modal-label">Grade Level (Enrollment)</div>
              <div className="registrar-modal-value">{selected.gradeLevel}</div>
            </div>

            <div className="registrar-modal-note">This is dummy data for the registrar interface. Hook this up to your backend once ready.</div>
          </div>
        )}
      </Modal>

      <Modal
        open={createOpen}
        title="Create Account"
        onClose={() => {
          setCreateOpen(false);
          setCreateError('');
        }}
      >
        <form className="registrar-modal-form" onSubmit={handleCreateAccountSubmit}>
          {createError ? <div className="registrar-modal-error">{createError}</div> : null}

          <div className="registrar-modal-form-grid">
            <label className="registrar-field">
              <span className="registrar-field-label">Full Name</span>
              <input
                className="registrar-field-input"
                value={createForm.fullName}
                onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Juan Dela Cruz"
              />
            </label>

            <label className="registrar-field">
              <span className="registrar-field-label">Email</span>
              <input
                className="registrar-field-input"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@school.edu"
              />
            </label>

            <label className="registrar-field">
              <span className="registrar-field-label">Role</span>
              <select className="registrar-field-input" value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}>
                <option>Admin</option>
                <option>Teacher</option>
                <option>Registrar</option>
                <option>Student</option>
              </select>
            </label>

            <label className="registrar-field">
              <span className="registrar-field-label">Password</span>
              <input
                className="registrar-field-input"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Temporary password"
              />
            </label>
          </div>

          <div className="registrar-modal-actions">
            <button type="button" className="registrar-ghost-btn" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="registrar-primary-btn">
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
        <div className="registrar-bulk">
          <div className="registrar-bulk-row">
            <input ref={bulkInputRef} type="file" accept=".csv,text/csv" className="registrar-file-input" />
            <button type="button" className="registrar-secondary-btn" onClick={loadBulkSample}>
              Load sample preview
            </button>
            <button type="button" className="registrar-secondary-btn" onClick={previewSelectedCsv}>
              Preview CSV
            </button>
          </div>

          {bulkError ? <div className="registrar-modal-error">{bulkError}</div> : null}

          <div className="registrar-bulk-meta">
            {bulkFileName ? (
              <span>
                Selected file: <strong>{bulkFileName}</strong>
              </span>
            ) : (
              <span>Select a CSV to preview columns and rows (mock).</span>
            )}
          </div>

          <div className="registrar-table-wrapper" style={{ border: '1px solid #e5e7eb', borderRadius: 14 }}>
            <table className="registrar-table">
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

          <div className="registrar-modal-actions">
            <button type="button" className="registrar-ghost-btn" onClick={() => setBulkOpen(false)}>
              Close
            </button>
            <button type="button" className="registrar-primary-btn" onClick={uploadBulkStudents}>
              Upload
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegistrarDashboard;
