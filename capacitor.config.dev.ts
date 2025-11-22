import type { CapacitorConfig } from '@capacitor/cli';

// Development config - use local server
const config: CapacitorConfig = {
  appId: 'com.ucaircare.app',
  appName: 'Air Care & Mobile Care (Dev)',
  webDir: 'public',
  server: {
    // For development - point to local machine
    // Replace with your computer's IP address on the same network
    url: 'http://192.168.1.XXX:3000',
    cleartext: true,
    androidScheme: 'http',
  },
};

export default config;
