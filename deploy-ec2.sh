#!/bin/bash

# Fleet Management System - EC2 Deployment Script
# This script sets up and deploys the application on an EC2 instance

set -e  # Exit on any error

echo "🚀 Starting Fleet Management System Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js 18.x
echo "📥 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL 15
echo "🐘 Installing PostgreSQL..."
sudo yum install -y postgresql15 postgresql15-server

# Initialize PostgreSQL
if [ ! -f /var/lib/pgsql/data/PG_VERSION ]; then
    echo "🔧 Initializing PostgreSQL..."
    sudo postgresql-setup initdb
fi

# Start and enable PostgreSQL
echo "▶️  Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Git (if not already installed)
echo "📂 Installing Git..."
sudo yum install -y git

# Create application directory
APP_DIR="/home/ec2-user/fleet-management-system"
echo "📁 Setting up application directory at $APP_DIR..."

# Clone or update repository
if [ -d "$APP_DIR" ]; then
    echo "📥 Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    cd /home/ec2-user
    git clone https://github.com/abdullah-fcc/fleet-management-system.git
    cd $APP_DIR
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd $APP_DIR/frontend
npm install --production

# Configure PostgreSQL
echo "🔐 Configuring PostgreSQL..."
sudo -u postgres psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE fleet_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fleet_management')\gexec

-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'fleetadmin') THEN
    CREATE USER fleetadmin WITH PASSWORD 'FleetPass2024!';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fleet_management TO fleetadmin;
ALTER DATABASE fleet_management OWNER TO fleetadmin;
EOF

# Configure PostgreSQL to allow local connections
echo "🔧 Configuring PostgreSQL authentication..."
sudo bash -c "cat > /var/lib/pgsql/data/pg_hba.conf << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    all             all             0.0.0.0/0               md5
EOF"

# Update PostgreSQL configuration to listen on all addresses
sudo bash -c "echo \"listen_addresses = '*'\" >> /var/lib/pgsql/data/postgresql.conf"

# Restart PostgreSQL to apply changes
echo "🔄 Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Create .env file
echo "⚙️  Creating environment configuration..."
cat > $APP_DIR/frontend/.env << EOF
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://fleetadmin:FleetPass2024!@localhost:5432/fleet_management
ALLOWED_ORIGINS=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000
EOF

# Install PM2 globally for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Stop existing PM2 process if running
pm2 delete fleet-management 2>/dev/null || true

# Start application with PM2
echo "🚀 Starting application..."
cd $APP_DIR/frontend
pm2 start src/app.js --name fleet-management

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# Configure firewall (if firewalld is installed)
if command -v firewall-cmd &> /dev/null; then
    echo "🔥 Configuring firewall..."
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --reload
fi

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Access your application at: http://$PUBLIC_IP:3000"
echo ""
echo "📝 Useful commands:"
echo "  - View logs:        pm2 logs fleet-management"
echo "  - Restart app:      pm2 restart fleet-management"
echo "  - Stop app:         pm2 stop fleet-management"
echo "  - Monitor:          pm2 monit"
echo ""
echo "🔐 Database Info:"
echo "  - Database:         fleet_management"
echo "  - User:            fleetadmin"
echo "  - Password:        FleetPass2024!"
echo ""
