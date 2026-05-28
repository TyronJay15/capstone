export const CHATBOT_QUICK_PROMPTS = [
  'How do I create an account?',
  'What is the enrollment process?',
  'What does enrollment status mean?',
  'How do I recover my password?',
  'How do I view my section?'
];

export const CHATBOT_KNOWLEDGE = [
  {
    id: 'account-create',
    keywords: ['create account', 'sign up', 'register', 'registration', 'new account'],
    answer:
      'Go to **Sign Up** from the home page or login screen. Complete the admission form with your details and academic year. After submission, the registrar reviews your application. You can sign in once your enrollment is fully approved.'
  },
  {
    id: 'enrollment-process',
    keywords: ['enrollment', 'enrol', 'apply', 'admission', 'procedure', 'process'],
    answer:
      '**Enrollment flow:** (1) Submit the online admission form, (2) Registrar reviews and assigns a section, (3) Admin gives final approval, (4) Student receives portal access. Track status through pending → registrar approved → admin approved.'
  },
  {
    id: 'login-help',
    keywords: ['login', 'sign in', 'log in', 'password', 'lrn', 'email'],
    answer:
      '**Students/Parents:** use your LRN (or linked LRN for parents) and password. **Staff:** use your school email (e.g. admin@dampol.edu.ph) and password. Complete the security check (reCAPTCHA) before signing in.'
  },
  {
    id: 'password-recovery',
    keywords: ['forgot', 'recover', 'reset password', 'lost password', 'change password'],
    answer:
      'Password recovery is handled by the school registrar or admin office. Visit the **Contact** page or email the registrar. For demo accounts, the default password is `password123` until your school enables self-service reset.'
  },
  {
    id: 'status-meanings',
    keywords: ['status', 'pending', 'approved', 'rejected', 'awaiting'],
    answer:
      '**Pending:** waiting for registrar review. **Registrar approved:** awaiting admin final approval. **Approved:** fully enrolled — portal access enabled. **Rejected:** application denied — contact the registrar for next steps.'
  },
  {
    id: 'section-view',
    keywords: ['section', 'class', 'assigned', 'einstein', 'curie'],
    answer:
      'Your section appears on the **Student Dashboard** under Student Information after enrollment is approved. The registrar assigns sections; students cannot change sections in the portal.'
  },
  {
    id: 'profile-update',
    keywords: ['profile', 'edit profile', 'update information', 'my account'],
    answer:
      'Open **My Account** from your dashboard or use **Edit Profile** on the student dashboard. Save contact details locally; official records are updated through the registrar.'
  },
  {
    id: 'grades',
    keywords: ['grades', 'report card', 'gpa', 'view grades'],
    answer:
      'Students see grades on the dashboard after login. Teachers need **parent consent** on file before viewing a student’s grades. Download your report card using the button on the student dashboard.'
  },
  {
    id: 'recommendations',
    keywords: ['recommend', 'strand', 'stem', 'abm', 'humss', 'college', 'ml'],
    answer:
      'The **Academic Recommendations** panel on the student dashboard provides advisory SHS strand and college course suggestions based on your grades. These are guides only — final decisions are made with your parents and guidance office.'
  },
  {
    id: 'parent',
    keywords: ['parent', 'guardian', 'consent'],
    answer:
      'Parents can log in with the **Parent** role using their registered email and their child’s LRN. Parent consent for grade viewing is recorded by the school admin.'
  },
  {
    id: 'teacher',
    keywords: ['teacher', 'faculty'],
    answer:
      'Teachers sign in with **teacher@dampol.edu.ph** (demo). Use **Student Grades** to view grades only when parent consent is granted. Notes can be saved per student from the teacher dashboard.'
  },
  {
    id: 'admin-registrar',
    keywords: ['admin', 'registrar', 'staff'],
    answer:
      '**Registrar:** manages enrollment requests and section assignment. **Admin:** final approval, parent consent, CMS, forecasting, and reports. Use the sidebar menu on your dashboard after login.'
  },
  {
    id: 'navigation',
    keywords: ['navigate', 'where', 'find', 'menu', 'help'],
    answer:
      'Use the top navigation on public pages (Home, Programs, Contact, About). After login, use your role dashboard sidebar. Tap the **menu (☰)** button on mobile to open the sidebar.'
  }
];

export const CHATBOT_WELCOME =
  'Hello! I am the Dampol Grade Portal assistant. Ask a question or choose a topic below. I can help with accounts, enrollment, login, grades, and navigation.';
