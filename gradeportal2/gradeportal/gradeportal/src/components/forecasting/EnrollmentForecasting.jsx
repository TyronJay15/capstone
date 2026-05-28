import React, { useMemo, useState } from 'react';
import { computeEnrollmentForecast, getCachedForecast } from '../../services/forecastingService';
import './EnrollmentForecasting.css';

const EnrollmentForecasting = () => {
  const [forecast, setForecast] = useState(() => getCachedForecast());
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    window.setTimeout(() => {
      setForecast(computeEnrollmentForecast());
      setLoading(false);
    }, 50);
  };

  const chartRows = useMemo(() => {
    if (!forecast?.chart) return [];
    const { labels, actual, forecast: fc } = forecast.chart;
    return labels.map((label, i) => ({
      label,
      actual: actual[i],
      forecast: fc[i]
    }));
  }, [forecast]);

  const maxVal = useMemo(() => {
    const vals = chartRows.flatMap((r) => [r.actual, r.forecast].filter((v) => v != null));
    return Math.max(...vals, 1);
  }, [chartRows]);

  return (
    <div className="forecast-panel admin-table-card">
      <div className="admin-table-header">
        <div>
          <h2 className="admin-table-title">Enrollment Forecasting</h2>
          <p className="admin-table-subtitle">
            Predictions from historical enrollment data. Separate from live enrollment records.
          </p>
        </div>
        <button type="button" className="admin-primary-btn" onClick={refresh} disabled={loading}>
          {loading ? 'Calculating...' : 'Recalculate'}
        </button>
      </div>

      <div className="forecast-summary-grid">
        <div className="forecast-stat">
          <span>Last school year</span>
          <strong>{forecast.summary.lastAcademicYear}</strong>
        </div>
        <div className="forecast-stat">
          <span>Last enrollment</span>
          <strong>{forecast.summary.lastTotal}</strong>
        </div>
        <div className="forecast-stat">
          <span>Next year forecast</span>
          <strong>{forecast.summary.nextPredictedTotal}</strong>
        </div>
        <div className="forecast-stat">
          <span>Estimated growth</span>
          <strong>{forecast.summary.growthRatePercent}%</strong>
        </div>
      </div>

      <div className="forecast-chart">
        <h3>Enrollment trend</h3>
        <div className="forecast-chart-bars">
          {chartRows.map((row) => (
            <div key={row.label} className="forecast-bar-col">
              <div className="forecast-bar-stack">
                {row.actual != null ? (
                  <div
                    className="forecast-bar forecast-bar-actual"
                    style={{ height: `${(row.actual / maxVal) * 100}%` }}
                    title={`Actual: ${row.actual}`}
                  />
                ) : null}
                {row.forecast != null ? (
                  <div
                    className="forecast-bar forecast-bar-predicted"
                    style={{ height: `${(row.forecast / maxVal) * 100}%` }}
                    title={`Forecast: ${row.forecast}`}
                  />
                ) : null}
              </div>
              <div className="forecast-bar-label">{row.label.replace('-20', '-')}</div>
            </div>
          ))}
        </div>
        <div className="forecast-legend">
          <span className="forecast-legend-actual">■ Actual</span>
          <span className="forecast-legend-predicted">■ Forecast</span>
        </div>
      </div>

      {forecast.summary.strandDemand?.length > 0 ? (
        <div className="forecast-strand">
          <h3>SHS strand / grade demand (projected)</h3>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Grade level</th>
                  <th>Current</th>
                  <th>Forecast</th>
                </tr>
              </thead>
              <tbody>
                {forecast.summary.strandDemand.map((row) => (
                  <tr key={row.grade}>
                    <td>{row.grade}</td>
                    <td>{row.count}</td>
                    <td>{row.forecast}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <p className="forecast-note">
        Generated {new Date(forecast.generatedAt).toLocaleString()}. Use forecasts for planning sections,
        teachers, and resources — not as official enrollment totals.
      </p>
    </div>
  );
};

export default EnrollmentForecasting;
