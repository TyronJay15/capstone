const HISTORY_KEY = 'gradeportal_recommendation_history';
const HISTORY_EVENT = 'gradeportal-recommendations-updated';

function notify() {
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
}

export function subscribeRecommendationHistory(callback) {
  const handler = () => callback();
  window.addEventListener(HISTORY_EVENT, handler);
  return () => window.removeEventListener(HISTORY_EVENT, handler);
}

export function getRecommendationHistory(studentId) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const all = raw ? JSON.parse(raw) : [];
    if (!studentId) return all;
    return all.filter((r) => r.studentId === studentId);
  } catch {
    return [];
  }
}

export function saveRecommendationRecord({ studentId, studentName, jhsToShs, shsToCollege }) {
  const record = {
    id: `rec-${Date.now()}`,
    studentId,
    studentName,
    createdAt: new Date().toISOString(),
    jhsToShs,
    shsToCollege
  };

  const history = getRecommendationHistory();
  history.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
  notify();
  return record;
}
