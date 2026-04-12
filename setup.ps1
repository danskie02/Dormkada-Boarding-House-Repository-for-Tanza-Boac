# ============================================================================
# Dorm-Finder Complete Installation Script
# ============================================================================
# This script installs all dependencies and sets up the entire system:
# - Backend API Server
# - Frontend (React/Vite)
# - Database packages
# - All monorepo workspaces
#
# Requirements: Node.js 18+ and internet connection
# ============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red
$Cyan = [System.ConsoleColor]::Cyan

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
    Write-Host "║ $Message" -ForegroundColor $Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Red
}

function Check-Command {
    param([string]$Command)
    try {
        if (Get-Command $Command -ErrorAction SilentlyContinue) {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# ============================================================================
# MAIN INSTALLATION
# ============================================================================

Write-Header "DORM-FINDER COMPLETE SETUP"

# Step 1: Check Prerequisites
Write-Header "STEP 1: Checking Prerequisites"

if (-not (Check-Command "node")) {
    Write-Error-Custom "Node.js is not installed!"
    Write-Host "Please download and install Node.js 18+ from https://nodejs.org/"
    exit 1
}

$nodeVersion = node --version
Write-Success "Node.js installed: $nodeVersion"

if (-not (Check-Command "pnpm")) {
    Write-Warning "pnpm not found globally. Installing pnpm..."
    npm install -g pnpm
}

$pnpmVersion = pnpm --version
Write-Success "pnpm installed: $pnpmVersion"

# Step 2: Install Root Dependencies
Write-Header "STEP 2: Installing Root Workspace Dependencies"
Write-Host "Installing dependencies from root package.json..."

try {
    pnpm install
    Write-Success "Root dependencies installed"
}
catch {
    Write-Error-Custom "Failed to install root dependencies"
    Write-Host "Error: $_"
    exit 1
}

# Step 3: Install Workspace Dependencies
Write-Header "STEP 3: Installing Monorepo Workspace Dependencies"
Write-Host "This will install all dependencies for:"
Write-Host "  • API Server (Express backend)"
Write-Host "  • Frontend (React + Vite)"
Write-Host "  • Database package (Drizzle ORM)"
Write-Host "  • API Client"
Write-Host "  • Scripts and utilities"
Write-Host ""

try {
    # Install all workspace packages recursively
    pnpm install -r
    Write-Success "All workspace dependencies installed"
}
catch {
    Write-Error-Custom "Failed to install workspace dependencies"
    Write-Host "Error: $_"
    exit 1
}

# Step 4: Generate Types
Write-Header "STEP 4: Type Checking"
Write-Host "Running TypeScript type checking..."

try {
    pnpm run typecheck
    Write-Success "Type checking completed"
}
catch {
    Write-Warning "Type checking encountered warnings (non-critical)"
}

# Step 5: Build Project
Write-Header "STEP 5: Building Project"
Write-Host "Building all artifacts..."

try {
    pnpm run build
    Write-Success "Project built successfully"
}
catch {
    Write-Error-Custom "Failed to build project"
    Write-Host "Error: $_"
    exit 1
}

# Step 6: Environment Setup
Write-Header "STEP 6: Environment Configuration"

$envPath = ".env"
$envExamplePath = ".env.example"

if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Write-Host "Creating .env file from .env.example..."
        Copy-Item $envExamplePath $envPath
        Write-Success ".env file created"
        Write-Warning "IMPORTANT: Please edit .env and fill in your configuration:"
        Write-Host ""
        Write-Host "Required variables:"
        Write-Host "  DATABASE_URL     - Your Supabase PostgreSQL connection string"
        Write-Host "  PORT             - API server port (default: 3001)"
        Write-Host "  SENDGRID_API_KEY - SendGrid API key for email notifications (optional)"
        Write-Host ""
        Write-Host "Edit: $envPath"
        Write-Host ""
    }
    else {
        Write-Warning ".env file not found"
        Write-Host "Create a .env file in the root directory with your configuration"
    }
}
else {
    Write-Success ".env file already exists"
}

# Step 7: Database Setup Instructions
Write-Header "STEP 7: Database Setup"
Write-Host "The application uses Supabase PostgreSQL database."
Write-Host ""
Write-Host "To set up your database:"
Write-Host "  1. Create a Supabase project at https://supabase.com/"
Write-Host "  2. Get your database connection string from:"
Write-Host "     Project Settings → Database → Connection string → URI"
Write-Host "  3. Copy the connection string to DATABASE_URL in .env"
Write-Host "  4. Run: pnpm run db:push (from lib/db directory)"
Write-Host ""

# Step 8: Summary and Next Steps
Write-Header "INSTALLATION COMPLETE! ✓"

Write-Host "Next Steps:" -ForegroundColor $Green
Write-Host ""
Write-Host "1. CONFIGURE ENVIRONMENT"
Write-Host "   Edit the .env file with your database connection"
Write-Host ""
Write-Host "2. START DEVELOPMENT SERVERS"
Write-Host "   Open 2-3 terminals and run:"
Write-Host ""
Write-Host "   Terminal 1 - API Server:"
Write-Host "   > cd artifacts/api-server && pnpm run dev"
Write-Host ""
Write-Host "   Terminal 2 - Frontend (Vite):"
Write-Host "   > cd artifacts/dormkada && pnpm run dev"
Write-Host ""
Write-Host "   Terminal 3 (Optional) - Mockup Preview:"
Write-Host "   > cd artifacts/mockup-sandbox && pnpm run dev"
Write-Host ""
Write-Host "3. ACCESS THE APPLICATION"
Write-Host "   Frontend: http://localhost:5173"
Write-Host "   API: http://localhost:3001"
Write-Host ""
Write-Host "For Production Build:"
Write-Host "   > pnpm run build"
Write-Host ""
Write-Host "Project Structure:" -ForegroundColor $Green
Write-Host "  artifacts/api-server/     - Express backend API"
Write-Host "  artifacts/dormkada/       - React + Vite frontend"
Write-Host "  artifacts/mockup-sandbox/ - UI component mockups"
Write-Host "  lib/db/                   - Database schema (Drizzle ORM)"
Write-Host "  lib/api-client-react/     - Auto-generated API client"
Write-Host "  lib/api-zod/              - Zod validation schemas"
Write-Host ""
Write-Host "Documentation:"
Write-Host "  README.md                 - Project overview"
Write-Host "  SENDGRID_SETUP.md         - Email notifications setup"
Write-Host "  EMAIL_TEST_GUIDE.md       - Testing email functionality"
Write-Host ""

Write-Success "Setup completed successfully! Happy coding! 🚀"
Write-Host ""
