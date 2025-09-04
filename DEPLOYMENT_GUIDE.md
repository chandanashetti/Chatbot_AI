# Chatbot AI Platform - Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Chatbot AI Platform to production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Security Configuration](#security-configuration)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **OS:** Ubuntu 20.04 LTS or CentOS 8

**Recommended for Production:**
- **CPU:** 4+ cores
- **RAM:** 8GB+
- **Storage:** 50GB+ SSD
- **OS:** Ubuntu 22.04 LTS

### Software Dependencies

```bash
# Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB (v6+)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Nginx (for reverse proxy)
sudo apt-get install -y nginx

# PM2 (for process management)
sudo npm install -g pm2

# Redis (for session storage)
sudo apt-get install -y redis-server
```

---

## Environment Setup

### 1. Create Production User

```bash
# Create dedicated user
sudo useradd -m -s /bin/bash chatbot
sudo usermod -aG sudo chatbot

# Switch to chatbot user
sudo su - chatbot
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/chatbot-ai.git
cd chatbot-ai

# Create production branch
git checkout -b production
```

### 3. Environment Variables

Create production environment file:

```bash
# Backend environment
cat > backend/.env << EOF
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/chatbot_ai_prod

# Authentication
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# OpenAI Configuration
OPENAI_API_KEY=sk-your-production-openai-key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/chatbot/uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/chatbot/app.log

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=$(openssl rand -base64 32)

# External Services
REDIS_URL=redis://localhost:6379
WEBHOOK_SECRET=$(openssl rand -base64 32)
EOF

# Frontend environment
cat > .env << EOF
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
VITE_ENV=production
EOF
```

### 4. Directory Structure

```bash
# Create necessary directories
sudo mkdir -p /var/chatbot/{uploads,logs,backups}
sudo mkdir -p /etc/chatbot
sudo chown -R chatbot:chatbot /var/chatbot
sudo chown -R chatbot:chatbot /etc/chatbot
```

---

## Database Configuration

### 1. MongoDB Setup

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create production database and user
mongo << EOF
use chatbot_ai_prod
db.createUser({
  user: "chatbot_user",
  pwd: "$(openssl rand -base64 32)",
  roles: [
    { role: "readWrite", db: "chatbot_ai_prod" }
  ]
})
EOF
```

### 2. Database Indexes

```javascript
// Run these commands in MongoDB shell
use chatbot_ai_prod

// Bot indexes
db.bots.createIndex({ "status": 1 })
db.bots.createIndex({ "isPublished": 1 })
db.bots.createIndex({ "createdAt": -1 })

// Agent indexes
db.agents.createIndex({ "email": 1 }, { unique: true })
db.agents.createIndex({ "status": 1 })
db.agents.createIndex({ "isActive": 1 })

// Handoff indexes
db.handoffrequests.createIndex({ "status": 1 })
db.handoffrequests.createIndex({ "priority": 1 })
db.handoffrequests.createIndex({ "createdAt": -1 })
db.handoffrequests.createIndex({ "assignedAgent": 1 })
db.handoffrequests.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })

// Chat indexes
db.chats.createIndex({ "sessionId": 1 })
db.chats.createIndex({ "userId": 1 })
db.chats.createIndex({ "createdAt": -1 })

// Conversation indexes
db.botconversations.createIndex({ "botId": 1 })
db.botconversations.createIndex({ "createdAt": -1 })
db.botconversations.createIndex({ "userId": 1 })
```

### 3. Database Security

```bash
# Enable authentication
sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf

# Restart MongoDB
sudo systemctl restart mongod

# Update connection string with authentication
MONGODB_URI="mongodb://chatbot_user:password@localhost:27017/chatbot_ai_prod?authSource=chatbot_ai_prod"
```

---

## Application Deployment

### 1. Backend Deployment

```bash
# Install dependencies
cd backend
npm ci --production

# Build application (if applicable)
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chatbot-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/chatbot/backend-error.log',
    out_file: '/var/log/chatbot/backend-out.log',
    log_file: '/var/log/chatbot/backend-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Frontend Deployment

```bash
# Build frontend
cd ..
npm ci
npm run build

# Move build to web directory
sudo mkdir -p /var/www/chatbot
sudo cp -r dist/* /var/www/chatbot/
sudo chown -R www-data:www-data /var/www/chatbot
```

### 3. Nginx Configuration

```bash
# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/chatbot << EOF
# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    root /var/www/chatbot;
    index index.html;
    
    # Frontend routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Backend
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    # SSL Configuration (same as above)
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=chat:10m rate=100r/s;
    
    # Proxy to backend
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Chat endpoints with higher rate limit
    location /api/chat {
        limit_req zone=chat burst=200 nodelay;
        proxy_pass http://localhost:5000;
        # ... same proxy settings
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # File upload size
    client_max_body_size 10M;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Security Configuration

### 1. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot --nginx -d api.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 3. Security Hardening

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl reload sshd

# Configure fail2ban
sudo apt-get install -y fail2ban
sudo cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Performance Optimization

### 1. Node.js Optimization

```javascript
// Add to backend/server.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Worker processes
  require('./app.js');
  console.log(`Worker ${process.pid} started`);
}
```

### 2. Database Optimization

```javascript
// MongoDB connection optimization
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

### 3. Caching Strategy

```bash
# Redis configuration for session storage
sudo cat >> /etc/redis/redis.conf << EOF
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

sudo systemctl restart redis
```

### 4. CDN Configuration

```javascript
// Add CDN headers for static assets
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));
```

---

## Monitoring & Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. System Monitoring

```bash
# Install monitoring stack
sudo apt-get install -y prometheus node-exporter grafana

# Configure Prometheus
sudo cat > /etc/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
  
  - job_name: 'chatbot-api'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/api/metrics'
EOF
```

### 3. Log Management

```bash
# Configure logrotate
sudo cat > /etc/logrotate.d/chatbot << EOF
/var/log/chatbot/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 chatbot chatbot
    postrotate
        pm2 reload all
    endscript
}
EOF
```

### 4. Health Checks

```bash
# Create health check script
cat > /home/chatbot/health-check.sh << EOF
#!/bin/bash
curl -f http://localhost:5000/api/health || exit 1
EOF

chmod +x /home/chatbot/health-check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /home/chatbot/health-check.sh
```

---

## Backup & Recovery

### 1. Database Backup

```bash
# Create backup script
cat > /home/chatbot/backup-db.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/chatbot/backups"
DB_NAME="chatbot_ai_prod"

# Create backup
mongodump --db \$DB_NAME --out \$BACKUP_DIR/mongodb_\$DATE

# Compress backup
tar -czf \$BACKUP_DIR/mongodb_\$DATE.tar.gz -C \$BACKUP_DIR mongodb_\$DATE
rm -rf \$BACKUP_DIR/mongodb_\$DATE

# Keep only last 7 days
find \$BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_\$DATE.tar.gz"
EOF

chmod +x /home/chatbot/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/chatbot/backup-db.sh
```

### 2. Application Backup

```bash
# Create application backup script
cat > /home/chatbot/backup-app.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/chatbot/backups"
APP_DIR="/home/chatbot/chatbot-ai"

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C \$APP_DIR .

# Backup uploads
tar -czf \$BACKUP_DIR/uploads_\$DATE.tar.gz -C /var/chatbot uploads

# Keep only last 3 days
find \$BACKUP_DIR -name "app_*.tar.gz" -mtime +3 -delete
find \$BACKUP_DIR -name "uploads_*.tar.gz" -mtime +3 -delete

echo "Application backup completed: app_\$DATE.tar.gz"
EOF

chmod +x /home/chatbot/backup-app.sh
```

### 3. Recovery Procedures

```bash
# Database recovery
mongorestore --db chatbot_ai_prod /path/to/backup/mongodb_YYYYMMDD_HHMMSS/chatbot_ai_prod/

# Application recovery
tar -xzf /var/chatbot/backups/app_YYYYMMDD_HHMMSS.tar.gz -C /home/chatbot/chatbot-ai/
pm2 restart all
```

---

## Troubleshooting

### 1. Common Issues

**Application won't start:**
```bash
# Check logs
pm2 logs chatbot-backend

# Check port availability
sudo netstat -tlnp | grep :5000

# Check environment variables
pm2 env 0
```

**Database connection issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongo --eval "db.adminCommand('ismaster')"

# Check authentication
mongo -u chatbot_user -p --authenticationDatabase chatbot_ai_prod
```

**High memory usage:**
```bash
# Check PM2 processes
pm2 monit

# Restart if needed
pm2 restart all

# Check for memory leaks
node --inspect server.js
```

### 2. Performance Issues

**Slow API responses:**
```bash
# Check database queries
db.setProfilingLevel(2)
db.system.profile.find().limit(5).sort({ts:-1}).pretty()

# Check system resources
htop
iotop
```

**High CPU usage:**
```bash
# Profile Node.js application
node --prof server.js
node --prof-process isolate-*.log > processed.txt
```

### 3. SSL/TLS Issues

```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443

# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

---

## Maintenance

### 1. Regular Updates

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade

# Update Node.js dependencies
npm audit
npm update

# Update PM2
pm2 update
```

### 2. Performance Monitoring

```bash
# Weekly performance check
pm2 monit
df -h
free -h
iostat 1 5
```

### 3. Security Updates

```bash
# Check for security updates
sudo apt list --upgradable | grep security

# Update SSL certificates
sudo certbot renew

# Review access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Support & Maintenance

### 1. Monitoring Dashboard

Access Grafana dashboard at: `https://monitor.your-domain.com`

### 2. Log Analysis

```bash
# View application logs
pm2 logs --lines 100

# View system logs
sudo journalctl -u nginx -f
sudo tail -f /var/log/mongodb/mongod.log
```

### 3. Emergency Procedures

**Service restart:**
```bash
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart mongod
```

**Rollback deployment:**
```bash
git checkout previous-stable-tag
npm ci --production
pm2 restart all
```

---

This deployment guide provides comprehensive instructions for setting up the Chatbot AI Platform in a production environment. Always test deployment procedures in a staging environment before applying to production.

**Last Updated:** January 2025  
**Version:** 1.0
