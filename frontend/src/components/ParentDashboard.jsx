import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead, Badge, ErrorState } from './common/Cards';
import { SkeletonGrid } from './common/Skeleton';
import GradeOverview from './grades/GradeOverview';
import MessagingCenter from './messaging/MessagingCenter';
import CourseRecommendationPanel from './recommendations/CourseRecommendationPanel';
import { getRecommendation } from './recommendations/recommendationStore';
import ProfilePanel from './profile/ProfilePanel';
import { getSession } from '../services/auth';
import { fetchStudentDashboard, mapStudentBundle } from '../services/studentApi';
import { fetchChildProfile, fetchLinkedChildren } from '../services/parentApi';
import './common/common.css';
import './common/roleDashboards.css';

function describeLoadError(err) {
  if (err?.isNetworkError) {
    return { title: 'Unable to reach the server', message: 'Check your connection and try again.' };
  }
  if (err?.status === 404) {
    return { title: 'Child record not found', message: 'Please contact the registrar.' };
  }
  if (err?.status >= 500) {
    return { title: 'Server error', message: 'Something went wrong on our end. Please try again in a moment.' };
  }
  return { title: 'Could not load your dashboard', message: err?.message || 'Please try again.' };
}

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
  const [loadError, setLoadError] = useState(null);
  const [noChild, setNoChild] = useState(false);

  // The child's identity is always resolved from the real, server-side
  // ParentStudentLink (via /parents/children/) — never from a cached LRN —
  // so a parent can never end up viewing an unlinked student's data.
  const loadDashboard = useCallback(async () => {
    if (!getSession().role) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setLoadError(null);
    setNoChild(false);

    try {
      const children = await fetchLinkedChildren();
      const firstChild = children[0];
      if (!firstChild) {
        setNoChild(true);
        setChild(null);
        setLoading(false);
        return;
      }

      const [profileResult, dashboardResult] = await Promise.allSettled([
        fetchChildProfile(firstChild.lrn),
        fetchStudentDashboard(firstChild.lrn)
      ]);

      const profileOk = profileResult.status === 'fulfilled';
      const dashboardOk = dashboardResult.status === 'fulfilled';

      if (!profileOk && !dashboardOk) {
        setLoadError(describeLoadError(profileResult.reason || dashboardResult.reason));
        setLoading(false);
        return;
      }

      const bundle = mapStudentBundle({
        profile: profileOk ? profileResult.value : null,
        dashboard: dashboardOk ? dashboardResult.value : null
      });
      setChild(bundle);
    } catch (err) {
      setLoadError(describeLoadError(err));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const grades = child?.grades || [];
  const avg = grades.length ? Number((grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(1)) : 0;
  const warnings = grades.filter((g) => g.grade < 80);
  const childRecommendation = getRecommendation(child?.id || child?.lrn || '');
  const recEmpty = 'The student has not generated a college course recommendation yet.';

  const renderContent = () => {
    // The profile tab has its own independent live-fetch, so a parent can
    // still view/edit their own profile even if the child dashboard failed.
    if (activeId === 'profile') {
      return <ProfilePanel role="parent" />;
    }

    if (loading) return <SkeletonGrid count={4} />;

    if (noChild) {
      return (
        <ErrorState
          icon="📭"
          title="No linked child found"
          message="Your parent account is not yet linked to a student record. Please contact the registrar."
        />
      );
    }

    if (loadError) {
      return <ErrorState title={loadError.title} message={loadError.message} onRetry={loadDashboard} />;
    }

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
