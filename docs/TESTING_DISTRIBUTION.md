# Internal Testing Distribution

This guide covers how to share NoRing with a small group of testers without publishing to the App Store or Google Play.

---

## Android — APK sideload

### Build

Run the build script once your environment is set up (see `docs/SETUP_GUIDE.md`):

```bash
bash scripts/build-android-apk.sh
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

For an even faster unsigned build (no keystore needed):

```bash
cd android && ./gradlew assembleDebug --no-daemon
# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Sign the release build (recommended)

1. **Generate a keystore once** (keep this file safe — losing it means you can never update the app for existing installs):

```bash
keytool -genkeypair -v \
  -keystore android/app/noring-release.keystore \
  -alias noring \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=NoRing, OU=Mobile, O=LoopEarplugs, L=Paris, ST=IDF, C=FR"
```

2. **Create `android/keystore.properties`** (this file is in `.gitignore`):

```bash
cp android/keystore.properties.example android/keystore.properties
# Edit the file and fill in your passwords
```

3. Re-run `bash scripts/build-android-apk.sh` — the APK is now release-signed.

### Share with testers

- Send the `.apk` file directly (email, Slack, Google Drive, etc.)
- Testers must enable **Settings → Apps → Install unknown apps** on their device
- Android 8+ prompts this per-app; testers tap "Allow from this source" once

### Tester requirements

- Android 7.0 (API 24) or higher
- ~50 MB free storage

---

## iOS — TestFlight internal testing

TestFlight internal testing is the simplest way to share an iOS build with up to **100 testers** without App Store Review. Internal testers get a notification and install via the TestFlight app.

### Prerequisites

- An [Apple Developer account](https://developer.apple.com/programs/) (paid, ~$99/year or via organisation membership)
- Xcode with a distribution certificate for your Apple ID / team
- Your testers' Apple IDs (they do **not** need a developer account)

### One-time App Store Connect setup

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **+** → **New App**
3. Fill in:
   - Platform: iOS
   - Name: NoRing
   - Bundle ID: `com.noring` (must match exactly)
   - SKU: `noring-1`
4. Click **Create**

### Build and upload

```bash
bash scripts/build-ios-archive.sh
```

Then in **Xcode → Window → Organizer**:
1. Select the `NoRing` archive
2. Click **Distribute App**
3. Choose **TestFlight Internal Testing**
4. Click through (Xcode handles signing automatically with your Apple ID)
5. Wait ~5 minutes for processing

### Add internal testers

In App Store Connect → **TestFlight** → **Internal Testers**:
1. Click **+** next to "Internal Testers"
2. Add testers by their Apple ID email
3. They receive an email with a TestFlight link
4. They install the **TestFlight** app from the App Store, then install NoRing through it

### Tester requirements

- iPhone with iOS 15.1 or higher
- TestFlight app installed (free, from App Store)

---

## Manual steps summary

| Step | Who | When |
|---|---|---|
| Generate Android keystore | Developer (once) | Before first Android build |
| Create `android/keystore.properties` | Developer (once per machine) | Before first Android build |
| Create App Store Connect app listing | Developer (once) | Before first iOS TestFlight upload |
| Upload iOS archive | Developer (each build) | Via Xcode Organizer |
| Add testers in App Store Connect | Developer (each new tester) | After first upload |
| Install TestFlight | Tester (once) | Before receiving first invite |
| Enable "Install unknown apps" | Android tester (once) | Before installing APK |

---

## Versioning

Current version: **1.0.0** (versionCode 1 on Android, build 1 on iOS)

When releasing a new build to testers:
1. Increment `versionCode` in `android/app/build.gradle` (Android) — must increase with every upload
2. Increment `CURRENT_PROJECT_VERSION` in Xcode project (iOS) — must increase with every TestFlight upload
3. Optionally bump `versionName` / `MARKETING_VERSION` / `package.json` version for significant changes
