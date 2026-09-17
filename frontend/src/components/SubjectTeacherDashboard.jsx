import React, { useCallback, useEffect, useState } from 'react';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead } from './common/Cards';
import { SkeletonGrid } from './common/Skeleton';
import TeacherRoster from './teacher/TeacherRoster';
import TeacherGradeManager from './teacher/TeacherGradeManager';
import MessagingCenter from './messaging/MessagingCenter';
import SectionMessenger from './messaging/SectionMessenger';
import ProfilePanel from './profile/ProfilePanel';
import { fetchTeacherAssignments, fetchTeacherRoster } from '../services/teacherApi';
import './common/common.css';
import './common/roleDashboards.css';

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
  const [summary, setSummary] = useState({ sections: 0, subjects: 0, students: 0, pendingConsent: 0 });
  const [summaryLoading, setSummaryLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [assignments, roster] = await Promise.all([
        fetchTeacherAssignments(),
        fetchTeacherRoster()
      ]);
      const sectionNames = new Set(assignments.map((a) => a.section_name).filter(Boolean));
      const subjectIds = new Set(assignments.map((a) => a.subject));
      setSummary({
        sections: sectionNames.size,
        subjects: subjectIds.size,
        students: roster.length,
        pendingConsent: roster.filter((s) => !s.parentConsent).length
      });
    } catch {
      // Overview stats are best-effort; the roster/encode tabs surface real errors.
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const renderContent = () => {
    switch (activeId) {
      case 'overview':
        return (
          <div className="gp-stack">
            <SectionHead title="Subject Teacher Overview" subtitle="Your assigned classes and tasks at a glance." />
            {summaryLoading ? (
              <SkeletonGrid count={4} />
            ) : (
              <div className="gp-grid is-tight">
                <StatCard label="Assigned Sections" value={summary.sections} icon="🏫" />
                <StatCard label="Subjects" value={summary.subjects} icon="📚" variant="accent" />
                <StatCard label="Assigned Students" value={summary.students} icon="👥" />
                <StatCard label="Pending Parent Consent" value={summary.pendingConsent} icon="⚠️" variant="danger" />
              </div>
            )}
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
        return <TeacherRoster />;
      case 'encode':
        return (
          <div className="rd-section">
            <SectionHead title="Encode Grades" subtitle="Add, edit, delete or bulk-encode grades for your assigned subjects." />
            <TeacherGradeManager />
          </div>
        );
      case 'notifications':
        return (
          <div className="rd-section">
            <SectionHead
              title="Notifications"
              subtitle="Message students in your subject and the section adviser."
            />
            <SectionMessenger role="teacher" subject="" extraContacts={SECTION_ADVISERS} />
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
