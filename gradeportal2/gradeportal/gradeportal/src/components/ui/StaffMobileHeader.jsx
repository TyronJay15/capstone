import React from 'react';

const StaffMobileHeader = ({ title, subtitle, onMenuClick, children }) => (
  <div className="staff-mobile-header">
    <button type="button" className="staff-menu-btn" onClick={onMenuClick} aria-label="Open navigation menu">
      ☰
    </button>
    <div className="staff-mobile-header-titles">
      <div className="staff-mobile-header-title">{title}</div>
      {subtitle ? <div className="staff-mobile-header-sub">{subtitle}</div> : null}
    </div>
    {children ? <div className="staff-mobile-header-actions">{children}</div> : null}
  </div>
);

export default StaffMobileHeader;
