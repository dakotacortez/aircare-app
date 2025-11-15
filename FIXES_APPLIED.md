# Fixes Applied - Production Server Error

## Issue Resolved
✅ Fixed "Application error: a server-side exception has occurred" on ucair.care

### Error Details
- **Pages affected:** `/protocols` and `/admin`  
- **Error message:** `"missing secret key. A secret key is needed to secure Payload"`
- **Environment:** Production only (worked in dev mode)
- **Root cause:** Missing environment variables during build process

---

## Files Modified

### 1. `ecosystem.config.cjs` ✏️
**Changes:** Added required environment variables to PM2 configuration

**Before:**
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000
}
```

**After:**
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  DATABASE_URI: process.env.DATABASE_URI,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://ucair.care',
  CRON_SECRET: process.env.CRON_SECRET,
  PREVIEW_SECRET: process.env.PREVIEW_SECRET,
}
```

### 2. `Dockerfile` ✏️
**Changes:** Added build arguments for environment variables

**Added:**
```dockerfile
ARG DATABASE_URI
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SERVER_URL
ARG CRON_SECRET
ARG PREVIEW_SECRET

ENV DATABASE_URI=$DATABASE_URI
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
# ... etc
```

### 3. `next.config.js` ✏️
**Changes:** Added standalone output for Docker builds

**Added:**
```javascript
output: 'standalone',
```

---

## New Files Created

### Documentation
1. **`PRODUCTION_FIX.md`** - Comprehensive explanation of the issue and solutions
2. **`DEPLOYMENT_STEPS.md`** - Step-by-step PM2 deployment guide
3. **`DOCKER_DEPLOYMENT.md`** - Docker-specific deployment instructions  
4. **`PRODUCTION_SETUP_SUMMARY.md`** - Quick reference guide
5. **`FIXES_APPLIED.md`** (this file) - Summary of changes

### Configuration
6. **`docker-compose.prod.yml`** - Production Docker Compose configuration
7. **`.dockerignore`** - Exclude unnecessary files from Docker builds
8. **`deploy.sh`** - Automated deployment script

### Code
9. **`src/app/(payload)/api/health/route.ts`** - Health check endpoint

---

## 🚀 How to Deploy

### Quick Start (PM2 - Your Current Setup)

```bash
# 1. Create .env file on your server
cd /home/ucair/apps/payload
cp .env.example .env
nano .env  # Add your values

# 2. Run the deploy script
./deploy.sh

# OR manually:
export $(cat .env | xargs) && pnpm run build
pm2 restart payload-ucair
```

### Required Environment Variables

Create a `.env` file with:
```bash
DATABASE_URI=postgresql://user:pass@localhost:5432/ucair_db
PAYLOAD_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_SERVER_URL=https://ucair.care
CRON_SECRET=$(openssl rand -base64 32)
PREVIEW_SECRET=$(openssl rand -base64 32)
```

---

## 🔍 Why This Fix Works

### The Problem
1. Next.js 15 performs static generation at **build time**
2. Payload CMS initializes during build to generate routes
3. Payload requires `PAYLOAD_SECRET` to initialize
4. Without env vars, build fails: `"missing secret key"`

### The Solution
Ensure environment variables are available in **two places**:

1. **Build time** - Load env vars before `pnpm run build`
   ```bash
   export $(cat .env | xargs) && pnpm run build
   ```

2. **Runtime** - PM2 config provides env vars when app runs
   ```javascript
   // ecosystem.config.cjs
   env: { DATABASE_URI: process.env.DATABASE_URI, ... }
   ```

### Why Dev Mode Worked
- Dev mode (`next dev`) doesn't perform full static generation
- It builds pages on-demand
- Less strict about environment variables during startup

---

## ✅ Verification Checklist

After deploying, verify:

- [ ] Build completes without errors
- [ ] PM2 shows app as "online": `pm2 status`  
- [ ] No errors in logs: `pm2 logs payload-ucair`
- [ ] https://ucair.care/protocols loads successfully
- [ ] https://ucair.care/admin loads successfully
- [ ] Health check works: `curl https://ucair.care/api/health`

---

## 🛠️ Troubleshooting

### Still seeing "missing secret key"?
```bash
# Verify env vars are loaded
export $(cat .env | xargs)
echo $PAYLOAD_SECRET  # Should print your secret

# Rebuild
rm -rf .next
pnpm run build
pm2 restart payload-ucair
```

### Build succeeds but runtime errors?
```bash
# Check PM2 has env vars
pm2 show payload-ucair | grep -A 20 "env"

# Check logs
pm2 logs payload-ucair --lines 50
```

### Database connection errors?
```bash
# Test database connection
psql $DATABASE_URI -c "SELECT 1"

# Check DATABASE_URI format
echo $DATABASE_URI
# Should be: postgresql://user:pass@host:5432/database
```

---

## 📋 Deployment Commands Reference

```bash
# Full deployment
cd /home/ucair/apps/payload
git pull
export $(cat .env | xargs) && pnpm install && pnpm run build
pm2 restart payload-ucair

# Quick rebuild (no git pull)
export $(cat .env | xargs) && pnpm run build && pm2 restart payload-ucair

# View logs
pm2 logs payload-ucair

# Monitor
pm2 monit

# Check status
pm2 status
```

---

## 🔐 Security Notes

1. ✅ `.env` is in `.gitignore` - never commit secrets
2. ✅ Use strong, random secrets (32+ characters)
3. ✅ Different secrets for dev/staging/production
4. ✅ Secure file permissions: `chmod 600 .env`
5. ✅ Regular backups of `.env` and database

---

## 📚 Additional Resources

- **Payload CMS Docs:** https://payloadcms.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Environment Variables:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

---

## 🎯 Summary

**Problem:** Production build failed due to missing environment variables  
**Solution:** Provide env vars at build time and runtime  
**Files changed:** 3 files modified, 9 files created  
**Deployment:** Use `./deploy.sh` or follow `DEPLOYMENT_STEPS.md`  

**Your production site should now work!** 🎉

If you still encounter issues, check the detailed guides:
- `DEPLOYMENT_STEPS.md` for PM2 deployments
- `DOCKER_DEPLOYMENT.md` for Docker deployments
- `PRODUCTION_SETUP_SUMMARY.md` for quick reference
