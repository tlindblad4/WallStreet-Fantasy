import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wallstreetfantasy.app',
  appName: 'WallStreet Fantasy',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow cleartext for local development
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    scheme: 'WallStreetFantasy'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#10b981'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
