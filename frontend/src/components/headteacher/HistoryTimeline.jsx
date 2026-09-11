import React, { useState } from 'react';
import { SectionHead, Badge } from '../common/Cards';
import { getAssignmentHistory, getValidationHistory, getSectioningHistory } from './headteacherApi';
import '../common/common.css';
import './HistoryTimeline.css';

const TABS = [
  { id: 'assignment', label: 'Assignment History' },
  { id: 'validation', label: 'Validation History' },
  { id: 'sectioning', label: 'Sectioning History' }
];

const STATUS_VARIANT = { approved: 'success', pending: 'warning', rejected: 'danger' };

const HistoryTimeline = () => {
  const [tab, setTab] = useState('assignment');

  const renderItems = () => {
    if (tab === 'assignment') {
      return getAssignmentHistory().map((h) => (
        <div key={h.id} className="ht-item">
          <div className="ht-dot" />
          <div className="ht-body">
            <div className="ht-title">
              {h.type}: <strong>{h.who}</strong>
              {h.subject ? ` — ${h.subject}` : ''}
            </div>
            <div className="ht-meta">Section {h.section || '—'} · Assigned {h.date}</div>
          </div>
        </div>
      ));
    }
    if (tab === 'validation') {
      return getValidationHistory().map((h) => (
        <div key={h.id} className="ht-item">
          <div className={`ht-dot is-${h.status}`} />
          <div className="ht-body">
            <div className="ht-title">
              <strong>{h.student}</strong> — {h.subject} <Badge variant={STATUS_VARIANT[h.status]}>{h.status}</Badge>
            </div>
            <div className="ht-meta">
              Submitted {h.submittedAt}
              {h.validatedAt ? ` · Validated ${h.validatedAt}` : ' · Not yet validated'}
              {h.approvedBy ? ` · Approved by ${h.approvedBy}` : ''}
              {h.rejectedBy ? ` · Rejected by ${h.rejectedBy}` : ''}
            </div>
          </div>
        </div>
      ));
    }
    return getSectioningHistory().map((h) => (
      <div key={h.id} className="ht-item">
        <div className="ht-dot" />
        <div className="ht-body">
          <div className="ht-title">
            <strong>{h.student}</strong> — {h.action}
          </div>
          <div className="ht-meta">{h.from} → {h.to} · {h.date}</div>
        </div>
      </div>
    ));
  };

  return (
    <div className="ht-wrap">
      <SectionHead title="History" subtitle="Assignment, validation and sectioning records." />
      <div className="gp-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`gp-tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="gp-card">
        <div className="ht-timeline">{renderItems()}</div>
      </div>
    </div>
  );
};

export default HistoryTimeline;
