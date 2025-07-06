@echo off
REM Gordon Project Setup Script for Windows
REM This script installs all necessary tools and dependencies for the Gordon project
REM Run this script when setting up the project on a new Windows device

echo 🚀 Setting up Gordon project environment...

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Node.js...
    echo Please download and install Node.js 22.x from https://nodejs.org/
    echo After installation, run this script again.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js already installed: %NODE_VERSION%
)

REM Check if pnpm is installed
echo [INFO] Checking pnpm installation...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing pnpm...
    npm install -g pnpm
    echo [SUCCESS] pnpm installed successfully
) else (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo [SUCCESS] pnpm already installed: %PNPM_VERSION%
)

REM Check if Firebase CLI is installed
echo [INFO] Checking Firebase CLI installation...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Firebase CLI...
    npm install -g firebase-tools
    echo [SUCCESS] Firebase CLI installed successfully
) else (
    for /f "tokens=*" %%i in ('firebase --version') do set FIREBASE_VERSION=%%i
    echo [SUCCESS] Firebase CLI already installed: %FIREBASE_VERSION%
)

REM Check if Google Cloud CLI is installed
echo [INFO] Checking Google Cloud CLI installation...
gcloud --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Google Cloud CLI...
    echo Please download and install Google Cloud CLI from https://cloud.google.com/sdk/docs/install
    echo After installation, run this script again.
    pause
    exit /b 1
) else (
    for /f "tokens=1" %%i in ('gcloud --version') do set GCLOUD_VERSION=%%i
    echo [SUCCESS] Google Cloud CLI already installed: %GCLOUD_VERSION%
)

REM Install project dependencies
echo [INFO] Installing project dependencies...
if exist package.json (
    pnpm install
    echo [SUCCESS] Main project dependencies installed
) else (
    echo [ERROR] package.json not found in current directory
    pause
    exit /b 1
)

REM Install functions dependencies
echo [INFO] Installing Firebase Functions dependencies...
if exist functions\package.json (
    cd functions
    pnpm install
    cd ..
    echo [SUCCESS] Firebase Functions dependencies installed
) else (
    echo [WARNING] Functions directory or package.json not found
)

REM Check for required environment files
echo [INFO] Checking for required environment files...
if not exist .env (
    echo [WARNING] .env file not found
    echo [INFO] Creating .env template...
    (
        echo # Environment variables for local development
        echo # Copy this file to .env and fill in your actual values
        echo.
        echo # Groq API Key ^(for AI suggestions^)
        echo GROQ_API_KEY=your_groq_api_key_here
        echo.
        echo # Firebase config ^(if needed for local development^)
        echo VITE_FIREBASE_API_KEY=your_firebase_api_key_here
        echo VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
        echo VITE_FIREBASE_PROJECT_ID=your_project_id
        echo VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
        echo VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        echo VITE_FIREBASE_APP_ID=your_app_id
    ) > .env
    echo [SUCCESS] .env template created
    echo [WARNING] Please edit .env file with your actual API keys
)

REM Check for service account key
if not exist serviceAccountKey.json (
    echo [WARNING] serviceAccountKey.json not found
    echo [INFO] This file is needed for admin operations and scripts
    echo [INFO] Download it from Firebase Console ^> Project Settings ^> Service Accounts
)

REM Verify installations
echo [INFO] Verifying installations...
echo.

echo 📋 Installation Summary:
echo ========================

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
) else (
    echo ❌ Node.js: Not installed
)

REM Check pnpm
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do echo ✅ pnpm: %%i
) else (
    echo ❌ pnpm: Not installed
)

REM Check Firebase CLI
firebase --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('firebase --version') do echo ✅ Firebase CLI: %%i
) else (
    echo ❌ Firebase CLI: Not installed
)

REM Check Google Cloud CLI
gcloud --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1" %%i in ('gcloud --version') do echo ✅ Google Cloud CLI: %%i
) else (
    echo ❌ Google Cloud CLI: Not installed
)

echo.
echo [SUCCESS] Setup complete! 🎉
echo.
echo 📝 Next steps:
echo 1. Edit .env file with your actual API keys
echo 2. Download serviceAccountKey.json from Firebase Console if needed
echo 3. Run 'firebase login' to authenticate with Firebase
echo 4. Run 'gcloud auth login' to authenticate with Google Cloud
echo 5. Run 'npm run dev' to start the development server
echo.
echo 🔧 Useful commands:
echo - npm run dev          # Start development server
echo - npm run build        # Build for production
echo - npm run test         # Run tests
echo - npm run lint         # Run linting
echo - firebase deploy      # Deploy to Firebase
echo - gcloud functions deploy # Deploy Cloud Functions
echo.
echo [INFO] Happy coding! 🚀
pause 