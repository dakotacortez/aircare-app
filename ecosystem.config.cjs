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
      PORT: 3000
    },
    error_file: '/home/ucair/logs/payload-error.log',
    out_file: '/home/ucair/logs/payload-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
}

