#!/bin/bash

# Build script for Capacitor mobile apps
# This syncs the mobile directory with Capacitor native projects

echo "🏗️ Building WallStreet Fantasy mobile app..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Sync with Capacitor
echo -e "${YELLOW}📱 Syncing with Capacitor...${NC}"
npx cap sync

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Mobile app ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "  iOS:     npx cap open ios"
    echo "  Android: npx cap open android"
    echo ""
    echo "To run on device:"
    echo "  iOS:     npx cap run ios"
    echo "  Android: npx cap run android"
else
    echo "❌ Sync failed!"
    exit 1
fi
