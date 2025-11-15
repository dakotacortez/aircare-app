# Production Setup Summary

## 🔴 **THE PROBLEM**

Your production site at `ucair.care` shows this error:
```
Application error: a server-side exception has occurred
Error: missing secret key. A secret key is needed to secure Payload.
```

**Root Cause:** Environment variables are missing during the build process.

---

## ✅ **THE SOLUTION**

You need to provide environment variables at **BUILD TIME**, not just runtime.

### For PM2 Deployment (Your Current Setup)

**Quick Fix Commands:**

```bash
# 1. SSH into your server
ssh user@ucair.care

# 2. Navigate to your app
cd /home/ucair/apps/payload

# 3. Create .env file (if it doesn't exist)
cp .env.example .env
nano .env  # Add your actual values

# 4. Build with environment variables
export $(cat .env | xargs) && pnpm run build

# 5. Restart PM2
pm2 restart payload-ucair

# 6. Check status
pm2 logs payload-ucair
```

**Required .env values:**
```bash
DATABASE_URI=postgresql://user:pass@host:5432/database
PAYLOAD_SECRET=<generate with: openssl rand -base64 32>
NEXT_PUBLIC_SERVER_URL=https://ucair.care
CRON_SECRET=<generate with: openssl rand -base64 32>
PREVIEW_SECRET=<generate with: openssl rand -base64 32>
```

---

## 📋 **WHAT WAS CHANGED**

### 1. Updated `ecosystem.config.cjs`
Added environment variables to PM2 config so they're available at runtime:

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

### 2. Updated `Dockerfile`
Added build arguments so environment variables are available during Docker build:

```dockerfile
ARG DATABASE_URI
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SERVER_URL
# ... etc
```

### 3. Updated `next.config.js`
Added `output: 'standalone'` for Docker deployments.

### 4. Created `docker-compose.prod.yml`
Production-ready Docker Compose file with proper build args.

---

## 📚 **DETAILED GUIDES**

Three comprehensive guides have been created:

1. **`PRODUCTION_FIX.md`** - Understanding the problem and general solutions
2. **`DEPLOYMENT_STEPS.md`** - Specific PM2 deployment instructions  
3. **`DOCKER_DEPLOYMENT.md`** - Docker-specific deployment instructions

---

## 🚀 **QUICK DEPLOYMENT SCRIPT**

Save this as `deploy.sh` on your server:

```bash
#!/bin/bash
set -e
cd /home/ucair/apps/payload

# Check .env exists
if [ ! -f .env ]; then
  echo "❌ .env file missing!"
  exit 1
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build with env vars
echo "🔨 Building..."
export $(cat .env | xargs) && pnpm run build

# Restart PM2
echo "♻️  Restarting..."
pm2 restart payload-ucair

echo "✅ Deployment complete!"
pm2 logs payload-ucair --lines 20
```

Usage:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔍 **TROUBLESHOOTING**

### Build fails with "missing secret key"
- **Cause:** Environment variables not loaded before build
- **Fix:** Run `export $(cat .env | xargs)` before building

### /protocols or /admin show errors at runtime
- **Cause:** Database connection issues or missing runtime env vars
- **Fix:** Check PM2 logs: `pm2 logs payload-ucair`

### "Cannot connect to database"
- **Cause:** DATABASE_URI is wrong or database is not running
- **Fix:** Test connection: `psql $DATABASE_URI -c "SELECT 1"`

### Changes don't appear
- **Cause:** Cached build or PM2 not restarted
- **Fix:** 
  ```bash
  rm -rf .next
  export $(cat .env | xargs) && pnpm run build
  pm2 restart payload-ucair
  ```

---

## ✨ **VERIFICATION**

After deployment, verify:

1. ✅ Build completes without errors
2. ✅ PM2 shows app as online: `pm2 status`
3. ✅ No errors in logs: `pm2 logs payload-ucair`
4. ✅ https://ucair.care/protocols loads
5. ✅ https://ucair.care/admin loads

---

## 🔐 **SECURITY CHECKLIST**

- [ ] `.env` file is NOT in git
- [ ] Used strong secrets (32+ characters)
- [ ] File permissions: `chmod 600 .env`
- [ ] Different secrets for dev/staging/prod
- [ ] Regular backups of database and `.env`

---

## 📞 **NEED HELP?**

If you're still seeing errors:

1. Check server logs: `pm2 logs payload-ucair --lines 100`
2. Verify env vars are set: `pm2 show payload-ucair`
3. Test database connection: `psql $DATABASE_URI -c "SELECT 1"`
4. Clear cache and rebuild: `rm -rf .next && export $(cat .env | xargs) && pnpm run build`

---

## 🎯 **KEY TAKEAWAY**

**The build process needs environment variables, not just the runtime.**

Always run:
```bash
export $(cat .env | xargs) && pnpm run build
```

Not just:
```bash
pnpm run build  # ❌ Will fail without env vars
```
