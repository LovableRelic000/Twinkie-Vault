import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.twinkievault.game',
  appName: 'TwinkieVault',
  webDir: 'dist',
  backgroundColor: '#000000',
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
