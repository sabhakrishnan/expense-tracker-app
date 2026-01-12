# 📱 Expense Tracker - Deployment Guide

## Quick Overview

| Platform | Cost | Difficulty |
|----------|------|------------|
| **Web (Vercel/Netlify)** | ✅ FREE | Easy |
| **Android APK (Direct Install)** | ✅ FREE | Easy |
| **Google Play Store** | $25 one-time | Medium |
| **Apple App Store** | $99/year | Hard |

---

## 🌐 Option 1: Deploy to Web (FREE)

### Step 1: Build for Web
```bash
npx expo export -p web
```

### Step 2: Deploy to Vercel (Recommended - FREE)

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com) and sign up with GitHub

2. **Install Vercel CLI**:
```bash
npm install -g vercel
```

3. **Deploy**:
```bash
cd dist
vercel
```

4. Follow the prompts - your app will be live at `https://your-app.vercel.app`

### Alternative: Deploy to Netlify (FREE)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop the `dist` folder to deploy
3. Get your free URL like `https://your-app.netlify.app`

---

## 📱 Option 2: Build Android APK (FREE)

### Method A: Using EAS Build (Expo's Cloud - FREE tier)

1. **Create Expo Account**:
```bash
npx eas login
```

2. **Configure Project**:
```bash
npx eas build:configure
```

3. **Build APK**:
```bash
npx eas build -p android --profile preview
```

4. **Download**: Once built, download the APK from [expo.dev](https://expo.dev)

5. **Install on Phone**:
   - Transfer APK to your phone
   - Enable "Install from Unknown Sources" in Settings > Security
   - Tap the APK to install

### Method B: Local Build (Requires Android Studio)

1. **Generate Native Project**:
```bash
npx expo prebuild -p android
```

2. **Open in Android Studio**:
```bash
open -a "Android Studio" android
```

3. **Build APK**: 
   - Go to Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Find APK at `android/app/build/outputs/apk/release/`

---

## 🛒 Option 3: Google Play Store ($25 one-time)

### Prerequisites
- Google Play Developer Account ($25): [play.google.com/console](https://play.google.com/console)

### Steps

1. **Build App Bundle**:
```bash
npx eas build -p android --profile production
```

2. **Create App in Play Console**:
   - Go to Play Console > Create App
   - Fill in app details, screenshots, privacy policy

3. **Upload AAB File**:
   - Go to Production > Create Release
   - Upload the `.aab` file from EAS

4. **Submit for Review**: Takes 1-3 days

---

## 🍎 Option 4: Apple App Store ($99/year)

### Prerequisites
- Apple Developer Account ($99/year): [developer.apple.com](https://developer.apple.com)
- Mac computer required

### Steps

1. **Build for iOS**:
```bash
npx eas build -p ios --profile production
```

2. **Submit to App Store**:
```bash
npx eas submit -p ios
```

3. **Configure in App Store Connect**:
   - Add screenshots, description, pricing
   - Submit for review (takes 1-7 days)

---

## 🚀 Recommended Free Path

### For Immediate Use:
1. **Web**: Deploy to Vercel (takes 5 minutes)
2. **Android**: Build APK with EAS and install directly

### Commands to Run Now:

```bash
# 1. Login to Expo (create account if needed)
npx eas login

# 2. Configure EAS
npx eas build:configure

# 3. Build Android APK (FREE - uses Expo's cloud)
npx eas build -p android --profile preview

# 4. Build for Web
npx expo export -p web

# 5. Deploy to Vercel
cd dist && npx vercel
```

---

## 📝 Before Publishing Checklist

- [ ] Update `app.json` with your actual:
  - `bundleIdentifier` (iOS): `com.yourname.expensetracker`
  - `package` (Android): `com.yourname.expensetracker`
  - `owner`: Your Expo username
  - `extra.eas.projectId`: From EAS configure

- [ ] Replace placeholder icons in `/assets`:
  - `icon.png` (1024x1024)
  - `splash-icon.png` (1284x2778)
  - `adaptive-icon.png` (1024x1024)
  - `favicon.png` (48x48)

- [ ] Update Google OAuth:
  - Add your production redirect URIs
  - Add SHA-256 fingerprint for Android

- [ ] Create Privacy Policy (required for stores)

---

## 🔧 Troubleshooting

### "Build failed" on EAS
- Check for native module compatibility
- Run `npx expo-doctor` to diagnose issues

### APK won't install
- Enable "Unknown Sources" in phone settings
- Check Android version compatibility

### Google Sign-In not working in production
- Add release SHA-256 to Google Console
- Update OAuth redirect URIs

---

## 📊 Cost Summary

| What You Get | Cost |
|--------------|------|
| Web app on Vercel | FREE |
| APK for personal use | FREE |
| Share APK with friends | FREE |
| Google Play Store listing | $25 (one-time) |
| Apple App Store listing | $99/year |

**My Recommendation**: Start with **Web + APK** (completely free), then consider Play Store if you want wider distribution.
