#!/usr/bin/env bash
# Build a release APK for internal testing distribution.
# The APK is signed with the release keystore if android/keystore.properties
# exists, otherwise falls back to the debug keystore (still shareable).
#
# Usage:
#   bash scripts/build-android-apk.sh
#
# Output:
#   android/app/build/outputs/apk/release/app-release.apk
#   (or app-release-unsigned.apk if no release keystore is configured)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "▶ Installing JS dependencies..."
npm ci

echo "▶ Building release APK..."
cd android
./gradlew assembleRelease --no-daemon

APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    SIZE=$(du -sh "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ APK ready: android/$APK_PATH ($SIZE)"
    echo ""
    echo "Share this file directly with testers."
    echo "Testers must enable 'Install from Unknown Sources' on their Android device."
else
    echo "❌ APK not found at expected path. Check Gradle output above."
    exit 1
fi
