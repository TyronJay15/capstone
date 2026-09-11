import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './common/DashboardLayout';
import { StatCard, SectionHead } from './common/Cards';
import { SkeletonGrid } from './common/Skeleton';
import ProfilePanel from './profile/ProfilePanel';
import GradeOverview from './grades/GradeOverview';
import StrandExplorer from './enrollment/StrandExplorer';
import MessagingCenter from './messaging/MessagingCenter';
import CourseRecommendationPanel from './recommendations/CourseRecommendationPanel';
import { generateRecommendation, getRecommendation } from './recommendations/recommendationStore';
import RegistrationStatus from './student/RegistrationStatus';
import { getSession, refreshStudentSession } from '../services/auth';
import { getApiBaseUrl } from '../services/apiClient';
import './common/common.css';
import './common/roleDashboards.css';

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
  const [recommendation, setRecommendation] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const stored = localStorage.getItem('currentStudent');
      if (getApiBaseUrl() && localStorage.getItem('accessToken')) {
        try {
          const dash = await refreshStudentSession();
          if (!cancelled && dash) {
            setStudent(dash);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }
      if (stored) {
        if (!cancelled) setStudent(JSON.parse(stored));
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

  const statusValue = String(student?.status || student?.enrollmentStatus || '')
    .toLowerCase()
    .replace(/\s+/g, '_');
  const isPending = ['pending', 'under_review', 'submitted', 'for_review', 'pending_approval'].includes(statusValue);

  const renderContent = () => {
    if (loading) return <SkeletonGrid count={6} />;

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
              <StatCard label="Enrollment" value={student?.status || 'Enrolled'} icon="📝" />
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
        return <StrandExplorer enrollmentStatus={isPending ? 'review' : 'enrolled'} />;
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
