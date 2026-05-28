import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import GradeTable from './GradeTable';
import AcademicRecommendations from './recommendations/AcademicRecommendations';
import Modal from './ui/Modal';
import { getSession } from '../services/auth';
import { downloadMockPdf } from '../utils/mockDownloads';
import { clearSession } from '../services/auth';
import './Dashboard.css';

const Dashboard = () => {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [notifications] = useState([
    { id: 1, title: 'New grade posted', detail: 'Science grade updated for 1st Sem.', time: 'Today' },
    { id: 2, title: 'School announcement', detail: 'Parent-teacher conference on Friday.', time: 'Yesterday' },
    { id: 3, title: 'Reminder', detail: 'Submit your community service log.', time: '2 days ago' }
  ]);
  const [messages] = useState([
    { id: 1, from: 'Mrs. Cruz', subject: 'Math review session', status: 'Unread' },
    { id: 2, from: 'Mr. Santos', subject: 'Project feedback', status: 'Read' }
  ]);
  const navigate = useNavigate();
  const sessionRole = getSession().role;
  const isParentView = sessionRole === 'parent';

  useEffect(() => {
    const storedStudent = localStorage.getItem('currentStudent');
    if (storedStudent) {
      setCurrentStudent(JSON.parse(storedStudent));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (currentStudent) {
      setEditedProfile(currentStudent);
    }
  }, [currentStudent]);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleSemesterChange = (semester) => {
    setSemesterFilter(semester);
  };

  const openProfileEditor = () => {
    setEditedProfile(currentStudent);
    setProfileEditOpen(true);
  };

  const handleProfileChange = (field, value) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfileChanges = () => {
    setCurrentStudent(editedProfile);
    localStorage.setItem('currentStudent', JSON.stringify(editedProfile));
    setProfileEditOpen(false);
  };

  const downloadReportCard = () => {
    const filteredGrades = semesterFilter === 'All'
      ? currentStudent.grades
      : currentStudent.grades.filter((grade) => grade.semester === semesterFilter);

    const lines = [
      `Student: ${currentStudent.name}`,
      `Student ID: ${currentStudent.id}`,
      `Grade / Section: ${currentStudent.grade} - ${currentStudent.section}`,
      `Semester: ${semesterFilter}`,
      '',
      'Grades:'
    ];

    lines.push(
      ...(filteredGrades.length
        ? filteredGrades.map((grade) => `- ${grade.subject}: ${grade.grade} (${grade.semester})`)
        : ['No grades available for this semester.'])
    );

    downloadMockPdf({
      filename: 'report-card.pdf',
      title: `Report Card - ${currentStudent.name}`,
      lines
    });
  };

  if (!currentStudent) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const allGrades = currentStudent.grades || [];
  const filteredGrades = semesterFilter === 'All' ? allGrades : allGrades.filter((grade) => grade.semester === semesterFilter);
  const averageGrade = filteredGrades.length > 0 ? (filteredGrades.reduce((sum, grade) => sum + grade.grade, 0) / filteredGrades.length).toFixed(1) : 0;
  const gpa = filteredGrades.length > 0 ? ((averageGrade / 100) * 4).toFixed(2) : '0.00';
  const progressCards = filteredGrades.map((grade) => {
    const status = grade.grade >= 95 ? 'Excellent' : grade.grade >= 90 ? 'Very Good' : grade.grade >= 85 ? 'Good' : grade.grade >= 80 ? 'Satisfactory' : 'Needs Improvement';
    return { subject: grade.subject, grade: grade.grade, status };
  });
  const onTrackCount = filteredGrades.filter((grade) => grade.grade >= 85).length;
  const needsImprovementCount = filteredGrades.filter((grade) => grade.grade < 85).length;

  return (
    <div className="dashboard-page">
      <AnimatedBackground />
      
      {/* Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="navbar-logo">
              <img 
                src="/logo/logodampol.jpg" 
                alt="Dampol 1st National High School Logo" 
                className="navbar-logo-image"
              />
            </div>
            <div className="navbar-title">
              <h1>Dampol 1st National High School</h1>
              <p>Grading Portal</p>
            </div>
          </div>
          
          <div className="navbar-actions">
            <Link to="/dashboard" className="btn btn-outline home-btn">Home</Link>
            <button onClick={handleLogout} className="btn btn-secondary logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          
          {/* Student Information Section */}
          <div className="student-info-section">
            <div className="card student-card">
              <div className="card-header student-card-header">
                <div>
                  <h2>Student Information</h2>
                  <p className="student-card-tag">Personal account summary and quick actions.</p>
                </div>
                <div className="student-card-actions">
                  <button type="button" className="btn btn-primary" onClick={downloadReportCard}>
                    Download Report Card
                  </button>
                  <button type="button" className="btn btn-outline" onClick={openProfileEditor}>
                    Edit Profile
                  </button>
                </div>
              </div>
              <div className="student-details">
                <div className="student-avatar">
                  <div className="avatar-circle">
                    {currentStudent.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                </div>
                <div className="student-info">
                  <h3 className="student-name">{currentStudent.name}</h3>
                  <div className="student-meta">
                    <div className="meta-item">
                      <span className="meta-label">Student ID:</span>
                      <span className="meta-value">{currentStudent.id}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Email:</span>
                      <span className="meta-value">{currentStudent.email}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Grade & Section:</span>
                      <span className="meta-value">{currentStudent.grade} - {currentStudent.section}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Current Semester:</span>
                      <span className="meta-value">{currentStudent.semester}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isParentView ? (
            <div className="parent-view-banner">
              Parent view — viewing records for {currentStudent.name} (LRN {currentStudent.id})
            </div>
          ) : null}

          <AcademicRecommendations student={currentStudent} />

          <div className="dashboard-stat-grid">
            <div className="stat-card">
              <div className="stat-label">Average Grade</div>
              <div className="stat-value">{averageGrade}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Estimated GPA</div>
              <div className="stat-value">{gpa}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">On Track</div>
              <div className="stat-value">{onTrackCount} subjects</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Needs Improvement</div>
              <div className="stat-value">{needsImprovementCount} subjects</div>
            </div>
          </div>

          <div className="dashboard-panels">
            <section className="panel-card progress-panel">
              <div className="panel-header">
                <h3>Subject Progress</h3>
                <p>Quick view of performance across subjects.</p>
              </div>
              <div className="progress-grid">
                {progressCards.length > 0 ? (
                  progressCards.map((item) => (
                    <div key={item.subject} className="progress-card">
                      <div className="progress-subject">{item.subject}</div>
                      <div className="progress-grade">{item.grade}</div>
                      <div className={`progress-status ${item.status.replace(/ /g, '-').toLowerCase()}`}>
                        {item.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No subject progress data available.</p>
                )}
              </div>
            </section>

            <section className="panel-card message-panel">
              <div className="panel-header">
                <h3>Notifications & Messages</h3>
                <p>Recent announcements and staff messages.</p>
              </div>
              <div className="notification-list">
                {notifications.map((item) => (
                  <div key={item.id} className="notification-item">
                    <div>
                      <div className="notification-title">{item.title}</div>
                      <div className="notification-detail">{item.detail}</div>
                    </div>
                    <div className="notification-time">{item.time}</div>
                  </div>
                ))}
              </div>
              <div className="message-list">
                <div className="message-list-title">Messages</div>
                {messages.map((message) => (
                  <div key={message.id} className={`message-item ${message.status === 'Unread' ? 'unread' : ''}`}>
                    <div>
                      <div className="message-from">{message.from}</div>
                      <div className="message-subject">{message.subject}</div>
                    </div>
                    <span className="message-status">{message.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Semester Filter */}
          <div className="filter-section">
            <div className="card filter-card">
              <div className="card-header">
                <h2>Semester Filter</h2>
              </div>
              <div className="filter-buttons">
                <button
                  onClick={() => handleSemesterChange('All')}
                  className={`filter-btn ${semesterFilter === 'All' ? 'active' : ''}`}
                >
                  All Semesters
                </button>
                <button
                  onClick={() => handleSemesterChange('1st Sem')}
                  className={`filter-btn ${semesterFilter === '1st Sem' ? 'active' : ''}`}
                >
                  1st Semester
                </button>
                <button
                  onClick={() => handleSemesterChange('2nd Sem')}
                  className={`filter-btn ${semesterFilter === '2nd Sem' ? 'active' : ''}`}
                >
                  2nd Semester
                </button>
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="grades-section">
            <GradeTable 
              grades={currentStudent.grades} 
              semesterFilter={semesterFilter}
            />
          </div>

          {/* Footer with Motto */}
        </div>
      </main>

      <Modal
        open={profileEditOpen}
        title="Edit Profile"
        onClose={() => setProfileEditOpen(false)}
        footer={
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setProfileEditOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveProfileChanges}>
              Save Changes
            </button>
          </div>
        }
      >
        {editedProfile && (
          <div className="modal-form">
            <label className="modal-field">
              <span className="modal-label">Name</span>
              <input
                className="form-input"
                value={editedProfile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">Email</span>
              <input
                className="form-input"
                type="email"
                value={editedProfile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">Grade</span>
              <input
                className="form-input"
                value={editedProfile.grade}
                onChange={(e) => handleProfileChange('grade', e.target.value)}
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">Section</span>
              <input
                className="form-input"
                value={editedProfile.section}
                onChange={(e) => handleProfileChange('section', e.target.value)}
              />
            </label>
          </div>
        )}
      </Modal>

      <div className="dashboard-footer">
        <p className="motto">"Thy Light Shall Guide Us!"</p>
        <p className="footer-text">
          Dampol 1st National High School - Preparing for Citizenship
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
