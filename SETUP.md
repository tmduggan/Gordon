# Gordon Project Setup Guide

This guide will help you set up the Gordon project on any device, ensuring all necessary tools and dependencies are installed.

## Quick Start

### For macOS/Linux Users
```bash
# Clone the repository
git clone <your-repo-url>
cd Gordon

# Run the setup script
./setup.sh
```

### For Windows Users
```cmd
# Clone the repository
git clone <your-repo-url>
cd Gordon

# Run the setup script
setup.bat
```

## What the Setup Scripts Do

The setup scripts automatically install and configure:

### Core Tools
- **Node.js 22.x** - JavaScript runtime (required for functions)
- **pnpm** - Fast, disk space efficient package manager
- **Firebase CLI** - Firebase project management and deployment
- **Google Cloud CLI (gcloud)** - Google Cloud services management

### Project Dependencies
- Installs all npm packages from `package.json`
- Installs Firebase Functions dependencies from `functions/package.json`
- Sets up Git pre-commit hooks for code quality

### Environment Configuration
- Creates `.env` template file with required environment variables
- Checks for required service account files
- Provides guidance for missing configurations

## Manual Installation (if scripts don't work)

### 1. Install Node.js
- **macOS**: `brew install node@22`
- **Linux**: Follow instructions at https://nodejs.org/
- **Windows**: Download from https://nodejs.org/

### 2. Install pnpm
```bash
npm install -g pnpm
```

### 3. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 4. Install Google Cloud CLI
- **macOS**: `brew install --cask google-cloud-sdk`
- **Linux**: `curl https://sdk.cloud.google.com | bash`
- **Windows**: Download from https://cloud.google.com/sdk/docs/install

### 5. Install Project Dependencies
```bash
# Main project
pnpm install

# Firebase Functions
cd functions
pnpm install
cd ..
```

## Required Environment Variables

Create a `.env` file in the project root with:

```bash
# Groq API Key (for AI suggestions)
GROQ_API_KEY=your_groq_api_key_here

# Firebase config (if needed for local development)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Required Service Account Files

### serviceAccountKey.json
Download from Firebase Console:
1. Go to Project Settings
2. Service Accounts tab
3. Generate new private key
4. Save as `serviceAccountKey.json` in project root

This file is needed for:
- Admin operations in scripts
- Firebase Functions deployment
- Database management

## Authentication Setup

After installation, authenticate with Google services:

```bash
# Firebase authentication
firebase login

# Google Cloud authentication
gcloud auth login
```

## Verification

Run the setup script to verify all installations:

```bash
# macOS/Linux
./setup.sh

# Windows
setup.bat
```

You should see a summary like:
```
📋 Installation Summary:
========================
✅ Node.js: v22.x.x
✅ pnpm: x.x.x
✅ Firebase CLI: x.x.x
✅ Google Cloud CLI: x.x.x
```

## Common Issues

### Node.js Version Mismatch
- Functions require Node.js 22.x
- Main project requires Node.js >=18
- Use `nvm` or `n` to manage multiple Node.js versions

### Permission Errors
- On macOS/Linux, you may need `sudo` for global installations
- On Windows, run Command Prompt as Administrator

### Firebase CLI Not Found
- Ensure `npm install -g firebase-tools` completed successfully
- Restart your terminal after installation
- Check your PATH environment variable

### Google Cloud CLI Issues
- Follow the official installation guide for your OS
- Ensure you have proper permissions for the installation directory
- Restart your terminal after installation

## Development Workflow

After setup, use these commands:

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting
```

## Project Structure

```
Gordon/
├── setup.sh              # macOS/Linux setup script
├── setup.bat             # Windows setup script
├── SETUP.md              # This file
├── package.json          # Main project dependencies
├── functions/
│   └── package.json      # Firebase Functions dependencies
├── src/                  # React application source
├── .env                  # Environment variables (created by setup)
└── serviceAccountKey.json # Firebase service account (manual download)
```

## Support

If you encounter issues:

1. Check the [Common Issues](#common-issues) section
2. Verify all tools are properly installed
3. Ensure environment variables are set correctly
4. Check Firebase Console for project configuration
5. Review the [deployment guide](docs/06-deployment-guide.md)

## Next Steps

After successful setup:

1. Edit `.env` file with your actual API keys
2. Download `serviceAccountKey.json` from Firebase Console
3. Run `firebase login` and `gcloud auth login`
4. Start development with `npm run dev`
5. Review the [deployment guide](docs/06-deployment-guide.md) for deployment instructions 