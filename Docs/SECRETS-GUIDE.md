# Secret Management Across Multiple Computers

Here are several clever ways to store your API keys and secrets across multiple computers without exposing them to your public GitHub repo:

## 🏆 **Recommended: GitHub Secrets + Codespaces**

### 1. **GitHub Repository Secrets**
- Go to your GitHub repo → Settings → Secrets and variables → Actions
- Add `NUTRITIONIX_APP_ID` and `NUTRITIONIX_APP_KEY`
- These are encrypted and only accessible in GitHub Actions

### 2. **GitHub Codespaces**
- Create a `.devcontainer/devcontainer.json` file
- Use GitHub Codespaces for development
- Secrets are automatically available in the Codespace environment

### 3. **Local Development with GitHub CLI**
```bash
# Install GitHub CLI
brew install gh

# Login and set up secrets
gh auth login
gh secret set NUTRITIONIX_APP_ID --body "131fa0b3"
gh secret set NUTRITIONIX_APP_KEY --body "13e8901407aa8ed57df60306bf558875"
```

## 🔐 **Alternative: Private GitHub Gist**

### 1. **Create Private Gist**
```json
{
  "nutritionix": {
    "appId": "131fa0b3",
    "appKey": "13e8901407aa8ed57df60306bf558875"
  }
}
```

### 2. **Fetch Script**
Use the `fetch-secrets.js` script to pull secrets from your private gist.

### 3. **Setup**
```bash
export GITHUB_TOKEN="your-personal-access-token"
node fetch-secrets.js
```

## 🎯 **Cursor-Specific: Settings Sync**

### 1. **Cursor Settings**
- Cursor syncs settings across computers
- Store encrypted secrets in Cursor's settings
- Use the `setup-secrets.js` script to decrypt

### 2. **Environment Variables**
```bash
export CURSOR_SECRET_KEY="your-encryption-key"
node setup-secrets.js
```

## 🚀 **Quick Setup for Your Current Project**

### Option 1: Simple .env file (for now)
```bash
echo "NUTRITIONIX_APP_ID=131fa0b3" > .env
echo "NUTRITIONIX_APP_KEY=13e8901407aa8ed57df60306bf558875" >> .env
```

### Option 2: Use the updated script
The script now supports both hardcoded values (fallback) and environment variables.

## 🔒 **Security Best Practices**

1. **Never commit secrets to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Rotate keys regularly**
   - Update API keys periodically
   - Use different keys for different environments

3. **Use least privilege**
   - Only grant necessary permissions to API keys
   - Use separate keys for development/production

## 📁 **File Structure**
```
Gordon/
├── .env                    # Local secrets (gitignored)
├── nutritionix-query.cjs   # Main script
├── fetch-secrets.js        # GitHub Gist fetcher
├── setup-secrets.js        # Cursor secrets setup
├── .github/
│   └── workflows/
│       └── secrets.yml     # GitHub Actions example
└── SECRETS-GUIDE.md        # This guide
```

## 🎯 **Recommended Workflow**

1. **For personal projects**: Use GitHub Secrets + Codespaces
2. **For team projects**: Use GitHub Secrets + environment variables
3. **For quick prototyping**: Use .env file (but don't commit it)

The script is now ready to use with your credentials and supports multiple secret management approaches! 