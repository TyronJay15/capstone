import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import FlashBanner from './ui/FlashBanner';
import { clearSession } from '../services/auth';
import './AccountProfile.css';

const readRole = () => {
  const raw = (localStorage.getItem('currentRole') || 'student').toLowerCase();
  if (raw === 'registrar' || raw === 'admin' || raw === 'teacher' || raw === 'student' || raw === 'parent')
    return raw;
  return 'student';
};

const roleHome = (role) => {
  if (role === 'registrar') return '/registrar';
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher';
  if (role === 'parent') return '/dashboard';
  return '/dashboard';
};

const AccountProfile = () => {
  const navigate = useNavigate();
  const role = useMemo(() => readRole(), []);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [religion, setReligion] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');

  const [flash, setFlash] = useState({ kind: 'success', message: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const key = `accountProfile:${role}`;
    const stored = localStorage.getItem(key);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      setPhone(parsed.phone || '');
      setAddress(parsed.address || '');
      setReligion(parsed.religion || '');
      setEmergencyContact(parsed.emergencyContact || '');
      setNotes(parsed.notes || '');
    } catch {
      // ignore corrupt storage
    }
  }, [role]);

  const displayName = useMemo(() => {
    if (role === 'student') {
      try {
        const s = JSON.parse(localStorage.getItem('currentStudent') || 'null');
        return s?.name || 'Student';
      } catch {
        return 'Student';
      }
    }

    const email = localStorage.getItem('currentUserEmail') || '';
    return email ? email : `${role.charAt(0).toUpperCase()}${role.slice(1)} User`;
  }, [role]);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !address.trim()) {
      setError('Please enter at least a phone number and address (mock validation).');
      setFlash({ kind: 'error', message: '' });
      return;
    }

    const payload = {
      phone: phone.trim(),
      address: address.trim(),
      religion: religion.trim(),
      emergencyContact: emergencyContact.trim(),
      notes: notes.trim(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`accountProfile:${role}`, JSON.stringify(payload));
    console.log('[mock] update profile', { role, payload });

    setFlash({ kind: 'success', message: 'Profile updated (frontend-only).' });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  return (
    <div className="account-page">
      <AnimatedBackground />

      <nav className="account-navbar">
        <div className="account-navbar-inner">
          <div className="account-brand">
            <div className="account-brand-logo">GP</div>
            <div>
              <div className="account-brand-title">My Account</div>
              <div className="account-brand-subtitle">Dampol 1st National High School</div>
            </div>
          </div>

          <div className="account-actions">
            <Link className="account-btn account-btn-outline" to={roleHome(role)}>
              Back to Dashboard
            </Link>
            <button type="button" className="account-btn account-btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="account-main">
        <div className="account-container">
          <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />

          <div className="account-card">
            <div className="account-card-header">
              <div>
                <div className="account-card-kicker">Signed in as</div>
                <div className="account-card-title">{displayName}</div>
                <div className="account-card-meta">
                  Role: <span className="account-pill">{role}</span>
                </div>
              </div>
            </div>

            <form className="account-form" onSubmit={handleSubmit}>
              {error ? <div className="account-error">{error}</div> : null}

              <div className="account-grid">
                <label className="account-field">
                  <span className="account-label">Phone Number</span>
                  <input className="account-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxxx" />
                </label>

                <label className="account-field">
                  <span className="account-label">Religion</span>
                  <input className="account-input" value={religion} onChange={(e) => setReligion(e.target.value)} placeholder="Optional" />
                </label>

                <label className="account-field account-field-wide">
                  <span className="account-label">Address</span>
                  <textarea className="account-textarea" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Street, barangay, city/province" />
                </label>

                <label className="account-field account-field-wide">
                  <span className="account-label">Emergency Contact</span>
                  <input
                    className="account-input"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Name + relationship + phone"
                  />
                </label>

                <label className="account-field account-field-wide">
                  <span className="account-label">Other Notes</span>
                  <textarea className="account-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything else you want on file (mock)" />
                </label>
              </div>

              <div className="account-actions-row">
                <button type="submit" className="account-btn account-btn-primary">
                  Update Profile
                </button>
                <button
                  type="button"
                  className="account-btn account-btn-outline"
                  onClick={() => {
                    setError('');
                    setFlash({ kind: 'error', message: 'Mock error: could not sync to server (no backend yet).' });
                    window.setTimeout(() => setFlash({ kind: 'error', message: '' }), 3500);
                  }}
                >
                  Simulate Sync Error
                </button>
              </div>

              <div className="account-footnote">This page stores values in localStorage for demo purposes only.</div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountProfile;
