# Production Build Fix - Database Connection During Build

## Problem Identified

Your production error is caused by **`generateStaticParams` trying to connect to the database during the build process**.

### Error Details
```
Error: cannot connect to Postgres. Details: ECONNREFUSED
at generateStaticParams (/[slug]/page.js)
```

### Root Cause
Three pages use `generateStaticParams` which requires database access at **build time**:
1. `/[slug]/page.tsx` - Dynamic pages
2. `/posts/[slug]/page.tsx` - Blog posts
3. `/posts/page/[pageNumber]/page.tsx` - Paginated posts

In Next.js 15, these functions run during `next build` to pre-generate static paths.

---

## The Fix

### Changes Made

Added error handling and `dynamicParams` to all affected pages:

1. **`src/app/(frontend)/[slug]/page.tsx`** - Added try-catch and `dynamicParams = true`
2. **`src/app/(frontend)/posts/[slug]/page.tsx`** - Added try-catch and `dynamicParams = true` 
3. **`src/app/(frontend)/posts/page/[pageNumber]/page.tsx`** - Added try-catch and `dynamicParams = true`

These changes allow:
- **With database**: Pages are pre-generated at build time (faster)
- **Without database**: Pages are generated on-demand at runtime (still works)

---

## Production Deployment Options

### Option 1: Build WITH Database Access (Recommended)

**Best for:** Production deployments where database is always available

Ensure your database is accessible during build:

```bash
# Your DATABASE_URI should point to accessible database
export DATABASE_URI=postgresql://user:pass@host:5432/database
export PAYLOAD_SECRET=your-secret
export NEXT_PUBLIC_SERVER_URL=https://ucair.care

# Build
pnpm run build

# Start
pm2 restart payload-ucair
```

**Pros:** 
- Pages are pre-generated (faster initial loads)
- Better for SEO
- Optimal performance

**Cons:**
- Requires database during build

---

### Option 2: Build WITHOUT Database Access

**Best for:** CI/CD environments where database isn't available during build

The error handling now allows builds to complete without database:

```bash
# Even without DATABASE_URI, build will complete
export PAYLOAD_SECRET=your-secret
export NEXT_PUBLIC_SERVER_URL=https://ucair.care

# Build (will skip static generation)
pnpm run build

# At runtime, pages generate on-demand
pm2 restart payload-ucair
```

**Pros:**
- Build works anywhere
- No database required during CI/CD

**Cons:**
- First request to each page is slower
- No pre-generated pages

---

## Why `/protocols` Works But Others Don't

The `/protocols` pages already have:
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

This tells Next.js to **NEVER** try to pre-generate these pages. They're always generated at request time, so they don't need database during build.

The `/[slug]` and `/posts/*` pages were trying to be **statically generated**, which requires database at build time.

---

## Recommended Production Setup

### For Your PM2 Deployment

1. **Ensure database is accessible during build:**
   ```bash
   cd /home/ucair/apps/payload
   
   # Check database connection
   psql $DATABASE_URI -c "SELECT 1"
   ```

2. **Build with database access:**
   ```bash
   export $(cat .env | xargs)
   pnpm run build
   ```

3. **If build fails with database error:**
   
   **Check these:**
   - Is PostgreSQL running?
   - Is DATABASE_URI correct?
   - Can the build server reach the database?
   - Are there any pending migrations?

4. **Run migrations if needed:**
   ```bash
   pnpm payload migrate
   ```

---

## Alternative: Make All Pages Dynamic

If you prefer to NEVER need database during build, you can make all pages dynamic:

### In each page file, add:
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 600 // or 0 for no caching
```

Then remove `generateStaticParams` entirely.

**Trade-off:** Pages are generated on every request (or per revalidate interval), which is slightly slower but requires no build-time database access.

---

## Testing the Fix

### Test WITHOUT database (should now work):
```bash
export PAYLOAD_SECRET=test-secret-32-chars-minimum
export NEXT_PUBLIC_SERVER_URL=https://ucair.care
pnpm run build
# Should complete with warnings but no errors
```

### Test WITH database (optimal):
```bash
export DATABASE_URI=postgresql://user:pass@localhost:5432/db
export PAYLOAD_SECRET=your-secret
export NEXT_PUBLIC_SERVER_URL=https://ucair.care
pnpm run build
# Should complete and pre-generate all pages
```

---

## Summary

✅ **Fixed:** Added error handling to `generateStaticParams`  
✅ **Fixed:** Added `dynamicParams = true` to allow on-demand generation  
✅ **Result:** Build works with OR without database access  

### For Production:
- **Best:** Build with database access for optimal performance
- **Fallback:** Build without database still works, pages generate on-demand

### Files Changed:
- `src/app/(frontend)/[slug]/page.tsx`
- `src/app/(frontend)/posts/[slug]/page.tsx`
- `src/app/(frontend)/posts/page/[pageNumber]/page.tsx`

---

## Still Having Issues?

If production still shows errors:

1. **Check actual database connection in production:**
   ```bash
   # On production server
   psql $DATABASE_URI -c "SELECT 1"
   ```

2. **Check Payload initialization:**
   ```bash
   # View startup logs
   pm2 logs payload-ucair --lines 100
   ```

3. **Check for pending migrations:**
   ```bash
   pnpm payload migrate:status
   pnpm payload migrate
   ```

4. **Verify environment variables are set:**
   ```bash
   pm2 show payload-ucair | grep -A 20 "env"
   ```

---

## Quick Commands Reference

```bash
# Full production deployment
cd /home/ucair/apps/payload
export $(cat .env | xargs)
pnpm install
pnpm run build
pm2 restart payload-ucair

# Check status
pm2 logs payload-ucair
curl https://ucair.care/api/health
```
