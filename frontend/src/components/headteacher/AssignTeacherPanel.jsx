import React, { useMemo, useState } from 'react';
import { SectionHead, Badge, EmptyState } from '../common/Cards';
import FlashBanner from '../ui/FlashBanner';
import Modal from '../ui/Modal';
import { getTeachers, recordAssignment, getAssignmentHistory } from './headteacherApi';
import { getSections } from '../grades/gradesApi';
import '../common/common.css';
import './AssignTeacherPanel.css';

const AssignTeacherPanel = () => {
  const [search, setSearch] = useState('');
  const [strandFilter, setStrandFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [flash, setFlash] = useState({ kind: 'success', message: '' });
  const [assigning, setAssigning] = useState(null);
  const [assignForm, setAssignForm] = useState({ section: '', subject: '' });
  const [, setVersion] = useState(0);

  const teachers = getTeachers();
  const sections = getSections();

  const strands = useMemo(() => ['all', ...Array.from(new Set(teachers.map((t) => t.strand)))], [teachers]);
  const grades = useMemo(() => ['all', ...Array.from(new Set(teachers.map((t) => t.grade)))], [teachers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers
      .filter((t) => (strandFilter === 'all' ? true : t.strand === strandFilter))
      .filter((t) => (gradeFilter === 'all' ? true : t.grade === gradeFilter))
      .filter((t) =>
        q
          ? t.name.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.section.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers, search, strandFilter, gradeFilter]);

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  const openAssign = (teacher) => {
    setAssigning(teacher);
    setAssignForm({ section: teacher.section || '', subject: teacher.subject || '' });
  };

  const confirmAssign = () => {
    if (!assignForm.section) return;
    assigning.section = assignForm.section;
    assigning.subject = assignForm.subject || assigning.subject;
    assigning.assigned = true;
    recordAssignment({ type: 'Subject Teacher', who: assigning.name, subject: assigning.subject, section: assignForm.section });
    setAssigning(null);
    setVersion((v) => v + 1);
    showFlash('success', `${assigning.name} assigned to ${assignForm.section}.`);
  };

  return (
    <div className="atp-wrap">
      <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />
      <SectionHead title="Assign Subject Teacher" subtitle="Search, filter and assign available teachers." />

      <div className="gp-toolbar">
        <div className="gp-search">
          <span className="gp-search-icon" aria-hidden="true">🔎</span>
          <input
            type="search"
            placeholder="Search by name, subject or section…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="gp-select" value={strandFilter} onChange={(e) => setStrandFilter(e.target.value)}>
          {strands.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All strands' : s}</option>
          ))}
        </select>
        <select className="gp-select" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
          {grades.map((g) => (
            <option key={g} value={g}>{g === 'all' ? 'All grade levels' : g}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🧑‍🏫"
          title="No teachers match your search"
          message="Try clearing the search box or changing the strand/grade filters."
        />
      ) : (
        <div className="gp-table-wrap">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Subject</th>
                <th>Grade Level</th>
                <th>Strand</th>
                <th>Section</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.subject}</td>
                  <td>{t.grade}</td>
                  <td>{t.strand}</td>
                  <td>{t.section || '—'}</td>
                  <td>
                    <Badge variant={t.assigned ? 'success' : 'warning'}>
                      {t.assigned ? 'Assigned' : 'Available'}
                    </Badge>
                  </td>
                  <td>
                    <button type="button" className="gp-btn-sm is-primary" onClick={() => openAssign(t)}>
                      {t.assigned ? 'Reassign' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="gp-card atp-summary">
        <div className="gp-card-title">Assignment Summary</div>
        <ul className="atp-summary-list">
          {getAssignmentHistory().filter((a) => a.type === 'Subject Teacher').slice(0, 6).map((a) => (
            <li key={a.id}>
              <span className="atp-summary-who">{a.who}</span>
              <span className="atp-summary-detail">{a.subject} · {a.section}</span>
              <span className="atp-summary-date">{a.date}</span>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        open={!!assigning}
        title={assigning ? `Assign ${assigning.name}` : 'Assign Teacher'}
        onClose={() => setAssigning(null)}
        footer={
          <div className="gp-row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAssigning(null)}>Cancel</button>
            <button type="button" className="btn btn-primary" disabled={!assignForm.section} onClick={confirmAssign}>
              Save Assignment
            </button>
          </div>
        }
      >
        {assigning ? (
          <div className="atp-modal-form">
            <label className="atp-field">
              <span>Subject</span>
              <input className="form-input" value={assignForm.subject} onChange={(e) => setAssignForm((p) => ({ ...p, subject: e.target.value }))} />
            </label>
            <label className="atp-field">
              <span>Section</span>
              <select className="form-input" value={assignForm.section} onChange={(e) => setAssignForm((p) => ({ ...p, section: e.target.value }))}>
                <option value="">Select section</option>
                {sections.map((s) => (
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

export default AssignTeacherPanel;
