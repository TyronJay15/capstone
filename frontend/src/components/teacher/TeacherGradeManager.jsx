import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, ErrorState } from '../common/Cards';
import { SkeletonGrid } from '../common/Skeleton';
import FlashBanner from '../ui/FlashBanner';
import { fetchTeacherAssignments, fetchTeacherRoster } from '../../services/teacherApi';
import {
  bulkEncodeGrades,
  createGrade,
  deleteGrade,
  listGrades,
  listTerms,
  updateGrade
} from '../../services/academicsApi';
import '../common/common.css';
import '../common/roleDashboards.css';

const EMPTY_FORM = { id: null, student: '', subject: '', term: '', score: '' };

function describeError(err) {
  if (err?.isNetworkError) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }
  if (err?.status >= 500) {
    return 'Server error. Please try again in a moment.';
  }
  if (err?.data && typeof err.data === 'object') {
    const parts = Object.values(err.data).flat().filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return err?.message || 'Something went wrong.';
}

/**
 * Real grade management for the signed-in teacher: add / edit / delete /
 * bulk-encode against the actual GradeRecordViewSet endpoints. The backend
 * (get_teacher_grade_queryset + teacher_can_manage_grade) is the real
 * authority on what a teacher may see or touch — this UI only narrows the
 * pickers to the teacher's own assignments so mistakes are caught early,
 * it never assumes that narrowing is the security boundary.
 */
const TeacherGradeManager = () => {
  const [tab, setTab] = useState('encode');

  const [assignments, setAssignments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [refError, setRefError] = useState(null);

  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [gradesError, setGradesError] = useState(null);

  const [filters, setFilters] = useState({ subject: '', term: '', student_lrn: '' });

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState({ kind: 'success', message: '' });

  const [bulk, setBulk] = useState({ subject: '', term: '' });
  const [bulkScores, setBulkScores] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 4000);
  };

  const subjects = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (!map.has(a.subject)) map.set(a.subject, { id: a.subject, name: a.subject_name });
    });
    return Array.from(map.values());
  }, [assignments]);

  const termsById = useMemo(() => {
    const map = new Map();
    terms.forEach((t) => map.set(t.id, t));
    return map;
  }, [terms]);

  const loadRefs = useCallback(async () => {
    setLoadingRefs(true);
    setRefError(null);
    try {
      const [assignmentList, rosterList] = await Promise.all([
        fetchTeacherAssignments(),
        fetchTeacherRoster()
      ]);
      setAssignments(assignmentList);
      setRoster(rosterList);

      const yearIds = Array.from(new Set(assignmentList.map((a) => a.academic_year)));
      const termLists = await Promise.all(yearIds.map((id) => listTerms(id)));
      setTerms(termLists.flat());
    } catch (err) {
      setRefError(describeError(err));
    } finally {
      setLoadingRefs(false);
    }
  }, []);

  const loadGrades = useCallback(async () => {
    setLoadingGrades(true);
    setGradesError(null);
    try {
      const data = await listGrades({
        subject: filters.subject || undefined,
        term: filters.term || undefined,
        student_lrn: filters.student_lrn || undefined
      });
      setGrades(data);
    } catch (err) {
      setGradesError(describeError(err));
    } finally {
      setLoadingGrades(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const validateForm = () => {
    const errors = {};
    if (!form.student) errors.student = 'Select a student.';
    if (!form.subject) errors.subject = 'Select a subject.';
    if (!form.term) errors.term = 'Select a grading period.';
    if (form.score === '' || form.score === null || form.score === undefined) {
      errors.score = 'Enter a grade.';
    } else {
      const num = Number(form.score);
      if (Number.isNaN(num)) errors.score = 'Grade must be a number.';
      else if (num < 0 || num > 100) errors.score = 'Grade must be between 0 and 100.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const handleEdit = (record) => {
    setForm({
      id: record.id,
      student: record.student,
      subject: record.subject,
      term: record.term,
      score: String(record.score)
    });
    setFormErrors({});
    setTab('encode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete ${record.subject_name} grade for ${record.student_name}?`)) return;
    try {
      await deleteGrade(record.id);
      showFlash('success', 'Grade deleted.');
      loadGrades();
    } catch (err) {
      showFlash('error', describeError(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
      student: Number(form.student),
      subject: Number(form.subject),
      term: Number(form.term),
      score: form.score
    };

    try {
      if (form.id) {
        await updateGrade(form.id, payload);
        showFlash('success', 'Grade updated successfully.');
      } else {
        await createGrade(payload);
        showFlash('success', 'Grade saved successfully.');
      }
      resetForm();
      loadGrades();
    } catch (err) {
      if (err?.data && typeof err.data === 'object' && !Array.isArray(err.data)) {
        const fieldErrors = {};
        Object.entries(err.data).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value.join(' ') : String(value);
        });
        setFormErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      showFlash('error', describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkScoreChange = (profileId, value) => {
    setBulkScores((prev) => ({ ...prev, [profileId]: value }));
  };

  const handleBulkSubmit = async () => {
    if (!bulk.subject || !bulk.term) {
      showFlash('error', 'Select a subject and grading period before bulk encoding.');
      return;
    }

    const entries = Object.entries(bulkScores)
      .filter(([, score]) => score !== '' && score !== null && score !== undefined)
      .map(([student, score]) => ({ student: Number(student), subject: Number(bulk.subject), score }));

    const invalid = entries.find((e) => Number.isNaN(Number(e.score)) || Number(e.score) < 0 || Number(e.score) > 100);
    if (invalid) {
      showFlash('error', 'One or more grades are invalid. Grades must be between 0 and 100.');
      return;
    }

    if (entries.length === 0) {
      showFlash('error', 'Enter at least one grade to bulk encode.');
      return;
    }

    setBulkSaving(true);
    setBulkResult(null);
    try {
      const result = await bulkEncodeGrades({ term: Number(bulk.term), entries });
      setBulkResult(result);
      if (result.errors && result.errors.length) {
        showFlash('error', `${result.created + result.updated} saved, ${result.errors.length} failed. See details below.`);
      } else {
        showFlash('success', `Bulk encoding complete — ${result.created} created, ${result.updated} updated.`);
        setBulkScores({});
      }
      loadGrades();
    } catch (err) {
      showFlash('error', describeError(err));
    } finally {
      setBulkSaving(false);
    }
  };

  if (loadingRefs) return <SkeletonGrid count={4} />;
  if (refError) return <ErrorState title="Could not load your assignments" message={refError} onRetry={loadRefs} />;

  if (assignments.length === 0) {
    return (
      <ErrorState
        icon="📭"
        title="No subject assignments yet"
        message="You must be assigned to a subject before you can encode grades. Contact the registrar or head teacher."
      />
    );
  }

  return (
    <div className="ge-wrap">
      <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />

      <div className="gp-tabs">
        <button type="button" className={`gp-tab ${tab === 'encode' ? 'is-active' : ''}`} onClick={() => setTab('encode')}>
          Add / Edit Grade
        </button>
        <button type="button" className={`gp-tab ${tab === 'bulk' ? 'is-active' : ''}`} onClick={() => setTab('bulk')}>
          Bulk Encoding
        </button>
        <button type="button" className={`gp-tab ${tab === 'table' ? 'is-active' : ''}`} onClick={() => setTab('table')}>
          Grade Records
        </button>
      </div>

      {tab === 'encode' ? (
        <form className="gp-card gp-mt" onSubmit={handleSubmit}>
          <div className="gp-card-title">{form.id ? 'Edit Grade' : 'Add Grade'}</div>
          <div className="rd-form-grid">
            <label className="rd-field">
              <span className="rd-field-label">Student</span>
              <select
                className="form-input"
                value={form.student}
                onChange={(e) => setForm((p) => ({ ...p, student: e.target.value }))}
              >
                <option value="">Select student</option>
                {roster.map((s) => (
                  <option key={s.profileId} value={s.profileId}>{s.name} ({s.id})</option>
                ))}
              </select>
              {formErrors.student ? <span className="profile-pw-error">{formErrors.student}</span> : null}
            </label>

            <label className="rd-field">
              <span className="rd-field-label">Subject</span>
              <select
                className="form-input"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {formErrors.subject ? <span className="profile-pw-error">{formErrors.subject}</span> : null}
            </label>

            <label className="rd-field">
              <span className="rd-field-label">Grading Period</span>
              <select
                className="form-input"
                value={form.term}
                onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
              >
                <option value="">Select grading period</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.label} ({t.academic_year_label})</option>
                ))}
              </select>
              {formErrors.term ? <span className="profile-pw-error">{formErrors.term}</span> : null}
            </label>

            <label className="rd-field">
              <span className="rd-field-label">Grade (0–100)</span>
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.score}
                onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))}
                placeholder="0–100"
              />
              {formErrors.score ? <span className="profile-pw-error">{formErrors.score}</span> : null}
            </label>
          </div>

          <div className="gp-row gp-mt">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : form.id ? 'Update Grade' : 'Save Grade'}
            </button>
            {form.id ? (
              <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {tab === 'bulk' ? (
        <div className="gp-card gp-mt">
          <div className="gp-card-title">Bulk Grade Encoding</div>
          <p className="gp-card-desc">
            Select a subject and grading period, then enter grades for as many students as you need in one submission.
          </p>
          <div className="rd-form-grid">
            <label className="rd-field">
              <span className="rd-field-label">Subject</span>
              <select
                className="form-input"
                value={bulk.subject}
                onChange={(e) => setBulk((p) => ({ ...p, subject: e.target.value }))}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="rd-field">
              <span className="rd-field-label">Grading Period</span>
              <select
                className="form-input"
                value={bulk.term}
                onChange={(e) => setBulk((p) => ({ ...p, term: e.target.value }))}
              >
                <option value="">Select grading period</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.label} ({t.academic_year_label})</option>
                ))}
              </select>
            </label>
          </div>

          {roster.length === 0 ? (
            <ErrorState icon="🗂️" title="No students to encode" />
          ) : (
            <div className="gp-table-wrap gp-mt">
              <table className="gp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>LRN</th>
                    <th>Section</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s) => (
                    <tr key={s.profileId}>
                      <td>{s.name}</td>
                      <td>{s.id}</td>
                      <td>{s.section}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="form-input"
                          style={{ maxWidth: 120 }}
                          value={bulkScores[s.profileId] ?? ''}
                          onChange={(e) => handleBulkScoreChange(s.profileId, e.target.value)}
                          placeholder="0–100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="gp-row gp-mt">
            <button type="button" className="btn btn-primary" onClick={handleBulkSubmit} disabled={bulkSaving}>
              {bulkSaving ? 'Submitting…' : 'Submit Bulk Grades'}
            </button>
          </div>

          {bulkResult ? (
            <div className="gp-mt">
              <Badge variant="success">{bulkResult.created} created</Badge>{' '}
              <Badge variant="info">{bulkResult.updated} updated</Badge>{' '}
              {bulkResult.errors?.length ? <Badge variant="danger">{bulkResult.errors.length} failed</Badge> : null}
              {bulkResult.errors?.length ? (
                <ul className="gp-mt">
                  {bulkResult.errors.map((e, i) => (
                    <li key={i} className="profile-pw-error">Row {e.index + 1}: {e.error}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'table' ? (
        <div className="gp-mt">
          <div className="gp-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: 220 }}
              placeholder="Search by LRN…"
              value={filters.student_lrn}
              onChange={(e) => setFilters((p) => ({ ...p, student_lrn: e.target.value }))}
            />
            <select
              className="form-input"
              style={{ maxWidth: 200 }}
              value={filters.subject}
              onChange={(e) => setFilters((p) => ({ ...p, subject: e.target.value }))}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ maxWidth: 220 }}
              value={filters.term}
              onChange={(e) => setFilters((p) => ({ ...p, term: e.target.value }))}
            >
              <option value="">All grading periods</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.label} ({t.academic_year_label})</option>
              ))}
            </select>
          </div>

          {loadingGrades ? (
            <SkeletonGrid count={3} />
          ) : gradesError ? (
            <ErrorState title="Could not load grade records" message={gradesError} onRetry={loadGrades} />
          ) : grades.length === 0 ? (
            <ErrorState icon="🗂️" title="No grade records found" message="Try different filters, or encode a new grade." />
          ) : (
            <div className="gp-table-wrap gp-mt">
              <table className="gp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Grading Period</th>
                    <th>Academic Year</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g) => (
                    <tr key={g.id}>
                      <td>{g.student_name} ({g.student_lrn})</td>
                      <td>{g.subject_name}</td>
                      <td>{g.term_label}</td>
                      <td>{termsById.get(g.term)?.academic_year_label || '—'}</td>
                      <td>{g.score}</td>
                      <td>
                        <div className="gp-row" style={{ gap: '0.4rem' }}>
                          <button type="button" className="gp-btn-sm" onClick={() => handleEdit(g)}>Edit</button>
                          <button type="button" className="gp-btn-sm is-danger" onClick={() => handleDelete(g)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default TeacherGradeManager;
