import React from 'react';
import { EmptyState } from '../common/Cards';
import './CourseRecommendationPanel.css';

function Sparkline({ values }) {
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');
  return (
    <svg className="rec-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CourseRecommendationPanel = ({
  data,
  recommendation,
  title = 'College Course Recommendation',
  canGenerate = false,
  generating = false,
  onGenerate,
  emptyMessage = 'No recommendation has been generated yet.'
}) => {
  const rec = recommendation || data || null;

  const header = (
    <div className="gp-section-head">
      <div>
        <h2>{title}</h2>
        <p className="gp-section-sub">AI-assisted college course and strand guidance.</p>
      </div>
      <div className="gp-row">
        {rec ? <span className="gp-badge is-info">Advisory</span> : null}
        {canGenerate ? (
          <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={generating}>
            {generating ? 'Generating…' : rec ? 'Regenerate Recommendation' : 'Generate Recommendation'}
          </button>
        ) : null}
      </div>
    </div>
  );

  if (!rec) {
    return (
      <div className="rec-panel">
        {header}
        <EmptyState
          icon="🧭"
          title="No recommendation yet"
          message={canGenerate ? 'Click “Generate Recommendation” to create your college course guidance.' : emptyMessage}
        />
      </div>
    );
  }

  return (
    <div className="rec-panel">
      {header}

      {rec.generatedAt ? (
        <div className="rec-generated">Generated {new Date(rec.generatedAt).toLocaleString()}</div>
      ) : null}

      <div className="rec-grid">
        <div className="rec-primary">
          <div className="rec-primary-label">Recommended Course</div>
          <div className="rec-primary-course">{rec.topCourse}</div>
          <div className="rec-primary-strand">Aligned strand: <strong>{rec.strand}</strong></div>

          <div className="rec-scores">
            <div className="rec-score">
              <div className="rec-score-num">{rec.confidence}%</div>
              <div className="rec-score-label">Confidence Score</div>
              <div className="rec-meter">
                <span style={{ width: `${rec.confidence}%` }} />
              </div>
            </div>
            <div className="rec-score">
              <div className="rec-score-num">{rec.recommendationScore}/10</div>
              <div className="rec-score-label">Recommendation Score</div>
              <div className="rec-meter">
                <span style={{ width: `${(rec.recommendationScore / 10) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rec-side">
          <div className="rec-trend-card">
            <div className="rec-trend-head">
              <span>Academic Trend</span>
              <span className="gp-badge is-success">Improving</span>
            </div>
            <Sparkline values={rec.trend} />
            <div className="rec-trend-foot">
              <span>Start: {rec.trend[0]}</span>
              <span>Latest: {rec.trend[rec.trend.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rec-explanation">
        <div className="rec-explanation-title">💡 Why this recommendation?</div>
        <p>{rec.explanation}</p>
      </div>

      <div className="rec-alts">
        <div className="rec-alts-title">Other strong matches</div>
        <div className="rec-alts-list">
          {rec.alternatives.map((alt) => (
            <div key={alt.name} className="rec-alt">
              <span className="rec-alt-name">{alt.name}</span>
              <div className="rec-meter is-sm">
                <span style={{ width: `${alt.confidence}%` }} />
              </div>
              <span className="rec-alt-conf">{alt.confidence}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseRecommendationPanel;
