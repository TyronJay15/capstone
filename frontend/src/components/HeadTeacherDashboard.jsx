import React, { useState } from 'react';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead, Badge, EmptyState } from './common/Cards';
import FlashBanner from './ui/FlashBanner';
import ForecastingCards from './forecasting/ForecastingCards';
import ProfilePanel from './profile/ProfilePanel';
import AssignTeacherPanel from './headteacher/AssignTeacherPanel';
import AssignAdviserPanel from './headteacher/AssignAdviserPanel';
import SectioningPanel from './headteacher/SectioningPanel';
import AuditTrails from './headteacher/AuditTrails';
import { getSections, getSubmissions, setSubmissionStatus } from './grades/gradesApi';
import { getTeachers, getAdvisers } from './headteacher/headteacherApi';
import './common/common.css';
import './common/roleDashboards.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'assignAdviser', label: 'Assign Adviser', icon: '🧑‍🏫' },
  { id: 'assignSubject', label: 'Assign Subject Teacher', icon: '🗂️' },
  { id: 'sectioning', label: 'Sectioning', icon: '🔤' },
  { id: 'validation', label: 'Grade Validation', icon: '✅' },
  { id: 'audit', label: 'Audit Trails', icon: '🕘' },
  { id: 'forecasting', label: 'Enrollment Forecasting', icon: '📈' },
  { id: 'profile', label: 'My Profile', icon: '🪪' }
];

const STATUS_VARIANT = { approved: 'success', pending: 'warning', rejected: 'danger' };

const HeadTeacherDashboard = () => {
  const [activeId, setActiveId] = useState('overview');
  const [flash, setFlash] = useState({ kind: 'success', message: '' });
  // `version` bumps force a re-read of the in-memory submissions store.
  const [, setVersion] = useState(0);
  const [selected, setSelected] = useState(null);

  const sections = getSections();
  const submissions = getSubmissions();
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const teachers = getTeachers();
  const advisers = getAdvisers();

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  const validate = (id, status) => {
    setSubmissionStatus(id, status);
    setSelected(null);
    setVersion((v) => v + 1);
    showFlash('success', `Grade ${status}. Status updated in adviser & teacher summaries.`);
  };

  const renderContent = () => {
    switch (activeId) {
      case 'overview':
        return (
          <div className="gp-stack">
            <SectionHead title="Head Teacher Overview" subtitle="Assignments, sectioning, and grade validation." />
            <div className="gp-grid is-tight">
              <StatCard label="Advisers" value={advisers.length} icon="🧑‍🏫" />
              <StatCard label="Subject Teachers" value={teachers.length} icon="📚" variant="accent" />
              <StatCard label="Sections" value={sections.length} icon="🏫" />
              <StatCard label="Pending Validation" value={pendingCount} icon="✅" variant="warning" />
            </div>
            <ForecastingCards />
          </div>
        );

      case 'assignAdviser':
        return (
          <div className="rd-section">
            <AssignAdviserPanel />
          </div>
        );

      case 'assignSubject':
        return (
          <div className="rd-section">
            <AssignTeacherPanel />
          </div>
        );

      case 'sectioning':
        return <SectioningPanel />;

      case 'audit':
        return <AuditTrails />;

      case 'validation':
        if (selected) {
          return (
            <div className="rd-section">
              <SectionHead
                title={`Grade Validation — ${selected.studentName}`}
                subtitle={`${selected.section} · ${selected.subject} · ${selected.term}`}
                actions={<button type="button" className="gp-btn-sm" onClick={() => setSelected(null)}>← Back</button>}
              />
              <div className="gp-card">
                <div className="gp-grid is-tight">
                  <StatCard label="Grade" value={selected.grade} icon="📊" />
                  <StatCard label="Submitted" value={selected.submittedAt} icon="📅" variant="accent" />
                  <StatCard label="Last Modified" value={selected.lastModified} icon="✏️" />
                  <StatCard label="Status" value={selected.status} icon="🔖" variant={selected.status === 'pending' ? 'warning' : undefined} />
                </div>
                <div className="gp-row gp-mt">
                  <button type="button" className="btn btn-primary" onClick={() => validate(selected.id, 'approved')}>Approve</button>
                  <button type="button" className="btn btn-secondary" onClick={() => validate(selected.id, 'rejected')}>Reject</button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="rd-section">
            <SectionHead title="Grade Validation" subtitle="Review submitted grade summaries." />
            {submissions.length === 0 ? (
              <EmptyState icon="✅" title="Nothing to validate" />
            ) : (
              <div className="gp-grid">
                {submissions.map((s) => (
                  <button key={s.id} type="button" className="gp-card is-interactive" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setSelected(s)}>
                    <div className="gp-card-title">
                      <span className="gp-card-icon" aria-hidden="true">🗂️</span>
                      {s.studentName}
                    </div>
                    <p className="gp-card-desc">{s.section} · {s.subject} · {s.term}</p>
                    <div className="gp-row" style={{ marginTop: '0.5rem', justifyContent: 'space-between' }}>
                      <span>Submitted {s.submittedAt}</span>
                      <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'forecasting':
        return <ForecastingCards />;

      case 'profile':
        return <ProfilePanel role="head_teacher" />;

      default:
        return null;
    }
  };

  const navWithBadges = NAV_ITEMS.map((n) => (n.id === 'validation' && pendingCount ? { ...n, badge: pendingCount } : n));

  return (
    <DashboardLayout
      brandInitials="HT"
      title="Head Teacher Dashboard"
      navItems={navWithBadges}
      activeId={activeId}
      onNavigate={setActiveId}
    >
      <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />
      {renderContent()}
    </DashboardLayout>
  );
};

export default HeadTeacherDashboard;
