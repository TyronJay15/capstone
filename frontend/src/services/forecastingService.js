import { getEnrollments, ACADEMIC_YEARS, DEFAULT_ACADEMIC_YEAR } from './enrollmentStore';

const FORECAST_KEY = 'gradeportal_forecast_cache';

const SEED_HISTORICAL = [
  { academicYear: '2022-2023', total: 420, byGrade: { 'Grade 7': 95, 'Grade 8': 88, 'Grade 9': 82, 'Grade 10': 78, 'Grade 11': 42, 'Grade 12': 35 } },
  { academicYear: '2023-2024', total: 445, byGrade: { 'Grade 7': 98, 'Grade 8': 92, 'Grade 9': 86, 'Grade 10': 80, 'Grade 11': 48, 'Grade 12': 41 } },
  { academicYear: '2024-2025', total: 468, byGrade: { 'Grade 7': 102, 'Grade 8': 96, 'Grade 9': 90, 'Grade 10': 84, 'Grade 11': 52, 'Grade 12': 44 } }
];

function parseYearStart(academicYear) {
  const match = String(academicYear).match(/^(\d{4})/);
  return match ? Number(match[1]) : 0;
}

function linearForecast(points, futureYears = 2) {
  if (points.length < 2) {
    const last = points[0]?.value || 0;
    return Array.from({ length: futureYears }, (_, i) => ({
      year: (points[0]?.year || new Date().getFullYear()) + i + 1,
      value: last
    }));
  }

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.year, 0);
  const sumY = points.reduce((s, p) => s + p.value, 0);
  const sumXY = points.reduce((s, p) => s + p.year * p.value, 0);
  const sumXX = points.reduce((s, p) => s + p.year * p.year, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  const lastYear = points[points.length - 1].year;
  return Array.from({ length: futureYears }, (_, i) => {
    const year = lastYear + i + 1;
    const value = Math.max(0, Math.round(intercept + slope * year));
    return { year, value, academicYear: `${year}-${year + 1}` };
  });
}

export function buildHistoricalSeries() {
  const fromStore = ACADEMIC_YEARS.map((year) => {
    const enrollments = getEnrollments({ academicYear: year });
    const approved = enrollments.filter((e) => e.registrarStatus === 'approved' && e.adminStatus === 'approved');
    const byGrade = {};
    for (const e of approved) {
      const g = e.gradeLevelEnrollment || 'Unknown';
      byGrade[g] = (byGrade[g] || 0) + 1;
    }
    return {
      academicYear: year,
      total: approved.length,
      byGrade,
      source: 'live'
    };
  }).filter((row) => row.total > 0);

  if (fromStore.length >= 2) return [...SEED_HISTORICAL, ...fromStore];
  return SEED_HISTORICAL;
}

export function computeEnrollmentForecast() {
  const historical = buildHistoricalSeries();
  const points = historical.map((h) => ({
    year: parseYearStart(h.academicYear),
    value: h.total,
    academicYear: h.academicYear
  }));

  const predictions = linearForecast(points, 3);
  const lastTotal = historical[historical.length - 1]?.total || 0;
  const nextTotal = predictions[0]?.value || lastTotal;
  const growthRate = lastTotal > 0 ? (((nextTotal - lastTotal) / lastTotal) * 100).toFixed(1) : '0';

  const lastByGrade = historical[historical.length - 1]?.byGrade || {};
  const strandDemand = Object.entries(lastByGrade)
    .filter(([g]) => g.includes('11') || g.includes('12'))
    .map(([grade, count]) => ({ grade, count, forecast: Math.round(count * (1 + Number(growthRate) / 100)) }));

  const result = {
    generatedAt: new Date().toISOString(),
    historical,
    predictions,
    summary: {
      lastAcademicYear: historical[historical.length - 1]?.academicYear || DEFAULT_ACADEMIC_YEAR,
      lastTotal,
      nextPredictedTotal: nextTotal,
      growthRatePercent: growthRate,
      strandDemand
    },
    chart: {
      labels: [...historical.map((h) => h.academicYear), ...predictions.map((p) => p.academicYear)],
      actual: [...historical.map((h) => h.total), ...predictions.map(() => null)],
      forecast: [...historical.map(() => null), ...predictions.map((p) => p.value)]
    }
  };

  localStorage.setItem(FORECAST_KEY, JSON.stringify(result));
  return result;
}

export function getCachedForecast() {
  try {
    const raw = localStorage.getItem(FORECAST_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return computeEnrollmentForecast();
}
