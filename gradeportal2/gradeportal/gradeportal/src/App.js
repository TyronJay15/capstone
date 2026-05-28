import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Programs from './components/Programs';
import Contact from './components/Contact';
import About from './components/About';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import RegistrarDashboard from './components/RegistrarDashboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AccountProfile from './components/AccountProfile';
import ProtectedRoute from './components/ProtectedRoute';
import ChatbotWidget from './components/chatbot/ChatbotWidget';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.key} className="route-transition">
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
            <ProtectedRoute allowedRoles={['student', 'parent']}>
              <Dashboard />
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
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute allowedRoles={['student', 'parent', 'registrar', 'admin', 'teacher']}>
              <AccountProfile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <AnimatedRoutes />
        <ChatbotWidget />
      </div>
    </Router>
  );
}

export default App;
