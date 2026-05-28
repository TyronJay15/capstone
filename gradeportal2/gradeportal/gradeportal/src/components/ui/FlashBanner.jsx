import React from 'react';
import './FlashBanner.css';

const FlashBanner = ({ kind = 'success', message, onDismiss }) => {
  if (!message) return null;
  const cls = kind === 'error' ? 'gp-flash gp-flash-error' : 'gp-flash gp-flash-success';

  return (
    <div className={cls} role="status" aria-live="polite">
      <div className="gp-flash-text">{message}</div>
      {onDismiss ? (
        <button type="button" className="gp-flash-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
};

export default FlashBanner;
