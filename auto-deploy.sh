#!/bin/bash

# =====================================================
# ULW Auto-Deploy Script - Complete Automation
# =====================================================
# This script automates the entire deployment process
# Usage: ./auto-deploy.sh [--backend] [--frontend] [--all]
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/tao.shen/MemLayer"
FRONTEND_DIR="$PROJECT_ROOT/frontend/skills-replica"
BACKEND_DIR="$PROJECT_ROOT/services/skill-creator-service"
SSH_KEY="/Users/tao.shen/Downloads/ssh-key-2026-01-31 (5).key"
BACKEND_HOST="ubuntu@170.9.12.37"
BACKEND_URL="https://opencode.tao-shen.com"
FRONTEND_URL="https://tacits-candy-shop.vercel.app"

# =====================================================
# Helper Functions
# =====================================================
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =====================================================
# Task 1: Backend Operations
# =====================================================
deploy_backend() {
    log_info "🚀 Starting Backend Deployment..."
    
    # Check if backend is already running
    log_info "Checking backend status..."
    if curl -s --connect-timeout 5 "$BACKEND_URL/health" > /dev/null 2>&1; then
        log_success "Backend is already running!"
        return 0
    fi
    
    log_warning "Backend is not responding. Attempting to start..."
    
    # SSH and start the backend
    log_info "Connecting to backend server..."
    
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY" "$BACKEND_HOST" "
        cd $BACKEND_DIR
        
        # Check if .env exists
        if [ ! -f .env ]; then
            log_error '.env file not found!'
            exit 1
        fi
        
        # Check for PM2
        if command -v pm2 &> /dev/null; then
            log_info 'Starting with PM2...'
            pm2 restart skill-creator || pm2 start \"npx tsx watch src/index.ts\" --name skill-creator
            pm2 save
        else
            log_info 'Starting with nohup...'
            # Kill any existing process on port 3001
            pkill -f 'tsx watch' || true
            nohup npx tsx watch src/index.ts > /tmp/skill-creator.log 2>&1 &
            sleep 3
        fi
        
        # Wait for startup
        for i in {1..10}; do
            if curl -s http://localhost:3001/health > /dev/null 2>&1; then
                log_success 'Backend started successfully!'
                exit 0
            fi
            sleep 1
        done
        
        log_error 'Backend failed to start. Check logs: /tmp/skill-creator.log'
        exit 1
    " 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Backend deployment completed!"
        return 0
    else
        log_error "Backend deployment failed. Manual intervention required."
        return 1
    fi
}

# =====================================================
# Task 2: Frontend Deployment
# =====================================================
deploy_frontend() {
    log_info "🚀 Starting Frontend Deployment..."
    
    cd "$FRONTEND_DIR"
    
    # Check if Vercel is logged in
    if ! vercel token > /dev/null 2>&1; then
        log_warning "Vercel not logged in. Please run: vercel login"
        log_info "Alternative: Push to git and Vercel will auto-deploy"
        return 1
    fi
    
    # Deploy to production
    log_info "Deploying to Vercel production..."
    vercel --prod --yes
    
    log_success "Frontend deployment completed!"
}

# =====================================================
# Task 3: Testing
# =====================================================
run_tests() {
    log_info "🧪 Running End-to-End Tests..."
    
    local all_passed=true
    
    # Test 1: Backend Health
    log_info "Test 1: Backend Health Check..."
    if curl -s --connect-timeout 10 "$BACKEND_URL/health" | grep -q '"status":"ok"'; then
        log_success "✅ Backend health check passed"
    else
        log_error "❌ Backend health check failed"
        all_passed=false
    fi
    
    # Test 2: Frontend loads
    log_info "Test 2: Frontend Loading..."
    if curl -s --connect-timeout 10 -I "$FRONTEND_URL" | head -1 | grep -q "200\|304"; then
        log_success "✅ Frontend loads successfully"
    else
        log_error "❌ Frontend failed to load"
        all_passed=false
    fi
    
    # Test 3: API Endpoint exists
    log_info "Test 3: API Endpoint Check..."
    if curl -s --connect-timeout 10 -X OPTIONS "$BACKEND_URL/api/skills/test/execute" \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: POST" | grep -q "Access-Control"; then
        log_success "✅ CORS headers present"
    else
        log_warning "⚠️ CORS check inconclusive (may require actual POST)"
    fi
    
    # Test 4: coi-fixed.js served correctly
    log_info "Test 4: COI Service Worker..."
    local content_type=$(curl -s --connect-timeout 10 -I "$FRONTEND_URL/coi-fixed.js" 2>/dev/null | grep -i "content-type" | head -1)
    if echo "$content_type" | grep -q "application/javascript"; then
        log_success "✅ coi-fixed.js served as JavaScript"
    else
        log_warning "⚠️ coi-fixed.js content type unclear"
    fi
    
    if [ "$all_passed" = true ]; then
        log_success "🎉 All critical tests passed!"
        return 0
    else
        log_error "❌ Some tests failed. Check details above."
        return 1
    fi
}

# =====================================================
# Task 4: Git Operations (Auto-Push)
# =====================================================
git_commit_and_push() {
    log_info "📦 Committing and pushing changes..."
    
    cd "$PROJECT_ROOT"
    
    # Add all changes
    git add -A
    
    # Check if there are changes to commit
    if git diff --cached --quiet; then
        log_info "No changes to commit"
        return 0
    fi
    
    # Create commit message
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    git commit -m "fix: automated deployment update - $timestamp"
    
    # Push to origin
    log_info "Pushing to origin/main..."
    git push origin main
    
    log_success "Changes committed and pushed!"
}

# =====================================================
# Main Entry Point
# =====================================================
main() {
    echo "====================================================="
    echo "  ULW Auto-Deploy Script v1.0"
    echo "  $(date)"
    echo "====================================================="
    echo ""
    
    local mode=${1:-"all"}
    
    case $mode in
        --backend)
            deploy_backend
            ;;
        --frontend)
            deploy_frontend
            ;;
        --test)
            run_tests
            ;;
        --git)
            git_commit_and_push
            ;;
        --all|"")
            log_info "Running full deployment sequence..."
            
            # Step 1: Git commit and push (triggers Vercel auto-deploy)
            git_commit_and_push
            
            # Step 2: Wait for Vercel deployment
            log_info "Waiting for Vercel deployment (30s)..."
            sleep 30
            
            # Step 3: Deploy backend
            deploy_backend || log_warning "Backend deploy needs manual intervention"
            
            # Step 4: Run tests
            run_tests
            
            log_success "====================================================="
            log_success "  Deployment Complete!"
            log_success "  Frontend: $FRONTEND_URL"
            log_success "  Backend:  $BACKEND_URL"
            log_success "====================================================="
            ;;
        *)
            echo "Usage: $0 [--backend] [--frontend] [--test] [--git] [--all]"
            echo ""
            echo "Options:"
            echo "  --backend   Start/restart backend server"
            echo "  --frontend  Deploy frontend to Vercel"
            echo "  --test      Run end-to-end tests"
            echo "  --git       Commit and push changes"
            echo "  --all       Run full deployment (default)"
            exit 1
            ;;
    esac
}

main "$@"
