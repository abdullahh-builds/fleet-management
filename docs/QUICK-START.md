# AWS EC2 Deployment - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Launch EC2 Instance
- **AMI:** Amazon Linux 2023
- **Instance Type:** t2.small (recommended) or t2.micro
- **Security Group Ports:** 22 (SSH), 3000 (App)
- **Storage:** 20 GB

### 2. Connect to EC2
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

### 3. Deploy Application
```bash
# One-command deplopm2 statusyment
curl -o setup.sh https://raw.githubusercontent.com/abdullah-fcc/fleet-management-system/main/quick-setup.sh && bash setup.sh
```

**OR** Manual steps:
```bash
git clone https://github.com/abdullah-fcc/fleet-management-system.git
cd fleet-management-system
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### 4. Access Application
```
http://YOUR_EC2_IP:3000
```

**Login:**
- Admin: admin@fleet.com / admin123
- Employee: abdullah@fleet.com / abdullah123

---

## 📋 AWS Console Setup Checklist

### Security Group Configuration
- [x] Port 22 - SSH (Your IP only)
- [x] Port 3000 - HTTP (0.0.0.0/0)
- [x] Port 80 - HTTP (0.0.0.0/0) - Optional

### EC2 Instance Settings
- [x] Instance Type: t2.small or t2.micro
- [x] Storage: 20 GB minimum
- [x] Key Pair: Downloaded and saved
- [x] Public IP: Auto-assign enabled

---

## 🔧 Essential Commands

### Application Management
```bash
# Check status
pm2 status

# View logs
pm2 logs fleet-management

# Restart app
pm2 restart fleet-management

# Stop app
pm2 stop fleet-management
```

### Updates
```bash
cd /home/ec2-user/fleet-management-system
git pull origin main
cd frontend
npm install
pm2 restart fleet-management
```

### Database
```bash
# Access PostgreSQL
sudo -u postgres psql -d fleet_management

# Backup
pg_dump -U fleetadmin fleet_management > backup.sql
```

---

## 🛠️ Troubleshooting

### App not accessible
```bash
# Check if app is running
pm2 status

# Check security group in AWS Console
# Ensure port 3000 is open to 0.0.0.0/0

# Check logs
pm2 logs fleet-management --lines 50
```

### Database issues
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Out of memory
```bash
# Check memory
free -h

# Restart app
pm2 restart fleet-management

# Consider upgrading instance type
```

---

## 💡 Tips

1. **Save your EC2 IP** - You'll need it to access the app
2. **Keep your key pair safe** - You can't download it again
3. **Use Elastic IP** - To keep the same IP after restart
4. **Enable CloudWatch** - For monitoring
5. **Regular backups** - Backup database weekly

---

## 📞 Support

- Deployment Guide: [README-DEPLOYMENT.md](README-DEPLOYMENT.md)
- GitHub Issues: https://github.com/abdullah-fcc/fleet-management-system/issues
- PM2 Docs: https://pm2.keymetrics.io/docs/usage/quick-start/

---

## 💰 Cost Estimate (AWS Free Tier)

- t2.micro: **FREE** for 750 hours/month (first 12 months)
- t2.small: ~$17/month
- Storage (20GB): ~$2/month
- Data transfer: First 15GB free

**Total:** $0-19/month depending on instance type
