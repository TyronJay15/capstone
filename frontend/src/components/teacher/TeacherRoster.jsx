import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, ErrorState } from '../common/Cards';
import { SkeletonGrid } from '../common/Skeleton';
import { fetchTeacherAssignments, fetchTeacherRoster } from '../../services/teacherApi';
import '../common/common.css';
import '../sections/SectionBrowser.css';

const STATUS_VARIANT = { Active: 'success', Pending: 'warning' };

function describeError(err) {
  if (err?.isNetworkError) {
    return { title: 'Unable to reach the server', message: 'Check your connection and try again.' };
  }
  if (err?.status >= 500) {
    return { title: 'Server error', message: 'Something went wrong on our end. Please try again in a moment.' };
  }
  return { title: 'Could not load your roster', message: err?.message || 'Please try again.' };
}

/**
 * Real teacher assignments + student roster, sourced from
 * GET /api/v1/teachers/assignments/ and GET /api/v1/teachers/roster/.
 * The backend already scopes both to the signed-in teacher — this view
 * never trusts the client to filter "which students are mine".
 */
const TeacherRoster = () => {
  const [assignments, setAssignments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentList, rosterList] = await Promise.all([
        fetchTeacherAssignments(),
        fetchTeacherRoster()
      ]);
      setAssignments(assignmentList);
      setRoster(rosterList);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sectionOptions = useMemo(() => {
    const names = new Set(roster.map((s) => s.section).filter(Boolean));
    return ['all', ...Array.from(names).sort()];
  }, [roster]);

  const filteredRoster = useMemo(() => {
    const term = search.trim().toLowerCase();
    return roster.filter((s) => {
      if (sectionFilter !== 'all' && s.section !== sectionFilter) return false;
      if (!term) return true;
      return s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term);
    });
  }, [roster, search, sectionFilter]);

  if (loading) return <SkeletonGrid count={4} />;
  if (error) return <ErrorState title={error.title} message={error.message} onRetry={load} />;

  return (
    <div className="sb-wrap">
      <div className="gp-section-head">
        <div>
          <h2>My Subject Assignments</h2>
          <p className="gp-section-sub">Subjects, grade levels and sections assigned to you this school year.</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <ErrorState
          icon="📭"
          title="No subject assignments yet"
          message="You have not been assigned any subjects or sections. Contact the registrar or head teacher."
        />
      ) : (
        <div className="gp-grid is-tight">
          {assignments.map((a) => (
            <div key={a.id} className="gp-card">
              <div className="gp-card-title">
                <span className="gp-card-icon" aria-hidden="true">📚</span>
                {a.subject_name}
              </div>
              <p className="gp-card-desc">
                {a.section_name || a.grade_level || 'All sections'} · {a.academic_year_label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="gp-section-head gp-mt">
        <div>
          <h2>Assigned Students</h2>
          <p className="gp-section-sub">Students enrolled in your assigned subjects and sections.</p>
        </div>
      </div>

      <div className="gp-row gp-mt" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: 260 }}
          placeholder="Search by name or LRN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input"
          style={{ maxWidth: 200 }}
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
        >
          {sectionOptions.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All sections' : s}</option>
          ))}
        </select>
      </div>

      {filteredRoster.length === 0 ? (
        <ErrorState icon="🗂️" title="No students found" message="Try a different search or section filter." />
      ) : (
        <div className="gp-table-wrap gp-mt">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>LRN</th>
                <th>Grade Level</th>
                <th>Section</th>
                <th>Enrollment Status</th>
                <th>Parent Consent</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.id}</td>
                  <td>{s.grade}</td>
                  <td>{s.section}</td>
                  <td><Badge variant={STATUS_VARIANT[s.status] || 'warning'}>{s.status}</Badge></td>
                  <td>
                    <Badge variant={s.parentConsent ? 'success' : 'danger'}>
                      {s.parentConsent ? 'Given' : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherRoster;
