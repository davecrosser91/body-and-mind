# Deployment Guide - Hostinger VPS

This guide walks you through deploying Routine Game on a Hostinger VPS for a stable, scalable production environment.

## Prerequisites

- Hostinger VPS (KVM 2 or higher recommended)
- Domain name pointed to your VPS IP
- SSH access to your server

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Hostinger VPS                        │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│  │   Nginx     │───▶│    PM2      │───▶│  Next.js   │  │
│  │  (reverse   │    │  (process   │    │   App      │  │
│  │   proxy)    │    │  manager)   │    │            │  │
│  └─────────────┘    └─────────────┘    └────────────┘  │
│         │                                     │        │
│         ▼                                     ▼        │
│  ┌─────────────┐                      ┌────────────┐   │
│  │ Let's       │                      │   Neon     │   │
│  │ Encrypt SSL │                      │ PostgreSQL │   │
│  └─────────────┘                      │  (external)│   │
│                                       └────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Step 1: Initial Server Setup

SSH into your VPS and run:

```bash
# Download and run setup script
curl -O https://raw.githubusercontent.com/davecrosser91/body-and-mind/main/deploy/server-setup.sh
sudo bash server-setup.sh
```

This installs:
- Node.js 20
- PM2 (process manager)
- Nginx (reverse proxy)
- Certbot (SSL certificates)
- UFW firewall
- Fail2ban (security)

## Step 2: Set Up Database

### Option A: Neon (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use it in your `.env` file

**Why Neon?**
- Free tier with 3GB storage
- Serverless (auto-scales)
- Automatic backups
- No maintenance required

### Option B: Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE USER routine_user WITH PASSWORD 'secure_password';
CREATE DATABASE routine_game OWNER routine_user;
GRANT ALL PRIVILEGES ON DATABASE routine_game TO routine_user;
\q
```

## Step 3: Configure Domain & SSL

1. **Point your domain to VPS IP**
   - Add an A record: `@` → `your-vps-ip`
   - Add an A record: `www` → `your-vps-ip`

2. **Get SSL certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Update Nginx config**
   ```bash
   # Edit the nginx config with your domain
   sudo nano /etc/nginx/sites-available/routine-game
   # Replace 'your-domain.com' with your actual domain

   # Enable the site
   sudo ln -s /etc/nginx/sites-available/routine-game /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default

   # Test and reload
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Step 4: Configure Environment

```bash
# Switch to deploy user
su - deploy

# Create env file
nano /var/www/routine-game/.env
```

Add your environment variables (see `deploy/.env.production.example`):

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
WHOOP_CLIENT_ID="..."
WHOOP_CLIENT_SECRET="..."
WHOOP_REDIRECT_URI="https://your-domain.com/api/v1/integrations/whoop/callback"
```

## Step 5: Deploy

```bash
# As deploy user
cd /var/www/routine-game
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

The deploy script will:
1. Pull latest code from GitHub
2. Install dependencies
3. Generate Prisma client
4. Run database migrations
5. Build the Next.js app
6. Start/restart PM2 processes
7. Verify health check

## Step 6: Set Up Auto-Start

```bash
# Generate PM2 startup script
pm2 startup systemd -u deploy --hp /home/deploy

# Save current process list
pm2 save
```

## Monitoring & Maintenance

### View Logs
```bash
pm2 logs                    # All logs
pm2 logs routine-game       # App logs only
pm2 logs --lines 100        # Last 100 lines
```

### Monitor Resources
```bash
pm2 monit                   # Real-time monitoring
pm2 status                  # Process status
```

### Restart App
```bash
pm2 restart routine-game    # Restart app
pm2 reload routine-game     # Zero-downtime reload
```

### Update App
```bash
cd /var/www/routine-game
./deploy/deploy.sh          # Pull and redeploy
```

## Scaling

### Vertical Scaling (More Power)
Upgrade your Hostinger VPS plan for more CPU/RAM.

### Horizontal Scaling (More Instances)
PM2 is already configured to use all CPU cores (`instances: 'max'`).

To see current cluster status:
```bash
pm2 status
```

## Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs routine-game --lines 50

# Check if port is in use
sudo lsof -i :3000

# Restart
pm2 restart routine-game
```

### Database connection issues
```bash
# Test connection
npx prisma db pull

# Check DATABASE_URL in .env
cat /var/www/routine-game/.env | grep DATABASE
```

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

### 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/routine-game-error.log
```

## Security Checklist

- [x] UFW firewall enabled (only 22, 80, 443 open)
- [x] Fail2ban installed (blocks brute force)
- [x] SSL/HTTPS enforced
- [x] Security headers configured in Nginx
- [x] Rate limiting on API endpoints
- [ ] Regular backups (set up with Neon or cron)
- [ ] Keep system updated (`apt update && apt upgrade`)

## Backup Strategy

### Database (Neon)
Neon handles automatic backups. You can also:
```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Automated Backups
```bash
# Add to crontab (daily at 2am)
crontab -e
0 2 * * * pg_dump $DATABASE_URL > /var/backups/routine-game-$(date +\%Y\%m\%d).sql
```

## Cost Estimate

| Service | Cost |
|---------|------|
| Hostinger VPS KVM 2 | ~$10/month |
| Neon PostgreSQL | Free (3GB) |
| Domain | ~$10/year |
| **Total** | **~$11/month** |
