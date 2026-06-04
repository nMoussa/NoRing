# NoRing — Local Development Setup

## Prerequisites overview

| Tool | Required version | Why |
|---|---|---|
| Node.js | ≥ 22.11.0 | `engines` field in `package.json` |
| npm | ≥ 10 | ships with Node 22 |
| Java (JDK) | 17 (Temurin) | Gradle 9.3.1 minimum |
| Android SDK | API 36 (compileSdk) | configured in `android/app/build.gradle` |
| Ruby | 3.1.x | `CFPropertyList 3.0.9` requires `< 3.2` |
| Bundler | 2.6.9 | `BUNDLED WITH` in `Gemfile.lock`; Bundler 2.7+ requires Ruby ≥ 3.2 |
| CocoaPods | 1.16.2 | via `bundle install`, not `gem install cocoapods` globally |
| Xcode | 16.x | iOS simulator build |

---

## 1. Node.js

Install Node 22 via [nvm](https://github.com/nvm-sh/nvm) or [Homebrew](https://brew.sh):

```bash
brew install node@22
# or
nvm install 22 && nvm use 22
node --version  # should print v22.x.x
```

---

## 2. JavaScript dependencies

```bash
npm ci
```

This also runs `husky` via the `prepare` lifecycle script, installing the pre-commit and pre-push hooks.

---

## 3. Android

### 3a. Java 17 (Temurin)

```bash
brew install --cask temurin@17
# then verify:
java -version  # should show openjdk 17
```

Set `JAVA_HOME` if it is not already pointing to JDK 17:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### 3b. Android SDK

Install Android Studio. Inside Android Studio open **SDK Manager** and ensure these are installed:
- **SDK Platform**: Android 14 (API 36)
- **SDK Tools**: Android Build-Tools 36.0.0, NDK 27.1.12297006

Set `ANDROID_HOME`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 3c. Run on Android

```bash
npm run android        # starts Metro + launches on emulator/device
cd android && ./gradlew assembleDebug --no-daemon  # build only (no launch)
```

---

## 4. iOS

### 4a. Xcode

Install Xcode from the Mac App Store (16.x). After installing, point `xcode-select` at it:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcode-select -p   # should print /Applications/Xcode.app/Contents/Developer
```

If this step is skipped, CocoaPods and `xcodebuild` will fail with `Unexpected XCode version string ''`.

### 4b. Ruby 3.1

The project's `Gemfile` pins `CFPropertyList 3.0.9` (required by `xcodeproj`) which only supports Ruby `< 3.2`. Use Ruby **3.1** — not 3.2+.

```bash
brew install rbenv ruby-build  # if rbenv is not installed
rbenv install 3.1.7
rbenv global 3.1.7
ruby --version  # should print ruby 3.1.x
```

### 4c. CocoaPods via Bundler

Do **not** use `gem install cocoapods` globally. Use the project's Gemfile to get the pinned versions:

```bash
cd ios
bundle install   # installs CocoaPods 1.16.2 + xcodeproj 1.27.0 + xcpretty
bundle exec pod install
```

`pod install` downloads ~170 MB of React Native prebuilt binaries on first run.

### 4d. Run on iOS

```bash
npm run ios     # starts Metro + launches on simulator
# open workspace in Xcode:
open ios/NoRing.xcworkspace
```

Always open the **workspace** (`.xcworkspace`), not the project (`.xcodeproj`), after running `pod install`.

---

## 5. Pre-commit hooks

`husky` is installed automatically by `npm ci` via the `prepare` script.

- **pre-commit** — runs `lint-staged`: ESLint + Prettier on staged `.ts`/`.tsx` files (~1-2 s)
- **pre-push** — runs TypeScript check + full Jest suite (~15 s)

To skip a hook in an emergency: `git commit --no-verify` (use sparingly).

---

## 6. Verifying your setup

```bash
# JS
npm test -- --ci --coverage=false    # 98 tests, all green
npm run lint                          # 0 errors
npx tsc --noEmit                      # 0 errors

# Android (requires JAVA_HOME set)
cd android && ./gradlew assembleDebug --no-daemon

# iOS (requires Xcode + Ruby 3.1 + pod install done)
cd ios && xcodebuild -workspace NoRing.xcworkspace -scheme NoRing \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO build | bundle exec xcpretty
```
