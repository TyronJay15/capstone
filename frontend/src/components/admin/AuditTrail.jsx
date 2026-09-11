import React, { useMemo, useState } from 'react';
import { SectionHead, StatCard, Badge, EmptyState } from '../common/Cards';
import { CATEGORIES, STATUSES, getAuditRows, getAuditSummary } from './auditApi';
import '../common/common.css';
import './AuditTrail.css';

const STATUS_VARIANT = { success: 'success', pending: 'warning', failed: 'danger' };

const AuditTrail = () => {
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const rows = useMemo(
    () => getAuditRows({ category, status, search, from, to }),
    [category, status, search, from, to]
  );
  const summary = useMemo(() => getAuditSummary(rows), [rows]);

  return (
    <div className="audit-trail">
      <SectionHead title="Audit Trail & Monitoring" subtitle="Track activity across all stakeholders and the system." />

      <div className="gp-grid is-tight">
        <StatCard label="Total Events" value={summary.total} icon="📋" />
        <StatCard label="Successful" value={summary.success} icon="✅" variant="accent" />
        <StatCard label="Pending" value={summary.pending} icon="🕒" variant="warning" />
        <StatCard label="Failed" value={summary.failed} icon="⛔" variant="danger" />
      </div>

      <div className="audit-cats gp-mt">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`audit-cat ${category === c.id ? 'is-active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            <span aria-hidden="true">{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="gp-toolbar">
        <div className="gp-search">
          <span className="gp-search-icon" aria-hidden="true">🔎</span>
          <input
            type="search"
            placeholder="Search activity, user or module…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="gp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
          ))}
        </select>
        <label className="audit-date">
          <span>From</span>
          <input type="date" className="gp-select" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="audit-date">
          <span>To</span>
          <input type="date" className="gp-select" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="🔍" title="No matching activity" message="Adjust your search, filters or date range." />
      ) : (
        <div className="gp-table-wrap">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>User</th>
                <th>Date</th>
                <th>Module</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.activity}</td>
                  <td>{r.user}</td>
                  <td>{r.date}</td>
                  <td>{r.module}</td>
                  <td><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
