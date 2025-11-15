# Docker Deployment Guide

## If Using Docker/Docker Compose

### Quick Setup

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

2. **Build with environment variables:**
   ```bash
   # Build the Docker image with build args
   docker build \
     --build-arg DATABASE_URI="${DATABASE_URI}" \
     --build-arg PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
     --build-arg NEXT_PUBLIC_SERVER_URL="${NEXT_PUBLIC_SERVER_URL}" \
     --build-arg CRON_SECRET="${CRON_SECRET}" \
     --build-arg PREVIEW_SECRET="${PREVIEW_SECRET}" \
     -t ucair-care:latest .
   ```

3. **Run the container:**
   ```bash
   docker run -d \
     --name ucair-care \
     -p 3000:3000 \
     --env-file .env \
     ucair-care:latest
   ```

### Using Docker Compose

The `docker-compose.yml` already includes `env_file: - .env`, so it will automatically load your environment variables.

However, the current docker-compose.yml is configured for development. For production:

1. **Create a production docker-compose file:**

```yaml
# docker-compose.prod.yml
version: '3'

services:
  payload:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - DATABASE_URI=${DATABASE_URI}
        - PAYLOAD_SECRET=${PAYLOAD_SECRET}
        - NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
        - CRON_SECRET=${CRON_SECRET}
        - PREVIEW_SECRET=${PREVIEW_SECRET}
    ports:
      - '3000:3000'
    env_file:
      - .env
    restart: unless-stopped
```

2. **Deploy:**
   ```bash
   # Build and start
   docker-compose -f docker-compose.prod.yml up -d --build
   
   # Check logs
   docker-compose -f docker-compose.prod.yml logs -f payload
   ```

### Build Script for Docker

Create a `docker-build.sh` script:

```bash
#!/bin/bash
set -e

echo "🐳 Building Docker image..."

# Load environment variables
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  exit 1
fi

source .env

# Build with all required build arguments
docker build \
  --build-arg DATABASE_URI="${DATABASE_URI}" \
  --build-arg PAYLOAD_SECRET="${PAYLOAD_SECRET}" \
  --build-arg NEXT_PUBLIC_SERVER_URL="${NEXT_PUBLIC_SERVER_URL}" \
  --build-arg CRON_SECRET="${CRON_SECRET}" \
  --build-arg PREVIEW_SECRET="${PREVIEW_SECRET}" \
  -t ucair-care:latest \
  -t ucair-care:$(date +%Y%m%d-%H%M%S) \
  .

echo "✅ Docker image built successfully!"
```

Make it executable:
```bash
chmod +x docker-build.sh
./docker-build.sh
```

### Important Notes

1. **Environment variables are needed TWICE:**
   - As `--build-arg` during build (for Next.js build process)
   - As `--env-file .env` during run (for runtime)

2. **Security:** Never commit `.env` to version control

3. **Database:** Ensure your DATABASE_URI is accessible from within the container

4. **Networking:** If using Docker networks, adjust DATABASE_URI accordingly
