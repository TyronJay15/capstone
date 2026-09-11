import React, { useState } from 'react';
import { SectionHead, Badge } from '../common/Cards';
import { getStrands, getEnrollmentTimeline } from './enrollmentInfoApi';
import '../common/common.css';
import '../common/roleDashboards.css';
import './StrandExplorer.css';

const StrandExplorer = ({ enrollmentStatus = 'enrolled' }) => {
  const strands = getStrands();
  const [activeStrand, setActiveStrand] = useState(strands[0].id);
  const { steps, currentStatus } = getEnrollmentTimeline(enrollmentStatus);
  const currentIndex = steps.findIndex((s) => s.id === currentStatus);
  const selected = strands.find((s) => s.id === activeStrand);

  return (
    <div className="strand-explorer">
      <SectionHead title="Enrollment Progress" subtitle="Track your admission status." />
      <div className="gp-card">
        <div className="rd-timeline se-timeline">
          {steps.map((step, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step.id} className={`rd-tl-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}>
                <div className="rd-tl-marker">
                  <span className="rd-tl-dot">{isDone ? '✓' : idx + 1}</span>
                  {idx < steps.length - 1 ? <span className="rd-tl-line" /> : null}
                </div>
                <div className="rd-tl-body">
                  <div className="rd-tl-title">{step.title}</div>
                  <div className="rd-tl-desc">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gp-mt">
        <SectionHead title="Academic Strands" subtitle="Explore strands, subjects and possible careers." />
        <div className="gp-grid">
          {strands.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`se-strand-card ${activeStrand === s.id ? 'is-active' : ''}`}
              onClick={() => setActiveStrand(s.id)}
            >
              <div className="se-strand-name">{s.name}</div>
              <div className="se-strand-full">{s.full}</div>
              <p className="se-strand-desc">{s.description}</p>
              <div className="se-careers">
                {s.careers.slice(0, 3).map((c) => (
                  <span key={c} className="rd-pill">{c}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="gp-mt">
          <div className="gp-section-head">
            <div>
              <h3>{selected.name} — Subjects</h3>
              <p className="gp-section-sub">{selected.full}</p>
            </div>
            <Badge variant="success">{selected.subjects.length} subjects</Badge>
          </div>
          <div className="gp-grid">
            {selected.subjects.map((sub) => (
              <div key={sub.name} className="gp-card">
                <div className="gp-card-title">
                  <span className="gp-card-icon" aria-hidden="true">📘</span>
                  {sub.name}
                </div>
                <p className="gp-card-desc">{sub.desc}</p>
              </div>
            ))}
          </div>
          <div className="se-careers-full gp-mt">
            <span className="se-careers-label">Possible careers:</span>
            {selected.careers.map((c) => (
              <span key={c} className="rd-pill">{c}</span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StrandExplorer;
