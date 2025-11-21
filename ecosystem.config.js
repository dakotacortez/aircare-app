/**
 * PM2 Ecosystem Configuration
 *
 * This file configures PM2 to run your application with proper environment variables.
 * PM2 does NOT automatically load .env files, so we need to specify them here.
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to your production server at /home/ucair/apps/payload/
 * 2. Edit the 'env' section below and replace placeholder values with real values from your .env file
 * 3. Run: pm2 delete ucair
 * 4. Run: pm2 start ecosystem.config.js
 * 5. Run: pm2 save
 * 6. Verify: node check-firebase.js (should show ✅ for all Firebase vars)
 */

module.exports = {
  apps: [
    {
      name: 'ucair',
      script: 'npm',
      args: 'start',
      cwd: '/home/ucair/apps/payload',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',

        // Database
        DATABASE_URI: 'YOUR_DATABASE_URI_HERE', // Copy from .env

        // Payload CMS
        PAYLOAD_SECRET: 'YOUR_PAYLOAD_SECRET_HERE', // Copy from .env
        NEXT_PUBLIC_SERVER_URL: 'https://acmc.app', // Copy from .env
        CRON_SECRET: 'YOUR_CRON_SECRET_HERE', // Copy from .env
        PREVIEW_SECRET: 'YOUR_PREVIEW_SECRET_HERE', // Copy from .env

        // Firebase Push Notifications - THIS IS THE FIX!
        GOOGLE_APPLICATION_CREDENTIALS: '/home/ucair/apps/payload/aircare-app-firebase-adminsdk-fbsvc-abc07050a3.json',
        FCM_PROJECT_ID: 'aircare-app',

        // Email (Resend)
        RESEND_API_KEY: 'YOUR_RESEND_API_KEY_HERE', // Copy from .env
        FROM_EMAIL: 'noreply@ping.acmc.app', // Copy from .env
        FROM_NAME: 'Air Care & Mobile Care', // Copy from .env

        // Maps APIs
        GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY_HERE', // Copy from .env
        HERE_API_KEY: 'YOUR_HERE_API_KEY_HERE', // Copy from .env
        ETA_PROVIDER: 'google', // Copy from .env
        ETA_FALLBACK_ENABLED: 'true', // Copy from .env

        // Add any other environment variables from your .env file here
      },
      error_file: '/home/ucair/.pm2/logs/ucair-error.log',
      out_file: '/home/ucair/.pm2/logs/ucair-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
    },
  ],
}
