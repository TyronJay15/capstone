import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import {
  getAcademicYearOptions,
  createEnrollmentFromSignup,
  getCurrentAcademicYear,
  refreshEnrollmentStore
} from '../services/enrollmentStore';
import './SignUp.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    lastName: '',
    middleName: '',
    firstName: '',
    lrn: '',
    birthdate: '',
    age: '',
    gender: '',
    address: '',
    contactNumber: '',
    previousSchool: '',
    gradeLevelCurrent: '',
    gradeLevelEnrollment: '',
    schoolName: '',
    password: '',
    confirmPassword: '',
    academicYear: getCurrentAcademicYear()
  });
  const [yearOptions, setYearOptions] = useState(getAcademicYearOptions());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    refreshEnrollmentStore().catch((err) => {
      // API may not be available for unauthenticated users; fall back to localStorage
      console.log('Enrollment API unavailable, using local data:', err.message);
    }).then(() => {
      setYearOptions(getAcademicYearOptions());
      setFormData((prev) => ({ ...prev, academicYear: getCurrentAcademicYear() }));
    });
  }, []);

  const calculateAgeFromBirthdate = (birthdateStr) => {
    if (!birthdateStr) return '';
    const [y, m, d] = birthdateStr.split('-').map((x) => Number(x));
    if (!y || !m || !d) return '';

    const today = new Date();
    const dob = new Date(y, m - 1, d);

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    if (!Number.isFinite(age) || age < 0) return '';
    return String(age);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'birthdate') {
        return {
          ...prev,
          birthdate: value,
          age: calculateAgeFromBirthdate(value)
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await createEnrollmentFromSignup(formData);
      alert(
        'Enrollment application submitted successfully. The registrar will review your application. You may sign in after approval.'
      );
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Unable to submit enrollment application.');
    }
    setIsLoading(false);
  };

  return (
    <div className="signup-page">
      <AnimatedBackground />
      <div className="signup-container">
        <div className="signup-card fade-in">
          <div className="signup-header">
            <div className="school-logo">
              <img 
                src="/logo/logodampol.jpg" 
                alt="Dampol 1st National High School Logo" 
                className="logo-image"
              />
            </div>
            <h1 className="school-name">Dampol 1st National High School</h1>
            <h2 className="portal-title">Admission Registration</h2>
            <p className="motto">"Thy Light Shall Guide Us!"</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-row form-row-3">
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="middleName" className="form-label">Middle Name</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter middle name (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter first name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="lrn" className="form-label">LRN</label>
              <input
                type="text"
                id="lrn"
                name="lrn"
                value={formData.lrn}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter LRN"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthdate" className="form-label">Birthdate</label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="age" className="form-label">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  readOnly
                  className="form-input"
                  placeholder="Auto-calculated from birthdate"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender" className="form-label">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contactNumber" className="form-label">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input form-textarea"
                placeholder="Enter complete address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="previousSchool" className="form-label">Previous School (for transfer student)</label>
              <input
                type="text"
                id="previousSchool"
                name="previousSchool"
                value={formData.previousSchool}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter previous school (optional)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gradeLevelCurrent" className="form-label">Grade Level (Current)</label>
                <select
                  id="gradeLevelCurrent"
                  name="gradeLevelCurrent"
                  value={formData.gradeLevelCurrent}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select Current Grade (optional)</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="gradeLevelEnrollment" className="form-label">Grade Level for Enrollment</label>
                <select
                  id="gradeLevelEnrollment"
                  name="gradeLevelEnrollment"
                  value={formData.gradeLevelEnrollment}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select Enrollment Grade</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="schoolName" className="form-label">School Name</label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter school name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="academicYear" className="form-label">Academic Year</label>
                <select
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="signup-note">
              Section assignment is handled by the registrar after your application is reviewed.
            </p>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Confirm password"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary signup-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="signup-footer">
            <p className="login-link">
              Already have an account? <Link to="/login" className="link">Sign In</Link>
            </p>
            <Link to="/" className="btn btn-secondary home-back-btn">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
