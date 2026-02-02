#!/bin/bash
set -e

# ===========================================
# Deployment Script for Routine Game
# Run on server: ./deploy.sh
# ===========================================

APP_DIR="/var/www/routine-game"
REPO_URL="https://github.com/davecrosser91/body-and-mind.git"
BRANCH="main"

echo "=========================================="
echo "  Deploying Routine Game"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then
    log_error "Please don't run as root. Run as your deploy user."
    exit 1
fi

# Navigate to app directory
if [ ! -d "$APP_DIR" ]; then
    log_info "Cloning repository..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# Pull latest changes
log_info "Pulling latest changes from $BRANCH..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Install dependencies
log_info "Installing dependencies..."
npm ci --production=false

# Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate

# Run database migrations
log_info "Running database migrations..."
npx prisma migrate deploy

# Build the application
log_info "Building application..."
npm run build

# Restart PM2 processes
log_info "Restarting application..."
if pm2 list | grep -q "routine-game"; then
    pm2 reload ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js --env production
fi

# Save PM2 process list
pm2 save

# Verify deployment
log_info "Verifying deployment..."
sleep 5
if curl -s http://localhost:3000/api/v1/health > /dev/null; then
    log_info "Health check passed!"
else
    log_error "Health check failed!"
    pm2 logs routine-game --lines 50
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View logs"
echo "  pm2 monit           - Monitor resources"
echo "  pm2 restart all     - Restart all apps"
echo ""
