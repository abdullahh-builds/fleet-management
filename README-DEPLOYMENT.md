# Fleet Management System - AWS EC2 Deployment Guide

## Prerequisites

1. **AWS Account** - Active AWS account
2. **EC2 Instance** - Amazon Linux 2023 or Amazon Linux 2 instance
3. **Security Group** - Configure inbound rules:
   - Port 22 (SSH) - Your IP
   - Port 3000 (Application) - 0.0.0.0/0
   - Port 5432 (PostgreSQL) - Optional, only if external access needed

## Step-by-Step Deployment

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. **Name:** fleet-management-server
3. **AMI:** Amazon Linux 2023 (or Amazon Linux 2)
4. **Instance Type:** t2.micro (Free tier) or t2.small (recommended)
5. **Key Pair:** Create or select existing key pair
6. **Security Group:** Create with rules mentioned above
7. **Storage:** 20 GB (minimum)
8. Click **Launch Instance**

### 2. Connect to EC2 Instance

```bash
# Download your key pair (e.g., fleet-key.pem)
chmod 400 fleet-key.pem

# Connect to EC2
ssh -i fleet-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### 3. Run Deployment Script

```bash
# Download and run the deployment script
curl -o deploy.sh https://raw.githubusercontent.com/abdullah-fcc/fleet-management-system/main/deploy-ec2.sh

# Make it executable
chmod +x deploy.sh

# Run the script
./deploy.sh
```

**OR** Manual deployment:

```bash
# Clone repository
git clone https://github.com/abdullah-fcc/fleet-management-system.git
cd fleet-management-system

# Make deployment script executable
chmod +x deploy-ec2.sh

# Run deployment
./deploy-ec2.sh
```

### 4. Access Your Application

After deployment completes, access your application at:
```
http://YOUR_EC2_PUBLIC_IP:3000
```

**Default Login Credentials:**
- **Admin:**
  - Email: admin@fleet.com
  - Password: admin123

- **Employee:**
  - Email: abdullah@fleet.com
  - Password: abdullah123

## Configuration

### Environment Variables

Edit `/home/ec2-user/fleet-management-system/frontend/.env`:

```bash
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://fleetadmin:FleetPass2024!@localhost:5432/fleet_management
ALLOWED_ORIGINS=http://YOUR_EC2_IP:3000
```

### Database Configuration

**Connect to PostgreSQL:**
```bash
sudo -u postgres psql -d fleet_management
```

**Change database password:**
```sql
ALTER USER fleetadmin WITH PASSWORD 'YourNewPassword';
```

Don't forget to update the `.env` file with new password.

## Management Commands

### PM2 Process Manager

```bash
# View application status
pm2 status

# View logs
pm2 logs fleet-management

# View real-time logs
pm2 logs fleet-management --lines 100

# Restart application
pm2 restart fleet-management

# Stop application
pm2 stop fleet-management

# Start application
pm2 start fleet-management

# Monitor resources
pm2 monit
```

### Application Updates

```bash
cd /home/ec2-user/fleet-management-system
git pull origin main
cd frontend
npm install
pm2 restart fleet-management
```

### PostgreSQL Management

```bash
# Access PostgreSQL
sudo -u postgres psql

# List databases
\l

# Connect to fleet_management
\c fleet_management

# List tables
\dt

# View users
SELECT * FROM users;

# Backup database
pg_dump -U fleetadmin fleet_management > backup.sql

# Restore database
psql -U fleetadmin fleet_management < backup.sql
```

## Optional: Setup Domain Name

### Using Route 53

1. Register domain in Route 53
2. Create A record pointing to EC2 public IP
3. Update `.env` file:
   ```
   ALLOWED_ORIGINS=http://yourdomain.com,http://YOUR_EC2_IP:3000
   ```
4. Restart application: `pm2 restart fleet-management`

### Using Nginx as Reverse Proxy (Optional)

```bash
# Install Nginx
sudo yum install -y nginx

# Configure Nginx
sudo nano /etc/nginx/conf.d/fleet-management.conf
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Update security group to allow port 80
```

## Troubleshooting

### Application not starting
```bash
# Check PM2 logs
pm2 logs fleet-management

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart application
pm2 restart fleet-management
```

### Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Cannot access application
1. Check EC2 Security Group - Port 3000 should be open
2. Check if application is running: `pm2 status`
3. Check firewall: `sudo firewall-cmd --list-all`
4. Verify EC2 public IP: `curl http://169.254.169.254/latest/meta-data/public-ipv4`

### Out of memory
```bash
# Check memory usage
free -m

# Restart application to free memory
pm2 restart fleet-management

# Consider upgrading to larger instance type (t2.small or t2.medium)
```

## Security Best Practices

1. **Change default passwords** - Update database and application passwords
2. **Use SSH keys** - Disable password authentication
3. **Update regularly** - Keep system and packages updated
   ```bash
   sudo yum update -y
   ```
4. **Enable HTTPS** - Use Let's Encrypt with Nginx
5. **Restrict Security Groups** - Limit SSH access to your IP only
6. **Backup database** - Regular automated backups
7. **Use IAM roles** - Instead of storing AWS credentials on EC2

## Monitoring

### CloudWatch

1. Enable detailed monitoring in EC2 console
2. Set up CloudWatch alarms for:
   - CPU utilization > 80%
   - Memory utilization > 80%
   - Disk space < 20%

### Application Monitoring

```bash
# Install PM2 web monitoring
pm2 install pm2-server-monit

# View metrics
pm2 monit
```

## Cost Optimization

1. **Use t2.micro** - Free tier eligible (750 hours/month for 12 months)
2. **Stop when not needed** - Stop instance during off-hours
3. **Use reserved instances** - If running 24/7 for 1+ year
4. **Monitor billing** - Set up billing alerts in AWS Console

## Support

For issues or questions:
- GitHub Issues: https://github.com/abdullah-fcc/fleet-management-system/issues
- Check logs: `pm2 logs fleet-management`
- AWS Support: https://aws.amazon.com/support/

## License

MIT License - See LICENSE file for details
