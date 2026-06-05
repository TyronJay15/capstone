# Implementation Plan: Teacher & Parent Account Management

**Based on:** Django Backend Architecture Analysis  
**Date:** June 5, 2026  
**Status:** Ready for Implementation

---

## Overview

The Grade Portal backend is architecturally sound with a working role-based access control system. The issue is not in the backend API but in the **frontend dashboard not displaying Teachers and Parents**. This document outlines the phased implementation plan to complete the account management system.

---

## Phase 1: Backend Data Model Enhancement (Optional but Recommended)

### Task 1.1: Create ParentProfile Model

**File:** `backend/apps/parents/models.py`

**Rationale:** Create architectural consistency - StudentProfile and TeacherAssignment both track additional metadata; ParentProfile should do the same.

**Implementation:**
```python
from django.conf import settings
from django.db import models

class ParentProfile(models.Model):
    """Parent account profile with contact information."""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='parent_profile',
        limit_choices_to={'role': 'parent'},
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text='Contact phone number',
    )
    address = models.TextField(
        blank=True,
        help_text='Home address',
    )
    profession = models.CharField(
        max_length=100,
        blank=True,
        help_text='Parent profession (optional)',
    )
    emergency_contact = models.CharField(
        max_length=100,
        blank=True,
        help_text='Emergency contact name',
    )
    emergency_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text='Emergency contact number',
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Whether this parent account is active',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parents_profiles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]

    def __str__(self):
        return f'{self.user.email} — {self.user.get_full_name()}'
```

**Time Estimate:** 15 minutes

---

### Task 1.2: Register ParentProfile in Admin

**File:** `backend/apps/parents/admin.py`

**Implementation:**
```python
from django.contrib import admin
from .models import ParentProfile


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_email', 'phone_number', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')
    
    def user_email(self, obj):
        return obj.user.email if obj.user else '—'
    user_email.short_description = 'Email'
```

**Time Estimate:** 10 minutes

---

### Task 1.3: Create and Run Django Migration

**Command:**
```bash
cd backend
python manage.py makemigrations parents
python manage.py migrate
```

**Expected Output:**
```
Migrations for 'parents':
  parents/migrations/0001_initial.py
    - Create model ParentProfile
Running migrations:
  Applying parents.0001_initial... OK
```

**Time Estimate:** 5 minutes

---

## Phase 2: Backend API Verification

### Task 2.1: Verify UserManagementViewSet Returns All Roles

**File:** `backend/apps/authentication/views.py` (already correct, just verify)

**Test:** Call the account management endpoint with different role filters

```bash
# List all users
curl -H "Authorization: Bearer {access_token}" \
  http://localhost:8000/api/v1/auth/users/

# Filter by role=teacher
curl -H "Authorization: Bearer {access_token}" \
  http://localhost:8000/api/v1/auth/users/?role=teacher

# Filter by role=parent
curl -H "Authorization: Bearer {access_token}" \
  http://localhost:8000/api/v1/auth/users/?role=parent

# Search by email
curl -H "Authorization: Bearer {access_token}" \
  http://localhost:8000/api/v1/auth/users/?search=teacher@school.edu
```

**Expected Results:** API returns users of all roles correctly

**Time Estimate:** 10 minutes

---

### Task 2.2: Verify Login Endpoints

**Test 1: Generic Login (All Roles)**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@school.edu", "password": "password123"}'
```

**Test 2: Parent Login**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/parent/ \
  -H "Content-Type: application/json" \
  -d '{"email": "parent@home.edu", "password": "password123", "child_lrn": "123456789"}'
```

**Expected Results:** Both endpoints return JWT token with correct role

**Time Estimate:** 10 minutes

---

## Phase 3: Frontend Dashboard Updates

### Task 3.1: Update Account Management Dashboard

**File:** `frontend/src/components/AdminDashboard.jsx`

**Changes Needed:**
1. Ensure the dashboard fetches users from `/api/v1/auth/users/`
2. Display all users (not just students)
3. Add role column to user table
4. Add role-based filtering UI

**Implementation Checklist:**
- [ ] Fetch all users without role filter
- [ ] Display role badge/badge for each user
- [ ] Add dropdown/filter for role (Student/Teacher/Parent/etc.)
- [ ] Show count of total users by role
- [ ] Maintain existing search/sort functionality
- [ ] Add activation/deactivation per user
- [ ] Add delete user button

**Example UI Layout:**
```
┌────────────────────────────────────────────────────────┐
│ User Management Dashboard                              │
├────────────────────────────────────────────────────────┤
│ Filter by Role: [All] [Students] [Teachers] [Parents]  │
│ Search: [search box]                                   │
├────────────────────────────────────────────────────────┤
│ Email           | Name           | Role   | Status     │
├─────────────────┼─────────────────┼────────┼───────────┤
│ john@school.edu | John Doe       | Student| Active    │
│ jane@school.edu | Jane Smith     | Teacher| Active    │
│ parent@mail.com | Mary Johnson   | Parent | Active    │
└────────────────────────────────────────────────────────┘
```

**Time Estimate:** 1-2 hours

---

### Task 3.2: Update Dashboard Statistics

**File:** `frontend/src/components/Dashboard.jsx`

**Changes Needed:**
1. Fetch counts for each user type
2. Display statistics widgets for:
   - Total Students
   - Total Teachers
   - Total Parents
   - Total Registered Users

**Implementation Checklist:**
- [ ] Create API call to fetch user counts by role
- [ ] Add statistics cards/widgets to dashboard
- [ ] Update counts when users are added/removed
- [ ] Cache statistics to avoid excessive API calls
- [ ] Add percentage breakdown (e.g., Teachers = 15% of total)

**Example API Response:**
```json
{
  "students": 150,
  "teachers": 25,
  "parents": 100,
  "registrars": 2,
  "admins": 1,
  "total": 278
}
```

**Time Estimate:** 1 hour

---

### Task 3.3: Add Role-Based Account Actions

**File:** `frontend/src/components/AdminDashboard.jsx`

**Changes Needed:**
1. View account details by role
2. Activate/deactivate accounts
3. Delete accounts
4. Filter and search by role

**Implementation:**
- [ ] Add detail view for each user
- [ ] Show role-specific information (if available)
- [ ] Enable bulk actions (activate, deactivate, delete)
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement proper error handling

**Time Estimate:** 1-2 hours

---

## Phase 4: Testing & Validation

### Test Case 1: Create Test Users

**Steps:**
1. Log in as Admin
2. Create 3 test Teacher accounts via `/api/v1/auth/register/`
3. Create 3 test Parent accounts via `/api/v1/auth/register/`
4. Create 2 test Student accounts via Student enrollment

**Verification:**
- [ ] All users appear in account management dashboard
- [ ] Users show correct role
- [ ] User counts in statistics are accurate

**Time Estimate:** 30 minutes

---

### Test Case 2: Login Workflows

**Steps:**
1. Log in as Student (LRN + password)
2. Log in as Teacher (email + password)
3. Log in as Parent (email + password + child LRN)
4. Log in as Admin (email + password)

**Verification:**
- [ ] All login endpoints work
- [ ] JWT tokens have correct role
- [ ] Correct dashboard loads for each role
- [ ] No errors in console

**Time Estimate:** 30 minutes

---

### Test Case 3: Account Management Operations

**Steps:**
1. List all accounts (no filter)
2. Filter by role=teacher
3. Filter by role=parent
4. Search for specific user
5. Activate/deactivate an account
6. Delete a test account
7. Verify deletion from list

**Verification:**
- [ ] Filtering works correctly
- [ ] Search returns correct results
- [ ] Activate/deactivate updates is_active flag
- [ ] Deletion removes user from list
- [ ] No existing student workflows affected

**Time Estimate:** 45 minutes

---

### Test Case 4: Dashboard Statistics

**Steps:**
1. View dashboard after creating test users
2. Check student count
3. Check teacher count
4. Check parent count
5. Check total count

**Verification:**
- [ ] All counts are accurate
- [ ] Counts update when users are added/deleted
- [ ] Percentages calculated correctly
- [ ] Statistics visible without errors

**Time Estimate:** 30 minutes

---

### Test Case 5: Existing Student Functionality

**Steps:**
1. Create student enrollment
2. Student logs in with LRN
3. Student views dashboard and grades
4. Student updates profile
5. Parent links to student
6. Parent logs in and views student data

**Verification:**
- [ ] No changes to student enrollment workflow
- [ ] Student login still works
- [ ] Student grades display correctly
- [ ] Parent linking still works
- [ ] Parent login successful with child LRN

**Time Estimate:** 1 hour

---

## Phase 5: Database Backup & Migration

### Pre-Deployment Checklist

```bash
# 1. Backup current database
./backend/scripts/backup_database.sh

# 2. Create migration for ParentProfile
python manage.py makemigrations parents

# 3. Test migration on copy (optional)
python manage.py migrate

# 4. Verify database integrity
python manage.py sqlmigrate parents 0001

# 5. Run all tests
python manage.py test

# 6. Verify API endpoints
python manage.py runserver
# Test endpoints manually
```

**Time Estimate:** 30 minutes

---

## Implementation Timeline

| Phase | Task | Estimated Time | Priority |
|-------|------|-----------------|----------|
| 1.1 | Create ParentProfile model | 15 min | High |
| 1.2 | Register in admin | 10 min | High |
| 1.3 | Create and run migration | 5 min | High |
| 2.1 | Verify API returns all roles | 10 min | Medium |
| 2.2 | Verify login endpoints | 10 min | Medium |
| 3.1 | Update dashboard for all roles | 1-2 hours | **Critical** |
| 3.2 | Update statistics | 1 hour | **Critical** |
| 3.3 | Add role-based actions | 1-2 hours | High |
| 4.1 | Test user creation | 30 min | High |
| 4.2 | Test login workflows | 30 min | High |
| 4.3 | Test account management | 45 min | High |
| 4.4 | Test statistics | 30 min | High |
| 4.5 | Test existing functionality | 1 hour | **Critical** |
| 5 | Database backup & migration | 30 min | Medium |
| **TOTAL** | | **8-11 hours** | |

---

## Success Criteria

✅ **All of the following must pass:**

1. **Backend API**
   - [ ] `/api/v1/auth/users/` returns students, teachers, parents, registrars, admins
   - [ ] Role filtering works: `?role=student`, `?role=teacher`, `?role=parent`
   - [ ] Search works: `?search=email`
   - [ ] All login endpoints work for each role
   - [ ] New ParentProfile model migrated successfully

2. **Frontend Dashboard**
   - [ ] Account management displays all user roles
   - [ ] Role-based filtering UI works correctly
   - [ ] Statistics show accurate counts for each role
   - [ ] User activation/deactivation functions
   - [ ] User deletion functions (with confirmation)

3. **Account Creation**
   - [ ] New student accounts appear in dashboard
   - [ ] New teacher accounts appear in dashboard
   - [ ] New parent accounts appear in dashboard
   - [ ] All accounts have correct role assignment

4. **Existing Functionality**
   - [ ] Student enrollment workflow unchanged
   - [ ] Student login with LRN works
   - [ ] Parent login with child LRN works
   - [ ] Teacher login with email works
   - [ ] Admin login works
   - [ ] Role-based permissions unchanged
   - [ ] Grading system unchanged
   - [ ] Portal operations unchanged

5. **Testing Evidence**
   - [ ] Screenshots of account management showing all roles
   - [ ] API response showing users of all roles
   - [ ] Test results showing all test cases passing

---

## Rollback Plan

If critical issues occur:

1. **Revert database migration:**
   ```bash
   python manage.py migrate parents zero
   ```

2. **Restore database backup:**
   ```bash
   ./backend/scripts/restore_database.sh
   ```

3. **Revert frontend changes** (git rollback):
   ```bash
   git revert <commit>
   ```

**Estimated Rollback Time:** 15 minutes

---

## Deployment Steps

### Step 1: Prepare Backend
```bash
cd backend
python manage.py makemigrations parents
python manage.py migrate
python manage.py collectstatic --noinput
```

### Step 2: Update Frontend
```bash
cd frontend
npm install  # if needed
npm run build
```

### Step 3: Deploy
```bash
# Via Docker Compose
docker-compose up -d

# Or via manual deployment
python backend/manage.py runserver
npm start  # frontend dev server
```

### Step 4: Verify
- [ ] Django Admin loads
- [ ] API endpoints respond
- [ ] Frontend dashboard loads
- [ ] Account management displays all roles

---

## Documentation to Update

After implementation:

1. **Backend API Documentation**
   - Add ParentProfile model to schema
   - Document user filtering endpoints

2. **Frontend Documentation**
   - Document new dashboard features
   - Add screenshots of role-based filtering

3. **User Guide**
   - How to manage teacher accounts
   - How to manage parent accounts
   - Role-based permissions

4. **README.md**
   - Add note about role-based account management
   - Add link to account management guide

---

## Questions & Clarifications

**Q: What if a parent self-registers?**  
A: Not yet supported. Currently, parents must be created by admin via `/api/v1/auth/register/` endpoint. This can be added as a follow-up feature.

**Q: What about teacher self-registration?**  
A: Same as parents - currently admin-only. Can be added as follow-up.

**Q: Will this affect existing student data?**  
A: No. StudentProfile model unchanged. No data will be lost or modified.

**Q: Do we need to migrate existing parent accounts?**  
A: No. ParentProfile is optional (OneToOne to User). Existing parent User accounts will continue to work without a ParentProfile.

**Q: Can we delete parent or teacher accounts?**  
A: Yes, but with caution. Deleting a parent will cascade-delete their ParentStudentLinks. Consider deactivating instead.

---

## Next Steps

1. ✅ **Review this plan with stakeholders**
2. ⏳ **Proceed with Phase 1 (Backend changes)**
3. ⏳ **Proceed with Phase 2 (API verification)**
4. ⏳ **Proceed with Phase 3 (Frontend updates)**
5. ⏳ **Execute Phase 4 (Testing)**
6. ⏳ **Deploy Phase 5 (Production)**

---

