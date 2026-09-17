import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProfilePanel from './profile/ProfilePanel';
import ThemeToggle from '../theme/ThemeToggle';
import { logout, getSession, ROLE_HOME_ROUTES } from '../services/auth';
import './common/common.css';
import './AccountProfile.css';

const AccountProfile = () => {
  const navigate = useNavigate();
  const { role } = getSession();
  const home = ROLE_HOME_ROUTES[role] || '/login';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="account-page-wrap">
      <header className="account-topbar">
        <div className="account-topbar-inner">
          <div className="account-brand">
            <div className="account-brand-logo">GP</div>
            <div>
              <div className="account-brand-title">My Account</div>
              <div className="account-brand-subtitle">Dampol 1st National High School</div>
            </div>
          </div>
          <div className="account-actions">
            <ThemeToggle />
            <Link className="btn btn-secondary" to={home}>
              Back to Dashboard
            </Link>
            <button type="button" className="btn btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="account-main-wrap">
        <ProfilePanel role={role} />
      </main>
    </div>
  );
};

export default AccountProfile;
