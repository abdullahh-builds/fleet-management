#!/bin/bash
# Quick EC2 Setup Commands - Copy and paste these on your EC2 instance

echo "🚀 Fleet Management System - Quick EC2 Setup"
echo "=============================================="
echo ""

# Clone repository
echo "Step 1: Clone repository..."
git clone https://github.com/abdullah-fcc/fleet-management-system.git
cd fleet-management-system

# Make script executable
echo "Step 2: Make deployment script executable..."
chmod +x deploy-ec2.sh

# Run deployment
echo "Step 3: Run deployment..."
./deploy-ec2.sh

echo ""
echo "✅ Setup complete!"
echo "Access your app at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
