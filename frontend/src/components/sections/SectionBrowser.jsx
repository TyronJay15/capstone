import React, { useState } from 'react';
import { Badge } from '../common/Cards';
import { getSections, getSectionStudents } from './sectionsApi';
import '../common/common.css';
import './SectionBrowser.css';

const STATUS_VARIANT = {
  Enrolled: 'success',
  'In Progress': 'warning',
  'Not Enrolled': 'danger'
};

const SectionBrowser = ({
  title = 'Assigned Students & Sections',
  subtitle = 'Select a section to view its students.',
  showSubject = false,
  showStrand = false,
  sortStudents = false,
  subject,
  onSelectStudent
}) => {
  const sections = getSections();
  const [activeSection, setActiveSection] = useState(null);

  let students = activeSection ? getSectionStudents(activeSection.id, { subject }) : [];
  if (sortStudents) {
    students = [...students].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (activeSection) {
    return (
      <div className="sb-wrap">
        <button type="button" className="gp-btn-sm sb-back" onClick={() => setActiveSection(null)}>
          ← Back to sections
        </button>
        <div className="gp-section-head">
          <div>
            <h2>{activeSection.name}</h2>
            <p className="gp-section-sub">{activeSection.grade} · {activeSection.strand} · {students.length} students</p>
          </div>
        </div>
        <div className="gp-table-wrap">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>LRN</th>
                <th>Grade Level</th>
                {showStrand ? <th>Strand</th> : null}
                <th>Section</th>
                {showSubject ? <th>Assigned Subject</th> : null}
                <th>Enrollment Status</th>
                {onSelectStudent ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.id}</td>
                  <td>{s.grade}</td>
                  {showStrand ? <td>{s.strand}</td> : null}
                  <td>{s.section}</td>
                  {showSubject ? <td>{s.assignedSubject}</td> : null}
                  <td><Badge variant={STATUS_VARIANT[s.enrollmentStatus]}>{s.enrollmentStatus}</Badge></td>
                  {onSelectStudent ? (
                    <td>
                      <button type="button" className="gp-btn-sm is-primary" onClick={() => onSelectStudent(s)}>
                        View
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-wrap">
      <div className="gp-section-head">
        <div>
          <h2>{title}</h2>
          <p className="gp-section-sub">{subtitle}</p>
        </div>
      </div>
      <div className="gp-grid">
        {sections.map((sec) => (
          <button key={sec.id} type="button" className="sb-section-card" onClick={() => setActiveSection(sec)}>
            <span className="sb-section-icon" aria-hidden="true">🏫</span>
            <span className="sb-section-name">{sec.name}</span>
            <span className="sb-section-meta">{sec.grade} · {sec.strand}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SectionBrowser;
