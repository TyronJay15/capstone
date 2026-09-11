import React, { useMemo, useState } from 'react';
import GradeTable from '../GradeTable';
import { StatCard } from '../common/Cards';
import '../common/common.css';
import './GradeOverview.css';

const TERMS = ['1st Term', '2nd Term', '3rd Term'];

function standingFor(avg) {
  if (avg >= 95) return { label: 'With Highest Honors', variant: 'success' };
  if (avg >= 90) return { label: 'With High Honors', variant: 'success' };
  if (avg >= 85) return { label: 'With Honors', variant: 'success' };
  if (avg >= 75) return { label: 'Passing', variant: 'warning' };
  return { label: 'Needs Improvement', variant: 'danger' };
}

const GradeOverview = ({ student, showTermFilter = true, heading = 'Grades' }) => {
  const grades = useMemo(() => student?.grades || [], [student]);
  const [term, setTerm] = useState('All');

  // Grades may use a `term` or fall back to `semester`; filter gracefully.
  const filtered = useMemo(() => {
    if (term === 'All') return grades;
    return grades.filter((g) => (g.term || g.semester) === term);
  }, [grades, term]);

  const avg = filtered.length
    ? Number((filtered.reduce((s, g) => s + g.grade, 0) / filtered.length).toFixed(1))
    : 0;
  const gpa = filtered.length ? ((avg / 100) * 4).toFixed(2) : '0.00';
  const standing = standingFor(avg);
  const previous = grades.filter((g) => (g.term || g.semester) && (g.term || g.semester) !== term && term !== 'All');

  return (
    <div className="go-wrap">
      <div className="gp-section-head">
        <div>
          <h2>{heading}</h2>
          <p className="gp-section-sub">Current grades, GPA, academic standing and summary.</p>
        </div>
      </div>

      <div className="gp-grid is-tight">
        <StatCard label="Average" value={avg || '—'} icon="📊" />
        <StatCard label="GPA (4.0)" value={gpa} icon="🎯" variant="accent" />
        <StatCard label="Academic Standing" value={standing.label} icon="🏅" variant={standing.variant === 'danger' ? 'danger' : undefined} />
        <StatCard label="Subjects" value={filtered.length} icon="📚" />
      </div>

      {showTermFilter ? (
        <div className="go-terms">
          {['All', ...TERMS].map((t) => (
            <button
              key={t}
              type="button"
              className={`go-term ${term === t ? 'is-active' : ''}`}
              onClick={() => setTerm(t)}
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}

      <div className="gp-card go-table-card">
        <div className="gp-card-title">Grade Summary {term !== 'All' ? `— ${term}` : ''}</div>
        <GradeTable grades={filtered} />
      </div>

      {previous.length > 0 ? (
        <div className="gp-card gp-mt">
          <div className="gp-card-title">Previous Grades</div>
          <GradeTable grades={previous} />
        </div>
      ) : null}
    </div>
  );
};

export default GradeOverview;
