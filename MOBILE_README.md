# WallStreet Fantasy - Mobile App Setup

This guide explains how to build and deploy the WallStreet Fantasy mobile app for iOS and Android using Capacitor.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18+)
2. **npm** or **yarn**
3. **For iOS:** Mac with Xcode installed
4. **For Android:** Android Studio installed

### Install Dependencies

```bash
npm install
```

## 📱 Building the Mobile App

### Step 1: Build the Next.js App

```bash
npm run build
```

This creates a production build in the `.next` directory.

### Step 2: Sync with Capacitor

```bash
npx cap sync
```

This copies the built web assets to the iOS and Android projects.

### Step 3: Open in Native IDE

**For iOS:**
```bash
npx cap open ios
```

This opens Xcode. From there:
1. Select your team in Signing & Capabilities
2. Connect your iPhone or select a simulator
3. Click the play button to run

**For Android:**
```bash
npx cap open android
```

This opens Android Studio. From there:
1. Connect your Android device or start an emulator
2. Click the play button to run

### Alternative: Use the Build Script

```bash
npm run build:mobile
```

This runs the build and sync in one command.

## 🔧 Configuration

### API Endpoints

The mobile app uses the deployed web API. Make sure your environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gvszwcthazytxtfqklne.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_SITE_URL=https://wall-street-fantasy.vercel.app
```

### Capacitor Config

Edit `capacitor.config.ts` to customize:
- App name
- Bundle ID
- Splash screen colors
- Plugins

## 📋 App Store Submission Checklist

### Before Submitting

- [ ] Test on real devices (not just simulators)
- [ ] Update app version in `capacitor.config.ts`
- [ ] Update version in `ios/App/App/Info.plist` (iOS)
- [ ] Update version in `android/app/build.gradle` (Android)
- [ ] Add app icons (see below)
- [ ] Add splash screens (see below)
- [ ] Write app description
- [ ] Take screenshots for each device size
- [ ] Create privacy policy

### iOS Specific

**Required Assets:**
- App Icon: 1024×1024 PNG
- Screenshots: iPhone (1290×2796) + iPad (2048×2732)
- App Store listing description
- Keywords
- Support URL
- Marketing URL (optional)

**In Xcode:**
1. Select the project → Signing & Capabilities
2. Select your Apple Developer team
3. Update the Bundle Identifier if needed
4. Set the Version and Build numbers

**Build for App Store:**
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload

### Android Specific

**Required Assets:**
- App Icon: 512×512 PNG
- Feature Graphic: 1024×500 PNG
- Screenshots: Various phone/tablet sizes
- Short description (80 chars)
- Full description (4000 chars)

**In Android Studio:**
1. Build → Generate Signed Bundle/APK
2. Select Android App Bundle (.aab)
3. Create or select keystore
4. Upload to Google Play Console

## 🎨 Customizing the App

### App Icons

Replace these files with your custom icons:

**iOS:**
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Android:**
- `android/app/src/main/res/mipmap-*/`

Use a tool like [Capacitor Assets](https://github.com/ionic-team/capacitor-assets) to generate all sizes:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

### Splash Screen

Replace:
- `ios/App/App/Assets.xcassets/Splash.imageset/`
- `android/app/src/main/res/drawable*/splash.png`

### Theme Colors

Update `capacitor.config.ts`:

```typescript
plugins: {
  SplashScreen: {
    backgroundColor: '#0a0a0a', // Your brand color
    spinnerColor: '#10b981'
  }
}
```

## 🔌 Native Plugins

### Push Notifications

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission
await PushNotifications.requestPermissions();

// Register
await PushNotifications.register();

// Listen for notifications
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Notification received', notification);
});
```

### Biometric Authentication

```bash
npm install @capacitor/biometric-auth
npx cap sync
```

```typescript
import { BiometricAuth } from '@capacitor/biometric-auth';

const checkBio = async () => {
  const result = await BiometricAuth.checkBiometry();
  if (result.biometryType === 'faceId' || result.biometryType === 'touchId') {
    await BiometricAuth.authenticate({
      reason: 'Log in to WallStreet Fantasy'
    });
  }
};
```

### Secure Storage

```typescript
import { Preferences } from '@capacitor/preferences';

// Store auth token
await Preferences.set({
  key: 'auth_token',
  value: token
});

// Retrieve
const { value } = await Preferences.get({ key: 'auth_token' });
```

## 🐛 Troubleshooting

### Build Errors

**Error: Cannot find module '@capacitor/*'**
```bash
npm install
npx cap sync
```

**Error: CocoaPods not found (iOS)**
```bash
sudo gem install cocoapods
```

**Error: Gradle sync failed (Android)**
```bash
cd android
./gradlew clean
cd ..
npx cap sync
```

### App Not Updating

After making changes to the web code:
```bash
npm run build
npx cap copy
```

### White Screen on Launch

1. Check that `npm run build` succeeded
2. Verify the `webDir` in `capacitor.config.ts` matches your build output
3. Check for JavaScript errors in the Safari/Chrome remote debugger

## 🔄 Live Reload (Development)

For faster development with live reload:

1. Get your computer's IP address
2. Update `capacitor.config.ts`:

```typescript
server: {
  url: 'http://YOUR_IP:3000',
  cleartext: true
}
```

3. Run the dev server: `npm run dev`
4. Run: `npx cap run ios` or `npx cap run android`

## 📦 Project Structure

```
/ios           - iOS Xcode project
/android       - Android Studio project
/capacitor.config.ts  - Capacitor configuration
/build-mobile.sh      - Build script for mobile
```

## 💰 App Store Fees

- **Apple Developer Program**: $99/year
- **Google Play Developer**: $25 one-time

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)

## 🆘 Support

If you encounter issues:
1. Check Capacitor's [troubleshooting guide](https://capacitorjs.com/docs/guides)
2. Review Next.js [deployment docs](https://nextjs.org/docs/deployment)
3. Open an issue on GitHub

---

**Ready to build?** Start with `npm run build:mobile` 🚀
