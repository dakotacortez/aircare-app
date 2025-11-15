# Production Deployment Steps for ucair.care

## Issue Summary
Your production site (ucair.care) is failing because the **build process** requires environment variables that aren't set. The error `"missing secret key"` happens during `npm run build`, not at runtime.

## Root Cause
- PM2 only sets environment variables at **runtime**
- Next.js needs environment variables at **build time** too
- You must set env vars BEFORE building, then again when starting PM2

---

## Step-by-Step Deployment Fix

### 1. Create `.env` file on your server

SSH into your production server and create a `.env` file:

```bash
# Navigate to your app directory
cd /home/ucair/apps/payload

# Create .env file from template
cp .env.example .env

# Edit with your actual production values
nano .env
```

### 2. Set your production values in `.env`

```bash
# Database connection (REQUIRED - use your actual PostgreSQL connection)
DATABASE_URI=postgresql://username:password@localhost:5432/ucair_production

# Generate a strong secret (REQUIRED - run: openssl rand -base64 32)
PAYLOAD_SECRET=your-super-secret-key-at-least-32-characters-long

# Your production URL (REQUIRED)
NEXT_PUBLIC_SERVER_URL=https://ucair.care

# Cron secret (REQUIRED for scheduled tasks - run: openssl rand -base64 32)
CRON_SECRET=your-cron-secret-here

# Preview secret (OPTIONAL - run: openssl rand -base64 32)
PREVIEW_SECRET=your-preview-secret-here
```

**Important**: Use STRONG, UNIQUE secrets for production! Generate them with:
```bash
openssl rand -base64 32
```

### 3. Build with environment variables

```bash
cd /home/ucair/apps/payload

# Load environment variables and build
export $(cat .env | xargs) && pnpm run build
```

This will:
- Load all variables from `.env`
- Run the production build
- Next.js will now have access to required env vars during build

### 4. Restart PM2 with environment variables

```bash
# Stop the current app
pm2 stop payload-ucair

# Load env vars and start PM2
export $(cat .env | xargs) && pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs payload-ucair
```

---

## Alternative: Direct Deployment Script

Create a deployment script to automate this:

```bash
# Create deploy.sh in /home/ucair/apps/payload
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  exit 1
fi

export $(cat .env | xargs)

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building application..."
pnpm run build

echo "♻️  Restarting PM2..."
pm2 reload ecosystem.config.cjs

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status payload-ucair
EOF

chmod +x deploy.sh
```

Then deploy with:
```bash
./deploy.sh
```

---

## Troubleshooting

### If build still fails:

1. **Check environment variables are loaded:**
   ```bash
   export $(cat .env | xargs)
   echo $PAYLOAD_SECRET  # Should print your secret
   echo $DATABASE_URI    # Should print your database connection
   ```

2. **Verify database is accessible:**
   ```bash
   # Test PostgreSQL connection
   psql $DATABASE_URI -c "SELECT 1"
   ```

3. **Check PM2 logs:**
   ```bash
   pm2 logs payload-ucair --lines 100
   ```

4. **Check build logs:**
   ```bash
   # Run build with verbose output
   export $(cat .env | xargs) && NODE_OPTIONS=--no-deprecation pnpm run build
   ```

### If /protocols or /admin still show errors:

1. **Clear Next.js cache and rebuild:**
   ```bash
   cd /home/ucair/apps/payload
   rm -rf .next
   export $(cat .env | xargs) && pnpm run build
   pm2 restart payload-ucair
   ```

2. **Check database connection:**
   - Ensure PostgreSQL is running
   - Verify DATABASE_URI is correct
   - Check database has the required tables

3. **Verify all env vars are set at runtime:**
   ```bash
   pm2 show payload-ucair
   # Look for environment variables section
   ```

---

## Security Checklist

- [ ] `.env` file is NOT committed to git (check `.gitignore`)
- [ ] Used strong, randomly generated secrets (32+ characters)
- [ ] Different secrets for dev/staging/production
- [ ] File permissions: `chmod 600 .env` (only owner can read)
- [ ] Database credentials are secure
- [ ] Regular backups of database and `.env` file

---

## Quick Reference

```bash
# Full deployment sequence
cd /home/ucair/apps/payload
git pull origin main  # or your branch
export $(cat .env | xargs)
pnpm install
pnpm run build
pm2 restart payload-ucair
pm2 logs payload-ucair
```

## Next Steps After Fix

Once you've completed these steps:

1. Visit https://ucair.care/protocols - should load without error
2. Visit https://ucair.care/admin - admin dashboard should work
3. Test authentication and protocol access
4. Monitor logs: `pm2 logs payload-ucair --lines 50`

---

## Why This Happened

The issue occurred because:

1. **Next.js 15.x** performs more static generation at build time
2. **Payload CMS** initializes during build to generate routes
3. **Environment variables** are required for Payload initialization
4. **PM2 config** only provided env vars at runtime, not build time
5. **Build failed** without access to required secrets

The fix ensures environment variables are available for BOTH build and runtime.
