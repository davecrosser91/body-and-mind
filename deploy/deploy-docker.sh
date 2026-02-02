#!/bin/bash
set -e

# ===========================================
# Docker Deployment Script for Routine Game
# Pulls latest image from GitHub Container Registry
# ===========================================

APP_DIR="/var/www/routine-game"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=========================================="
echo "  Deploying Routine Game (Docker)"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cd "$APP_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    log_error ".env file not found! Copy from .env.production.example"
    exit 1
fi

# Login to GitHub Container Registry
log_info "Logging in to GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin

# Pull latest image
log_info "Pulling latest image..."
docker-compose -f "$COMPOSE_FILE" pull

# Run database migrations
log_info "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" run --rm app npx prisma migrate deploy

# Start/restart containers
log_info "Starting containers..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for health check
log_info "Waiting for health check..."
sleep 10

# Verify deployment
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
    log_info "Health check passed!"
else
    log_warn "Health check status unknown. Checking logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=20 app
fi

# Clean up old images
log_info "Cleaning up old images..."
docker image prune -f

echo ""
echo "=========================================="
echo -e "${GREEN}  Docker Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  docker-compose -f $COMPOSE_FILE ps       - Check status"
echo "  docker-compose -f $COMPOSE_FILE logs -f  - View logs"
echo "  docker-compose -f $COMPOSE_FILE restart  - Restart"
echo "  docker-compose -f $COMPOSE_FILE down     - Stop"
echo ""
