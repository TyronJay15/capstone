import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Programs from './components/Programs';
import Contact from './components/Contact';
import About from './components/About';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotWidget from './components/chatbot/ChatbotWidget';
import ErrorBoundary from './components/common/ErrorBoundary';
import { SkeletonGrid } from './components/common/Skeleton';
import { ThemeProvider } from './theme/ThemeContext';
import './App.css';

// Lazy-loaded dashboards keep the initial bundle small and load on demand.
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const RegistrarDashboard = lazy(() => import('./components/RegistrarDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const SubjectTeacherDashboard = lazy(() => import('./components/SubjectTeacherDashboard'));
const AdviserDashboard = lazy(() => import('./components/AdviserDashboard'));
const HeadTeacherDashboard = lazy(() => import('./components/HeadTeacherDashboard'));
const AccountProfile = lazy(() => import('./components/AccountProfile'));

function RouteFallback() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <SkeletonGrid count={6} />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.key} className="route-transition">
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/registar" element={<Navigate to="/registrar" replace />} />
            <Route
              path="/registrar"
              element={
                <ProtectedRoute allowedRoles={['registrar']}>
                  <RegistrarDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/administrator"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <SubjectTeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <SubjectTeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adviser"
              element={
                <ProtectedRoute allowedRoles={['adviser']}>
                  <AdviserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/head-teacher"
              element={
                <ProtectedRoute allowedRoles={['head_teacher']}>
                  <HeadTeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute
                  allowedRoles={['student', 'parent', 'registrar', 'admin', 'teacher', 'adviser', 'head_teacher']}
                >
                  <AccountProfile />
                </ProtectedRoute>
              }
            />
            {/* Unknown URLs fall back to the landing page instead of rendering blank. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <AnimatedRoutes />
          <ChatbotWidget />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
