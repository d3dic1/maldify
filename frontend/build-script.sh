#!/bin/bash

# Frontend Build and Deploy Script for AWS S3
# Usage: ./build-script.sh [bucket-name] [region]

set -e

BUCKET_NAME=${1:-"your-dashboard-frontend"}
REGION=${2:-"us-east-1"}

echo "🚀 Building and deploying frontend to S3..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found"
    exit 1
fi

# Create S3 bucket if it doesn't exist
echo "🪣 Creating S3 bucket if it doesn't exist..."
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document index.html

# Upload files to S3
echo "📤 Uploading files to S3..."
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Set cache headers for better performance
echo "⚡ Setting cache headers..."
aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive \
    --cache-control "max-age=31536000,public" \
    --exclude "*.html" \
    --exclude "*.json"

# Set no-cache for HTML files
aws s3 cp s3://$BUCKET_NAME s3://$BUCKET_NAME --recursive \
    --cache-control "no-cache,no-store,must-revalidate" \
    --include "*.html"

echo "✅ Deployment complete!"
echo "🌍 Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo "📋 Next steps:"
echo "   1. Set up CloudFront distribution for HTTPS"
echo "   2. Configure custom domain (optional)"
echo "   3. Update CORS settings in your backend" 