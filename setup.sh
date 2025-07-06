#!/bin/bash

# Gordon Project Setup Script
# This script installs all necessary tools and dependencies for the Gordon project
# Run this script when setting up the project on a new device

set -e  # Exit on any error

echo "🚀 Setting up Gordon project environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos";;
        Linux*)     echo "linux";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

OS=$(detect_os)
print_status "Detected OS: $OS"

# Check if Homebrew is installed (macOS)
if [[ "$OS" == "macos" ]]; then
    if ! command_exists brew; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        print_success "Homebrew installed successfully"
    else
        print_success "Homebrew already installed"
    fi
fi

# Install Node.js
print_status "Checking Node.js installation..."
if ! command_exists node; then
    print_status "Installing Node.js..."
    if [[ "$OS" == "macos" ]]; then
        brew install node@22
        brew link node@22 --force
    elif [[ "$OS" == "linux" ]]; then
        # Install Node.js 22.x on Linux
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        print_error "Please install Node.js 22.x manually for your OS"
        exit 1
    fi
    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js already installed: $NODE_VERSION"
fi

# Install pnpm
print_status "Checking pnpm installation..."
if ! command_exists pnpm; then
    print_status "Installing pnpm..."
    if [[ "$OS" == "macos" ]]; then
        brew install pnpm
    else
        npm install -g pnpm
    fi
    print_success "pnpm installed successfully"
else
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm already installed: $PNPM_VERSION"
fi

# Install Firebase CLI
print_status "Checking Firebase CLI installation..."
if ! command_exists firebase; then
    print_status "Installing Firebase CLI..."
    npm install -g firebase-tools
    print_success "Firebase CLI installed successfully"
else
    FIREBASE_VERSION=$(firebase --version)
    print_success "Firebase CLI already installed: $FIREBASE_VERSION"
fi

# Install Google Cloud CLI
print_status "Checking Google Cloud CLI installation..."
if ! command_exists gcloud; then
    print_status "Installing Google Cloud CLI..."
    if [[ "$OS" == "macos" ]]; then
        # Install via Homebrew
        brew install --cask google-cloud-sdk
    elif [[ "$OS" == "linux" ]]; then
        # Install via official script
        curl https://sdk.cloud.google.com | bash
        exec -l $SHELL
    else
        print_error "Please install Google Cloud CLI manually for your OS"
        print_status "Visit: https://cloud.google.com/sdk/docs/install"
    fi
    print_success "Google Cloud CLI installed successfully"
else
    GCLOUD_VERSION=$(gcloud --version | head -n 1)
    print_success "Google Cloud CLI already installed: $GCLOUD_VERSION"
fi

# Install project dependencies
print_status "Installing project dependencies..."
if [[ -f "package.json" ]]; then
    pnpm install
    print_success "Main project dependencies installed"
else
    print_error "package.json not found in current directory"
    exit 1
fi

# Install functions dependencies
print_status "Installing Firebase Functions dependencies..."
if [[ -d "functions" && -f "functions/package.json" ]]; then
    cd functions
    pnpm install
    cd ..
    print_success "Firebase Functions dependencies installed"
else
    print_warning "Functions directory or package.json not found"
fi

# Check for required environment files
print_status "Checking for required environment files..."
if [[ ! -f ".env" ]]; then
    print_warning ".env file not found"
    print_status "Creating .env template..."
    cat > .env << EOF
# Environment variables for local development
# Copy this file to .env and fill in your actual values

# Groq API Key (for AI suggestions)
GROQ_API_KEY=your_groq_api_key_here

# Firebase config (if needed for local development)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
EOF
    print_success ".env template created"
    print_warning "Please edit .env file with your actual API keys"
fi

# Check for service account key
if [[ ! -f "serviceAccountKey.json" ]]; then
    print_warning "serviceAccountKey.json not found"
    print_status "This file is needed for admin operations and scripts"
    print_status "Download it from Firebase Console > Project Settings > Service Accounts"
fi

# Setup Git hooks (if not already set up)
print_status "Setting up Git hooks..."
if [[ -d ".git" ]]; then
    # Create pre-commit hook if it doesn't exist
    if [[ ! -f ".git/hooks/pre-commit" ]]; then
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to run tests and linting
echo "Running pre-commit checks..."

# Run linting
npm run lint:check
if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix the issues before committing."
    exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
    echo "Type checking failed. Please fix the issues before committing."
    exit 1
fi

# Run tests
npm test -- --run
if [ $? -ne 0 ]; then
    echo "Tests failed. Please fix the issues before committing."
    exit 1
fi

echo "Pre-commit checks passed!"
EOF
        chmod +x .git/hooks/pre-commit
        print_success "Pre-commit hook created"
    else
        print_success "Pre-commit hook already exists"
    fi
else
    print_warning "Not a Git repository. Skipping Git hooks setup."
fi

# Verify installations
print_status "Verifying installations..."
echo ""

echo "📋 Installation Summary:"
echo "========================"

# Check Node.js
if command_exists node; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: Not installed"
fi

# Check pnpm
if command_exists pnpm; then
    echo "✅ pnpm: $(pnpm --version)"
else
    echo "❌ pnpm: Not installed"
fi

# Check Firebase CLI
if command_exists firebase; then
    echo "✅ Firebase CLI: $(firebase --version)"
else
    echo "❌ Firebase CLI: Not installed"
fi

# Check Google Cloud CLI
if command_exists gcloud; then
    echo "✅ Google Cloud CLI: $(gcloud --version | head -n 1)"
else
    echo "❌ Google Cloud CLI: Not installed"
fi

echo ""
print_success "Setup complete! 🎉"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your actual API keys"
echo "2. Download serviceAccountKey.json from Firebase Console if needed"
echo "3. Run 'firebase login' to authenticate with Firebase"
echo "4. Run 'gcloud auth login' to authenticate with Google Cloud"
echo "5. Run 'npm run dev' to start the development server"
echo ""
echo "🔧 Useful commands:"
echo "- npm run dev          # Start development server"
echo "- npm run build        # Build for production"
echo "- npm run test         # Run tests"
echo "- npm run lint         # Run linting"
echo "- firebase deploy      # Deploy to Firebase"
echo "- gcloud functions deploy # Deploy Cloud Functions"
echo ""
print_status "Happy coding! 🚀" 