#!/usr/bin/env bash
# Build an iOS archive for TestFlight internal testing.
# Requires Xcode, the correct signing certificate, and pod install to have run.
#
# Usage:
#   bash scripts/build-ios-archive.sh
#
# Output:
#   build/NoRing.xcarchive  → open in Xcode Organizer to upload to TestFlight

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ARCHIVE_PATH="$REPO_ROOT/build/NoRing.xcarchive"

echo "▶ Installing JS dependencies..."
npm ci --safe-chain-skip-minimum-package-age

echo "▶ Installing CocoaPods..."
cd ios && bundle exec pod install && cd ..

echo "▶ Building archive..."
xcodebuild archive \
    -workspace ios/NoRing.xcworkspace \
    -scheme NoRing \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    | bundle exec xcpretty || exit 1

echo ""
echo "✅ Archive ready: $ARCHIVE_PATH"
echo ""
echo "Next steps:"
echo "  1. Open Xcode → Window → Organizer"
echo "  2. Select the NoRing archive"
echo "  3. Click 'Distribute App' → 'TestFlight Internal Testing'"
echo "  4. Upload to App Store Connect"
echo "  5. Add testers in App Store Connect → TestFlight → Internal Testers"
