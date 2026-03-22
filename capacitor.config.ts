import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nebula.app',
  appName: 'Nebula',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
