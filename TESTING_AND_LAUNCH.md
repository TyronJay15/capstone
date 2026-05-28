# Grade Portal Phase 3b — Production Testing & Readiness Guide

## Pre-Launch Testing Checklist

### Security Testing (Critical)

#### Authentication & JWT
- [ ] Student login works with valid credentials
- [ ] Student login fails with invalid credentials
- [ ] JWT access token is generated on login
- [ ] JWT access token expires after configured time
- [ ] JWT refresh token works correctly
- [ ] Token refresh generates new access token
- [ ] Expired token returns 401
- [ ] API automatically retries with refreshed token
- [ ] Logout clears all tokens

#### Authorization & Permissions
- [ ] Student can only access own profile
- [ ] Student cannot access other students' data
- [ ] Parent can only access linked children
- [ ] Teachers can only modify their own grades
- [ ] Registrars can process enrollments
- [ ] Admins have full access
- [ ] API returns 403 when access denied
- [ ] Admin panel requires admin role

#### Security Headers
```bash
curl -I https://yourdomain.com | grep -E \
  "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport"
```

Expected headers:
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security: present
- [ ] Content-Security-Policy: present

#### HTTPS & SSL
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate is valid
- [ ] SSL certificate is not self-signed
- [ ] Certificate chain is complete
- [ ] HSTS preload header present

#### CORS
- [ ] API accepts requests from frontend domain
- [ ] API rejects requests from unauthorized origins
- [ ] API responds with correct CORS headers
- [ ] Wildcard (*) is NOT used in production

### Data Persistence Testing

#### API-Only Mode
- [ ] `REACT_APP_USE_API_ONLY=true` is set in production
- [ ] Enrollment data does NOT save to localStorage
- [ ] Profile data does NOT save to localStorage
- [ ] API failure throws error (not silent fallback)
- [ ] User cannot access data when API is down
- [ ] Error message guides user to contact support

#### Database Persistence
- [ ] Student profile changes persist after logout/login
- [ ] Enrollment data persists across sessions
- [ ] Grade data persists across sessions
- [ ] All data readable after database restart
- [ ] MySQL foreign keys prevent invalid data
- [ ] Database UTF-8 support works correctly

### Role-Based Workflow Testing

#### Student Workflow
1. Student enrolls
   - [ ] Enrollment form accepted
   - [ ] Enrollment saved to database
   - [ ] Confirmation email sent (if enabled)

2. Registrar approves enrollment
   - [ ] Registrar can view pending enrollments
   - [ ] Registrar can approve/reject
   - [ ] Approval creates StudentProfile
   - [ ] Student receives notification

3. Admin assigns to section
   - [ ] Admin can view approved students
   - [ ] Admin can assign to sections
   - [ ] Section assignment saved correctly
   - [ ] Student dashboard shows section

4. Student logs in
   - [ ] Dashboard loads correctly
   - [ ] Grades visible
   - [ ] Profile editable
   - [ ] Can update profile via API
   - [ ] Changes persist

#### Teacher Workflow
1. Teacher logs in
   - [ ] Dashboard shows assigned sections
   - [ ] Can access grade entry forms

2. Teacher enters grades
   - [ ] Grades save correctly
   - [ ] Can bulk upload CSV
   - [ ] Validation prevents invalid grades
   - [ ] Changes persist after logout

3. Teacher views analytics
   - [ ] Class performance shows
   - [ ] Student performance detailed
   - [ ] Graphs render correctly

#### Parent Workflow
1. Parent logs in with child LRN
   - [ ] Dashboard shows only linked child
   - [ ] Cannot access other children

2. Parent views child's grades
   - [ ] All grades visible
   - [ ] Section and class info shown
   - [ ] Latest update time displayed

3. Parent receives notifications
   - [ ] New grades trigger notification
   - [ ] Attendance alerts sent
   - [ ] Messages appear in notification center

### API Performance Testing

#### Response Times
```bash
# Measure response times
time curl -H "Authorization: Bearer $TOKEN" \
  https://yourdomain.com/api/v1/students/me/
```

Requirements:
- [ ] API response < 500ms (average)
- [ ] API response < 1000ms (99th percentile)
- [ ] Static files < 200ms
- [ ] Database queries < 100ms

#### Concurrent Users
```bash
# Load test with Apache Bench
ab -n 1000 -c 100 https://yourdomain.com/api/v1/enrollment/

# Or use Locust
locust -f locustfile.py --host=https://yourdomain.com
```

Requirements:
- [ ] 100 concurrent users no errors
- [ ] 500 concurrent users < 2% errors
- [ ] Database connections pool correctly
- [ ] No memory leaks after 1 hour

#### Rate Limiting
```bash
# Send 150 requests in 60 seconds (should be throttled)
for i in {1..150}; do curl https://yourdomain.com/api/v1/; done
```

Requirements:
- [ ] Anon: ~100 requests/hour allowed
- [ ] Auth: ~1000 requests/hour allowed
- [ ] Returns 429 when throttled
- [ ] Throttle headers present

### Data Integrity Testing

#### Database Constraints
- [ ] Cannot create duplicate LRN
- [ ] Cannot create enrollment without section
- [ ] Cannot create grade without student/subject
- [ ] Foreign key cascade deletes work
- [ ] Unique constraints enforced

#### Transaction Safety
- [ ] Bulk grade uploads are atomic
- [ ] Failed upload doesn't partially save
- [ ] Database rollback works correctly
- [ ] No orphaned records in database

### Error Handling Testing

#### Expected Errors
- [ ] 404 when resource not found
- [ ] 403 when access denied
- [ ] 400 with validation errors
- [ ] 401 when authentication fails
- [ ] 500 errors logged (not returned to user)

#### User-Facing Errors
- [ ] Error messages are helpful
- [ ] No technical stack traces exposed
- [ ] Logging includes full error details
- [ ] Admin gets notified of errors

### Backup & Recovery Testing

#### Backup Process
```bash
# Test backup creation
docker-compose exec backend ./scripts/backup_database.sh ./backups 30

# Verify backup file exists
ls -lh backend/backups/gradeportal_*.sql.gz
```

Requirements:
- [ ] Backup completes in < 5 minutes
- [ ] Backup file is compressed
- [ ] Backup size reasonable (< 1GB)
- [ ] Can compress multiple backups

#### Restore Process
```bash
# Test restore
docker-compose exec backend ./scripts/restore_database.sh \
  ./backups/gradeportal_latest.sql.gz
```

Requirements:
- [ ] Restore completes successfully
- [ ] All tables restored
- [ ] Data matches backup
- [ ] No corruption after restore

### Deployment Validation

#### Docker Setup
- [ ] docker-compose builds without errors
- [ ] All services start correctly
- [ ] Health checks pass
- [ ] Container logs are readable
- [ ] Volumes mount correctly

#### Configuration Files
- [ ] Nginx config valid (test with: nginx -t)
- [ ] Gunicorn config loads
- [ ] All environment variables set
- [ ] No secrets in git repo
- [ ] .env files not committed

#### Static Files
- [ ] collectstatic runs without errors
- [ ] All admin static files present
- [ ] Frontend build completes
- [ ] Static files serve from /static/
- [ ] Media files serve from /media/

---

## Production Launch Checklist

### 48 Hours Before Launch

- [ ] Run full test suite
- [ ] Run `python validate_production_readiness.py`
- [ ] Database backup created
- [ ] SSL certificate valid and auto-renewing
- [ ] DNS records configured and propagating
- [ ] Load balancer health checks passing
- [ ] Monitoring and alerting configured
- [ ] On-call rotation scheduled
- [ ] Incident response plan written
- [ ] Team trained on deployment

### 24 Hours Before Launch

- [ ] Final backup taken
- [ ] Run performance tests under load
- [ ] Test all user workflows one more time
- [ ] Database restore tested
- [ ] Nginx configuration reviewed
- [ ] Security headers verified
- [ ] API documentation updated
- [ ] Status page created
- [ ] Communication plan confirmed
- [ ] Maintenance window scheduled (if needed)

### Launch Day

- [ ] Check all systems one final time
- [ ] Monitor error logs constantly
- [ ] Monitor response times
- [ ] Monitor database connections
- [ ] Monitor disk usage
- [ ] Be prepared for rollback
- [ ] Document any issues
- [ ] Keep team updated

---

## Critical Issues During Launch

### If Something Goes Wrong

**Issue: API returning 500 errors**
```bash
# 1. Check backend logs
docker-compose logs backend | tail -100

# 2. Check database connection
docker-compose exec backend python manage.py dbshell

# 3. Restart backend
docker-compose restart backend

# 4. If no resolution, rollback
docker-compose down
git checkout previous-commit
docker-compose up -d
```

**Issue: Database connection failing**
```bash
# 1. Check MySQL is running
docker-compose ps db

# 2. Check MySQL logs
docker-compose logs db

# 3. Restore from backup if corrupted
./backend/scripts/restore_database.sh ./backend/backups/latest.sql.gz

# 4. Restart MySQL
docker-compose restart db
```

**Issue: Frontend not loading**
```bash
# 1. Check Nginx logs
docker-compose logs nginx

# 2. Verify frontend files exist
docker-compose exec nginx ls -la /var/www/gradeportal/frontend/

# 3. Restart Nginx
docker-compose restart nginx
```

**Issue: SSL certificate errors**
```bash
# 1. Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain/cert.pem -noout -dates

# 2. Renew certificate
certbot renew --force-renewal

# 3. Restart Nginx
docker-compose restart nginx
```

---

## Post-Launch Validation (First Week)

### Daily
- [ ] Check error logs for anomalies
- [ ] Verify API response times
- [ ] Check database size growth
- [ ] Monitor login success rate
- [ ] Monitor API error rate
- [ ] Backup completed successfully
- [ ] All services healthy

### Weekly
- [ ] Security audit logs
- [ ] Database optimization
- [ ] User feedback review
- [ ] Performance report
- [ ] Backup restore test

---

## Production Runbook

### Daily Operations
```bash
# View logs
docker-compose logs -f backend

# Check service status
docker-compose ps

# Monitor real-time
watch docker-compose ps

# Database backup
docker-compose exec backend ./scripts/backup_database.sh

# Collect static files (if updated)
docker-compose exec backend python manage.py collectstatic --noinput
```

### Common Tasks

**Restart backend after code update:**
```bash
git pull origin main
docker-compose build backend
docker-compose up -d backend
```

**Restore database from backup:**
```bash
docker-compose exec backend ./scripts/restore_database.sh <backup_file>
docker-compose restart backend
```

**Scale services:**
```bash
# Increase workers (in .env)
GUNICORN_WORKERS=8

docker-compose up -d backend
```

---

## Monitoring Setup

### Essential Metrics to Track
- API response time (p50, p95, p99)
- Error rate (errors per minute)
- Database connection pool usage
- CPU usage (target < 70%)
- Memory usage (target < 80%)
- Disk usage (alert > 80%)
- Active user sessions

### Recommended Monitoring Tools
- **Application**: New Relic, DataDog, or APM Pro
- **Uptime**: UptimeRobot (free), PagerDuty
- **Logs**: ELK Stack, Splunk, or CloudWatch
- **Errors**: Sentry (free tier available)
- **Frontend**: Sentry, LogRocket

### Example Sentry Setup
```python
# In settings/production.py
SENTRY_DSN = os.environ.get('SENTRY_DSN')
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=0.1)
```

```bash
# Set in environment
export SENTRY_DSN=https://...@sentry.io/...
```

---

## Success Criteria

After 1 week of production deployment, verify:

- [ ] 99.9% uptime achieved
- [ ] Average API response time < 200ms
- [ ] Error rate < 0.1%
- [ ] No critical security issues
- [ ] Zero data loss incidents
- [ ] Backup/restore procedure verified
- [ ] All users able to login
- [ ] All workflows function correctly
- [ ] Performance meets SLA requirements
- [ ] Team comfortable with operations

**If all criteria met: Phase 3b deployment is successful! 🎉**
