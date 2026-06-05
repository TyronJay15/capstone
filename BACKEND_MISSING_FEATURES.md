# Backend Missing Features - Comprehensive Analysis

**Date:** June 5, 2026  
**Status:** Implementation Roadmap for Account Management System

---

## Executive Summary

**What's Complete (✅):**
- Custom User model with role-based access control
- ParentProfile model created
- StudentLoginLog model with tracking integration
- Admin interface for all models
- Student login tracking (IP address + user agent captured)
- All login endpoints (student, parent, teacher, generic)
- UserManagementViewSet for account management

**What's Missing (❌):**
1. Parent and Teacher login tracking
2. API serializers and views for Parent/Teacher profiles
3. Account activity endpoints
4. Statistics endpoints
5. Login history API access
6. Profile auto-creation on registration
7. Advanced account management features

---

## Detailed Missing Features List

### PRIORITY 1: LOGIN TRACKING COMPLETION

#### 1.1 Parent Login Tracking ❌

**What's needed:**
- ParentLoginLog model (mirror of StudentLoginLog)
- Integration into ParentTokenObtainPairSerializer
- Admin interface for viewing parent login logs

**File to create:** `backend/apps/parents/models.py`

```python
class ParentLoginLog(models.Model):
    """Track parent login activity."""
    parent = models.ForeignKey(ParentProfile, on_delete=models.CASCADE, related_name='login_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_login_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    login_time = models.DateTimeField(auto_now_add=True, db_index=True)
    logout_time = models.DateTimeField(null=True, blank=True)
```

**Files to modify:**
- `backend/apps/parents/models.py` - Add ParentLoginLog
- `backend/apps/parents/admin.py` - Register ParentLoginLog admin
- `backend/apps/authentication/serializers.py` - Update ParentTokenObtainPairSerializer
- Create migration: `parents/migrations/0002_parentloginlog.py`

**Time:** ~45 minutes

---

#### 1.2 Teacher Login Tracking ❌

**What's needed:**
- TeacherLoginLog model (mirror of StudentLoginLog)
- Integration into EmailTokenObtainPairSerializer (for teacher logins)
- Admin interface for viewing teacher login logs

**File to create:** `backend/apps/teachers/models.py`

```python
class TeacherLoginLog(models.Model):
    """Track teacher login activity."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_login_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    login_time = models.DateTimeField(auto_now_add=True, db_index=True)
    logout_time = models.DateTimeField(null=True, blank=True)
```

**Files to modify:**
- `backend/apps/teachers/admin.py` - Register TeacherLoginLog admin
- `backend/apps/authentication/serializers.py` - Update EmailTokenObtainPairSerializer
- Create migration: `teachers/migrations/0001_teacherloginlog.py`

**Time:** ~45 minutes

---

### PRIORITY 2: API SERIALIZERS & VIEWS

#### 2.1 Parent Profile Serializer ❌

**File to create:** `backend/apps/parents/serializers.py`

```python
class ParentProfileSerializer(serializers.ModelSerializer):
    """Serialize ParentProfile for API."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ParentProfile
        fields = ('id', 'user_email', 'full_name', 'phone_number', 'address', 
                  'profession', 'emergency_contact', 'emergency_phone', 'is_active')
        read_only_fields = ('id', 'user_email', 'created_at', 'updated_at')
    
    def get_full_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return '—'
```

**Time:** ~20 minutes

---

#### 2.2 Parent Login Log Serializer ❌

**File to update:** `backend/apps/parents/serializers.py`

```python
class ParentLoginLogSerializer(serializers.ModelSerializer):
    """Serialize parent login history."""
    parent_email = serializers.EmailField(source='user.email', read_only=True)
    session_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = ParentLoginLog
        fields = ('id', 'parent_email', 'ip_address', 'login_time', 'logout_time', 'session_duration')
        read_only_fields = fields
    
    def get_session_duration(self, obj):
        if obj.logout_time:
            return (obj.logout_time - obj.login_time).total_seconds()
        return None
```

**Time:** ~15 minutes

---

#### 2.3 Teacher Profile Serializer ❌

**File to create:** `backend/apps/teachers/serializers.py` (update existing)

Add:
```python
class TeacherLoginLogSerializer(serializers.ModelSerializer):
    """Serialize teacher login history."""
    teacher_email = serializers.EmailField(source='user.email', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    session_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherLoginLog
        fields = ('id', 'teacher_email', 'teacher_name', 'ip_address', 'login_time', 
                  'logout_time', 'session_duration')
        read_only_fields = fields
```

**Time:** ~15 minutes

---

### PRIORITY 3: API VIEWS & ENDPOINTS

#### 3.1 Parent Profile ViewSet ❌

**File to create/update:** `backend/apps/parents/views.py`

```python
class ParentProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """View and list parent profiles."""
    serializer_class = ParentProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'phone_number']
    ordering_fields = ['created_at', 'user__email']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ParentProfile.objects.select_related('user')
        if user.role == 'parent' and hasattr(user, 'parent_profile'):
            return ParentProfile.objects.filter(user=user)
        return ParentProfile.objects.none()
```

**Time:** ~30 minutes

---

#### 3.2 Parent Login History View ❌

**File to update:** `backend/apps/parents/views.py`

```python
class ParentLoginHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """View parent login history."""
    serializer_class = ParentLoginLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['parent__user__email', 'login_time']
    ordering = ['-login_time']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ParentLoginLog.objects.select_related('user', 'parent')
        if user.role == 'parent' and hasattr(user, 'parent_profile'):
            return user.parent_login_logs.all()
        return ParentLoginLog.objects.none()
```

**Time:** ~30 minutes

---

#### 3.3 Teacher Login History View ❌

**File to update:** `backend/apps/teachers/views.py`

```python
class TeacherLoginHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """View teacher login history."""
    serializer_class = TeacherLoginLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering = ['-login_time']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return TeacherLoginLog.objects.select_related('user')
        if user.role == 'teacher':
            return user.teacher_login_logs.all()
        return TeacherLoginLog.objects.none()
```

**Time:** ~30 minutes

---

### PRIORITY 4: STATISTICS ENDPOINTS

#### 4.1 Account Statistics Endpoint ❌

**File to update:** `backend/apps/authentication/views.py`

```python
class AccountStatisticsView(APIView):
    """Get account statistics by role."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['admin', 'registrar']:
            return Response({'detail': 'Unauthorized'}, status=403)
        
        stats = {
            'total_users': User.objects.count(),
            'students': User.objects.filter(role='student').count(),
            'teachers': User.objects.filter(role='teacher').count(),
            'parents': User.objects.filter(role='parent').count(),
            'registrars': User.objects.filter(role='registrar').count(),
            'admins': User.objects.filter(role='admin').count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'inactive_users': User.objects.filter(is_active=False).count(),
        }
        return Response(stats)
```

**Endpoint:** `GET /api/v1/auth/statistics/`

**Time:** ~20 minutes

---

#### 4.2 Login Activity Dashboard ❌

**File to create:** `backend/apps/authentication/views.py` (new endpoint)

```python
class LoginActivityView(APIView):
    """Get recent login activity."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role not in ['admin', 'registrar']:
            return Response({'detail': 'Unauthorized'}, status=403)
        
        from apps.students.models import StudentLoginLog
        from apps.parents.models import ParentLoginLog
        from apps.teachers.models import TeacherLoginLog
        
        student_logins = StudentLoginLog.objects.select_related('user', 'student')[:10]
        parent_logins = ParentLoginLog.objects.select_related('user', 'parent')[:10]
        teacher_logins = TeacherLoginLog.objects.select_related('user')[:10]
        
        data = {
            'recent_student_logins': StudentLoginLogSerializer(student_logins, many=True).data,
            'recent_parent_logins': ParentLoginLogSerializer(parent_logins, many=True).data,
            'recent_teacher_logins': TeacherLoginLogSerializer(teacher_logins, many=True).data,
        }
        return Response(data)
```

**Endpoint:** `GET /api/v1/auth/login-activity/`

**Time:** ~30 minutes

---

### PRIORITY 5: URL ROUTING

#### 5.1 Parents URLs ❌

**File to update:** `backend/apps/parents/urls.py`

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ParentProfileViewSet, ParentLoginHistoryViewSet

router = DefaultRouter()
router.register('profiles', ParentProfileViewSet, basename='parent-profile')
router.register('login-history', ParentLoginHistoryViewSet, basename='parent-login-history')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Time:** ~15 minutes

---

#### 5.2 Teachers URLs Update ❌

**File to update:** `backend/apps/teachers/urls.py`

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import TeacherRosterView, TeacherAssignmentsView, TeacherLoginHistoryViewSet

router = DefaultRouter()
router.register('login-history', TeacherLoginHistoryViewSet, basename='teacher-login-history')

urlpatterns = [
    path('roster/', TeacherRosterView.as_view(), name='teacher-roster'),
    path('assignments/', TeacherAssignmentsView.as_view(), name='teacher-assignments'),
    path('', include(router.urls)),
]
```

**Time:** ~15 minutes

---

#### 5.3 Authentication URLs ❌

**File to update:** `backend/apps/authentication/urls.py`

Add:
```python
path('statistics/', AccountStatisticsView.as_view(), name='auth-statistics'),
path('login-activity/', LoginActivityView.as_view(), name='auth-login-activity'),
```

**Time:** ~10 minutes

---

### PRIORITY 6: DATABASE MIGRATIONS

#### 6.1 Parent Models Migration ❌

```bash
python manage.py makemigrations parents
python manage.py migrate parents
```

**Time:** ~5 minutes

---

#### 6.2 Teacher Models Migration ❌

```bash
python manage.py makemigrations teachers
python manage.py migrate teachers
```

**Time:** ~5 minutes

---

### PRIORITY 7: OPTIONAL ENHANCEMENTS

#### 7.1 Profile Auto-Creation on Registration ❌

**Where:** Update `RegisterStaffView` in `backend/apps/authentication/views.py`

```python
def post(self, request):
    # ... existing code ...
    user = serializer.save()
    
    # Auto-create profile if needed
    if user.role == 'parent':
        ParentProfile.objects.get_or_create(user=user)
    elif user.role == 'teacher':
        # Optional: create teacher profile
        pass
    
    return Response(UserSerializer(user).data, status=201)
```

**Time:** ~20 minutes

---

#### 7.2 Account Activity Signals ❌

**Create:** `backend/apps/authentication/signals.py`

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import User

@receiver(post_save, sender=User)
def user_created(sender, instance, created, **kwargs):
    """Log user creation."""
    if created:
        print(f"User created: {instance.email} (role: {instance.role})")

@receiver(post_delete, sender=User)
def user_deleted(sender, instance, **kwargs):
    """Log user deletion."""
    print(f"User deleted: {instance.email}")
```

**Time:** ~20 minutes

---

#### 7.3 Bulk Export Login History ❌

**Create endpoint:** `backend/apps/authentication/views.py`

```python
class ExportLoginHistoryView(APIView):
    """Export login history as CSV."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import csv
        from django.http import HttpResponse
        
        if request.user.role not in ['admin', 'registrar']:
            return Response({'detail': 'Unauthorized'}, status=403)
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="login_history.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['User Email', 'Role', 'Login Time', 'IP Address', 'User Agent'])
        
        # Write data...
        
        return response
```

**Time:** ~45 minutes

---

## Implementation Order (Recommended)

### Phase 1: Login Tracking (CRITICAL)
1. Parent login tracking (~45 min)
2. Teacher login tracking (~45 min)
3. **Subtotal: ~90 minutes**

### Phase 2: Serializers & Views (IMPORTANT)
4. Parent profile serializer (~20 min)
5. Parent login log serializer (~15 min)
6. Teacher login log serializer (~15 min)
7. Parent profile viewset (~30 min)
8. Parent login history viewset (~30 min)
9. Teacher login history viewset (~30 min)
10. **Subtotal: ~140 minutes**

### Phase 3: Statistics & Activity (HIGH)
11. Account statistics endpoint (~20 min)
12. Login activity dashboard (~30 min)
13. **Subtotal: ~50 minutes**

### Phase 4: URL Routing & Migrations (ESSENTIAL)
14. Update parents URLs (~15 min)
15. Update teachers URLs (~15 min)
16. Update auth URLs (~10 min)
17. Parent models migration (~5 min)
18. Teacher models migration (~5 min)
19. **Subtotal: ~50 minutes**

### Phase 5: Optional Enhancements (NICE-TO-HAVE)
20. Profile auto-creation (~20 min)
21. Account activity signals (~20 min)
22. Bulk export functionality (~45 min)
23. **Subtotal: ~85 minutes**

---

## Summary

| Category | Status | Time | Priority |
|----------|--------|------|----------|
| Login tracking | ❌ | 90 min | 🔴 CRITICAL |
| Serializers & Views | ❌ | 140 min | 🟠 IMPORTANT |
| Statistics endpoints | ❌ | 50 min | 🟠 IMPORTANT |
| URL routing & migrations | ❌ | 50 min | 🔴 CRITICAL |
| Optional enhancements | ❌ | 85 min | 🟡 NICE-TO-HAVE |
| **TOTAL** | | **415 min (6.9 hrs)** | |

---

## New API Endpoints to Add

```
AUTHENTICATION
GET    /api/v1/auth/statistics/                    # Account statistics by role
GET    /api/v1/auth/login-activity/               # Recent login activity

PARENTS
GET    /api/v1/parents/profiles/                  # List all parent profiles
GET    /api/v1/parents/profiles/{id}/             # Get single parent profile
GET    /api/v1/parents/login-history/             # Parent login history

TEACHERS
GET    /api/v1/teachers/login-history/            # Teacher login history
```

---

## Files to Create

1. ❌ `backend/apps/parents/serializers.py` - NEW
2. ❌ `backend/apps/parents/migrations/0002_parentloginlog.py` - GENERATED
3. ❌ `backend/apps/teachers/migrations/0001_teacherloginlog.py` - GENERATED
4. ❌ `backend/apps/teachers/urls.py` (update/create)
5. ❌ `backend/apps/authentication/signals.py` (optional)

---

## Files to Modify

1. ❌ `backend/apps/parents/models.py` - Add ParentLoginLog
2. ❌ `backend/apps/parents/admin.py` - Register ParentLoginLog
3. ❌ `backend/apps/parents/views.py` - Add viewsets
4. ❌ `backend/apps/parents/urls.py` - Add routes
5. ❌ `backend/apps/teachers/models.py` - Add TeacherLoginLog
6. ❌ `backend/apps/teachers/admin.py` - Register TeacherLoginLog
7. ❌ `backend/apps/teachers/views.py` - Add viewsets
8. ❌ `backend/apps/teachers/serializers.py` - Update serializers
9. ❌ `backend/apps/authentication/serializers.py` - Add login tracking
10. ❌ `backend/apps/authentication/views.py` - Add statistics/activity views
11. ❌ `backend/apps/authentication/urls.py` - Add new routes

---

## Next Steps

1. ✅ Review this missing features list
2. ⏳ Confirm priorities with stakeholders
3. ⏳ Begin Phase 1 implementation (login tracking)
4. ⏳ Progress through phases in order
5. ⏳ Test each phase before moving to next

