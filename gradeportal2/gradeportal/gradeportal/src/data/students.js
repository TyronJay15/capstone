// Sample student data for the grading system
export const sampleStudents = [
  {
    id: "2025-001",
    name: "Maria Santos",
    email: "maria.santos@dampol.edu.ph",
    grade: "Grade 10",
    section: "Einstein",
    semester: "1st Semester",
    grades: [
      { subject: "Mathematics", grade: 92, semester: "1st Sem" },
      { subject: "English", grade: 88, semester: "1st Sem" },
      { subject: "Science", grade: 95, semester: "1st Sem" },
      { subject: "Filipino", grade: 90, semester: "1st Sem" },
      { subject: "Social Studies", grade: 87, semester: "1st Sem" },
      { subject: "Physical Education", grade: 94, semester: "1st Sem" },
      { subject: "Values Education", grade: 91, semester: "1st Sem" },
      { subject: "Computer Science", grade: 89, semester: "1st Sem" }
    ]
  },
  {
    id: "2025-002",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@dampol.edu.ph",
    grade: "Grade 10",
    section: "Einstein",
    semester: "1st Semester",
    grades: [
      { subject: "Mathematics", grade: 85, semester: "1st Sem" },
      { subject: "English", grade: 92, semester: "1st Sem" },
      { subject: "Science", grade: 88, semester: "1st Sem" },
      { subject: "Filipino", grade: 86, semester: "1st Sem" },
      { subject: "Social Studies", grade: 90, semester: "1st Sem" },
      { subject: "Physical Education", grade: 93, semester: "1st Sem" },
      { subject: "Values Education", grade: 89, semester: "1st Sem" },
      { subject: "Computer Science", grade: 87, semester: "1st Sem" }
    ]
  },
  {
    id: "2025-003",
    name: "Ana Rodriguez",
    email: "ana.rodriguez@dampol.edu.ph",
    grade: "Grade 10",
    section: "Einstein",
    semester: "2nd Semester",
    grades: [
      { subject: "Mathematics", grade: 94, semester: "2nd Sem" },
      { subject: "English", grade: 91, semester: "2nd Sem" },
      { subject: "Science", grade: 96, semester: "2nd Sem" },
      { subject: "Filipino", grade: 88, semester: "2nd Sem" },
      { subject: "Social Studies", grade: 92, semester: "2nd Sem" },
      { subject: "Physical Education", grade: 90, semester: "2nd Sem" },
      { subject: "Values Education", grade: 93, semester: "2nd Sem" },
      { subject: "Computer Science", grade: 95, semester: "2nd Sem" }
    ]
  },
  {
    id: "2025-004",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@dampol.edu.ph",
    grade: "Grade 10",
    section: "Einstein",
    semester: "2nd Semester",
    grades: [
      { subject: "Mathematics", grade: 89, semester: "2nd Sem" },
      { subject: "English", grade: 87, semester: "2nd Sem" },
      { subject: "Science", grade: 91, semester: "2nd Sem" },
      { subject: "Filipino", grade: 85, semester: "2nd Sem" },
      { subject: "Social Studies", grade: 88, semester: "2nd Sem" },
      { subject: "Physical Education", grade: 92, semester: "2nd Sem" },
      { subject: "Values Education", grade: 86, semester: "2nd Sem" },
      { subject: "Computer Science", grade: 90, semester: "2nd Sem" }
    ]
  },
  {
    id: "2025-005",
    name: "Sofia Garcia",
    email: "sofia.garcia@dampol.edu.ph",
    grade: "Grade 10",
    section: "Einstein",
    semester: "1st Semester",
    grades: [
      { subject: "Mathematics", grade: 96, semester: "1st Sem" },
      { subject: "English", grade: 94, semester: "1st Sem" },
      { subject: "Science", grade: 98, semester: "1st Sem" },
      { subject: "Filipino", grade: 92, semester: "1st Sem" },
      { subject: "Social Studies", grade: 95, semester: "1st Sem" },
      { subject: "Physical Education", grade: 89, semester: "1st Sem" },
      { subject: "Values Education", grade: 97, semester: "1st Sem" },
      { subject: "Computer Science", grade: 93, semester: "1st Sem" }
    ]
  }
];

// Function to get student by ID from sample roster (login uses enrollmentStore for full lookup)
export const getStudentById = (id) => {
  return sampleStudents.find((student) => student.id === id);
};

// Function to get all students
export const getAllStudents = () => {
  return sampleStudents;
};

// Function to filter students by semester
export const getStudentsBySemester = (semester) => {
  if (semester === "All") {
    return sampleStudents;
  }
  return sampleStudents.filter(student => student.semester.includes(semester));
};
