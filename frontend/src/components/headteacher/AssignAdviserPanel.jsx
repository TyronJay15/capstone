import React, { useMemo, useState } from 'react';
import { SectionHead, Badge, EmptyState } from '../common/Cards';
import FlashBanner from '../ui/FlashBanner';
import Modal from '../ui/Modal';
import { getAdvisers, recordAssignment, getAssignmentHistory } from './headteacherApi';
import { getSections } from '../grades/gradesApi';
import '../common/common.css';
import './AssignTeacherPanel.css';

const STRANDS = ['STEM', 'ABM', 'HUMSS'];

const AssignAdviserPanel = () => {
  const [search, setSearch] = useState('');
  const [flash, setFlash] = useState({ kind: 'success', message: '' });
  const [assigning, setAssigning] = useState(null);
  const [assignForm, setAssignForm] = useState({ strand: '', section: '' });
  const [, setVersion] = useState(0);

  const advisers = getAdvisers();
  const sections = getSections();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return advisers
      .filter((a) => (q ? a.name.toLowerCase().includes(q) || (a.section || '').toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [advisers, search]);

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  const openAssign = (adviser) => {
    setAssigning(adviser);
    setAssignForm({ strand: adviser.strand || STRANDS[0], section: adviser.section || '' });
  };

  const confirmAssign = () => {
    if (!assignForm.section) return;
    assigning.strand = assignForm.strand;
    assigning.section = assignForm.section;
    assigning.assigned = true;
    recordAssignment({ type: 'Adviser', who: assigning.name, section: assignForm.section });
    setAssigning(null);
    setVersion((v) => v + 1);
    showFlash('success', `${assigning.name} assigned to ${assignForm.section}.`);
  };

  return (
    <div className="atp-wrap">
      <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />
      <SectionHead title="Assign Adviser" subtitle="Teachers listed alphabetically. Assign a strand and section." />

      <div className="gp-toolbar">
        <div className="gp-search">
          <span className="gp-search-icon" aria-hidden="true">🔎</span>
          <input
            type="search"
            placeholder="Search by name or section…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🧑‍🏫" title="No advisers match your search" />
      ) : (
        <div className="gp-grid">
          {filtered.map((a) => (
            <div key={a.id} className="gp-card">
              <div className="gp-card-title">
                <span className="gp-card-icon" aria-hidden="true">🧑‍🏫</span>
                {a.name}
              </div>
              <p className="gp-card-desc">
                Current Assignment: {a.assigned ? `${a.section} · ${a.strand}` : 'None'}
              </p>
              <div className="gp-row" style={{ justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <Badge variant={a.assigned ? 'success' : 'warning'}>{a.assigned ? 'Assigned' : 'Available'}</Badge>
                <button type="button" className="gp-btn-sm is-primary" onClick={() => openAssign(a)}>
                  {a.assigned ? 'Reassign' : 'Assign'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="gp-card atp-summary">
        <div className="gp-card-title">Assignment Summary</div>
        <ul className="atp-summary-list">
          {getAssignmentHistory().filter((a) => a.type === 'Adviser').slice(0, 6).map((a) => (
            <li key={a.id}>
              <span className="atp-summary-who">{a.who}</span>
              <span className="atp-summary-detail">{a.section}</span>
              <span className="atp-summary-date">{a.date}</span>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        open={!!assigning}
        title={assigning ? `Assign ${assigning.name}` : 'Assign Adviser'}
        onClose={() => setAssigning(null)}
        footer={
          <div className="gp-row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAssigning(null)}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!assignForm.section} onClick={confirmAssign}>
              Assign
            </button>
          </div>
        }
      >
        {assigning ? (
          <div className="atp-modal-form">
            <label className="atp-field">
              <span>Strand</span>
              <select className="form-input" value={assignForm.strand} onChange={(e) => setAssignForm((p) => ({ ...p, strand: e.target.value }))}>
                {STRANDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="atp-field">
              <span>Section</span>
              <select className="form-input" value={assignForm.section} onChange={(e) => setAssignForm((p) => ({ ...p, section: e.target.value }))}>
                <option value="">Select section</option>
                {sections
                  .filter((s) => (assignForm.strand ? s.strand === assignForm.strand : true))
                  .map((s) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.strand})</option>
                  ))}
              </select>
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AssignAdviserPanel;
