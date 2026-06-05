// src/components/SignUp.jsx
// Same UI as before, but handleSubmit now POSTs to Django instead of
// writing to localStorage.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import { getCurrentAcademicYear, submitEnrollment } from '../services/api';
import './SignUp.css';

const GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const SignUp = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState(null);
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
    academicYearId: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load academic years from Django on mount
  useEffect(() => {
    getCurrentAcademicYear()
      .then((data) => {
        // data is a single object: { id, label, is_current, ... }
        setCurrentAcademicYearId(data.id);
        setAcademicYears([data]);           // Add more years via GET /enrollment/academic-years/ if needed
        setFormData((prev) => ({ ...prev, academicYearId: data.id }));
      })
      .catch(() => {
        // If the backend is unreachable, show a sensible message
        setError('Could not connect to the server. Please try again later.');
      });
  }, []);

  const calculateAge = (birthdateStr) => {
    if (!birthdateStr) return '';
    const [y, m, d] = birthdateStr.split('-').map(Number);
    if (!y || !m || !d) return '';
    const today = new Date();
    let age = today.getFullYear() - y;
    if (
      today.getMonth() + 1 < m ||
      (today.getMonth() + 1 === m && today.getDate() < d)
    ) age -= 1;
    return Number.isFinite(age) && age >= 0 ? String(age) : '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'birthdate' ? { age: calculateAge(value) } : {}),
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!formData.academicYearId) {
      setError('Academic year could not be loaded. Please refresh the page.');
      return;
    }

    setIsLoading(true);

    // Map camelCase form fields → snake_case Django fields
    const payload = {
      lrn:                     formData.lrn.trim(),
      first_name:              formData.firstName.trim(),
      middle_name:             formData.middleName.trim(),
      last_name:               formData.lastName.trim(),
      birthdate:               formData.birthdate || null,
      age:                     formData.age ? Number(formData.age) : null,
      gender:                  formData.gender,
      address:                 formData.address.trim(),
      contact_number:          formData.contactNumber.trim(),
      previous_school:         formData.previousSchool.trim(),
      grade_level_current:     formData.gradeLevelCurrent,
      grade_level_enrollment:  formData.gradeLevelEnrollment,
      school_name:             formData.schoolName.trim(),
      academic_year:           formData.academicYearId,   // Django FK expects the PK
      submitted_info:          'Online admission registration form',
    };

    try {
      await submitEnrollment(payload);
      alert(
        'Enrollment application submitted successfully!\n\n' +
        'The registrar will review your application. You may sign in after approval.'
      );
      navigate('/login');
    } catch (err) {
      // err.data may have field-level errors from DRF
      if (err.data && typeof err.data === 'object') {
        const fieldErrors = Object.entries(err.data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('\n');
        setError(fieldErrors || err.message);
      } else {
        setError(err.message || 'Unable to submit enrollment application. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
            {/* Name row */}
            <div className="form-row form-row-3">
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input type="text" id="lastName" name="lastName"
                  value={formData.lastName} onChange={handleChange}
                  className="form-input" placeholder="Enter last name" required />
              </div>
              <div className="form-group">
                <label htmlFor="middleName" className="form-label">Middle Name</label>
                <input type="text" id="middleName" name="middleName"
                  value={formData.middleName} onChange={handleChange}
                  className="form-input" placeholder="Optional" />
              </div>
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input type="text" id="firstName" name="firstName"
                  value={formData.firstName} onChange={handleChange}
                  className="form-input" placeholder="Enter first name" required />
              </div>
            </div>

            {/* LRN */}
            <div className="form-group">
              <label htmlFor="lrn" className="form-label">LRN</label>
              <input type="text" id="lrn" name="lrn"
                value={formData.lrn} onChange={handleChange}
                className="form-input" placeholder="Enter LRN" required />
            </div>

            {/* Birthdate + Age */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthdate" className="form-label">Birthdate</label>
                <input type="date" id="birthdate" name="birthdate"
                  value={formData.birthdate} onChange={handleChange}
                  className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="age" className="form-label">Age</label>
                <input type="number" id="age" name="age"
                  value={formData.age} readOnly
                  className="form-input" placeholder="Auto-calculated" />
              </div>
            </div>

            {/* Gender + Contact */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender" className="form-label">Gender</label>
                <select id="gender" name="gender"
                  value={formData.gender} onChange={handleChange}
                  className="form-input" required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="contactNumber" className="form-label">Contact Number</label>
                <input type="tel" id="contactNumber" name="contactNumber"
                  value={formData.contactNumber} onChange={handleChange}
                  className="form-input" placeholder="Enter contact number" required />
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address" className="form-label">Address</label>
              <textarea id="address" name="address"
                value={formData.address} onChange={handleChange}
                className="form-input form-textarea"
                placeholder="Enter complete address" required />
            </div>

            {/* Previous school */}
            <div className="form-group">
              <label htmlFor="previousSchool" className="form-label">Previous School (transfer students)</label>
              <input type="text" id="previousSchool" name="previousSchool"
                value={formData.previousSchool} onChange={handleChange}
                className="form-input" placeholder="Optional" />
            </div>

            {/* Grade levels */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gradeLevelCurrent" className="form-label">Current Grade Level</label>
                <select id="gradeLevelCurrent" name="gradeLevelCurrent"
                  value={formData.gradeLevelCurrent} onChange={handleChange}
                  className="form-input">
                  <option value="">Optional</option>
                  {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="gradeLevelEnrollment" className="form-label">Enrolling for Grade Level</label>
                <select id="gradeLevelEnrollment" name="gradeLevelEnrollment"
                  value={formData.gradeLevelEnrollment} onChange={handleChange}
                  className="form-input" required>
                  <option value="">Select Grade</option>
                  {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* School name + Academic year */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="schoolName" className="form-label">School Name</label>
                <input type="text" id="schoolName" name="schoolName"
                  value={formData.schoolName} onChange={handleChange}
                  className="form-input" placeholder="Enter school name" required />
              </div>
              <div className="form-group">
                <label htmlFor="academicYearId" className="form-label">Academic Year</label>
                <select id="academicYearId" name="academicYearId"
                  value={formData.academicYearId} onChange={handleChange}
                  className="form-input" required>
                  <option value="">— loading —</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="signup-note">
              Section assignment is handled by the registrar after your application is reviewed.
            </p>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" id="password" name="password"
                value={formData.password} onChange={handleChange}
                className="form-input" placeholder="Enter password" required />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                className="form-input" placeholder="Confirm password" required />
            </div>

            {error && (
              <div className="error-message" style={{ whiteSpace: 'pre-wrap' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary signup-btn" disabled={isLoading}>
              {isLoading ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>

          <div className="signup-footer">
            <p className="login-link">
              Already have an account? <Link to="/login" className="link">Sign In</Link>
            </p>
            <Link to="/" className="btn btn-secondary home-back-btn">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
