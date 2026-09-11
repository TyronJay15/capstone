import React, { useMemo, useState } from 'react';
import { Badge, EmptyState } from '../common/Cards';
import FlashBanner from '../ui/FlashBanner';
import {
  TERMS,
  getSections,
  getStudents,
  getSubjects,
  getSubmissions,
  submitGrade,
  shareWithStudent
} from './gradesApi';
import '../common/common.css';
import '../common/roleDashboards.css';
import './GradeEncoder.css';

const STATUS_VARIANT = { approved: 'success', pending: 'warning', rejected: 'danger' };

const GradeEncoder = ({ role = 'adviser', withSubject = false }) => {
  const [tab, setTab] = useState('encode');
  // `version` bumps force a re-read of the in-memory submissions store.
  const [, setVersion] = useState(0);
  const [flash, setFlash] = useState({ kind: 'success', message: '' });
  const [form, setForm] = useState({ section: '', subject: '', student: '', term: '', grade: '' });

  const sections = getSections();
  const students = useMemo(() => (form.section ? getStudents(form.section) : []), [form.section]);
  const subjects = getSubjects();

  const submissions = getSubmissions({ by: role });

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  const ready =
    form.section &&
    form.student &&
    form.term &&
    form.grade !== '' &&
    (!withSubject || form.subject);

  const handleSubmit = () => {
    if (!ready) return;
    const student = students.find((s) => s.id === form.student);
    submitGrade({
      section: form.section,
      studentName: student?.name || form.student,
      lrn: student?.id || form.student,
      subject: withSubject ? form.subject : 'Advisory',
      term: form.term,
      grade: Number(form.grade),
      by: role
    });
    setForm((p) => ({ ...p, student: '', grade: '' }));
    setVersion((v) => v + 1);
    showFlash('success', 'Grade submitted for validation.');
  };

  const steps = [
    { id: 'section', label: 'Select Section', done: !!form.section },
    ...(withSubject ? [{ id: 'subject', label: 'Select Subject', done: !!form.subject }] : []),
    { id: 'student', label: 'Select Student', done: !!form.student },
    { id: 'term', label: 'Select Term', done: !!form.term },
    { id: 'grade', label: 'Encode Grade', done: form.grade !== '' },
    { id: 'submit', label: 'Submit Grade', done: false }
  ];

  return (
    <div className="ge-wrap">
      <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />

      <div className="gp-tabs">
        <button type="button" className={`gp-tab ${tab === 'encode' ? 'is-active' : ''}`} onClick={() => setTab('encode')}>
          Grade Encoding
        </button>
        <button type="button" className={`gp-tab ${tab === 'summary' ? 'is-active' : ''}`} onClick={() => setTab('summary')}>
          Grade Summary
        </button>
      </div>

      {tab === 'encode' ? (
        <div className="ge-encode">
          <ol className="ge-steps">
            {steps.map((s, i) => (
              <li key={s.id} className={`ge-step ${s.done ? 'is-done' : ''}`}>
                <span className="ge-step-num">{s.done ? '✓' : i + 1}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ol>

          <div className="gp-card">
            <div className="rd-form-grid">
              <label className="rd-field">
                <span className="rd-field-label">Section</span>
                <select className="form-input" value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value, student: '' }))}>
                  <option value="">Select section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.strand})</option>
                  ))}
                </select>
              </label>

              {withSubject ? (
                <label className="rd-field">
                  <span className="rd-field-label">Subject</span>
                  <select className="form-input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}>
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="rd-field">
                <span className="rd-field-label">Student</span>
                <select className="form-input" value={form.student} disabled={!form.section} onChange={(e) => setForm((p) => ({ ...p, student: e.target.value }))}>
                  <option value="">{form.section ? 'Select student' : 'Select a section first'}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </label>

              <label className="rd-field">
                <span className="rd-field-label">Term</span>
                <select className="form-input" value={form.term} onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}>
                  <option value="">Select term</option>
                  {TERMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label className="rd-field">
                <span className="rd-field-label">Grade</span>
                <input className="form-input" type="number" min="60" max="100" value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} placeholder="0–100" />
              </label>
            </div>

            <div className="gp-row gp-mt">
              <button type="button" className="btn btn-primary" disabled={!ready} onClick={handleSubmit}>
                Submit Grade
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="ge-summary">
          {submissions.length === 0 ? (
            <EmptyState icon="🗂️" title="No submissions yet" message="Encoded grades will appear here after you submit." />
          ) : (
            TERMS.map((term) => {
              const items = submissions.filter((s) => s.term === term);
              if (items.length === 0) return null;
              return (
                <div key={term} className="ge-term-group">
                  <div className="ge-term-head">
                    <span className="ge-term-title">{term}</span>
                    <span className="gp-badge">{items.length} submission{items.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="gp-grid">
                    {items.map((s) => (
                      <div key={s.id} className="gp-card ge-sum-card">
                        <div className="ge-sum-top">
                          <div>
                            <div className="ge-sum-student">{s.studentName}</div>
                            <div className="ge-sum-meta">{s.section}{withSubject ? ` · ${s.subject}` : ''}</div>
                          </div>
                          <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                        </div>
                        <dl className="ge-sum-fields">
                          <div><dt>Term</dt><dd>{s.term}</dd></div>
                          <div><dt>Grade</dt><dd>{s.grade}</dd></div>
                          <div><dt>Submission Date</dt><dd>{s.submittedAt}</dd></div>
                        </dl>
                        {s.status === 'approved' ? (
                          s.sharedWithStudent ? (
                            <span className="gp-badge is-success">Shared with student</span>
                          ) : (
                            <button
                              type="button"
                              className="gp-btn-sm is-primary"
                              onClick={() => {
                                shareWithStudent(s.id);
                                setVersion((v) => v + 1);
                                showFlash('success', 'Grade is now visible to the student.');
                              }}
                            >
                              Show To Student
                            </button>
                          )
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GradeEncoder;
