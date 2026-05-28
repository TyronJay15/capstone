import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import RecaptchaField from './auth/RecaptchaField';
import { authenticate } from '../services/auth';
import { verifyRecaptcha } from '../services/recaptchaService';
import './Login.css';

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

    const result = authenticate({
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

    navigate(result.redirectTo);
    setIsLoading(false);
  };

  const idHelperText =
    loginAs === 'student'
      ? 'Enter your LRN (the student LRN used for account login).'
      : loginAs === 'parent'
        ? 'Use your registered parent email and your child’s LRN below.'
        : 'Staff: registrar@dampol.edu.ph, admin@dampol.edu.ph, or teacher@dampol.edu.ph | Password: password123';

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
                Log in as
              </label>
              <select
                id="loginAs"
                name="loginAs"
                value={loginAs}
                onChange={(e) => setLoginAs(e.target.value)}
                className="form-input"
                required
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="registrar">Registrar</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
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
                Registrar / Admin / Teacher — see staff emails above
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
