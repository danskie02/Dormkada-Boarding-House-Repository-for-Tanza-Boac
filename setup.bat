@echo off
REM ============================================================================
REM Dorm-Finder Complete Installation Script (Batch Version)
REM ============================================================================
REM This script installs all dependencies and sets up the entire system
REM Requirements: Node.js 18+ and internet connection
REM ============================================================================

setlocal enabledelayedexpansion
color 0B

echo.
echo ============================================================================
echo DORM-FINDER COMPLETE SETUP
echo ============================================================================
echo.

REM Step 1: Check Prerequisites
echo [STEP 1] Checking Prerequisites...
echo.

where node >nul 2>nul
if errorlevel 1 (
    color 0C
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js installed: %NODE_VERSION%

where pnpm >nul 2>nul
if errorlevel 1 (
    echo.
    echo [WARNING] pnpm not found globally. Installing pnpm...
    call npm install -g pnpm
    if errorlevel 1 (
        color 0C
        echo ERROR: Failed to install pnpm
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo [OK] pnpm installed: %PNPM_VERSION%

REM Step 2: Install Root Dependencies
echo.
echo [STEP 2] Installing Root Workspace Dependencies...
echo.

call pnpm install
if errorlevel 1 (
    color 0C
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo [OK] Root dependencies installed

REM Step 3: Install Workspace Dependencies
echo.
echo [STEP 3] Installing Monorepo Workspace Dependencies...
echo This will install all dependencies for:
echo   - API Server (Express backend)
echo   - Frontend (React + Vite)
echo   - Database package (Drizzle ORM)
echo   - API Client
echo   - Scripts and utilities
echo.

call pnpm install -r
if errorlevel 1 (
    color 0C
    echo ERROR: Failed to install workspace dependencies
    pause
    exit /b 1
)
echo [OK] All workspace dependencies installed

REM Step 4: Type Checking
echo.
echo [STEP 4] Type Checking...
echo.

call pnpm run typecheck
REM Type checking non-critical

REM Step 5: Build Project
echo.
echo [STEP 5] Building Project...
echo.

call pnpm run build
if errorlevel 1 (
    color 0C
    echo ERROR: Failed to build project
    pause
    exit /b 1
)
echo [OK] Project built successfully

REM Step 6: Environment Setup
echo.
echo [STEP 6] Environment Configuration...
echo.

if not exist .env (
    if exist .env.example (
        echo Creating .env file from .env.example...
        copy .env.example .env
        echo [OK] .env file created
        echo.
        echo [WARNING] IMPORTANT: Please edit .env and fill in your configuration:
        echo.
        echo Required variables:
        echo   DATABASE_URL     - Your Supabase PostgreSQL connection string
        echo   PORT             - API server port (default: 3001)
        echo   SENDGRID_API_KEY - SendGrid API key for email (optional)
        echo.
    ) else (
        echo [WARNING] .env file not found
        echo Create a .env file in the root directory with your configuration
    )
) else (
    echo [OK] .env file already exists
)

REM Step 7: Summary
echo.
echo ============================================================================
echo INSTALLATION COMPLETE!
echo ============================================================================
echo.
echo Next Steps:
echo.
echo 1. CONFIGURE ENVIRONMENT
echo    Edit the .env file with your database connection
echo.
echo 2. START DEVELOPMENT SERVERS
echo    Open 2-3 terminals and run:
echo.
echo    Terminal 1 - API Server:
echo    > cd artifacts\api-server ^&^& pnpm run dev
echo.
echo    Terminal 2 - Frontend (Vite):
echo    > cd artifacts\dormkada ^&^& pnpm run dev
echo.
echo    Terminal 3 (Optional) - Mockup Preview:
echo    > cd artifacts\mockup-sandbox ^&^& pnpm run dev
echo.
echo 3. ACCESS THE APPLICATION
echo    Frontend: http://localhost:5173
echo    API: http://localhost:3001
echo.
echo For Production Build:
echo    > pnpm run build
echo.
echo Project Structure:
echo   artifacts/api-server/     - Express backend API
echo   artifacts/dormkada/       - React + Vite frontend
echo   artifacts/mockup-sandbox/ - UI component mockups
echo   lib/db/                   - Database schema (Drizzle ORM)
echo   lib/api-client-react/     - Auto-generated API client
echo   lib/api-zod/              - Zod validation schemas
echo.
echo Documentation:
echo   README.md                 - Project overview
echo   SENDGRID_SETUP.md         - Email notifications setup
echo   EMAIL_TEST_GUIDE.md       - Testing email functionality
echo.
echo Setup completed successfully! Happy coding! [OK]
echo.

pause
