# Grade Portal Phase 3b — Platform-Specific Deployment Guides

## Quick Start Summary

| Platform | Complexity | Cost | Setup Time |
|----------|-----------|------|-----------|
| **Railway** | ⭐ Very Easy | Affordable | 15 mins |
| **Render** | ⭐ Very Easy | Free tier available | 20 mins |
| **DigitalOcean + Docker** | ⭐⭐⭐ Moderate | $5-20/month | 30 mins |
| **AWS ECS** | ⭐⭐⭐⭐ Complex | Variable | 45 mins |
| **Docker + Nginx (VPS)** | ⭐⭐⭐ Moderate | $5-50/month | 30 mins |

---

## 1. Railway Deployment (Recommended for Beginners)

Railway is the **easiest** deployment option with zero-configuration databases.

### Prerequisites
- Railway account (free tier available)
- GitHub repository with your code
- Domain name (optional, Railway provides subdomain)

### Step-by-Step

#### 1.1 Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

#### 1.2 Connect GitHub Repository
1. Go to railway.app dashboard
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Select your `gradeportal2` repository
5. Choose the main branch

#### 1.3 Configure Services

**Add MySQL Database:**
1. In project, click "+ Add Service"
2. Select "MySQL"
3. Railway automatically creates database
4. Note the connection string

**Add Backend Service:**
1. Click "+ Add Service"
2. Select your GitHub repo
3. Set environment variables:

```env
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
SECRET_KEY=<generate-random-key>
ALLOWED_HOSTS=<your-app>.railway.app,yourdomain.com
CORS_ALLOWED_ORIGINS=https://<your-app>.railway.app,https://yourdomain.com
DATABASE_URL=<from-mysql-service>
REACT_APP_API_BASE_URL=https://<your-app>.railway.app/api/v1
REACT_APP_USE_API_ONLY=true
```

#### 1.4 Set Build & Deploy Commands

**Build Command:**
```bash
python manage.py collectstatic --noinput
python manage.py migrate
```

**Start Command:**
```bash
gunicorn -c backend/gunicorn_config.py config.wsgi:application
```

#### 1.5 Deploy Frontend

Create `.railwayrc.json` in frontend directory:
```json
{
  "build": "npm run build",
  "start": "npm install -g serve && serve -s dist -l 3000"
}
```

Or deploy to Vercel/Netlify for static hosting.

### Cost Estimate
- Railway tier: $7-20/month
- MySQL: Included (with tier)
- **Total: $7-20/month**

### Monitoring
- Railway dashboard shows logs in real-time
- Use command: `railway logs` to view backend logs

---

## 2. Render Deployment (Best for Simplicity)

Render provides generous free tier and easy GitHub integration.

### Prerequisites
- Render account (free tier available)
- GitHub repository
- Domain name (optional)

### Step-by-Step

#### 2.1 Create Backend Service
1. Go to render.com
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub repository
5. Choose Python as environment

#### 2.2 Configure Backend
```
Service Name: gradeportal-backend
Runtime: Python
Build Command: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
Start Command: gunicorn -c backend/gunicorn_config.py config.wsgi:application
```

#### 2.3 Add Environment Variables
```env
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
SECRET_KEY=<random-secret-key>
ALLOWED_HOSTS=gradeportal-backend.onrender.com,yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
REACT_APP_API_BASE_URL=https://gradeportal-backend.onrender.com/api/v1
REACT_APP_USE_API_ONLY=true
```

#### 2.4 Add MySQL Database
1. In Render dashboard, click "New +"
2. Select "MySQL"
3. Configure database
4. Get connection string from "Connections" tab

#### 2.5 Deploy Frontend
Option A: Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

Option B: Render Static Site
1. Build frontend locally: `npm run build`
2. Use dist/ as static site

### Cost Estimate
- Backend: $7/month (minimum)
- MySQL: $7/month
- Frontend: Free (Vercel/Netlify)
- **Total: $14-20/month**

---

## 3. DigitalOcean + Docker (Best for Full Control)

Complete control with Docker containers on VPS.

### Prerequisites
- DigitalOcean account ($5-20/month)
- Ubuntu 22.04 VPS
- Domain name with DNS configured
- SSH access to server

### Step-by-Step

#### 3.1 Create Droplet
```bash
# Via DigitalOcean dashboard
# - Select: Ubuntu 22.04 LTS
# - Size: 2GB RAM, 2 vCPUs ($18/month)
# - Add backups for safety
```

#### 3.2 Install Docker & Docker Compose
```bash
# SSH into droplet
ssh root@<your-ip>

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install -y docker-compose
```

#### 3.3 Setup Application
```bash
# Clone repository
cd /opt
git clone https://github.com/yourusername/gradeportal2.git
cd gradeportal2

# Create .env file with production values
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values

cp frontend/.env.example frontend/.env
nano frontend/.env  # Edit with production values
```

#### 3.4 Configure SSL Certificate
```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate (do this AFTER setting up domain)
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

#### 3.5 Build and Start Services
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

#### 3.6 Configure DNS
Add A records to point to droplet IP:
- `yourdomain.com` → `<droplet-ip>`
- `www.yourdomain.com` → `<droplet-ip>`
- `api.yourdomain.com` → `<droplet-ip>` (optional)

#### 3.7 Setup Automated Backups
```bash
# Create backup script
cat > /opt/gradeportal2/backup_cron.sh << 'EOF'
#!/bin/bash
cd /opt/gradeportal2
docker-compose exec -T db ./scripts/backup_database.sh /backups 30
aws s3 sync /opt/gradeportal2/backend/backups s3://yourbucket/gradeportal/
EOF

chmod +x /opt/gradeportal2/backup_cron.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/gradeportal2/backup_cron.sh
```

### Cost Estimate
- DigitalOcean Droplet: $18/month
- Backups: $2/month
- Domain: $10-15/year
- **Total: $20-25/month**

---

## 4. AWS ECS Deployment (Enterprise)

Production-grade deployment with auto-scaling.

### Prerequisites
- AWS account (free tier available)
- AWS CLI configured
- ECR repository created
- RDS MySQL instance
- Application Load Balancer

### Step-by-Step (Abbreviated)

#### 4.1 Create Container Images
```bash
# Build and push to ECR
$(aws ecr get-login --no-include-email)
docker build -t gradeportal-backend backend/
docker tag gradeportal-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/gradeportal:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/gradeportal:latest
```

#### 4.2 Create ECS Task Definition
```json
{
  "family": "gradeportal",
  "containerDefinitions": [{
    "name": "backend",
    "image": "<account>.dkr.ecr.<region>.amazonaws.com/gradeportal:latest",
    "portMappings": [{"containerPort": 8000}],
    "environment": [
      {"name": "DJANGO_SETTINGS_MODULE", "value": "config.settings.production"},
      {"name": "DEBUG", "value": "False"}
    ]
  }]
}
```

#### 4.3 Create ECS Service
```bash
aws ecs create-service \
  --cluster gradeportal \
  --service-name gradeportal-backend \
  --task-definition gradeportal \
  --desired-count 2 \
  --load-balancers targetGroupArn=<arn>,containerName=backend,containerPort=8000
```

#### 4.4 Configure Auto-Scaling
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/gradeportal/gradeportal-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### Cost Estimate
- ECS cluster: $15/month
- RDS MySQL: $15-50/month
- ALB: $16/month
- Data transfer: $0-20/month
- **Total: $50-100+/month**

---

## 5. Docker + Nginx (VPS/Server)

Maximum control with standard setup.

### Prerequisites
- VPS with Ubuntu 22.04
- Docker & Docker Compose installed
- 2GB+ RAM, 2+ vCPU

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/yourusername/gradeportal2.git
cd gradeportal2

# 2. Create production .env
cp backend/.env.example backend/.env
# Edit with production values

# 3. Build and start
docker-compose build
docker-compose up -d

# 4. Verify
docker-compose ps
curl http://localhost/health
```

---

## Post-Deployment Verification

### Essential Checks
```bash
# 1. Health check
curl -I https://yourdomain.com/health

# 2. API test
curl -X POST https://yourdomain.com/api/v1/auth/login/student/ \
  -H "Content-Type: application/json" \
  -d '{"lrn":"2025-001","password":"test"}'

# 3. Check security headers
curl -I https://yourdomain.com | grep -E "X-Frame-Options|Strict-Transport"

# 4. Database test
curl https://yourdomain.com/api/v1/enrollment/academic-years/
```

### Monitoring Setup
```bash
# Set up uptime monitoring
# - UptimeRobot.com (free)
# - Monitoring: https://yourdomain.com/health

# Set up error tracking
# - Sentry.io (free tier available)
# - Configure SENTRY_DSN in environment

# Set up logging aggregation
# - ELK Stack or Splunk
# - Ship logs from containers
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check connection from backend
docker-compose exec backend python manage.py dbshell

# Verify credentials in .env
docker-compose exec backend env | grep MYSQL
```

### Static Files Not Loading
```bash
# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Verify Nginx is serving them
curl -I https://yourdomain.com/static/admin/css/base.css
```

### API Returns 401 Unauthorized
```bash
# Check JWT secret is set
echo $SECRET_KEY

# Verify token refresh working
curl -X POST https://yourdomain.com/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh-token>"}'
```

### Frontend Not Loading
```bash
# Check frontend build
docker-compose exec nginx ls -la /var/www/gradeportal/frontend/

# Verify Nginx is configured
docker-compose logs nginx | grep "location /"
```

---

## Rollback Procedures

### If Deployment Fails

**Railway/Render:**
1. Go to deployment history
2. Click "Rollback" on previous version
3. Confirm

**Docker/VPS:**
```bash
# Stop current deployment
docker-compose down

# Checkout previous version
git checkout previous-commit

# Rebuild and restart
docker-compose build
docker-compose up -d
```

**Database Rollback:**
```bash
# Restore from backup
./backend/scripts/restore_database.sh ./backend/backups/gradeportal_20260524.sql.gz
```

---

## Maintenance Tasks

### Weekly
- [ ] Check application logs for errors
- [ ] Verify SSL certificate is still valid
- [ ] Run health checks

### Monthly
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Test backup restore procedure
- [ ] Check disk space usage

### Quarterly
- [ ] Security audit
- [ ] Performance analysis
- [ ] Database optimization
- [ ] Update OS packages

---

**Choose your deployment platform based on your comfort level and requirements. Start with Railway or Render for simplicity, then migrate to Docker/VPS for more control.**
