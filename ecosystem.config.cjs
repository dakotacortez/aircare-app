module.exports = {
  apps: [{
    name: 'payload-ucair',
    cwd: '/home/ucair/apps/payload',
    script: 'pnpm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // CRITICAL: These environment variables are REQUIRED
      // Load from .env file or set them here directly
      DATABASE_URI: process.env.DATABASE_URI,
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'https://ucair.care',
      CRON_SECRET: process.env.CRON_SECRET,
      PREVIEW_SECRET: process.env.PREVIEW_SECRET,
    },
    error_file: '/home/ucair/logs/payload-error.log',
    out_file: '/home/ucair/logs/payload-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
}

