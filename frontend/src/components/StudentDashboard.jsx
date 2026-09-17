import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead, ErrorState } from './common/Cards';
import { SkeletonGrid } from './common/Skeleton';
import ProfilePanel from './profile/ProfilePanel';
import GradeOverview from './grades/GradeOverview';
import StrandExplorer from './enrollment/StrandExplorer';
import MessagingCenter from './messaging/MessagingCenter';
import CourseRecommendationPanel from './recommendations/CourseRecommendationPanel';
import { generateRecommendation, getRecommendation } from './recommendations/recommendationStore';
import RegistrationStatus from './student/RegistrationStatus';
import { getSession, setSession } from '../services/auth';
import { fetchStudentDashboard, fetchStudentProfile, mapStudentBundle } from '../services/studentApi';
import './common/common.css';
import './common/roleDashboards.css';

function describeLoadError(err) {
  if (err?.isNetworkError) {
    return { title: 'Unable to reach the server', message: 'Check your connection and try again.' };
  }
  if (err?.status === 404) {
    return {
      title: 'No student profile found',
      message: 'Your account is not yet linked to a student record. Please contact the registrar.'
    };
  }
  if (err?.status >= 500) {
    return { title: 'Server error', message: 'Something went wrong on our end. Please try again in a moment.' };
  }
  return { title: 'Could not load your dashboard', message: err?.message || 'Please try again.' };
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'profile', label: 'My Profile', icon: '🪪' },
  { id: 'grades', label: 'Grades', icon: '📊' },
  { id: 'enrollment', label: 'Admission / Enrollment', icon: '📝' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', badge: 1 },
  { id: 'recommendation', label: 'Course Recommendation', icon: '🧭' }
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('overview');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Profile and grades are always fetched fresh from the backend — the
  // database is the source of truth, not any cached copy in localStorage.
  const loadDashboard = useCallback(async () => {
    if (!getSession().role) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setLoadError(null);

    const [profileResult, dashboardResult] = await Promise.allSettled([
      fetchStudentProfile(),
      fetchStudentDashboard()
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
    setStudent(bundle);
    // Keep the cached session copy in sync for other pages (e.g. the login
    // redirect target), but it is never read back as authoritative data.
    setSession({ role: 'student', email: bundle.email, student: bundle });
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const studentKey = student?.id || student?.lrn || '';

  useEffect(() => {
    if (studentKey) setRecommendation(getRecommendation(studentKey));
  }, [studentKey]);

  const handleGenerate = () => {
    if (!studentKey) return;
    setGenerating(true);
    // Small delay so the action reads as "generating" (placeholder for API call).
    window.setTimeout(() => {
      setRecommendation(generateRecommendation(studentKey, student));
      setGenerating(false);
    }, 500);
  };

  const grades = student?.grades || [];
  const avg = grades.length ? Number((grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(1)) : 0;
  const onTrack = grades.filter((g) => g.grade >= 85).length;

  const statusValue = String(student?.enrollmentStatus || student?.status || '')
    .toLowerCase()
    .replace(/\s+/g, '_');
  const isPending = ['pending', 'under_review', 'submitted', 'for_review', 'pending_approval'].includes(statusValue);
  const hasEnrollmentRecord = Boolean(student?.section || student?.academicYear || student?.enrollmentStatus);

  const renderContent = () => {
    if (loading) return <SkeletonGrid count={6} />;

    if (loadError) {
      return <ErrorState title={loadError.title} message={loadError.message} onRetry={loadDashboard} />;
    }

    if (isPending && activeId === 'overview') {
      return <RegistrationStatus currentStatus={statusValue === 'submitted' ? 'submitted' : 'review'} studentName={student?.name} />;
    }

    switch (activeId) {
      case 'overview':
        return (
          <div className="gp-stack">
            <SectionHead title={`Welcome, ${student?.name || 'Student'}`} subtitle="Here is your academic snapshot." />
            <div className="gp-grid is-tight">
              <StatCard label="Average Grade" value={avg || '—'} icon="📊" />
              <StatCard label="On Track" value={`${onTrack} subjects`} icon="✅" variant="accent" />
              <StatCard label="Enrollment" value={student?.enrollmentStatus || 'Enrolled'} icon="📝" />
              <StatCard label="Section" value={student?.section || '—'} icon="🏫" />
            </div>
            <div className="dash-two-col">
              <CourseRecommendationPanel recommendation={recommendation} />
              <MessagingCenter role="student" title="Recent Notifications" />
            </div>
          </div>
        );
      case 'profile':
        return <ProfilePanel role="student" />;
      case 'grades':
        return (
          <div className="gp-stack">
            <GradeOverview student={student} heading="Grades" />
          </div>
        );
      case 'enrollment':
        return (
          <div className="gp-stack">
            <SectionHead title="Enrollment Information" subtitle="Your current enrollment record." />
            {hasEnrollmentRecord ? (
              <div className="gp-grid is-tight">
                <StatCard label="Status" value={student?.enrollmentStatus || 'Enrolled'} icon="📝" />
                <StatCard label="Academic Year" value={student?.academicYear || '—'} icon="🗓️" />
                <StatCard label="Grade Level" value={student?.grade || '—'} icon="🎓" />
                <StatCard label="Section" value={student?.section || '—'} icon="🏫" />
              </div>
            ) : (
              <ErrorState
                icon="📭"
                title="No enrollment record found"
                message="Your account is not yet linked to an enrollment record. Please contact the registrar."
              />
            )}
            <StrandExplorer enrollmentStatus={isPending ? 'review' : 'enrolled'} />
          </div>
        );
      case 'notifications':
        return <MessagingCenter role="student" title="Notifications" />;
      case 'recommendation':
        return (
          <div className="gp-stack">
            <CourseRecommendationPanel
              recommendation={recommendation}
              canGenerate
              generating={generating}
              onGenerate={handleGenerate}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      brandInitials="ST"
      title="Student Dashboard"
      navItems={NAV_ITEMS}
      activeId={activeId}
      onNavigate={setActiveId}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default StudentDashboard;
