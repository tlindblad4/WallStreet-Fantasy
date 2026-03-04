#!/bin/bash

# Simple build script for WallStreet Fantasy mobile app
# This copies the mobile wrapper to Capacitor and opens Xcode

echo "🏗️ WallStreet Fantasy Mobile Builder"
echo "======================================"
echo ""

# Check if we're on a Mac (required for iOS)
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  Warning: You're not on a Mac. iOS builds require macOS."
    echo "You can still build for Android on any computer."
    echo ""
fi

# Sync with Capacitor
echo "📱 Syncing with Capacitor..."
npx cap sync

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    echo ""
    echo "Try running: npm install"
    exit 1
fi

echo ""
echo "✅ Sync complete!"
echo ""
echo "Next steps:"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  For iOS:     npx cap open ios"
    echo "  For Android: npx cap open android"
    echo ""
    echo "Press Enter to open iOS in Xcode, or Ctrl+C to exit:"
    read
    npx cap open ios
else
    echo "  For Android: npx cap open android"
    echo ""
    echo "Run: npx cap open android"
fi
