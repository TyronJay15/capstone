import React from 'react';
import './common.css';

export function StatCard({ label, value, hint, icon, variant }) {
  const variantClass = variant ? `is-${variant}` : '';
  return (
    <div className={`gp-stat ${variantClass}`}>
      {icon ? <span className="gp-stat-icon" aria-hidden="true">{icon}</span> : null}
      <span className="gp-stat-label">{label}</span>
      <span className="gp-stat-value">{value}</span>
      {hint ? <span className="gp-stat-hint">{hint}</span> : null}
    </div>
  );
}

export function FeatureCard({ icon, title, description, children, onClick, actionLabel }) {
  return (
    <div className={`gp-card ${onClick ? 'is-interactive' : ''}`}>
      <div className="gp-card-title">
        {icon ? <span className="gp-card-icon" aria-hidden="true">{icon}</span> : null}
        <span>{title}</span>
      </div>
      {description ? <p className="gp-card-desc">{description}</p> : null}
      {children}
      {onClick ? (
        <button type="button" className="gp-btn-sm is-primary gp-mt" onClick={onClick}>
          {actionLabel || 'Open'}
        </button>
      ) : null}
    </div>
  );
}

export function Badge({ children, variant }) {
  return <span className={`gp-badge ${variant ? `is-${variant}` : ''}`}>{children}</span>;
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', message }) {
  return (
    <div className="gp-empty">
      <div className="gp-empty-icon" aria-hidden="true">{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {message ? <p style={{ margin: '0.35rem 0 0' }}>{message}</p> : null}
    </div>
  );
}

export function ErrorState({ icon = '⚠️', title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="gp-empty">
      <div className="gp-empty-icon" aria-hidden="true">{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {message ? <p style={{ margin: '0.35rem 0 0' }}>{message}</p> : null}
      {onRetry ? (
        <button type="button" className="btn btn-primary gp-mt" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function SectionHead({ title, subtitle, actions }) {
  return (
    <div className="gp-section-head">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p className="gp-section-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="gp-row">{actions}</div> : null}
    </div>
  );
}
