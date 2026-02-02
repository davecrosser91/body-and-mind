#!/bin/bash
set -e

# ===========================================
# Initial Server Setup for Hostinger VPS
# Run as root: sudo bash server-setup.sh
# ===========================================

echo "=========================================="
echo "  Hostinger VPS Setup for Routine Game"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo bash server-setup.sh)"
    exit 1
fi

# Update system
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "[2/8] Installing essential packages..."
apt install -y curl git build-essential ufw fail2ban

# Install Node.js 20
echo "[3/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install PM2 globally
echo "[4/8] Installing PM2..."
npm install -g pm2

# Install Nginx
echo "[5/8] Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Configure firewall
echo "[6/8] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# Install Certbot for SSL
echo "[7/8] Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create app directory
echo "[8/8] Setting up app directory..."
mkdir -p /var/www/routine-game
mkdir -p /var/log/pm2

# Create deploy user (optional)
if ! id "deploy" &>/dev/null; then
    echo "Creating deploy user..."
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    chown -R deploy:deploy /var/www/routine-game
    chown -R deploy:deploy /var/log/pm2
    echo "Deploy user created. Set password with: passwd deploy"
fi

echo ""
echo "=========================================="
echo "  Server Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Set up your domain DNS to point to this server's IP"
echo ""
echo "2. Create .env file:"
echo "   nano /var/www/routine-game/.env"
echo ""
echo "3. Get SSL certificate:"
echo "   certbot --nginx -d your-domain.com -d www.your-domain.com"
echo ""
echo "4. Copy nginx config:"
echo "   cp /var/www/routine-game/deploy/nginx.conf /etc/nginx/sites-available/routine-game"
echo "   ln -s /etc/nginx/sites-available/routine-game /etc/nginx/sites-enabled/"
echo "   rm /etc/nginx/sites-enabled/default"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "5. Deploy the app (as deploy user):"
echo "   su - deploy"
echo "   cd /var/www/routine-game"
echo "   ./deploy/deploy.sh"
echo ""
echo "6. Set up PM2 to start on boot:"
echo "   pm2 startup systemd -u deploy --hp /home/deploy"
echo ""
