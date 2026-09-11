import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../theme/ThemeToggle';
import { useMobileNav } from '../../hooks/useMobileNav';
import { clearSession } from '../../services/auth';
import './DashboardLayout.css';

const DashboardLayout = ({
  brandInitials = 'GP',
  title,
  subtitle = 'Dampol 1st National High School',
  navItems = [],
  activeId,
  onNavigate,
  headerActions,
  children
}) => {
  const navigate = useNavigate();
  const { navOpen, toggleNav, closeNav } = useMobileNav();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const handleNavClick = (id) => {
    onNavigate?.(id);
    closeNav();
  };

  return (
    <div className="gp-shell">
      <button
        type="button"
        className={`gp-shell-overlay ${navOpen ? 'is-visible' : ''}`}
        onClick={closeNav}
        aria-label="Close navigation menu"
      />

      <aside className={`gp-sidebar ${navOpen ? 'is-open' : ''}`}>
        <div className="gp-sidebar-brand">
          <div className="gp-sidebar-logo">{brandInitials}</div>
          <div className="gp-sidebar-brand-text">
            <div className="gp-sidebar-title">{title}</div>
            <div className="gp-sidebar-subtitle">{subtitle}</div>
          </div>
        </div>

        <nav className="gp-side-nav" aria-label="Dashboard sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`gp-side-item ${activeId === item.id ? 'is-active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.icon ? <span className="gp-side-icon" aria-hidden="true">{item.icon}</span> : null}
              <span className="gp-side-label">{item.label}</span>
              {item.badge ? <span className="gp-badge is-count">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="gp-sidebar-footer">
          <button type="button" className="gp-side-item" onClick={() => navigate('/account')}>
            <span className="gp-side-icon" aria-hidden="true">👤</span>
            <span className="gp-side-label">My Account</span>
          </button>
          <button type="button" className="gp-side-item is-logout" onClick={handleLogout}>
            <span className="gp-side-icon" aria-hidden="true">⎋</span>
            <span className="gp-side-label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="gp-content">
        <header className="gp-topbar">
          <button
            type="button"
            className="gp-menu-btn"
            onClick={toggleNav}
            aria-label="Open navigation menu"
          >
            ☰
          </button>
          <div className="gp-topbar-titles">
            <div className="gp-topbar-title">{title}</div>
            <div className="gp-topbar-sub">{subtitle}</div>
          </div>
          <div className="gp-spacer" />
          {headerActions}
          <ThemeToggle />
        </header>

        <main className="gp-main">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
