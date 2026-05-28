# Grade Portal — Phase 3a Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Copy `.env.example` to `.env` (backend)
- [ ] Copy `.env.example` to `.env.production` (frontend)
- [ ] Generate a strong `SECRET_KEY` using Django
  ```bash
  python manage.py shell
  >>> from django.core.management.utils import get_random_secret_key
  >>> print(get_random_secret_key())
  ```
- [ ] Set `DEBUG=False` in backend `.env`
- [ ] Set `REACT_APP_USE_API_ONLY=true` in frontend `.env`
- [ ] Configure `ALLOWED_HOSTS` with your production domain(s)
- [ ] Configure `CORS_ALLOWED_ORIGINS` with your frontend URL
- [ ] Set `DATABASE_URL` or individual MySQL connection variables
- [ ] Configure `SECURE_SSL_REDIRECT=true` for HTTPS-only access

### 2. Database Setup

- [ ] Verify MySQL server is running and accessible
- [ ] Create database user with proper privileges
- [ ] Test database connection:
  ```bash
  python manage.py dbshell
  ```
- [ ] Run database migrations:
  ```bash
  python manage.py migrate
  ```
- [ ] Verify all migrations applied successfully

### 3. Static Files

- [ ] Collect static files:
  ```bash
  python manage.py collectstatic --noinput
  ```
- [ ] Verify `staticfiles/` directory is created and populated
- [ ] Configure web server (Nginx, Apache) to serve static files

### 4. Backend Security

- [ ] Verify `SECURE_SSL_REDIRECT=true`
- [ ] Verify `SESSION_COOKIE_SECURE=true`
- [ ] Verify `CSRF_COOKIE_SECURE=true`
- [ ] Verify `SECURE_HSTS_SECONDS` is set (31536000 = 1 year)
- [ ] Test SSL/TLS certificate is valid and trusted

### 5. Frontend Security

- [ ] Verify `REACT_APP_USE_API_ONLY=true` in production build
- [ ] Verify `REACT_APP_API_BASE_URL` points to HTTPS API
- [ ] Verify no hardcoded localhost or development URLs
- [ ] Run production build:
  ```bash
  REACT_APP_API_BASE_URL=https://api.yourdomain.com/api/v1 \
  REACT_APP_USE_API_ONLY=true \
  npm run build
  ```

### 6. Authentication & JWT

- [ ] Verify JWT tokens use secure settings
- [ ] Test JWT token refresh mechanism works
- [ ] Verify refresh token rotation is enabled
- [ ] Test session timeout behavior

### 7. API Documentation

- [ ] Document all API endpoints
- [ ] Provide API authentication instructions
- [ ] Document rate limiting behavior
- [ ] Provide error response format documentation

## Deployment Validation Commands

### Backend Validation

```bash
# Check Django settings
python manage.py check --deploy

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput --clear

# Create superuser for admin access
python manage.py createsuperuser

# Test JWT authentication
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/students/me/
```

### Frontend Validation

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Verify build output
ls -la dist/

# Test built version locally
npm install -g serve
serve -s dist -l 3000
```

### Docker Deployment Validation

```bash
# Build and validate Docker images
docker-compose build

# Validate docker-compose configuration
docker-compose config

# Start services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test API from inside container
docker-compose exec backend python manage.py check --deploy
```

## Production Deployment Scenarios

### Scenario 1: Railway Deployment

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Link to Railway project
railway link

# 3. Set environment variables
railway variables set SECRET_KEY="your-generated-key"
railway variables set DEBUG=False
railway variables set DATABASE_URL="mysql://..."
railway variables set REACT_APP_USE_API_ONLY=true
railway variables set REACT_APP_API_BASE_URL="https://your-app.railway.app/api/v1"

# 4. Deploy
railway up
```

### Scenario 2: Render Deployment

```bash
# 1. Connect GitHub repository to Render

# 2. Create web service with build command:
# ./build.sh

# 3. Set environment variables in Render dashboard

# 4. Deploy by pushing to GitHub
git push origin main
```

### Scenario 3: Docker + Nginx (VPS Deployment)

```bash
# 1. SSH into VPS
ssh user@your-vps.com

# 2. Clone repository
git clone https://github.com/yourusername/gradeportal2.git
cd gradeportal2

# 3. Create .env with production values
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# 4. Build and run
docker-compose -f docker-compose.yml up -d

# 5. Verify
docker-compose ps
docker-compose logs backend
```

### Scenario 4: AWS Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize EB application
eb init -p "Python 3.11" gradeportal

# 3. Create environment
eb create production-env

# 4. Set environment variables
eb setenv SECRET_KEY="..." DEBUG=False ...

# 5. Deploy
eb deploy
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check backend health
curl -I https://api.yourdomain.com/api/v1/enrollment/academic-years/

# Check frontend loads
curl -I https://yourdomain.com/

# Check HTTPS redirects
curl -I http://yourdomain.com/  # Should redirect to https://
```

### 2. Functional Tests

```bash
# Test student login
curl -X POST https://api.yourdomain.com/api/v1/auth/login/student/ \
  -H "Content-Type: application/json" \
  -d '{"lrn":"2025-001","password":"password123"}'

# Test student profile update
curl -X PATCH https://api.yourdomain.com/api/v1/students/me/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Maria","email":"maria@example.com"}'

# Test enrollment data fetch
curl https://api.yourdomain.com/api/v1/enrollment/ \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Security Verification

```bash
# Verify HTTPS only
curl -I https://yourdomain.com/  # Should work
curl -I http://yourdomain.com/   # Should redirect to https

# Check security headers
curl -I https://api.yourdomain.com/api/v1/students/me/ | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"

# Check CORS
curl -I -H "Origin: https://yourdomain.com" \
  https://api.yourdomain.com/api/v1/students/me/
```

### 4. Performance Checks

```bash
# Check response times
time curl https://api.yourdomain.com/api/v1/students/me/ \
  -H "Authorization: Bearer $TOKEN"

# Monitor server resources
top  # CPU and memory usage
df -h  # Disk usage
```

## Rollback Procedures

### If Issues Arise

```bash
# 1. Check logs for errors
docker-compose logs -f backend
docker-compose logs -f frontend

# 2. Rollback to previous version
git checkout previous-commit
docker-compose build
docker-compose down
docker-compose up -d

# 3. Run migrations if needed
docker-compose exec backend python manage.py migrate

# 4. Verify rollback succeeded
curl https://api.yourdomain.com/api/v1/students/me/
```

## Monitoring & Maintenance

### Regular Tasks

- [ ] Monitor application logs daily
- [ ] Check API response times
- [ ] Verify database backups are occurring
- [ ] Monitor disk space and memory usage
- [ ] Update dependencies monthly
- [ ] Review security logs weekly

### Recommended Tools

- **Application Monitoring**: Sentry, New Relic, DataDog
- **Log Management**: ELK Stack, Splunk, CloudWatch
- **Error Tracking**: Sentry, Rollbar
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Database**: AWS RDS, DigitalOcean Managed Database

## Support & Troubleshooting

### Common Issues

**JWT Token Expired**
```
Error: "Token is invalid or expired"
Solution: Frontend should automatically refresh using refresh token
```

**Database Connection Error**
```
Error: "Can't connect to MySQL server"
Solution: Verify DATABASE_URL or MYSQL_* env vars
```

**CORS Error**
```
Error: "Access to XMLHttpRequest blocked by CORS policy"
Solution: Add frontend URL to CORS_ALLOWED_ORIGINS
```

**Static Files Not Loading**
```
Error: 404 on /static/... files
Solution: Run: python manage.py collectstatic --noinput
```

## Security Reminders

⚠️ **NEVER**:
- Commit `.env` files to version control
- Use demo passwords in production
- Set `DEBUG=True` in production
- Use unrestricted CORS ("*")
- Hardcode secrets in code
- Skip SSL/TLS encryption

✅ **ALWAYS**:
- Use environment variables for secrets
- Enable HTTPS/TLS
- Set strong, unique passwords
- Use JWT tokens for authentication
- Monitor logs and errors
- Regular security audits
- Keep dependencies updated

---

For additional help, see:
- [Django Production Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
