# Firebase Push Notifications Setup Guide

## Current Configuration

Your Firebase credentials are configured correctly in `.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=/home/ucair/apps/payload/aircare-app-firebase-adminsdk-fbsvc-abc07050a3.json
FCM_PROJECT_ID=aircare-app
```

## Common Issue: PM2 Not Loading Environment Variables

PM2 doesn't automatically load `.env` files by default. This is likely why you're seeing 404 errors from Firebase.

### Solution 1: Update PM2 Ecosystem File (Recommended)

Create or update `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [{
    name: 'ucair',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      GOOGLE_APPLICATION_CREDENTIALS: '/home/ucair/apps/payload/aircare-app-firebase-adminsdk-fbsvc-abc07050a3.json',
      FCM_PROJECT_ID: 'aircare-app',
      // Add other env vars from your .env file here
    }
  }]
}
```

Then restart PM2:
```bash
cd /home/ucair/apps/payload
pm2 delete ucair
pm2 start ecosystem.config.js
pm2 save
```

### Solution 2: Use PM2 env File

Alternatively, tell PM2 to load your `.env` file:

```bash
cd /home/ucair/apps/payload
pm2 delete ucair
pm2 start npm --name ucair -- start --env-file .env
pm2 save
```

### Solution 3: Load .env in PM2 Command

```bash
cd /home/ucair/apps/payload
pm2 delete ucair
pm2 start "npm start" --name ucair --update-env
pm2 save
```

## Verification Steps

### 1. Run Diagnostic Script on Production Server

```bash
# On your production server
cd /home/ucair/apps/payload
node check-firebase.js
```

This will tell you exactly what's wrong with your Firebase configuration.

### 2. Verify File Exists

```bash
ls -la /home/ucair/apps/payload/aircare-app-firebase-adminsdk-fbsvc-abc07050a3.json
```

Expected output: File should exist and be readable

### 3. Test Firebase Credentials

```bash
# Check if PM2 process has the env vars
pm2 env ucair | grep -i firebase
pm2 env ucair | grep -i fcm
```

### 4. Check PM2 Logs After Restart

```bash
pm2 restart ucair
pm2 logs ucair --lines 100
```

Look for the log line: `Firebase Admin SDK initialized successfully`

If you see: `Firebase credentials not configured` - that means PM2 isn't loading your env vars.

## Alternative: Use Individual Credentials in PM2

If the file path approach doesn't work, you can use individual environment variables:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ucair',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      FCM_PROJECT_ID: 'aircare-app',
      FCM_CLIENT_EMAIL: 'firebase-adminsdk-fbsvc@aircare-app.iam.gserviceaccount.com',
      FCM_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDk3DBVUA9ZHCQP\n...\n-----END PRIVATE KEY-----\n'
    }
  }]
}
```

**Note:** The `\n` characters in the private key must be actual newlines or `\\n` escaped properly.

## Troubleshooting

### Error: "Not Found" (404)

This means Firebase credentials are not loaded or invalid. Check:
1. ✅ PM2 is loading environment variables
2. ✅ Credentials file exists at specified path
3. ✅ Credentials file is readable by the PM2 process user
4. ✅ Project ID matches between .env and credentials file

### Error: "ENOENT: no such file"

The credentials file doesn't exist at the specified path:
1. Verify the path in your `.env` file
2. Ensure the file was uploaded to production server
3. Check file permissions (should be readable by ucair user)

### After Deployment

After deploying these fixes and configuring PM2:

```bash
cd /home/ucair/apps/payload
git pull origin claude/debug-pm2-logs-01FN1KTgqZiLVaYCbkaouReM
pnpm install
pnpm run build
pm2 restart ucair --update-env
pm2 logs ucair
```

You should see: `Firebase Admin SDK initialized successfully`

## Testing Push Notifications

Once Firebase is configured:

1. Go to `/admin/collections/push-notifications`
2. Create a new push notification
3. Select target roles
4. Save - it will automatically send
5. Check PM2 logs for success messages
