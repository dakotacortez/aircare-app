#!/usr/bin/env node
/**
 * Generate PM2 Ecosystem Config from .env file
 *
 * This script reads your .env file and generates an ecosystem.config.js
 * file for PM2 with all your environment variables properly configured.
 *
 * Usage: node generate-pm2-config.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n=== PM2 Ecosystem Config Generator ===\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found at:', envPath);
  console.error('\nPlease make sure you have a .env file in the project root.');
  process.exit(1);
}

console.log('✅ Found .env file');

// Parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  // Skip empty lines and comments
  if (!line || line.trim().startsWith('#')) return;

  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();

    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    envVars[key] = value;
  }
});

console.log(`✅ Parsed ${Object.keys(envVars).length} environment variables\n`);

// Generate ecosystem.config.js content
const ecosystemConfig = `/**
 * PM2 Ecosystem Configuration
 *
 * Auto-generated from .env file on ${new Date().toISOString()}
 *
 * To use this configuration:
 * 1. pm2 delete ucair
 * 2. pm2 start ecosystem.config.js
 * 3. pm2 save
 * 4. Verify: node check-firebase.js
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
${Object.entries(envVars)
  .map(([key, value]) => {
    // Escape single quotes and backslashes in values
    const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `        ${key}: '${escapedValue}',`;
  })
  .join('\n')}
      },
      error_file: '/home/ucair/.pm2/logs/ucair-error.log',
      out_file: '/home/ucair/.pm2/logs/ucair-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
    },
  ],
}
`;

// Write ecosystem.config.js
const outputPath = path.join(__dirname, 'ecosystem.config.js');
fs.writeFileSync(outputPath, ecosystemConfig, 'utf8');

console.log('✅ Generated ecosystem.config.js\n');
console.log('Environment variables included:');
Object.keys(envVars).forEach((key) => {
  // Mask sensitive values
  const isSensitive = key.includes('SECRET') ||
                      key.includes('KEY') ||
                      key.includes('PASSWORD') ||
                      key.includes('URI');
  const displayValue = isSensitive ? '***MASKED***' : envVars[key];
  console.log(`   ${key}: ${displayValue}`);
});

console.log('\n=== Next Steps ===');
console.log('1. Review ecosystem.config.js to verify all values');
console.log('2. On production server, run:');
console.log('   pm2 delete ucair');
console.log('   pm2 start ecosystem.config.js');
console.log('   pm2 save');
console.log('3. Verify Firebase is working:');
console.log('   node check-firebase.js');
console.log('4. Check logs:');
console.log('   pm2 logs ucair --lines 50');
console.log('\nLook for: "Firebase Admin SDK initialized successfully"\n');
