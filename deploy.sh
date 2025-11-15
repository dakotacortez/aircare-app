#!/bin/bash
set -e

echo "🚀 Starting deployment for ucair.care..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}❌ Error: .env file not found!${NC}"
  echo "Please create a .env file with required environment variables."
  echo "You can copy from .env.example:"
  echo ""
  echo "  cp .env.example .env"
  echo "  nano .env"
  echo ""
  exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
export $(cat .env | xargs)

# Verify critical env vars are set
if [ -z "$DATABASE_URI" ]; then
  echo -e "${RED}❌ Error: DATABASE_URI is not set in .env${NC}"
  exit 1
fi

if [ -z "$PAYLOAD_SECRET" ]; then
  echo -e "${RED}❌ Error: PAYLOAD_SECRET is not set in .env${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"
echo ""

# Pull latest code (if in git repo)
if [ -d .git ]; then
  echo "📥 Pulling latest code..."
  git pull
  echo -e "${GREEN}✓ Code updated${NC}"
  echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Build application
echo "🔨 Building application..."
echo "   This may take a few minutes..."
pnpm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build successful${NC}"
  echo ""
else
  echo -e "${RED}❌ Build failed${NC}"
  echo "Check the error messages above."
  exit 1
fi

# Restart PM2 if it's running
if command -v pm2 &> /dev/null; then
  echo "♻️  Restarting PM2..."
  pm2 restart payload-ucair || pm2 start ecosystem.config.cjs
  
  echo ""
  echo -e "${GREEN}✅ Deployment complete!${NC}"
  echo ""
  echo "📊 Application status:"
  pm2 status payload-ucair
  
  echo ""
  echo "📝 View logs with:"
  echo "   pm2 logs payload-ucair"
  echo ""
  echo "🌐 Your site should now be accessible at:"
  echo "   ${NEXT_PUBLIC_SERVER_URL:-https://ucair.care}"
else
  echo ""
  echo -e "${GREEN}✅ Build complete!${NC}"
  echo ""
  echo "To start the application:"
  echo "   pnpm run start"
  echo ""
  echo "Or with PM2:"
  echo "   pm2 start ecosystem.config.cjs"
fi

echo ""
echo -e "${YELLOW}💡 Tip: Run 'pm2 monit' for a live dashboard${NC}"
