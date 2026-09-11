import React from 'react';
import { Badge } from '../common/Cards';
import '../common/common.css';
import '../common/roleDashboards.css';
import './RegistrationStatus.css';

const STEPS = [
  {
    id: 'submitted',
    title: 'Registration Submitted',
    desc: 'Your application has been received.'
  },
  {
    id: 'review',
    title: 'Under Review',
    desc: 'The registrar is reviewing your details.'
  },
  {
    id: 'approved',
    title: 'Approved',
    desc: 'Access to the full dashboard will be granted.'
  }
];

const STATUS_LABEL = {
  submitted: 'Submitted',
  review: 'Under Review',
  approved: 'Approved'
};

const RegistrationStatus = ({ currentStatus = 'review', studentName }) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStatus);

  return (
    <div className="reg-status">
      <div className="reg-status-head">
        <div>
          <h2 className="reg-status-title">Registration Status</h2>
          <p className="reg-status-sub">
            {studentName ? `${studentName}, your ` : 'Your '}account is awaiting approval.
          </p>
        </div>
        <Badge variant={currentStatus === 'approved' ? 'success' : 'warning'}>
          {currentStatus === 'approved' ? 'Approved' : 'Pending Approval'}
        </Badge>
      </div>

      <div className="reg-status-banner">
        <span aria-hidden="true">⏳</span>
        <div>
          <strong>Current Status: {STATUS_LABEL[currentStatus] || 'Pending Approval'}</strong>
          <div className="reg-status-banner-sub">
            You will be notified once your registration is approved.
          </div>
        </div>
      </div>

      <div className="rd-timeline">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const stateClass = isDone ? 'is-done' : isCurrent ? 'is-current' : '';
          return (
            <div key={step.id} className={`rd-tl-step ${stateClass}`}>
              <div className="rd-tl-marker">
                <span className="rd-tl-dot">{isDone ? '✓' : idx + 1}</span>
                {idx < STEPS.length - 1 ? <span className="rd-tl-line" /> : null}
              </div>
              <div className="rd-tl-body">
                <div className="rd-tl-title">{step.title}</div>
                <div className="rd-tl-desc">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegistrationStatus;
