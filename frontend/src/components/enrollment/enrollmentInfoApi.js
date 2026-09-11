/**
 * enrollmentInfoApi — academic strand catalog + enrollment timeline.
 * Frontend-only reference data for the Admission / Enrollment section.
 */

export const STRANDS = [
  {
    id: 'STEM',
    name: 'STEM',
    full: 'Science, Technology, Engineering & Mathematics',
    description: 'For learners inclined toward science, math, research and engineering.',
    careers: ['Engineer', 'Doctor', 'Architect', 'Data Scientist', 'Pilot'],
    subjects: [
      { name: 'Pre-Calculus', desc: 'Functions, trigonometry and analytic geometry.' },
      { name: 'General Physics', desc: 'Mechanics, electricity and magnetism.' },
      { name: 'General Chemistry', desc: 'Matter, reactions and stoichiometry.' },
      { name: 'Research / Capstone', desc: 'Scientific investigation and project work.' }
    ]
  },
  {
    id: 'ABM',
    name: 'ABM',
    full: 'Accountancy, Business & Management',
    description: 'For future entrepreneurs, accountants and business leaders.',
    careers: ['Accountant', 'Entrepreneur', 'Bank Manager', 'Economist', 'Marketing Officer'],
    subjects: [
      { name: 'Fundamentals of ABM', desc: 'Core accounting and business concepts.' },
      { name: 'Business Math', desc: 'Financial computations for business.' },
      { name: 'Applied Economics', desc: 'Markets, demand and supply.' },
      { name: 'Business Ethics', desc: 'Responsible and ethical practice.' }
    ]
  },
  {
    id: 'HUMSS',
    name: 'HUMSS',
    full: 'Humanities & Social Sciences',
    description: 'For learners interested in society, communication and public service.',
    careers: ['Lawyer', 'Teacher', 'Journalist', 'Psychologist', 'Diplomat'],
    subjects: [
      { name: 'Creative Writing', desc: 'Craft of fiction and poetry.' },
      { name: 'Disciplines in Social Sciences', desc: 'Survey of social science fields.' },
      { name: 'Philippine Politics', desc: 'Governance and constitution.' },
      { name: 'Community Engagement', desc: 'Service-oriented field work.' }
    ]
  },
  {
    id: 'GAS',
    name: 'GAS',
    full: 'General Academic Strand',
    description: 'A flexible strand for learners still exploring their path.',
    careers: ['Educator', 'Civil Servant', 'Entrepreneur', 'HR Officer'],
    subjects: [
      { name: 'Humanities Electives', desc: 'Mixed academic electives.' },
      { name: 'Social Science Electives', desc: 'Foundational social sciences.' },
      { name: 'Applied Economics', desc: 'Everyday economic concepts.' },
      { name: 'Research', desc: 'General academic research.' }
    ]
  },
  {
    id: 'TVL',
    name: 'TVL',
    full: 'Technical-Vocational-Livelihood',
    description: 'Hands-on, skills-based tracks with industry certifications.',
    careers: ['Chef', 'IT Technician', 'Electrician', 'Caregiver', 'Welder'],
    subjects: [
      { name: 'ICT / Programming', desc: 'Computer systems and coding.' },
      { name: 'Cookery', desc: 'Food preparation and safety.' },
      { name: 'Electrical Installation', desc: 'Wiring and maintenance.' },
      { name: 'Work Immersion', desc: 'On-the-job training.' }
    ]
  }
];

export const ENROLLMENT_STEPS = [
  { id: 'submitted', title: 'Registration Submitted', desc: 'Your application has been received.' },
  { id: 'review', title: 'Under Review', desc: 'The registrar is reviewing your details.' },
  { id: 'approved', title: 'Approved', desc: 'Your application has been approved.' },
  { id: 'enrolled', title: 'Enrolled', desc: 'You are officially enrolled for the school year.' }
];

export function getStrands() {
  return STRANDS;
}

export function getEnrollmentTimeline(currentStatus = 'enrolled') {
  return { steps: ENROLLMENT_STEPS, currentStatus };
}
