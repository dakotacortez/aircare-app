# ⚡ QUICK FIX - Production Error

## TL;DR - Copy/Paste This

On your production server:

```bash
# Navigate to your app
cd /home/ucair/apps/payload

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cat > .env << 'EOF'
DATABASE_URI=postgresql://user:password@localhost:5432/ucair_db
PAYLOAD_SECRET=YOUR_SECRET_HERE_MINIMUM_32_CHARS
NEXT_PUBLIC_SERVER_URL=https://ucair.care
CRON_SECRET=YOUR_CRON_SECRET_HERE
PREVIEW_SECRET=YOUR_PREVIEW_SECRET_HERE
EOF
  echo "⚠️  Edit .env with your actual values!"
  nano .env
fi

# Deploy
export $(cat .env | xargs) && \
pnpm install && \
pnpm run build && \
pm2 restart payload-ucair

# Check status
pm2 logs payload-ucair --lines 20
```

## Generate Secrets

```bash
# Generate strong secrets
echo "PAYLOAD_SECRET=$(openssl rand -base64 32)"
echo "CRON_SECRET=$(openssl rand -base64 32)"
echo "PREVIEW_SECRET=$(openssl rand -base64 32)"
```

## What Was Wrong

- ❌ **Problem:** Build needs environment variables, but they weren't set
- ✅ **Fix:** Load env vars before building: `export $(cat .env | xargs)`

## Verify It Works

```bash
# Should return {"status":"ok"}
curl https://ucair.care/api/health

# Check these pages load without error
# - https://ucair.care/protocols
# - https://ucair.care/admin
```

## Still Broken?

```bash
# Full reset
cd /home/ucair/apps/payload
rm -rf .next node_modules
pnpm install
export $(cat .env | xargs) && pnpm run build
pm2 restart payload-ucair
pm2 logs payload-ucair
```

---

📖 **For detailed instructions, see:**
- `DEPLOYMENT_STEPS.md` - Full PM2 guide
- `FIXES_APPLIED.md` - What changed and why
- `deploy.sh` - Automated deployment script
