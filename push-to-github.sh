#!/bin/bash
# ============================================================
# IBS Pro - Push to GitHub Script
# ============================================================
# 
# INSTRUCTIONS:
# 1. Create a GitHub Personal Access Token:
#    - Go to https://github.com/settings/tokens
#    - Click "Generate new token (classic)"
#    - Select "repo" scope
#    - Copy the token
#
# 2. Run this script:
#    chmod +x push-to-github.sh
#    ./push-to-github.sh YOUR_GITHUB_USERNAME YOUR_TOKEN
#
# ============================================================

set -e

USERNAME=$1
TOKEN=$2
REPO_NAME="ibs-pro-income-billing-system"

if [ -z "$USERNAME" ] || [ -z "$TOKEN" ]; then
    echo "❌ Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME YOUR_GITHUB_TOKEN"
    echo ""
    echo "📌 Get a token at: https://github.com/settings/tokens"
    echo "   Select 'repo' scope when creating the token"
    exit 1
fi

echo "🚀 Pushing IBS Pro to GitHub..."

# Create the repository via GitHub API
echo "📦 Creating GitHub repository..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://api.github.com/user/repos \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $TOKEN" \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"IBS Pro - Professional Income & Billing System for Automotive Service Companies. Next.js 16 + TypeScript + Tailwind CSS + Supabase + PWA\",
    \"private\": false,
    \"auto_init\": false
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Repository created successfully!"
elif echo "$BODY" | grep -q "already exists"; then
    echo "⚠️  Repository already exists, pushing to it..."
else
    echo "⚠️  Could not create repo (HTTP $HTTP_CODE). Trying to push anyway..."
fi

# Set the remote URL with token
git remote set-url origin "https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/${REPO_NAME}.git"

# Push
echo "📤 Pushing code..."
git push -u origin master --force

# Reset remote to clean URL (remove token)
git remote set-url origin "https://github.com/${USERNAME}/${REPO_NAME}.git"

echo ""
echo "🎉 Done! Your repository is live at:"
echo "   https://github.com/${USERNAME}/${REPO_NAME}"
echo ""
echo "📌 Next steps:"
echo "   1. Go to https://vercel.com/new"
echo "   2. Import your GitHub repository"
echo "   3. Add these environment variables:"
echo "      NEXT_PUBLIC_SUPABASE_URL"
echo "      SUPABASE_SERVICE_ROLE_KEY"
echo "      SUPABASE_ANON_KEY"
echo "   4. Deploy!"
