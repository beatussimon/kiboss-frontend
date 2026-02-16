#!/bin/bash

# KIBOSS E2E Test Runner - Linux/macOS
# 
# Usage: 
#   ./e2e-test-runner.sh              # Run full setup + tests
#   ./e2e-test-runner.sh --headed    # Run with headed browser
#   ./e2e-test-runner.sh --test-only # Run tests only (servers must be running)

set -e  # Exit on error

BACKEND_PORT=8000
FRONTEND_PORT=5173
API_URL="http://localhost:${BACKEND_PORT}/api/v1"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 KIBOSS E2E Test Runner Starting...${NC}\n"

# Parse arguments
HEADED=false
TEST_ONLY=false
for arg in "$@"; do
    case $arg in
        --headed)
            HEADED=true
            ;;
        --test-only)
            TEST_ONLY=true
            ;;
    esac
done

# Colors for output
log_info() {
    echo -e "${GREEN}📦 $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    if [ ! -z "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
        log_success "Backend server stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
        log_success "Frontend server stopped"
    fi
    
    exit 0
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Wait for server to be ready
wait_for_server() {
    local url=$1
    local max_attempts=30
    local attempt=0
    
    echo -n "⏳ Waiting for server at $url..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q "200\|301\|302"; then
            echo -e " ${GREEN}Ready!${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}Failed!${NC}"
    return 1
}

# Change to backend directory
BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$TEST_ONLY" = false ]; then
    # Step 1: Start Django backend
    log_info "Step 1: Starting Django backend server..."
    cd "$BACKEND_DIR"
    
    python manage.py runserver "$BACKEND_PORT" > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    
    log_info "Backend PID: $BACKEND_PID"
    
    if ! wait_for_server "http://localhost:${BACKEND_PORT}/api/v1/"; then
        log_error "Backend server failed to start"
        cat /tmp/backend.log
        exit 1
    fi
    
    # Step 2: Start React frontend
    log_info "Step 2: Starting React frontend server..."
    cd "$FRONTEND_DIR"
    
    npm run dev -- --port "$FRONTEND_PORT" > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    log_info "Frontend PID: $FRONTEND_PID"
    
    if ! wait_for_server "$FRONTEND_URL"; then
        log_error "Frontend server failed to start"
        cat /tmp/frontend.log
        exit 1
    fi
    
    # Step 3: Verify backend health
    log_info "Step 3: Verifying backend health..."
    HEALTH_RESPONSE=$(curl -s "$API_URL/" | grep -o '"status":"ok"' || echo "")
    
    if [ "$HEALTH_RESPONSE" = '"status":"ok"' ]; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        exit 1
    fi
fi

# Step 4: Run Cypress tests
log_info "Step 4: Running Cypress E2E tests...\n"

cd "$SCRIPT_DIR"

export CYPRESS_apiBaseUrl="$API_URL"
export CYPRESS_backendUrl="$API_URL"
export CYPRESS_frontendUrl="$FRONTEND_URL"

if [ "$HEADED" = true ]; then
    npx cypress run --headed
else
    npx cypress run
fi

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    log_success "All E2E tests PASSED!"
else
    echo ""
    log_error "E2E tests FAILED with exit code $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE
