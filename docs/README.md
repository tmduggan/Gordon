# Gordon App Documentation

This directory contains focused documentation files that help prevent common development issues and maintain consistency across the codebase.

## 🚀 Quick Setup

**New to the project?** Start with the [Setup Guide](../SETUP.md) to install all necessary tools and dependencies.

## 📚 Documentation Structure

### SETUP.md
**Complete project setup and installation guide**
- Automated setup scripts for macOS/Linux and Windows
- Manual installation instructions
- Environment configuration
- Common issues and troubleshooting

**When to reference**: When setting up the project on a new device or encountering setup issues

### 01-patterns.md
**Established patterns and conventions**
- Directory structure patterns
- Naming conventions
- Architecture patterns
- Component patterns
- Database structure patterns

**When to reference**: Before creating new components, services, or hooks

### 02-common-bugs.md
**Known issues and their solutions**
- Critical Firebase Cloud Functions v2 issues
- Common architectural violations
- Prevention tips and debugging checklist

**When to reference**: When encountering errors or before making changes

### 03-copy-patterns.md
**How to duplicate features correctly**
- Step-by-step duplication process
- Common mistakes to avoid
- Specific scenarios (AI features, database operations)

**When to reference**: When duplicating existing features

### 04-integration-patterns.md
**How different parts connect**
- Data flow architecture
- Component integration patterns
- Firebase and external API integration
- State management patterns

**When to reference**: When understanding how features connect or adding new integrations

### 05-testing-strategy.md
**Comprehensive testing strategy and quick test guide**
- Test categories and priorities
- Running tests and test organization
- Mocking strategy and test data management
- Coverage goals and maintenance

**When to reference**: When writing tests or setting up testing infrastructure

### 06-deployment-guide.md
**Deployment instructions and API key configuration**
- Firebase deployment workflow
- Cloud Functions v2 API key setup
- Deployment checklist and troubleshooting
- Environment-specific deployments

**When to reference**: When deploying to Firebase or configuring API keys

### 07-gamification-patterns.md
**Gamification patterns, UI components, and scoring logic**
- Frameworks and component libraries
- Gamified UI components
- Advanced scoring logic with abuse prevention
- Future-proof enhancements

**When to reference**: When implementing gamification features or scoring systems

## 🎯 How to Use These Files

### For Cursor/Development
When asking for help or making changes, reference these files:

```bash
# Example: "When duplicating Suggest Meal to Suggest Snack, follow docs/03-copy-patterns.md"
# Example: "Check docs/02-common-bugs.md for Firebase Cloud Functions v2 API key setup"
# Example: "Follow the patterns in docs/01-patterns.md for naming conventions"
# Example: "Use docs/05-testing-strategy.md for test implementation"
# Example: "Follow docs/06-deployment-guide.md for Firebase deployment"
# Example: "Reference docs/07-gamification-patterns.md for scoring logic"
```

### Quick Reference Commands
```bash
# Open all docs in your editor
code docs/

# Search across all docs
grep -r "Firebase Cloud Functions" docs/

# Find specific patterns
grep -r "naming convention" docs/
```

## 🔄 Maintenance

These files should be updated when:
- New patterns are established
- New common bugs are discovered
- Architecture changes are made
- New integration patterns emerge

## 📋 Quick Checklist

Before making changes, check:
- [ ] `01-patterns.md` for naming and structure conventions
- [ ] `02-common-bugs.md` for known issues to avoid
- [ ] `03-copy-patterns.md` if duplicating features
- [ ] `04-integration-patterns.md` if adding new integrations
- [ ] `05-testing-strategy.md` if writing tests
- [ ] `06-deployment-guide.md` if deploying changes
- [ ] `07-gamification-patterns.md` if implementing gamification 