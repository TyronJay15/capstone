import React, { useMemo, useState } from 'react';
import { SectionHead, EmptyState, StatCard, Badge } from '../common/Cards';
import { getSections, getStudents } from '../grades/gradesApi';
import { getAdvisers, recordSectionCreation } from './headteacherApi';
import '../common/common.css';
import './SectioningPanel.css';

const STRANDS = ['STEM', 'ABM', 'HUMSS'];
const DEMO_SUBJECT_TEACHERS = ['Gregoria de Jesus (Mathematics)', 'Jose Rizal (Filipino)', 'Melchora Aquino (Science)'];

const SectioningPanel = () => {
  // Approved student pool = enrolled students across the demo sections.
  const approved = useMemo(() => {
    const all = getSections().flatMap((sec) => getStudents(sec.id));
    return all
      .filter((s) => s.enrollmentStatus === 'Enrolled')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const advisers = getAdvisers();

  const [sectionName, setSectionName] = useState('');
  const [strand, setStrand] = useState(STRANDS[0]);
  const [adviser, setAdviser] = useState(advisers[0]?.name || '');
  const [picked, setPicked] = useState([]);
  const [summary, setSummary] = useState(null);

  const togglePick = (id) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const canGenerate = sectionName.trim() && picked.length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    const students = approved.filter((s) => picked.includes(s.id));
    const created = {
      name: sectionName.trim(),
      strand,
      adviser,
      students,
      totalStudents: students.length,
      subjectTeachers: DEMO_SUBJECT_TEACHERS
    };
    setSummary(created);
    recordSectionCreation({
      name: created.name,
      strand: created.strand,
      adviser: created.adviser,
      totalStudents: created.totalStudents
    });
  };

  const reset = () => {
    setSectionName('');
    setPicked([]);
    setSummary(null);
  };

  if (summary) {
    return (
      <div className="rd-section">
        <SectionHead
          title="Section Summary"
          subtitle="The new section has been created and logged to Audit Trails."
          actions={<button type="button" className="gp-btn-sm" onClick={reset}>+ Create another section</button>}
        />
        <div className="gp-grid is-tight">
          <StatCard label="Section Name" value={summary.name} icon="🏫" />
          <StatCard label="Total Students" value={summary.totalStudents} icon="🎓" variant="accent" />
          <StatCard label="Strand" value={summary.strand} icon="🧪" />
          <StatCard label="Adviser" value={summary.adviser} icon="🧑‍🏫" />
        </div>
        <div className="dash-two-col gp-mt">
          <div className="gp-card">
            <div className="gp-card-title">Student List ({summary.totalStudents})</div>
            <ul className="sp-summary-list">
              {summary.students.map((s) => (
                <li key={s.id}>
                  <span>{s.name}</span>
                  <span className="sp-muted">{s.id}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="gp-card">
            <div className="gp-card-title">Subject Teachers</div>
            <ul className="sp-summary-list">
              {summary.subjectTeachers.map((t) => (
                <li key={t}><span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rd-section">
      <SectionHead title="Sectioning" subtitle="Create a new section from the approved student list." />

      <div className="dash-two-col">
        <div className="gp-card">
          <div className="gp-card-title">1. New Section Details</div>
          <div className="sp-form gp-mt">
            <label className="sp-field">
              <span>Section Name</span>
              <input className="form-input" placeholder="e.g. 11-STEM-B" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
            </label>
            <label className="sp-field">
              <span>Strand</span>
              <select className="form-input" value={strand} onChange={(e) => setStrand(e.target.value)}>
                {STRANDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="sp-field">
              <span>Adviser</span>
              <select className="form-input" value={adviser} onChange={(e) => setAdviser(e.target.value)}>
                {advisers.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </label>
          </div>
          <div className="gp-row gp-mt" style={{ justifyContent: 'space-between' }}>
            <span className="sp-muted">{picked.length} student{picked.length === 1 ? '' : 's'} selected</span>
            <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={!canGenerate}>
              Generate Section Summary
            </button>
          </div>
        </div>

        <div className="gp-card">
          <div className="gp-card-title">2. Assign Students (Approved List)</div>
          {approved.length === 0 ? (
            <EmptyState icon="🎓" title="No approved students" />
          ) : (
            <ul className="sp-pick-list gp-mt">
              {approved.map((s) => (
                <li key={s.id}>
                  <label className="sp-pick">
                    <input type="checkbox" checked={picked.includes(s.id)} onChange={() => togglePick(s.id)} />
                    <span className="sp-pick-name">{s.name}</span>
                    <span className="sp-muted">{s.id}</span>
                    <Badge variant="success">{s.strand}</Badge>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectioningPanel;
