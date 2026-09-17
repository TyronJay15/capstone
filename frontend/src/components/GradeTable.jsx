import React from 'react';
import './GradeTable.css';

// Grade records may carry a `term` (current backend field) or a legacy
// `semester` field — always resolve through this helper.
const periodOf = (grade) => grade.term || grade.semester || '';

const GradeTable = ({ grades = [], semesterFilter = 'All' }) => {

  const filteredGrades = semesterFilter === 'All'
    ? grades
    : grades.filter((grade) => periodOf(grade) === semesterFilter);


  const averageGrade = filteredGrades.length > 0 
    ? (filteredGrades.reduce((sum, grade) => sum + grade.grade, 0) / filteredGrades.length).toFixed(1)
    : 0;

  const getGradeColor = (grade) => {
    if (grade >= 95) return 'excellent';
    if (grade >= 90) return 'very-good';
    if (grade >= 85) return 'good';
    if (grade >= 80) return 'satisfactory';
    return 'needs-improvement';
  };

  const getSemesterTagColor = (period) => {
    return String(period).startsWith('1st') ? 'gold' : 'red';
  };

  return (
    <div className="grade-table-container">
      <div className="table-header">
        <h3>Academic Grades</h3>
        <div className="semester-filter-info">
          {semesterFilter !== 'All' && (
            <span className={`semester-tag ${getSemesterTagColor(semesterFilter)}`}>
              {semesterFilter}
            </span>
          )}
        </div>
      </div>

      {filteredGrades.length > 0 ? (
        <>
          <div className="table-wrapper">
            <table className="grade-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Term</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((grade, index) => (
                  <tr key={index} className="grade-row">
                    <td className="subject-cell">
                      <div className="subject-info">
                        <span className="subject-name">{grade.subject}</span>
                      </div>
                    </td>
                    <td className="grade-cell">
                      <span className={`grade-value ${getGradeColor(grade.grade)}`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="semester-cell">
                      <span className={`semester-tag ${getSemesterTagColor(periodOf(grade))}`}>
                        {periodOf(grade)}
                      </span>
                    </td>
                    <td className="status-cell">
                      <span className={`status-indicator ${getGradeColor(grade.grade)}`}>
                        {grade.grade >= 95 ? 'Excellent' :
                         grade.grade >= 90 ? 'Very Good' :
                         grade.grade >= 85 ? 'Good' :
                         grade.grade >= 80 ? 'Satisfactory' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grade-summary">
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">Average Grade:</span>
                <span className={`summary-value ${getGradeColor(averageGrade)}`}>
                  {averageGrade}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Subjects:</span>
                <span className="summary-value">{filteredGrades.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Highest Grade:</span>
                <span className="summary-value">
                  {Math.max(...filteredGrades.map(g => g.grade))}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-grades">
          <div className="no-grades-icon">📚</div>
          <p>No grades available for the selected semester.</p>
        </div>
      )}
    </div>
  );
};

export default GradeTable;
