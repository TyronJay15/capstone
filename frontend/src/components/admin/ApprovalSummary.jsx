import React, { useState } from 'react';
import { SectionHead, Badge } from '../common/Cards';
import { getApprovalSummary, SCHOOL_YEARS, STAKEHOLDERS } from './approvalApi';
import '../common/common.css';
import './ApprovalSummary.css';

const ICONS = {
  Students: '🎓',
  Advisers: '🧑‍🏫',
  'Subject Teachers': '📚',
  'Head Teachers': '🏛️'
};

const ApprovalSummary = () => {
  const [year, setYear] = useState(SCHOOL_YEARS[0]);
  const data = getApprovalSummary(year);

  return (
    <div className="approval-summary">
      <SectionHead
        title="Approval Summary"
        subtitle="Approved, rejected and pending accounts by stakeholder."
        actions={
          <select className="gp-select" value={year} onChange={(e) => setYear(e.target.value)}>
            {SCHOOL_YEARS.map((y) => (
              <option key={y} value={y}>S.Y. {y}</option>
            ))}
          </select>
        }
      />

      <div className="gp-grid">
        {STAKEHOLDERS.map((s) => {
          const row = data[s];
          const total = row.approved + row.rejected + row.pending;
          return (
            <div key={s} className="gp-card approval-card">
              <div className="gp-card-title">
                <span className="gp-card-icon" aria-hidden="true">{ICONS[s]}</span>
                {s}
              </div>
              <div className="approval-counts">
                <div className="approval-count is-approved">
                  <span className="approval-num">{row.approved}</span>
                  <span className="approval-label">Approved</span>
                </div>
                <div className="approval-count is-pending">
                  <span className="approval-num">{row.pending}</span>
                  <span className="approval-label">Pending</span>
                </div>
                <div className="approval-count is-rejected">
                  <span className="approval-num">{row.rejected}</span>
                  <span className="approval-label">Rejected</span>
                </div>
              </div>
              <div className="approval-bar" aria-hidden="true">
                <span className="is-approved" style={{ width: `${(row.approved / total) * 100}%` }} />
                <span className="is-pending" style={{ width: `${(row.pending / total) * 100}%` }} />
                <span className="is-rejected" style={{ width: `${(row.rejected / total) * 100}%` }} />
              </div>
              {Object.keys(row.sections).length > 0 ? (
                <div className="approval-sections">
                  <div className="approval-sections-label">By section</div>
                  <div className="gp-row">
                    {Object.entries(row.sections).map(([sec, n]) => (
                      <Badge key={sec}>{sec}: {n}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalSummary;
