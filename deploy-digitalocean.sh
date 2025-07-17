#!/bin/bash

echo "🚀 DigitalOcean Migration Script for Staff Scheduler"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ DigitalOcean CLI (doctl) is not installed${NC}"
    echo -e "${BLUE}📦 Install it with: brew install doctl${NC}"
    echo -e "${BLUE}   Then authenticate: doctl auth init${NC}"
    exit 1
fi

# Check if user is authenticated
if ! doctl account get &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with DigitalOcean${NC}"
    echo -e "${BLUE}🔑 Run: doctl auth init${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DigitalOcean CLI is ready${NC}"

# Get user inputs
echo -e "\n${YELLOW}📝 Please provide the following information:${NC}"

read -p "GitHub Username: " GITHUB_USERNAME
read -p "GitHub Repository Name: " GITHUB_REPO
read -p "Neon Database URL: " DATABASE_URL
read -s -p "PASETO Secret Key: " PASETO_SECRET
echo
read -s -p "SMTP Username: " SMTP_USERNAME
echo
read -s -p "SMTP Password: " SMTP_PASSWORD
echo
read -p "Frontend URL (e.g., https://yourapp.vercel.app): " FRONTEND_URL

# Update the app.yaml with user values
echo -e "\n${BLUE}📝 Updating DigitalOcean configuration...${NC}"

sed -i.bak "s/YOUR_GITHUB_USERNAME/$GITHUB_USERNAME/g" .do/app.yaml
sed -i.bak "s/YOUR_REPO_NAME/$GITHUB_REPO/g" .do/app.yaml
sed -i.bak "s|YOUR_NEON_DATABASE_URL|$DATABASE_URL|g" .do/app.yaml
sed -i.bak "s/YOUR_PASETO_SECRET/$PASETO_SECRET/g" .do/app.yaml
sed -i.bak "s/YOUR_SMTP_USERNAME/$SMTP_USERNAME/g" .do/app.yaml
sed -i.bak "s/YOUR_SMTP_PASSWORD/$SMTP_PASSWORD/g" .do/app.yaml
sed -i.bak "s|https://yourapp.vercel.app|$FRONTEND_URL|g" .do/app.yaml

# Clean up backup file
rm .do/app.yaml.bak

echo -e "${GREEN}✅ Configuration updated${NC}"

# Deploy to DigitalOcean
echo -e "\n${BLUE}🚀 Deploying to DigitalOcean App Platform...${NC}"

# Create the app
APP_ID=$(doctl apps create .do/app.yaml --format ID --no-header)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ App created successfully! App ID: $APP_ID${NC}"
    echo -e "${BLUE}📊 Deployment status: doctl apps get $APP_ID${NC}"
    echo -e "${BLUE}📱 App URL will be available after deployment completes${NC}"
    
    # Wait for deployment
    echo -e "\n${YELLOW}⏳ Waiting for deployment to complete...${NC}"
    while true; do
        STATUS=$(doctl apps get $APP_ID --format Phase --no-header)
        echo -e "Current status: ${BLUE}$STATUS${NC}"
        
        if [ "$STATUS" = "ACTIVE" ]; then
            echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
            APP_URL=$(doctl apps get $APP_ID --format LiveURL --no-header)
            echo -e "${GREEN}🌐 Your app is live at: $APP_URL${NC}"
            break
        elif [ "$STATUS" = "ERROR" ]; then
            echo -e "${RED}❌ Deployment failed${NC}"
            echo -e "${BLUE}🔍 Check logs: doctl apps logs $APP_ID${NC}"
            break
        fi
        
        sleep 30
    done
else
    echo -e "${RED}❌ Failed to create app${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎯 Migration Complete!${NC}"
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Update your frontend to use the new API URL"
echo "2. Test all endpoints"
echo "3. Remove Render deployment (see remove-render.sh)"
echo "4. Update DNS if needed" 