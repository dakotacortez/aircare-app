# Production Build Fix - Missing Environment Variables

## Problem
The production build fails with:
```
Error: missing secret key. A secret key is needed to secure Payload.
```

This happens because Payload CMS requires environment variables during the build process, but they're not available in production.

## Root Cause
- Next.js builds pages at build time (Static Generation)
- During build, Payload CMS gets initialized
- Payload requires `PAYLOAD_SECRET` and `DATABASE_URI` environment variables
- Without these variables, the build fails

## Required Environment Variables

Create a `.env` file with these required variables:

```bash
# Database connection string (REQUIRED)
DATABASE_URI=postgresql://user:password@host:5432/database

# Used to encrypt JWT tokens (REQUIRED)
PAYLOAD_SECRET=your-secret-key-minimum-32-characters-long

# Used to configure CORS, format links and more (REQUIRED)
NEXT_PUBLIC_SERVER_URL=https://ucair.care

# Optional: Secret used to authenticate cron jobs
CRON_SECRET=your-cron-secret-here

# Optional: Used to validate preview requests
PREVIEW_SECRET=your-preview-secret-here
```

## Deployment-Specific Solutions

### Option 1: Docker/Docker Compose (Recommended for production)
If using `docker-compose.yml`:

1. Create a `.env` file in your project root with all required variables
2. Docker Compose will automatically load these variables
3. Build and run:
   ```bash
   docker-compose up --build
   ```

### Option 2: Manual Deployment (VPS/Server)
If deploying directly to a server:

1. Create `.env` file in your deployment directory:
   ```bash
   cp .env.example .env
   nano .env  # Edit with your actual values
   ```

2. Build with environment variables:
   ```bash
   # Load .env and build
   export $(cat .env | xargs) && npm run build
   ```

3. Start with environment variables:
   ```bash
   export $(cat .env | xargs) && npm run start
   ```

### Option 3: Vercel/Netlify/Cloud Platforms
If deploying to a cloud platform:

1. Go to your deployment platform's dashboard
2. Navigate to Environment Variables section
3. Add all required variables:
   - `DATABASE_URI`
   - `PAYLOAD_SECRET`
   - `NEXT_PUBLIC_SERVER_URL`
   - `CRON_SECRET` (optional)
   - `PREVIEW_SECRET` (optional)

4. Redeploy your application

### Option 4: PM2/Process Manager
If using PM2 with `ecosystem.config.cjs`:

Check your `ecosystem.config.cjs` file and ensure it includes:

```javascript
module.exports = {
  apps: [{
    name: 'ucair-care',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      DATABASE_URI: process.env.DATABASE_URI,
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      // ... other variables
    }
  }]
}
```

Then:
```bash
# Load environment variables and start
export $(cat .env | xargs) && pm2 start ecosystem.config.cjs
```

## Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use strong secrets** - Generate secure random strings:
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   ```

3. **Different secrets per environment** - Use different values for:
   - Development
   - Staging
   - Production

## Testing the Fix Locally

1. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. Test production build:
   ```bash
   npm run build
   npm run start
   ```

3. Visit http://localhost:3000/protocols and http://localhost:3000/admin

## Current Issue Summary

Your production deployment at `ucair.care` is missing these environment variables, causing the build to fail. The fix depends on your deployment method - follow the appropriate option above.
