# Installation Guide - Dorm-Finder Complete Setup

## Overview

This repository includes automated installation scripts that will set up the entire Dorm-Finder system on a new device, including:

- **Backend API** (Express.js server)
- **Frontend** (React + Vite)
- **Database** (Drizzle ORM with Supabase PostgreSQL)
- **All Dependencies** across the monorepo

## Quick Start

### Prerequisites

Before running any installation script, ensure you have:

1. **Node.js 18+** - Download from https://nodejs.org/
2. **Internet connection** - Required to download dependencies

### Installation Scripts

Choose the appropriate script for your operating system:

#### Windows Users

**Option 1: PowerShell (Recommended)**

```powershell
# Open PowerShell and run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

**Option 2: Command Prompt**

```cmd
# Open Command Prompt and run:
setup.bat
```

#### macOS & Linux Users

```bash
# Make the script executable
chmod +x setup.sh

# Run the script
./setup.sh
```

### What the Installation Script Does

1. ✓ **Checks Prerequisites** - Verifies Node.js and pnpm are installed
2. ✓ **Installs Root Dependencies** - Sets up the root workspace
3. ✓ **Installs All Workspaces** - Installs dependencies for:
   - `artifacts/api-server` (Express backend)
   - `artifacts/dormkada` (React frontend)
   - `artifacts/mockup-sandbox` (UI mockups)
   - `lib/db` (Database layer)
   - `lib/api-client-react` (API client)
   - `lib/api-zod` (Validation schemas)
4. ✓ **Type Checking** - Runs TypeScript validation
5. ✓ **Builds Project** - Compiles all artifacts
6. ✓ **Creates .env File** - Sets up environment configuration

## Manual Configuration After Installation

### 1. Configure Environment Variables

Edit the `.env` file in the root directory:

```env
# Database connection string from Supabase
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require

# API server port
PORT=3001

# Optional: SendGrid API key for email notifications
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

**How to get DATABASE_URL:**

1. Go to https://supabase.com/ and create a project
2. Navigate to: Project Settings → Database → Connection string → URI
3. Copy the "Direct connection" string (includes `?sslmode=require`)
4. Paste into `.env` as `DATABASE_URL`

### 2. Initialize Database (Optional)

If you have database migrations set up:

```bash
cd lib/db
pnpm run push
```

## Running the Application

### Development Mode

You'll need **3 terminal windows** running simultaneously:

**Terminal 1: Start the API Server**

```bash
cd artifacts/api-server
pnpm run dev
```

- API will run on: `http://localhost:3001`

**Terminal 2: Start the Frontend Development Server**

```bash
cd artifacts/dormkada
pnpm run dev
```

- Frontend will run on: `http://localhost:5173`

**Terminal 3 (Optional): UI Mockup Preview**

```bash
cd artifacts/mockup-sandbox
pnpm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

### Production Build

To create a production-ready build:

```bash
pnpm run build
```

Outputs:

- Frontend build: `artifacts/dormkada/dist/`
- API server: `artifacts/api-server/dist/index.mjs`

## Project Structure

```
Dorm-Finder/
├── artifacts/
│   ├── api-server/        # Express.js backend API
│   ├── dormkada/          # React + Vite frontend
│   └── mockup-sandbox/    # UI component mockups
├── lib/
│   ├── db/                # Database schema (Drizzle ORM)
│   ├── api-client-react/  # Auto-generated API client
│   ├── api-spec/          # OpenAPI specification
│   └── api-zod/           # Zod validation schemas
├── scripts/               # Utility scripts
├── setup.ps1             # PowerShell installation script
├── setup.bat             # Batch installation script
├── setup.sh              # Bash installation script
├── .env.example          # Environment template
├── package.json          # Root workspace config
├── pnpm-workspace.yaml   # Monorepo configuration
└── tsconfig.base.json    # Base TypeScript config
```

## Troubleshooting

### PowerShell Script Won't Run

If you get an execution policy error:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### pnpm Installation Fails

If pnpm doesn't install globally:

```bash
npm install -g pnpm@latest
```

### Port Already in Use

If ports 3001 or 5173 are already in use:

**Change API Port:**
Edit `.env` and set `PORT=3002` (or another port)

**Change Frontend Port:**
Edit `artifacts/dormkada/vite.config.ts` and change the port configuration

### Database Connection Error

Ensure:

1. Your database connection string is correct
2. Your Supabase project is active
3. You're using the "Direct connection" string (not the pooler)
4. Add `?sslmode=require` to your connection string

### Module Not Found Errors

Clear cache and reinstall:

```bash
# Remove all node_modules
rm -rf node_modules
rm -rf artifacts/*/node_modules
rm -rf lib/*/node_modules

# Reinstall everything
pnpm install -r
```

## Additional Documentation

For more detailed information, see:

- **[README.md](./README.md)** - Project overview
- **[SENDGRID_SETUP.md](./SENDGRID_SETUP.md)** - Email notification setup
- **[EMAIL_TEST_GUIDE.md](./EMAIL_TEST_GUIDE.md)** - Testing email functionality
- **[SENDGRID_IMPLEMENTATION.md](./SENDGRID_IMPLEMENTATION.md)** - Implementation details

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check that your `.env` file is properly configured
4. Review the console output for specific error messages
5. Ensure you're running the installation from the root directory

## Summary

The installation scripts automate the complete setup process. After running the appropriate script for your OS:

1. Edit `.env` with your database connection
2. Open 3 terminals
3. Run the dev servers in each terminal
4. Access the frontend at http://localhost:5173

That's it! Your Dorm-Finder system is ready to use. 🚀
