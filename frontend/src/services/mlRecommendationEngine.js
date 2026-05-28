/**
 * Supervised-style classification engine (weighted logistic scores).
 * Modular — replace scoreWeights with trained model output later.
 */

const SHS_STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'];

const SUBJECT_GROUPS = {
  stem: ['mathematics', 'science', 'computer'],
  humanities: ['english', 'filipino', 'social studies', 'values'],
  business: ['english', 'mathematics'],
  practical: ['physical education', 'computer']
};

const SHS_WEIGHTS = {
  STEM: { stem: 0.45, humanities: 0.15, business: 0.1, practical: 0.1, overall: 0.2 },
  ABM: { stem: 0.15, humanities: 0.2, business: 0.4, practical: 0.1, overall: 0.15 },
  HUMSS: { stem: 0.1, humanities: 0.45, business: 0.15, practical: 0.1, overall: 0.2 },
  GAS: { stem: 0.2, humanities: 0.25, business: 0.2, practical: 0.15, overall: 0.2 },
  TVL: { stem: 0.15, humanities: 0.1, business: 0.1, practical: 0.45, overall: 0.2 }
};

const COLLEGE_BY_STRAND = {
  STEM: [
    { course: 'BS Computer Science', weight: 1 },
    { course: 'BS Engineering', weight: 0.95 },
    { course: 'BS Nursing / Pre-Med', weight: 0.85 },
    { course: 'BS Architecture', weight: 0.8 }
  ],
  ABM: [
    { course: 'BS Business Administration', weight: 1 },
    { course: 'BS Accountancy', weight: 0.95 },
    { course: 'BS Hospitality Management', weight: 0.85 },
    { course: 'BS Entrepreneurship', weight: 0.9 }
  ],
  HUMSS: [
    { course: 'BA Political Science', weight: 1 },
    { course: 'BA Communication', weight: 0.95 },
    { course: 'BS Psychology', weight: 0.9 },
    { course: 'Bachelor of Secondary Education', weight: 0.85 }
  ],
  GAS: [
    { course: 'BS Information Technology', weight: 0.9 },
    { course: 'BS Education', weight: 0.85 },
    { course: 'BS Public Administration', weight: 0.8 },
    { course: 'BA Multimedia Arts', weight: 0.75 }
  ],
  TVL: [
    { course: 'BS Industrial Technology', weight: 1 },
    { course: 'BS Information Technology', weight: 0.9 },
    { course: 'BS Tourism Management', weight: 0.85 },
    { course: 'Technical-Vocational Ladder Programs', weight: 0.95 }
  ]
};

function subjectKey(name) {
  return String(name || '').toLowerCase();
}

function groupAverage(grades, groupSubjects) {
  const matches = grades.filter((g) =>
    groupSubjects.some((s) => subjectKey(g.subject).includes(s))
  );
  if (!matches.length) return 0;
  return matches.reduce((sum, g) => sum + Number(g.grade || 0), 0) / matches.length;
}

export function extractGradeFeatures(grades = []) {
  const list = Array.isArray(grades) ? grades : [];
  const overall =
    list.length > 0 ? list.reduce((s, g) => s + Number(g.grade || 0), 0) / list.length : 0;

  return {
    stem: groupAverage(list, SUBJECT_GROUPS.stem),
    humanities: groupAverage(list, SUBJECT_GROUPS.humanities),
    business: groupAverage(list, SUBJECT_GROUPS.business),
    practical: groupAverage(list, SUBJECT_GROUPS.practical),
    overall
  };
}

function softmax(scores) {
  const max = Math.max(...scores.map((s) => s.score));
  const exps = scores.map((s) => ({ ...s, e: Math.exp(s.score - max) }));
  const sum = exps.reduce((a, b) => a + b.e, 0);
  return exps
    .map((s) => ({ label: s.label, confidence: sum > 0 ? Math.round((s.e / sum) * 1000) / 10 : 0 }))
    .sort((a, b) => b.confidence - a.confidence);
}

function scoreStrand(features, weights) {
  return (
    (features.stem / 100) * weights.stem +
    (features.humanities / 100) * weights.humanities +
    (features.business / 100) * weights.business +
    (features.practical / 100) * weights.practical +
    (features.overall / 100) * weights.overall
  );
}

export function recommendShsStrand(grades) {
  const features = extractGradeFeatures(grades);
  const raw = SHS_STRANDS.map((strand) => ({
    label: strand,
    score: scoreStrand(features, SHS_WEIGHTS[strand])
  }));
  const ranked = softmax(raw);
  const top = ranked[0];

  const explanations = [];
  if (features.stem >= 88) explanations.push('Strong performance in Mathematics and Science.');
  if (features.humanities >= 88) explanations.push('Strong performance in language and social subjects.');
  if (features.business >= 85) explanations.push('Solid English and Math balance for business tracks.');
  if (features.practical >= 85) explanations.push('Good aptitude for skills-based learning.');
  if (!explanations.length) explanations.push('Recommendations are based on your overall grade profile.');

  return {
    type: 'jhs-shs',
    features,
    ranked,
    topRecommendation: top?.label,
    topConfidence: top?.confidence || 0,
    explanation: explanations.join(' '),
    advisory: 'This is an advisory recommendation only. Final strand selection should include parent and guidance counselor input.'
  };
}

export function inferShsStrandFromGradeLevel(gradeLevel) {
  const g = String(gradeLevel || '').toLowerCase();
  if (g.includes('11') || g.includes('12')) return 'STEM';
  return null;
}

export function recommendCollegeCourses(grades, shsStrand = 'GAS') {
  const features = extractGradeFeatures(grades);
  const strand = SHS_STRANDS.includes(shsStrand) ? shsStrand : 'GAS';
  const baseCourses = COLLEGE_BY_STRAND[strand] || COLLEGE_BY_STRAND.GAS;

  const performanceFactor = features.overall / 100;
  const ranked = baseCourses
    .map((c) => ({
      label: c.course,
      confidence: Math.min(98, Math.round(c.weight * performanceFactor * 1000) / 10)
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    type: 'shs-college',
    strand,
    features,
    ranked,
    topRecommendation: ranked[0]?.label,
    topConfidence: ranked[0]?.confidence || 0,
    explanation: `Based on your SHS strand (${strand}) and overall academic average (${features.overall.toFixed(1)}).`,
    advisory: 'College suggestions are advisory. Consult your guidance office for program-specific requirements.'
  };
}

export function runFullRecommendation({ grades, gradeLevel, shsStrand }) {
  const jhsToShs = recommendShsStrand(grades);
  const strandForCollege = shsStrand || inferShsStrandFromGradeLevel(gradeLevel) || jhsToShs.topRecommendation;
  const shsToCollege = recommendCollegeCourses(grades, strandForCollege);
  return { jhsToShs, shsToCollege };
}
