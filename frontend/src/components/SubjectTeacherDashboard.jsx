import React, { useState } from 'react';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead } from './common/Cards';
import SectionBrowser from './sections/SectionBrowser';
import GradeEncoder from './grades/GradeEncoder';
import MessagingCenter from './messaging/MessagingCenter';
import SectionMessenger from './messaging/SectionMessenger';
import ProfilePanel from './profile/ProfilePanel';
import { getSections } from './grades/gradesApi';
import './common/common.css';
import './common/roleDashboards.css';

// Demo assignment for the signed-in subject teacher.
const TEACHER_SUBJECT = 'Mathematics';
const SECTION_ADVISERS = [
  { id: 'adv-11-A', name: 'Mrs. Maria Santos', role: 'Section Adviser', sectionId: '11-A' },
  { id: 'adv-11-B', name: 'Mr. Jose Rizal', role: 'Section Adviser', sectionId: '11-B' },
  { id: 'adv-12-STEM-A', name: 'Ms. Ana Cruz', role: 'Section Adviser', sectionId: '12-STEM-A' }
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'sections', label: 'Assigned Students & Sections', icon: '🏫' },
  { id: 'encode', label: 'Encode Grades', icon: '✏️' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', badge: 1 },
  { id: 'profile', label: 'My Profile', icon: '🪪' }
];

const SubjectTeacherDashboard = () => {
  const [activeId, setActiveId] = useState('overview');
  const sections = getSections();

  const renderContent = () => {
    switch (activeId) {
      case 'overview':
        return (
          <div className="gp-stack">
            <SectionHead title="Subject Teacher Overview" subtitle="Your assigned classes and tasks at a glance." />
            <div className="gp-grid is-tight">
              <StatCard label="Assigned Sections" value={sections.length} icon="🏫" />
              <StatCard label="Subjects" value={2} icon="📚" variant="accent" />
              <StatCard label="Pending Submissions" value={1} icon="🕒" variant="warning" />
              <StatCard label="Incomplete Students" value={3} icon="⚠️" variant="danger" />
            </div>
            <div className="dash-two-col">
              <div className="gp-card">
                <div className="gp-card-title">Quick Tasks</div>
                <div className="gp-stack gp-mt">
                  <button type="button" className="gp-btn-sm is-primary" onClick={() => setActiveId('encode')}>Encode Grades</button>
                  <button type="button" className="gp-btn-sm" onClick={() => setActiveId('sections')}>View Assigned Students</button>
                  <button type="button" className="gp-btn-sm" onClick={() => setActiveId('notifications')}>Notify Students</button>
                </div>
              </div>
              <MessagingCenter role="teacher" title="Recent Messages" />
            </div>
          </div>
        );
      case 'sections':
        return (
          <SectionBrowser
            title="Assigned Students & Sections"
            subtitle={`Students enrolled in your subject: ${TEACHER_SUBJECT}.`}
            subject={TEACHER_SUBJECT}
            showSubject
          />
        );
      case 'encode':
        return (
          <div className="rd-section">
            <SectionHead title="Encode Grades" subtitle="Select section, subject, student and term, then submit." />
            <GradeEncoder role="teacher" withSubject />
          </div>
        );
      case 'notifications':
        return (
          <div className="rd-section">
            <SectionHead
              title="Notifications"
              subtitle="Message students in your subject and the section adviser."
            />
            <SectionMessenger role="teacher" subject={TEACHER_SUBJECT} extraContacts={SECTION_ADVISERS} />
          </div>
        );
      case 'profile':
        return <ProfilePanel role="teacher" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      brandInitials="ST"
      title="Subject Teacher Dashboard"
      navItems={NAV_ITEMS}
      activeId={activeId}
      onNavigate={setActiveId}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default SubjectTeacherDashboard;
