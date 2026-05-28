import React, { useEffect, useState } from 'react';
import {
  bulkEncodeGrades,
  listSemesters,
  listSubjects
} from '../../services/academicsApi';

const GradeEncodePanel = ({ student, onSaved, onError }) => {
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [score, setScore] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [subj, sem] = await Promise.all([listSubjects(), listSemesters()]);
        if (!cancelled) {
          setSubjects(subj);
          setSemesters(sem);
          if (sem.length) setSemesterId(String(sem[0].id));
          if (subj.length) setSubjectId(String(subj[0].id));
        }
      } catch (err) {
        if (!cancelled) onError(err.message || 'Unable to load subjects.');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student || !semesterId || !subjectId || score === '') {
      onError('Complete all grade fields.');
      return;
    }
    setSaving(true);
    try {
      await bulkEncodeGrades({
        semester: Number(semesterId),
        entries: [
          {
            student: student.profileId,
            subject: Number(subjectId),
            score: Number(score)
          }
        ]
      });
      setScore('');
      onSaved();
    } catch (err) {
      onError(err.message || 'Unable to save grade.');
    } finally {
      setSaving(false);
    }
  };

  if (!student) {
    return <div className="teacher-notes-empty">Select a student to encode grades.</div>;
  }

  return (
    <form className="teacher-grade-encode-form" onSubmit={handleSubmit}>
      <div className="teacher-grade-encode-meta">
        Encoding for <strong>{student.name}</strong> (LRN {student.id})
      </div>
      <div className="teacher-grade-encode-grid">
        <label>
          Semester
          <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Score (0–100)
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </label>
      </div>
      <button type="submit" className="teacher-save-btn" disabled={saving}>
        {saving ? 'Saving…' : 'Save Grade'}
      </button>
    </form>
  );
};

export default GradeEncodePanel;
