# Production Deployment Guide

This document outlines the steps needed to deploy Concern2Care in a production environment.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Domain name with SSL certificate
- SMTP email service (optional but recommended)

## Required Environment Variables

### Core Requirements
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
EMAIL_ENCRYPTION_KEY=your-secure-32-char-encryption-key
SESSION_SECRET=your-secure-32-char-session-secret

# Application
NODE_ENV=production
PORT=5000
BASE_URL=https://yourdomain.com

# CORS Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Optional Services
```bash
# Email Configuration (Recommended)
SMTP_HOST=smtp.youremailprovider.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password

# Object Storage (If using file uploads)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
```

## Security Configuration

### 1. Generate Secure Keys
```bash
# Generate EMAIL_ENCRYPTION_KEY (32+ characters)
openssl rand -base64 32

# Generate SESSION_SECRET (32+ characters)
openssl rand -base64 32
```

### 2. Database Security
- Use strong database passwords
- Enable SSL connections
- Restrict database access to application servers only
- Regular backups with encryption

### 3. Application Security
- Set proper ALLOWED_ORIGINS for CORS
- Use HTTPS only in production
- Configure firewall to allow only necessary ports
- Regular security updates

## Performance Optimizations

### 1. Database
- ✅ Indexes added for frequently queried columns
- ✅ Connection pooling configured
- ✅ Query optimization enabled

### 2. Application
- ✅ Compression middleware enabled
- ✅ Rate limiting implemented
- ✅ Security headers configured
- ✅ Error handling improved

### 3. Monitoring
- ✅ Health check endpoint: `/health`
- ✅ Request logging with response times
- ✅ Environment validation on startup

## Deployment Steps

### 1. Build Application
```bash
npm install --production
npm run build
```

### 2. Database Setup
```bash
# Apply database schema
npm run db:push
```

### 3. Start Application
```bash
npm start
```

### 4. Verify Deployment
```bash
# Check health endpoint
curl https://yourdomain.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

## Production Checklist

### Security ✅
- [x] Environment variables properly set
- [x] HTTPS enabled
- [x] CORS properly configured
- [x] Rate limiting enabled
- [x] Security headers configured
- [x] Error messages sanitized

### Performance ✅
- [x] Database indexes optimized
- [x] Compression enabled
- [x] Connection pooling configured
- [x] Static asset caching

### Monitoring ✅
- [x] Health check endpoint
- [x] Request logging
- [x] Error logging
- [x] Environment validation

### Reliability ✅
- [x] Database migrations automated
- [x] Error handling improved
- [x] Graceful shutdowns
- [x] Session management

## Maintenance

### Regular Tasks
1. **Security Updates**: Keep dependencies updated
2. **Database Maintenance**: Regular VACUUM and ANALYZE
3. **Log Rotation**: Prevent log files from growing too large
4. **Backup Verification**: Test backup restoration regularly

### Monitoring
- Monitor `/health` endpoint for uptime
- Track response times and error rates
- Monitor database performance metrics
- Watch for unusual API usage patterns

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL and network connectivity
2. **Email Issues**: Verify SMTP settings and firewall rules
3. **CORS Errors**: Check ALLOWED_ORIGINS configuration
4. **Session Issues**: Verify SESSION_SECRET is set properly

### Debug Mode
To enable debug logging in production (temporarily):
```bash
export LOG_LEVEL=debug
```

## Support

For production support issues:
1. Check the health endpoint first
2. Review application logs
3. Verify environment configuration
4. Check database connectivity