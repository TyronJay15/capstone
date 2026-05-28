import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { runFullRecommendation } from '../../services/mlRecommendationEngine';
import { saveRecommendationRecord, getRecommendationHistory } from '../../services/recommendationStore';
import './AcademicRecommendations.css';

const AcademicRecommendations = ({ student }) => {
  const [result, setResult] = useState(null);
  const [historyTick, setHistoryTick] = useState(0);

  const history = useMemo(
    () => (student?.id ? getRecommendationHistory(student.id).slice(0, 3) : []),
    [student?.id, historyTick]
  );

  const runRecommendations = useCallback(() => {
    if (!student?.grades?.length) return;
    const next = runFullRecommendation({
      grades: student.grades,
      gradeLevel: student.grade,
      shsStrand: null
    });
    saveRecommendationRecord({
      studentId: student.id,
      studentName: student.name,
      jhsToShs: next.jhsToShs,
      shsToCollege: next.shsToCollege
    });
    setResult(next);
    setHistoryTick((t) => t + 1);
  }, [student]);

  useEffect(() => {
    if (student?.id && student?.grades?.length) {
      runRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  if (!student) return null;

  return (
    <section className="academic-rec-card card">
      <div className="academic-rec-header">
        <div>
          <h2>Academic Recommendations</h2>
          <p className="academic-rec-sub">
            Advisory ML-based suggestions from your grades. Not a mandatory assignment.
          </p>
        </div>
        <button type="button" className="btn btn-outline academic-rec-refresh" onClick={runRecommendations}>
          Refresh
        </button>
      </div>

      {!student.grades?.length ? (
        <p className="academic-rec-empty">Grade data is required to generate recommendations.</p>
      ) : result ? (
        <div className="academic-rec-grid">
          <div className="academic-rec-block">
            <h3>JHS → SHS Strand</h3>
            <p className="academic-rec-top">
              Top match: <strong>{result.jhsToShs.topRecommendation}</strong> ({result.jhsToShs.topConfidence}%
              confidence)
            </p>
            <p className="academic-rec-expl">{result.jhsToShs.explanation}</p>
            <ul className="academic-rec-rank">
              {result.jhsToShs.ranked.map((r) => (
                <li key={r.label}>
                  <span>{r.label}</span>
                  <span>{r.confidence}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="academic-rec-block">
            <h3>SHS → College Course</h3>
            <p className="academic-rec-top">
              Top match: <strong>{result.shsToCollege.topRecommendation}</strong> ({result.shsToCollege.topConfidence}%
              confidence)
            </p>
            <p className="academic-rec-expl">{result.shsToCollege.explanation}</p>
            <ul className="academic-rec-rank">
              {result.shsToCollege.ranked.map((r) => (
                <li key={r.label}>
                  <span>{r.label}</span>
                  <span>{r.confidence}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <p className="academic-rec-advisory">
        {result?.jhsToShs?.advisory || 'Recommendations are stored for guidance review and future model improvements.'}
      </p>

      {history.length > 0 ? (
        <div className="academic-rec-history">
          <h4>Recent recommendation history</h4>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                {new Date(h.createdAt).toLocaleString()} — SHS: {h.jhsToShs?.topRecommendation}, College:{' '}
                {h.shsToCollege?.topRecommendation}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default AcademicRecommendations;
