#!/bin/bash
set -e

# ===========================================
# One-Click Setup: Traefik + Portainer + App
# ===========================================
# Run: curl -sSL https://raw.githubusercontent.com/davecrosser91/body-and-mind/main/deploy/traefik/setup.sh | bash

echo "=========================================="
echo "  Routine Game - Full Stack Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Running as root is fine on a VPS
if [ "$EUID" -eq 0 ]; then
    log_info "Running as root - this is fine for VPS setup"
fi

# Get user input
echo ""
read -p "Enter your domain (e.g., routinegame.com): " DOMAIN
read -p "Enter your email (for SSL certificates): " EMAIL
read -p "Enter your GitHub username: " GITHUB_USER
read -s -p "Enter your GitHub PAT (with read:packages): " GITHUB_TOKEN
echo ""

# Validate inputs
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$GITHUB_USER" ] || [ -z "$GITHUB_TOKEN" ]; then
    log_error "All fields are required!"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    log_warn "Docker installed. Please log out and back in, then run this script again."
    exit 0
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    log_info "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create directories
log_info "Creating directories..."
mkdir -p ~/traefik
mkdir -p ~/routine-game
cd ~/traefik

# Create Docker network
log_info "Creating Docker network..."
docker network create proxy 2>/dev/null || true

# Login to GitHub Container Registry
log_info "Logging into GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

# Generate basic auth password for Traefik dashboard
log_info "Setting up Traefik dashboard auth..."
ADMIN_PASS=$(openssl rand -base64 12)
ADMIN_HASH=$(docker run --rm httpd:alpine htpasswd -nb admin "$ADMIN_PASS" | sed 's/\$/\$\$/g')

# Download and configure infrastructure
log_info "Downloading Traefik configuration..."
curl -sO https://raw.githubusercontent.com/davecrosser91/body-and-mind/main/deploy/traefik/docker-compose.infra.yml

# Replace placeholders
sed -i "s/YOUR_EMAIL@example.com/$EMAIL/g" docker-compose.infra.yml
sed -i "s/YOUR_DOMAIN.com/$DOMAIN/g" docker-compose.infra.yml
sed -i "s|admin:\$\$apr1\$\$xyz...YOUR_HASH|$ADMIN_HASH|g" docker-compose.infra.yml

# Create acme.json for SSL certificates
touch acme.json
chmod 600 acme.json

# Start Traefik + Portainer
log_info "Starting Traefik and Portainer..."
docker-compose -f docker-compose.infra.yml up -d

# Setup app
log_info "Setting up Routine Game..."
cd ~/routine-game

curl -sO https://raw.githubusercontent.com/davecrosser91/body-and-mind/main/deploy/traefik/docker-compose.app.yml

# Create .env file
log_info "Creating environment file..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > .env << EOF
DOMAIN=$DOMAIN
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
EOF

echo ""
echo "=========================================="
echo -e "${GREEN}  Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "IMPORTANT: Edit ~/routine-game/.env with your database URL!"
echo ""
echo "Access URLs (after DNS propagates):"
echo "  App:       https://$DOMAIN"
echo "  Portainer: https://portainer.$DOMAIN"
echo "  Traefik:   https://traefik.$DOMAIN"
echo ""
echo "Traefik Dashboard Login:"
echo "  Username: admin"
echo "  Password: $ADMIN_PASS"
echo ""
echo "DNS Records needed (point to your server IP):"
echo "  A  @           → YOUR_SERVER_IP"
echo "  A  www         → YOUR_SERVER_IP"
echo "  A  portainer   → YOUR_SERVER_IP"
echo "  A  traefik     → YOUR_SERVER_IP"
echo ""
echo "Start the app after configuring .env:"
echo "  cd ~/routine-game"
echo "  docker-compose -f docker-compose.app.yml up -d"
echo ""
