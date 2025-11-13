import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ucaircare.app',
  appName: 'Air Care & Mobile Care',
  webDir: 'public',
  server: {
    // Point the native shell at your live app
    url: 'https://ucair.care',
    cleartext: false,
  },
};

export default config;
