#!/usr/bin/env node
/**
 * Firebase Configuration Diagnostic Script
 * Run this on your production server to diagnose Firebase setup issues
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Firebase Configuration Diagnostic ===\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ NOT SET');
console.log('   FCM_PROJECT_ID:', process.env.FCM_PROJECT_ID || '❌ NOT SET');
console.log('   FCM_PRIVATE_KEY:', process.env.FCM_PRIVATE_KEY ? '✅ SET (length: ' + process.env.FCM_PRIVATE_KEY.length + ')' : '❌ NOT SET');
console.log('   FCM_CLIENT_EMAIL:', process.env.FCM_CLIENT_EMAIL || '❌ NOT SET');

// Check if credentials file exists
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credPath) {
  console.log('\n2. Credentials File Check:');
  console.log('   Path:', credPath);

  if (fs.existsSync(credPath)) {
    console.log('   Status: ✅ File exists');

    try {
      const stats = fs.statSync(credPath);
      console.log('   Readable:', fs.accessSync(credPath, fs.constants.R_OK) === undefined ? '✅ YES' : '❌ NO');
      console.log('   File size:', stats.size, 'bytes');

      // Try to parse the JSON
      const content = fs.readFileSync(credPath, 'utf8');
      const json = JSON.parse(content);

      console.log('\n3. Credentials File Content:');
      console.log('   type:', json.type || '❌ MISSING');
      console.log('   project_id:', json.project_id || '❌ MISSING');
      console.log('   private_key_id:', json.private_key_id ? '✅ SET' : '❌ MISSING');
      console.log('   private_key:', json.private_key ? '✅ SET (length: ' + json.private_key.length + ')' : '❌ MISSING');
      console.log('   client_email:', json.client_email || '❌ MISSING');

      // Verify project_id matches
      if (process.env.FCM_PROJECT_ID && json.project_id !== process.env.FCM_PROJECT_ID) {
        console.log('\n   ⚠️  WARNING: FCM_PROJECT_ID in .env does not match project_id in credentials file!');
        console.log('   .env FCM_PROJECT_ID:', process.env.FCM_PROJECT_ID);
        console.log('   Credentials project_id:', json.project_id);
      }
    } catch (error) {
      console.log('   ❌ Error reading/parsing file:', error.message);
    }
  } else {
    console.log('   Status: ❌ File does not exist at this path');
    console.log('   \n   This is the problem! The file is missing.');
  }
} else {
  console.log('\n2. Credentials File Check: ⚠️ GOOGLE_APPLICATION_CREDENTIALS not set, checking fallback method...');

  if (process.env.FCM_PROJECT_ID && process.env.FCM_PRIVATE_KEY && process.env.FCM_CLIENT_EMAIL) {
    console.log('   ✅ Fallback method (individual credentials) is configured');
  } else {
    console.log('   ❌ Neither method is fully configured!');
  }
}

// Check if firebase-admin is installed
console.log('\n4. Firebase Admin SDK:');
try {
  require.resolve('firebase-admin');
  console.log('   ✅ firebase-admin package is installed');

  const admin = require('firebase-admin');
  console.log('   Version:', admin.SDK_VERSION);
} catch (error) {
  console.log('   ❌ firebase-admin package not found:', error.message);
}

console.log('\n=== Diagnostic Complete ===\n');
console.log('Next steps:');
console.log('1. If credentials file is missing, verify the path is correct');
console.log('2. If environment variables are not set, check PM2 configuration');
console.log('3. If file exists but is not readable, check file permissions');
console.log('');
