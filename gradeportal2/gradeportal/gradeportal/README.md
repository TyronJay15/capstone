# Dampol 1st National High School Grading Portal

A professional React-based grading system website designed for Dampol 1st National High School, featuring a modern academic interface inspired by the school's official logo and colors.

## Features

### 🎨 Design & Theme
- **Color Palette**: Based on the school logo (Navy Blue #0b2b5a, Gold #d4a017, Red #b71c1c)
- **Animated Background**: Subtle gradient and particle animations inspired by the logo's light and torch theme
- **Professional Layout**: Modern, academic design suitable for educational institutions
- **School Motto**: "Thy Light Shall Guide Us!" prominently displayed

### 🔐 Authentication
- **Login Page**: Student ID and password authentication
- **Sign Up Page**: New student registration form
- **Demo Credentials**: Student ID: 2024-001, Password: password123

### 📊 Dashboard Features
- **Student Information**: Display student details, ID, email, grade, and section
- **Search Functionality**: Look up grades by Student ID number
- **Semester Filtering**: Filter grades by 1st Semester, 2nd Semester, or All
- **Grades Table**: Professional table displaying subjects, grades, and semester labels
- **Grade Status**: Color-coded grade indicators (Excellent, Very Good, Good, Satisfactory, Needs Improvement)
- **Summary Statistics**: Average grade, total subjects, and highest grade

### 📱 Responsive Design
- **Mobile-First**: Optimized for desktop, tablet, and mobile devices
- **Grid Layout**: Flexible grid system for consistent spacing
- **Touch-Friendly**: Large buttons and touch targets for mobile users

## Technology Stack

- **React 19.2.0**: Modern React with hooks
- **React Router DOM**: Client-side routing
- **CSS3**: Custom CSS with CSS variables and animations
- **JavaScript ES6+**: Modern JavaScript features

## Project Structure

```
src/
├── components/
│   ├── AnimatedBackground.jsx    # Animated background component
│   ├── AnimatedBackground.css    # Background animation styles
│   ├── Login.jsx                 # Login page component
│   ├── Login.css                 # Login page styles
│   ├── SignUp.jsx                # Sign up page component
│   ├── SignUp.css                # Sign up page styles
│   ├── Dashboard.jsx             # Main dashboard component
│   ├── Dashboard.css             # Dashboard styles
│   ├── GradeTable.jsx            # Grades table component
│   └── GradeTable.css            # Grades table styles
├── data/
│   └── students.js               # Sample student data
├── App.js                        # Main app component with routing
├── App.css                       # App-level styles
├── index.js                      # React entry point
└── index.css                     # Global CSS variables and styles
```

## Sample Data

The application includes sample student data with:
- 5 students with different grades and semesters
- Student IDs: 2025-001, 2025-002, 2025-003, 2025-004, 2025-005
- 8 subjects per student (Mathematics, English, Science, Filipino, Social Studies, Physical Education, Values Education, Computer Science)
- Both 1st and 2nd semester grades
- Realistic grade ranges (80-98)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Open Browser**:
   Navigate to `http://localhost:3000`

4. **Login with Demo Credentials**:
   - Student ID: `2025-001`
   - Password: `password123`

## Usage

### Login
- Enter Student ID and password
- Use demo credentials for testing
- Click "Sign In" to access dashboard

### Dashboard
- View student information at the top
- Search for other students by ID
- Filter grades by semester using the filter buttons
- View detailed grade table with color-coded status indicators
- Check summary statistics below the table

### Navigation
- Use the navbar logo to identify the school
- Click "Logout" to return to login page
- Navigate between Login and Sign Up pages

## Design Guidelines

### CSS Variables
```css
:root {
  --navy: #0b2b5a;        /* Primary brand color */
  --gold: #d4a017;        /* Accent color */
  --red: #b71c1c;        /* Secondary accent */
  --text: #1f2937;        /* Text color */
  --bg: #f7f8fa;          /* Background color */
  --radius: 10px;         /* Border radius */
  --font: "Inter", "Segoe UI", sans-serif;
}
```

### Button Styles
- **Primary**: Navy background with gold border, white text
- **Secondary**: Transparent background with navy border
- **Hover Effects**: Smooth shadow and glow effects

### Grade Color Coding
- **95+**: Excellent (Green)
- **90-94**: Very Good (Blue)
- **85-89**: Good (Gold)
- **80-84**: Satisfactory (Orange)
- **<80**: Needs Improvement (Red)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is created for educational purposes for Dampol 1st National High School.

---

**"Thy Light Shall Guide Us!"** - Dampol 1st National High School