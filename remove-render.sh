#!/bin/bash

echo "🗑️  Render Cleanup Script for Staff Scheduler"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  This script will help you clean up your Render deployment${NC}"
echo -e "${YELLOW}   Make sure your DigitalOcean deployment is working first!${NC}"
echo

read -p "Have you confirmed DigitalOcean is working? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please test DigitalOcean deployment first${NC}"
    exit 1
fi

echo -e "\n${BLUE}📋 Manual steps to remove Render deployment:${NC}"
echo
echo "1. 🌐 Go to https://dashboard.render.com/"
echo "2. 🔑 Log in to your account"
echo "3. 📱 Navigate to your services:"
echo "   - staff-api-gateway"
echo "   - staff-auth-service" 
echo "   - staff-employee-service"
echo "4. 🗑️  For each service:"
echo "   - Click on the service"
echo "   - Go to Settings"
echo "   - Scroll to 'Delete Service'"
echo "   - Type the service name to confirm"
echo "   - Click 'Delete'"
echo

echo -e "${YELLOW}📝 Cleaning up local Render configuration...${NC}"

# Backup render.yaml
if [ -f "render.yaml" ]; then
    cp render.yaml render.yaml.backup
    echo -e "${GREEN}✅ Backed up render.yaml to render.yaml.backup${NC}"
fi

# Remove render.yaml from git tracking
git rm --cached render.yaml 2>/dev/null || echo -e "${YELLOW}⚠️  render.yaml not in git or already removed${NC}"

# Add render.yaml to .gitignore
if ! grep -q "render.yaml" .gitignore 2>/dev/null; then
    echo "render.yaml" >> .gitignore
    echo -e "${GREEN}✅ Added render.yaml to .gitignore${NC}"
fi

echo -e "\n${GREEN}🎯 Render cleanup preparation complete!${NC}"
echo -e "${YELLOW}📋 Next manual steps:${NC}"
echo "1. Delete services manually in Render dashboard (see instructions above)"
echo "2. Commit the updated .gitignore:"
echo "   git add .gitignore"
echo "   git commit -m 'Remove Render configuration, migrate to DigitalOcean'"
echo "3. Push changes:"
echo "   git push"
echo
echo -e "${BLUE}💡 The render.yaml.backup file is kept for reference${NC}" 