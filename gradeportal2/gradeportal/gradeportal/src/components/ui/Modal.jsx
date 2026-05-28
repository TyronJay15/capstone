import React from 'react';
import './Modal.css';

const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;

  return (
    <div className="gp-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gp-modal-header">
          <h3 className="gp-modal-title">{title}</h3>
          <button type="button" className="gp-modal-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="gp-modal-body">{children}</div>
        {footer ? <div className="gp-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
};

export default Modal;
