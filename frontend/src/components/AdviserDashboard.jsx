import React, { useState } from 'react';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead } from './common/Cards';
import SectionBrowser from './sections/SectionBrowser';
import GradeEncoder from './grades/GradeEncoder';
import MessagingCenter from './messaging/MessagingCenter';
import SectionMessenger from './messaging/SectionMessenger';
import CourseRecommendationPanel from './recommendations/CourseRecommendationPanel';
import { getRecommendation } from './recommendations/recommendationStore';
import ProfilePanel from './profile/ProfilePanel';
import { getSections } from './grades/gradesApi';
import './common/common.css';
import './common/roleDashboards.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'students', label: 'Assigned Students & Sections', icon: '🎓' },
  { id: 'encode', label: 'Encode Grades', icon: '✏️' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', badge: 1 },
  { id: 'recommendation', label: 'College Recommendation', icon: '🧭' },
  { id: 'profile', label: 'My Profile', icon: '🪪' }
];

const AdviserDashboard = () => {
  const [activeId, setActiveId] = useState('overview');
  const [recStudent, setRecStudent] = useState(null);
  const sections = getSections();

  const renderContent = () => {
    switch (activeId) {
      case 'overview':
        return (
          <div className="gp-stack">
            <SectionHead title="Adviser Overview" subtitle="Your advisory classes and tasks." />
            <div className="gp-grid is-tight">
              <StatCard label="Advisory Sections" value={sections.length} icon="🏫" />
              <StatCard label="Total Students" value={24} icon="🎓" variant="accent" />
              <StatCard label="Pending Grades" value={1} icon="🕒" variant="warning" />
              <StatCard label="Unread Messages" value={1} icon="✉️" />
            </div>
            <div className="dash-two-col">
              <div className="gp-card">
                <div className="gp-card-title">Quick Tasks</div>
                <div className="gp-stack gp-mt">
                  <button type="button" className="gp-btn-sm is-primary" onClick={() => setActiveId('encode')}>Encode Grades</button>
                  <button type="button" className="gp-btn-sm" onClick={() => setActiveId('students')}>View Students &amp; Sections</button>
                  <button type="button" className="gp-btn-sm" onClick={() => setActiveId('recommendation')}>College Recommendations</button>
                </div>
              </div>
              <MessagingCenter role="adviser" title="Recent Messages" />
            </div>
          </div>
        );

      case 'students':
        return (
          <SectionBrowser
            title="Assigned Students & Sections"
            subtitle="Select a section to view its students and enrollment status."
          />
        );

      case 'encode':
        return (
          <div className="rd-section">
            <SectionHead title="Encode Grades" subtitle="Grade encoding and submission summary." />
            <GradeEncoder role="adviser" />
          </div>
        );

      case 'notifications':
        return (
          <div className="rd-section">
            <SectionHead
              title="Notifications"
              subtitle="Message students in your advisory section. Select a section, then a student."
            />
            <SectionMessenger role="adviser" />
          </div>
        );

      case 'recommendation':
        return (
          <div className="rd-section">
            <SectionHead
              title="College Recommendation"
              subtitle={recStudent ? `Viewing recommendation for ${recStudent.name}` : 'Select a section, then a student.'}
              actions={
                recStudent ? (
                  <button type="button" className="gp-btn-sm" onClick={() => setRecStudent(null)}>
                    ← Back to sections
                  </button>
                ) : null
              }
            />
            {recStudent ? (
              <CourseRecommendationPanel
                title={`Recommendation — ${recStudent.name}`}
                recommendation={getRecommendation(recStudent.id)}
                emptyMessage={`${recStudent.name} has not generated a recommendation yet.`}
              />
            ) : (
              <SectionBrowser
                title="Sections"
                subtitle="Select a section, then choose a student to view recommendations."
                onSelectStudent={setRecStudent}
              />
            )}
          </div>
        );

      case 'profile':
        return <ProfilePanel role="adviser" />;

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      brandInitials="AD"
      title="Adviser Dashboard"
      navItems={NAV_ITEMS}
      activeId={activeId}
      onNavigate={setActiveId}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdviserDashboard;
