import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead, Badge } from './common/Cards';
import { SkeletonGrid } from './common/Skeleton';
import GradeOverview from './grades/GradeOverview';
import MessagingCenter from './messaging/MessagingCenter';
import CourseRecommendationPanel from './recommendations/CourseRecommendationPanel';
import { getRecommendation } from './recommendations/recommendationStore';
import ProfilePanel from './profile/ProfilePanel';
import { getSession, refreshStudentSession } from '../services/auth';
import { getApiBaseUrl } from '../services/apiClient';
import './common/common.css';
import './common/roleDashboards.css';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'grades', label: 'Grades', icon: '📊' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', badge: 1 },
  { id: 'recommendation', label: 'Course Recommendation', icon: '🧭' },
  { id: 'profile', label: 'My Profile', icon: '🪪' }
];

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('overview');
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const stored = localStorage.getItem('currentStudent');
      if (getApiBaseUrl() && localStorage.getItem('accessToken')) {
        try {
          const dash = await refreshStudentSession();
          if (!cancelled && dash) {
            setChild(dash);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      if (stored) {
        if (!cancelled) setChild(JSON.parse(stored));
      } else if (!getSession().role) {
        navigate('/login');
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const grades = child?.grades || [];
  const avg = grades.length ? Number((grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(1)) : 0;
  const warnings = grades.filter((g) => g.grade < 80);
  const childRecommendation = getRecommendation(child?.id || child?.lrn || '');
  const recEmpty = 'The student has not generated a college course recommendation yet.';

  const renderContent = () => {
    if (loading) return <SkeletonGrid count={4} />;

    switch (activeId) {
      case 'overview':
        return (
          <div className="gp-stack">
            <SectionHead
              title={`Monitoring: ${child?.name || 'Your Child'}`}
              subtitle={`LRN ${child?.id || '—'} · ${child?.grade || ''} ${child?.section || ''}`}
            />
            <div className="gp-grid is-tight">
              <StatCard label="Child Average" value={avg || '—'} icon="📊" />
              <StatCard label="GPA (4.0)" value={grades.length ? ((avg / 100) * 4).toFixed(2) : '—'} icon="🎯" variant="accent" />
              <StatCard label="Academic Warnings" value={warnings.length} icon="⚠️" variant={warnings.length ? 'danger' : undefined} />
              <StatCard label="Enrollment" value={child?.status || 'Enrolled'} icon="📝" />
            </div>

            {warnings.length > 0 ? (
              <div className="gp-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <div className="gp-card-title">⚠️ Academic Warnings</div>
                <p className="gp-card-desc">Subjects currently below 80 — please monitor closely:</p>
                <div className="gp-row" style={{ marginTop: '0.5rem' }}>
                  {warnings.map((g) => (
                    <Badge key={g.subject} variant="danger">{g.subject}: {g.grade}</Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="dash-two-col">
              <CourseRecommendationPanel recommendation={childRecommendation} emptyMessage={recEmpty} />
              <MessagingCenter role="parent" title="Notifications" />
            </div>
          </div>
        );
      case 'grades':
        return <GradeOverview student={child} heading="Child Grades" showTermFilter />;
      case 'notifications':
        return <MessagingCenter role="parent" title="Notifications" />;
      case 'recommendation':
        return <CourseRecommendationPanel recommendation={childRecommendation} emptyMessage={recEmpty} />;
      case 'profile':
        return <ProfilePanel role="parent" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      brandInitials="PA"
      title="Parent Dashboard"
      navItems={NAV_ITEMS}
      activeId={activeId}
      onNavigate={setActiveId}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default ParentDashboard;
