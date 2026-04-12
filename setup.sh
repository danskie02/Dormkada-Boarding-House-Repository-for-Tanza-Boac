#!/bin/bash

# ============================================================================
# Dorm-Finder Complete Installation Script (Bash Version)
# ============================================================================
# This script installs all dependencies and sets up the entire system:
# - Backend API Server
# - Frontend (React/Vite)
# - Database packages
# - All monorepo workspaces
#
# Requirements: Node.js 18+ and internet connection
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# MAIN INSTALLATION
# ============================================================================

print_header "DORM-FINDER COMPLETE SETUP"

# Step 1: Check Prerequisites
print_header "STEP 1: Checking Prerequisites"

if ! command_exists node; then
    print_error "Node.js is not installed!"
    echo "Please download and install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js installed: $NODE_VERSION"

if ! command_exists pnpm; then
    print_warning "pnpm not found globally. Installing pnpm..."
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm --version)
print_success "pnpm installed: $PNPM_VERSION"

# Step 2: Install Root Dependencies
print_header "STEP 2: Installing Root Workspace Dependencies"
echo "Installing dependencies from root package.json..."

if ! pnpm install; then
    print_error "Failed to install root dependencies"
    exit 1
fi
print_success "Root dependencies installed"

# Step 3: Install Workspace Dependencies
print_header "STEP 3: Installing Monorepo Workspace Dependencies"
echo "This will install all dependencies for:"
echo "  • API Server (Express backend)"
echo "  • Frontend (React + Vite)"
echo "  • Database package (Drizzle ORM)"
echo "  • API Client"
echo "  • Scripts and utilities"
echo ""

if ! pnpm install -r; then
    print_error "Failed to install workspace dependencies"
    exit 1
fi
print_success "All workspace dependencies installed"

# Step 4: Type Checking
print_header "STEP 4: Type Checking"
echo "Running TypeScript type checking..."

if pnpm run typecheck; then
    print_success "Type checking completed"
else
    print_warning "Type checking encountered warnings (non-critical)"
fi

# Step 5: Build Project
print_header "STEP 5: Building Project"
echo "Building all artifacts..."

if ! pnpm run build; then
    print_error "Failed to build project"
    exit 1
fi
print_success "Project built successfully"

# Step 6: Environment Setup
print_header "STEP 6: Environment Configuration"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created"
        print_warning "IMPORTANT: Please edit .env and fill in your configuration:"
        echo ""
        echo "Required variables:"
        echo "  DATABASE_URL     - Your Supabase PostgreSQL connection string"
        echo "  PORT             - API server port (default: 3001)"
        echo "  SENDGRID_API_KEY - SendGrid API key for email notifications (optional)"
        echo ""
        echo "Edit: .env"
        echo ""
    else
        print_warning ".env file not found"
        echo "Create a .env file in the root directory with your configuration"
    fi
else
    print_success ".env file already exists"
fi

# Step 7: Database Setup Instructions
print_header "STEP 7: Database Setup"
echo "The application uses Supabase PostgreSQL database."
echo ""
echo "To set up your database:"
echo "  1. Create a Supabase project at https://supabase.com/"
echo "  2. Get your database connection string from:"
echo "     Project Settings → Database → Connection string → URI"
echo "  3. Copy the connection string to DATABASE_URL in .env"
echo "  4. Run: pnpm run db:push (from lib/db directory)"
echo ""

# Step 8: Summary and Next Steps
print_header "INSTALLATION COMPLETE! ✓"

echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo "1. CONFIGURE ENVIRONMENT"
echo "   Edit the .env file with your database connection"
echo ""
echo "2. START DEVELOPMENT SERVERS"
echo "   Open 2-3 terminals and run:"
echo ""
echo "   Terminal 1 - API Server:"
echo "   $ cd artifacts/api-server && pnpm run dev"
echo ""
echo "   Terminal 2 - Frontend (Vite):"
echo "   $ cd artifacts/dormkada && pnpm run dev"
echo ""
echo "   Terminal 3 (Optional) - Mockup Preview:"
echo "   $ cd artifacts/mockup-sandbox && pnpm run dev"
echo ""
echo "3. ACCESS THE APPLICATION"
echo "   Frontend: http://localhost:5173"
echo "   API: http://localhost:3001"
echo ""
echo "For Production Build:"
echo "   $ pnpm run build"
echo ""
echo -e "${GREEN}Project Structure:${NC}"
echo "  artifacts/api-server/     - Express backend API"
echo "  artifacts/dormkada/       - React + Vite frontend"
echo "  artifacts/mockup-sandbox/ - UI component mockups"
echo "  lib/db/                   - Database schema (Drizzle ORM)"
echo "  lib/api-client-react/     - Auto-generated API client"
echo "  lib/api-zod/              - Zod validation schemas"
echo ""
echo -e "${GREEN}Documentation:${NC}"
echo "  README.md                 - Project overview"
echo "  SENDGRID_SETUP.md         - Email notifications setup"
echo "  EMAIL_TEST_GUIDE.md       - Testing email functionality"
echo ""

print_success "Setup completed successfully! Happy coding! 🚀"
echo ""
