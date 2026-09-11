import React from 'react';
import { StatCard } from '../common/Cards';
import './ForecastingCards.css';

const DEMO = {
  expectedEnrollment: 1284,
  enrollmentDelta: '+6.4%',
  strandDemand: [
    { strand: 'STEM', value: 92 },
    { strand: 'ABM', value: 71 },
    { strand: 'HUMSS', value: 64 },
    { strand: 'GAS', value: 48 },
    { strand: 'TVL', value: 57 }
  ],
  sectionCapacity: [
    { section: 'Grade 11 STEM', filled: 45, capacity: 50 },
    { section: 'Grade 11 ABM', filled: 38, capacity: 45 },
    { section: 'Grade 12 HUMSS', filled: 49, capacity: 50 },
    { section: 'Grade 12 TVL', filled: 22, capacity: 45 }
  ],
  teacherRequirement: 38,
  teacherDelta: '+3 needed',
  growthTrend: [980, 1040, 1095, 1150, 1210, 1284]
};

function BarChart({ data, max }) {
  const ceiling = max || Math.max(...data.map((d) => d.value));
  return (
    <div className="fc-bars">
      {data.map((d) => (
        <div key={d.strand} className="fc-bar-row">
          <span className="fc-bar-label">{d.strand}</span>
          <div className="fc-bar-track">
            <span className="fc-bar-fill" style={{ width: `${(d.value / ceiling) * 100}%` }} />
          </div>
          <span className="fc-bar-value">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function GrowthChart({ values }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return (
    <div className="fc-growth">
      {values.map((v, i) => (
        <div key={i} className="fc-growth-col" title={`${v} students`}>
          <span
            className="fc-growth-bar"
            style={{ height: `${20 + ((v - min) / range) * 80}%` }}
          />
        </div>
      ))}
    </div>
  );
}

const ForecastingCards = ({ data, showHeader = true }) => {
  const f = data || DEMO;

  return (
    <div className="fc-wrap">
      {showHeader ? (
        <div className="gp-section-head">
          <div>
            <h2>Enrollment Forecasting</h2>
            <p className="gp-section-sub">Projected demand, capacity, and staffing estimates.</p>
          </div>
          <span className="gp-badge is-info">Projection</span>
        </div>
      ) : null}

      <div className="gp-grid is-tight">
        <StatCard label="Expected Enrollment" value={f.expectedEnrollment} hint={`${f.enrollmentDelta} vs last year`} icon="📈" />
        <StatCard label="Teacher Requirement" value={f.teacherRequirement} hint={f.teacherDelta} icon="👩‍🏫" variant="accent" />
        <StatCard
          label="Sections at Capacity"
          value={f.sectionCapacity.filter((s) => s.filled / s.capacity >= 0.95).length}
          hint={`${f.sectionCapacity.length} sections tracked`}
          icon="🏫"
          variant="warning"
        />
        <StatCard label="Top Strand Demand" value={f.strandDemand[0]?.strand} hint={`${f.strandDemand[0]?.value} demand index`} icon="⭐" />
      </div>

      <div className="fc-panels">
        <div className="gp-card">
          <div className="gp-card-title">Strand Demand</div>
          <BarChart data={f.strandDemand} max={100} />
        </div>

        <div className="gp-card">
          <div className="gp-card-title">Enrollment Growth Trend</div>
          <GrowthChart values={f.growthTrend} />
          <div className="fc-growth-foot">
            <span>{f.growthTrend[0]}</span>
            <span>{f.growthTrend[f.growthTrend.length - 1]}</span>
          </div>
        </div>
      </div>

      <div className="gp-card gp-mt">
        <div className="gp-card-title">Section Capacity</div>
        <div className="gp-table-wrap">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Filled</th>
                <th>Capacity</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {f.sectionCapacity.map((s) => {
                const pct = Math.round((s.filled / s.capacity) * 100);
                return (
                  <tr key={s.section}>
                    <td>{s.section}</td>
                    <td>{s.filled}</td>
                    <td>{s.capacity}</td>
                    <td>
                      <div className="fc-util">
                        <div className="fc-util-track">
                          <span
                            className={`fc-util-fill ${pct >= 95 ? 'is-full' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ForecastingCards;
