import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import RecaptchaField from './auth/RecaptchaField';
import { authenticate, ROLE_HOME_ROUTES, ROLE_LABELS, ROLES } from '../services/auth';
import { verifyRecaptcha } from '../services/recaptchaService';
import ThemeToggle from '../theme/ThemeToggle';
import './Login.css';

// Account types shown in the selector (order matters for UX).
const LOGIN_ROLE_OPTIONS = [
  ROLES.STUDENT,
  ROLES.PARENT,
  ROLES.ADVISER,
  ROLES.TEACHER, // labelled "Subject Teacher"
  ROLES.HEAD_TEACHER,
  ROLES.ADMIN
];

const Login = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    password: '',
    childLrn: ''
  });
  const [loginAs, setLoginAs] = useState('student');
  const [error, setError] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaState, setCaptchaState] = useState({ token: null, demoChecked: false });
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setCaptchaError('');

    const captcha = await verifyRecaptcha(captchaState);
    if (!captcha.ok) {
      setCaptchaError(captcha.error);
      setIsLoading(false);
      return;
    }

    const result = await authenticate({
      loginAs,
      identifier: formData.studentId,
      password: formData.password,
      childLrn: formData.childLrn
    });

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Always route to the dashboard that matches the authenticated role.
    navigate(result.redirectTo || ROLE_HOME_ROUTES[loginAs] || '/login');
    setIsLoading(false);
  };

  const idHelperText =
    loginAs === 'student'
      ? 'Approved students: LRN (e.g. 2025-001) + password password123.'
      : loginAs === 'parent'
        ? 'parent@dampol.edu.ph + child LRN 2025-001 + password password123'
        : `Staff: ${loginAs === 'head_teacher' ? 'headteacher' : loginAs}@dampol.edu.ph + password password123`;

  const idLabel =
    loginAs === 'student' ? 'LRN' : loginAs === 'parent' ? 'Parent email' : 'Email';
  const idPlaceholder =
    loginAs === 'student'
      ? 'Enter your LRN'
      : loginAs === 'parent'
        ? 'parent@dampol.edu.ph'
        : 'Enter your email';
  const idInputType = loginAs === 'student' ? 'text' : 'email';

  return (
    <div className="login-page">
      <AnimatedBackground />
      <div className="login-container">
        <div className="login-card fade-in">
          <div className="login-toolbar">
            <ThemeToggle />
          </div>
          <div className="login-header">
            <div className="school-logo">
              <img
                src="/logo/logodampol.jpg"
                alt="Dampol 1st National High School Logo"
                className="logo-image"
              />
            </div>
            <h1 className="school-name">Dampol 1st National High School</h1>
            <h2 className="portal-title">Grading Portal</h2>
            <p className="motto">"Thy Light Shall Guide Us!"</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="studentId" className="form-label">
                {idLabel}
              </label>
              <input
                type={idInputType}
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className="form-input"
                placeholder={idPlaceholder}
                required
              />
              <div className="login-helper-text" aria-live="polite">
                {idHelperText}
              </div>
            </div>

            {loginAs === 'parent' ? (
              <div className="form-group">
                <label htmlFor="childLrn" className="form-label">
                  Child&apos;s LRN
                </label>
                <input
                  type="text"
                  id="childLrn"
                  name="childLrn"
                  value={formData.childLrn}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your child's LRN"
                  required
                />
              </div>
            ) : null}

            <div className="form-group">
              <label htmlFor="loginAs" className="form-label">
                Account Type
              </label>
              <select
                id="loginAs"
                name="loginAs"
                value={loginAs}
                onChange={(e) => setLoginAs(e.target.value)}
                className="form-input"
                required
              >
                {LOGIN_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <RecaptchaField onChange={setCaptchaState} error={captchaError} />

            <div className="login-account-links">
              <button
                type="button"
                className="login-text-link"
                onClick={() =>
                  setNotice('Password reset: enter your registered email and we will send reset instructions.')
                }
              >
                Forgot Password?
              </button>
              <button
                type="button"
                className="login-text-link"
                onClick={() =>
                  setNotice('Change Password: sign in first, then update your password from My Account → Security.')
                }
              >
                Change Password
              </button>
            </div>

            {notice && (
              <div className="login-notice" role="status">
                {notice}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="signup-link">
              Don&apos;t have an account? <Link to="/signup" className="link">Sign Up</Link>
            </p>
            <Link to="/" className="btn btn-secondary home-back-btn">
              ← Back to Home
            </Link>
            <div className="demo-info">
              <p className="demo-text">Demo Credentials:</p>
              <p className="demo-credentials">Student (LRN): 2025-001 | Password: password123</p>
              <p className="demo-credentials" style={{ marginTop: 6 }}>
                Parent: parent@dampol.edu.ph + child LRN 2025-001 | Password: password123
              </p>
              <p className="demo-credentials" style={{ marginTop: 6 }}>
                Staff: admin@ · adviser@ · teacher@ · headteacher@dampol.edu.ph | Password: password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
