#!/bin/bash

# Build script for Capacitor mobile apps
# This builds the Next.js app normally and copies it to Capacitor

echo "🏗️ Building WallStreet Fantasy for mobile..."

# Build normally (not static export)
echo "🔨 Building Next.js app..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Copy the built app to Capacitor
echo "📱 Copying to Capacitor..."
npx cap copy

echo "✨ Mobile build complete!"
echo ""
echo "Next steps:"
echo "  iOS:     npx cap open ios"
echo "  Android: npx cap open android"
echo ""
echo "⚠️  Note: API routes won't work in the mobile app."
echo "    Configure your app to use the deployed API at:"
echo "    https://wall-street-fantasy.vercel.app/api"
