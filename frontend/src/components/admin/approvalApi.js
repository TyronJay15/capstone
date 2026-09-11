/**
 * approvalApi — approval summary data grouped by stakeholder, school year, section.
 * Frontend-only demo data shaped for future API integration.
 */

const DATA = {
  '2025–2026': {
    Students: { approved: 412, rejected: 18, pending: 36, sections: { 'STEM-A': 48, 'ABM-B': 41, 'HUMSS-A': 39 } },
    Advisers: { approved: 22, rejected: 1, pending: 3, sections: {} },
    'Subject Teachers': { approved: 35, rejected: 2, pending: 5, sections: {} },
    'Head Teachers': { approved: 4, rejected: 0, pending: 1, sections: {} }
  },
  '2024–2025': {
    Students: { approved: 388, rejected: 24, pending: 0, sections: { 'STEM-A': 45, 'ABM-B': 40, 'HUMSS-A': 37 } },
    Advisers: { approved: 20, rejected: 2, pending: 0, sections: {} },
    'Subject Teachers': { approved: 33, rejected: 1, pending: 0, sections: {} },
    'Head Teachers': { approved: 4, rejected: 0, pending: 0, sections: {} }
  }
};

export const SCHOOL_YEARS = Object.keys(DATA);
export const STAKEHOLDERS = ['Students', 'Advisers', 'Subject Teachers', 'Head Teachers'];

export function getApprovalSummary(schoolYear = SCHOOL_YEARS[0]) {
  return DATA[schoolYear] || DATA[SCHOOL_YEARS[0]];
}
