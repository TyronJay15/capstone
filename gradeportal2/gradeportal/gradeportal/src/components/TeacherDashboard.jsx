import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import GradeTable from './GradeTable';
import StaffMobileHeader from './ui/StaffMobileHeader';
import { clearSession } from '../services/auth';
import { useMobileNav } from '../hooks/useMobileNav';
import {
  getCurrentAcademicYear,
  getStudentGradesForTeacher,
  getTeacherRoster,
  subscribeEnrollmentStore
} from '../services/enrollmentStore';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { navOpen, toggleNav, closeNav } = useMobileNav();

  const [activeTab, setActiveTab] = useState('Dashboards');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [students, setStudents] = useState(() => getTeacherRoster());
  const [gradesModalOpen, setGradesModalOpen] = useState(false);
  const [gradesView, setGradesView] = useState({ blocked: false, student: null, reason: '' });
  const [gradesError, setGradesError] = useState('');

  const refreshRoster = useCallback(() => {
    setStudents(getTeacherRoster(getCurrentAcademicYear()));
  }, []);

  useEffect(() => {
    refreshRoster();
    return subscribeEnrollmentStore(refreshRoster);
  }, [refreshRoster]);

  const [notesByStudent, setNotesByStudent] = useState(() => ({
    '2025-001': 'Focus on Math performance this week.'
  }));

  const sectionsHandled = useMemo(() => {
    const set = new Set(students.map((s) => `${s.grade} - ${s.section}`));
    return set.size;
  }, [students]);

  const totalStudents = students.length;

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const notesSaved = useMemo(() => {
    if (!selectedStudentId) return '';
    return notesByStudent[selectedStudentId] || '';
  }, [notesByStudent, selectedStudentId]);

  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    setNotesDraft(notesByStudent[id] || '');
    setActiveTab('Notes');
  };

  const handleViewGrades = (lrn) => {
    setGradesError('');
    const result = getStudentGradesForTeacher(lrn);
    if (result.blocked) {
      setGradesView({ blocked: true, student: null, reason: result.reason });
      setGradesError(result.reason);
    } else {
      setGradesView({ blocked: false, student: result.student, reason: '' });
    }
    setGradesModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!selectedStudentId) return;
    setNotesByStudent((prev) => ({
      ...prev,
      [selectedStudentId]: notesDraft
    }));
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const renderStudentTable = (title, subtitle) => (
    <div className="teacher-table-card">
      <div className="teacher-table-header">
        <div>
          <h2 className="teacher-table-title">{title}</h2>
          <p className="teacher-table-subtitle">{subtitle}</p>
        </div>
        <div className="teacher-active-badge">{activeTab}</div>
      </div>

      <div className="teacher-consent-notice">
        Grade viewing requires parent consent on file. Students without consent cannot have grades viewed by teachers.
      </div>

      <div className="teacher-table-wrapper table-scroll">
        <table className="teacher-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>LRN</th>
              <th>Grade/Section</th>
              <th>Parent Consent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.id}
                className={`teacher-row ${selectedStudentId === s.id ? 'is-selected' : ''}`}
              >
                <td>{s.name}</td>
                <td>{s.id}</td>
                <td>
                  {s.grade} - {s.section}
                </td>
                <td>
                  <span className={`teacher-consent-pill ${s.parentConsent ? 'is-yes' : 'is-no'}`}>
                    {s.parentConsent ? 'Granted' : 'Missing'}
                  </span>
                </td>
                <td className="teacher-row-actions">
                  <button
                    type="button"
                    className="teacher-view-grades-btn"
                    onClick={() => handleViewGrades(s.id)}
                    disabled={!s.hasGrades}
                  >
                    View Grades
                  </button>
                  <button
                    type="button"
                    className="teacher-note-link-btn"
                    onClick={() => handleSelectStudent(s.id)}
                  >
                    Notes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="teacher-dashboard-page">
      <button
        type="button"
        className={`staff-sidebar-overlay ${navOpen ? 'is-visible' : ''}`}
        onClick={closeNav}
        aria-label="Close navigation menu"
      />
      <aside className={`teacher-sidebar ${navOpen ? 'is-open' : ''}`}>
        <div className="teacher-sidebar-brand">
          <div className="teacher-sidebar-logo">TD</div>
          <div>
            <div className="teacher-sidebar-title">Teacher Dashboard</div>
            <div className="teacher-sidebar-subtitle">Dampol 1st National High School</div>
          </div>
        </div>

        <nav className="teacher-side-nav">
          {['Dashboard', 'My Students', 'Student Grades', 'Sections', 'Notes'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`teacher-side-item ${activeTab === tab ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                closeNav();
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="teacher-sidebar-footer">
          <button type="button" className="teacher-account-btn" onClick={() => navigate('/account')}>
            My Account
          </button>
          <button type="button" className="teacher-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="teacher-main">
        <div className="teacher-main-inner">
          <StaffMobileHeader
            title="Teacher Dashboard"
            subtitle="Dampol 1st National High School"
            onMenuClick={toggleNav}
          />
          {activeTab === 'Dashboard' || activeTab === 'My Students' ? (
            <>
              <div className="teacher-top-cards">
                <div className="teacher-card">
                  <div className="teacher-card-label">Total Students</div>
                  <div className="teacher-card-value">{totalStudents}</div>
                </div>
                <div className="teacher-card">
                  <div className="teacher-card-label">Sections Handled</div>
                  <div className="teacher-card-value teacher-card-value-green">{sectionsHandled}</div>
                </div>
              </div>
              {renderStudentTable(
                activeTab === 'My Students' ? 'My Students' : 'Dashboard',
                'Fully enrolled students for the active school year.'
              )}
            </>
          ) : null}

          {activeTab === 'Student Grades' ? (
            renderStudentTable(
              'Student Grades',
              'Teachers may only open grade records when parent consent has been recorded by admin.'
            )
          ) : null}

          {activeTab === 'Sections' ? (
            <div className="teacher-placeholder">
              <div className="teacher-placeholder-title">Sections</div>
              <div className="teacher-placeholder-body">
                {Array.from(new Set(students.map((s) => `${s.grade} - ${s.section}`))).map((sec) => (
                  <div key={sec} className="teacher-section-pill">
                    {sec}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === 'Notes' ? (
            <div className="teacher-table-card">
              <div className="teacher-table-header">
                <div>
                  <h2 className="teacher-table-title">Notes</h2>
                  <p className="teacher-table-subtitle">Write and save notes per student.</p>
                </div>
                <div className="teacher-active-badge">Notes</div>
              </div>

              {!selectedStudent ? (
                <div className="teacher-notes-empty">Select a student from the roster to start writing notes.</div>
              ) : (
                <div className="teacher-notes-editor">
                  <div className="teacher-notes-student">
                    <div className="teacher-notes-student-name">{selectedStudent.name}</div>
                    <div className="teacher-notes-student-meta">
                      {selectedStudent.grade} - {selectedStudent.section}
                    </div>
                  </div>

                  <label className="teacher-notes-label" htmlFor="teacher-notes-textarea">
                    Student Note
                  </label>
                  <textarea
                    id="teacher-notes-textarea"
                    className="teacher-textarea"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Type your note here..."
                  />

                  <div className="teacher-notes-actions">
                    <button type="button" className="teacher-save-btn" onClick={handleSaveNote}>
                      Save Note
                    </button>
                    <button
                      type="button"
                      className="teacher-reset-btn"
                      onClick={() => setNotesDraft(notesSaved)}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>

      <Modal
        open={gradesModalOpen}
        title={gradesView.student ? `Grades — ${gradesView.student.name}` : 'Grades unavailable'}
        onClose={() => {
          setGradesModalOpen(false);
          setGradesError('');
        }}
      >
        {gradesView.blocked ? (
          <div className="teacher-grades-blocked">
            <p>{gradesError || gradesView.reason}</p>
            <p className="teacher-grades-blocked-hint">
              Ask the school admin to record parent consent before viewing this student&apos;s grades.
            </p>
          </div>
        ) : gradesView.student ? (
          <div className="teacher-grades-modal">
            <div className="teacher-grades-meta">
              LRN {gradesView.student.id} · {gradesView.student.grade} · {gradesView.student.section}
            </div>
            <GradeTable grades={gradesView.student.grades} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
