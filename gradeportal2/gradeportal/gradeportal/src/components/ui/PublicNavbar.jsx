import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMobileNav } from '../../hooks/useMobileNav';
import './PublicNavbar.css';

const NAV_LINKS = [
  { to: '/', label: 'HOME' },
  { to: '/programs', label: 'PROGRAMS' },
  { to: '/contact', label: 'CONTACT' },
  { to: '/about', label: 'ABOUT' }
];

const PublicNavbar = ({ variant = 'default', isScrolled = false }) => {
  const location = useLocation();
  const { navOpen, toggleNav, closeNav } = useMobileNav();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={`public-navbar ${variant === 'landing' ? 'public-navbar-landing' : ''} ${isScrolled ? 'is-scrolled' : ''} ${navOpen ? 'is-open' : ''}`}
    >
      <div className="public-nav-container">
        <div className="public-nav-left">
          <Link to="/" className="public-logo-link" onClick={closeNav}>
            <img src="/logo/logodampol.jpg" alt="Dampol 1st National High School Logo" className="public-nav-logo" />
            <span className="public-school-name">Dampol 1st National Highschool</span>
          </Link>
        </div>

        <button
          type="button"
          className="public-nav-toggle"
          onClick={toggleNav}
          aria-expanded={navOpen}
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="public-nav-toggle-bar" />
          <span className="public-nav-toggle-bar" />
          <span className="public-nav-toggle-bar" />
        </button>

        <div className="public-nav-panel">
          <ul className="public-nav-links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={isActive(link.to) ? 'active' : ''}
                  onClick={closeNav}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/signup" className="public-register-btn" onClick={closeNav}>
            Register
          </Link>
        </div>
      </div>
      {navOpen ? <button type="button" className="public-nav-backdrop" onClick={closeNav} aria-label="Close menu" /> : null}
    </nav>
  );
};

export default PublicNavbar;
