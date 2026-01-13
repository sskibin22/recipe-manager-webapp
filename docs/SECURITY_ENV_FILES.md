# Environment Files Security Implementation

## Overview

This document describes the security measures implemented to prevent accidental commits of `.env.local` files containing sensitive information.

## Security Layers

### 1. `.gitignore` Protection

**File:** `frontend/.gitignore`

The `.gitignore` file includes patterns that prevent git from tracking environment files:

```gitignore
*.local
.env.local
.env.*.local
```

**Coverage:**
- ✅ `.env.local` - Main local environment file
- ✅ `.env.development.local` - Development-specific overrides
- ✅ `.env.production.local` - Production-specific overrides
- ✅ All other `*.local` files

### 2. Pre-commit Git Hook

**File:** `.githooks/pre-commit`

A pre-commit hook that actively prevents commits containing `.env.local` files.

**Setup:**
```bash
./setup-hooks.sh
```

**Features:**
- Scans staged files for `.env.local` patterns
- Provides clear error messages with remediation steps
- Blocks the commit if sensitive files are detected
- Zero configuration needed after setup

**Testing:**
```bash
# This should be blocked by the hook
echo "TEST=value" > frontend/.env.local
git add -f frontend/.env.local
git commit -m "Test"  # ❌ Will fail with helpful error message
```

### 3. GitHub Actions CI/CD Check

**File:** `.github/workflows/security-check-env-files.yml`

Automated checks that run on every pull request and push to main/develop branches.

**Checks Performed:**
1. **Working Directory Scan**: Verifies no `.env.local` files exist in the repository
2. **Git History Scan**: Warns if `.env.local` files were ever committed
3. **`.gitignore` Validation**: Ensures proper patterns are configured
4. **Template Verification**: Confirms `.env.local.example` exists with placeholders

**Behavior:**
- ❌ **Fails**: If `.env.local` files found in working directory
- ⚠️  **Warns**: If files found in git history (doesn't fail build)
- ✅ **Passes**: When all checks succeed

### 4. Template File

**File:** `frontend/.env.local.example`

A template file with placeholder values that developers should copy and customize.

**Usage:**
```bash
cp frontend/.env.local.example frontend/.env.local
# Edit .env.local with your actual values
```

**Benefits:**
- Provides clear guidance on required environment variables
- Uses placeholder values that are safe to commit
- Includes comments explaining each variable
- Updated to include all current configuration options

## Developer Workflow

### Initial Setup (One-time)

```bash
# 1. Clone the repository
git clone <repo-url>
cd recipe-manager-webapp

# 2. Set up git hooks
./setup-hooks.sh

# 3. Create local environment file
cd frontend
cp .env.local.example .env.local

# 4. Edit with your configuration
nano .env.local  # or your preferred editor
```

### Verification

```bash
# Verify .env.local is ignored
git status  # Should NOT show .env.local

# Test the pre-commit hook (optional)
git add -f frontend/.env.local  # Force add
git commit -m "Test"            # Should be blocked
git reset HEAD frontend/.env.local  # Unstage
```

## What to Do If `.env.local` Is Accidentally Committed

### If Not Yet Pushed

```bash
# Remove from staging
git reset HEAD frontend/.env.local

# Or remove from last commit
git reset --soft HEAD~1
```

### If Already Pushed

```bash
# 1. Remove from tracking
git rm --cached frontend/.env.local

# 2. Commit the removal
git commit -m "Remove .env.local from version control"

# 3. Push the fix
git push

# 4. Consider rotating exposed secrets
# - Firebase keys (if custom secrets were added)
# - Any API keys in the file
# - Database credentials if present

# 5. (Optional) Remove from git history
# Use git-filter-repo or BFG Repo-Cleaner for complete removal
```

## Security Best Practices

### ✅ Do

- Always use `./setup-hooks.sh` after cloning
- Copy `.env.local.example` to create your local config
- Keep `.env.local` in your local environment only
- Use placeholder values in `.env.local.example`
- Review PR checks before merging
- Rotate secrets if they are exposed

### ❌ Don't

- Never commit `.env.local` files
- Don't use `git add -f` for environment files
- Don't share your `.env.local` file
- Don't put real values in `.env.local.example`
- Don't ignore CI security check warnings

## Testing the Security Measures

### Test 1: `.gitignore` Protection

```bash
echo "TEST=value" > frontend/.env.local
git status  # Should NOT show the file
```

**Expected:** File is ignored by git.

### Test 2: Pre-commit Hook

```bash
git add -f frontend/.env.local
git commit -m "Test commit"
```

**Expected:** Commit is blocked with error message.

### Test 3: CI/CD Check

Create a PR that includes a `.env.local` file (using `git add -f`).

**Expected:** GitHub Actions workflow fails with clear error.

## Maintenance

### Updating the Hook

If the pre-commit hook needs updates:

1. Edit `.githooks/pre-commit`
2. Test locally
3. Commit changes
4. Team members run `./setup-hooks.sh` again

### Updating CI/CD Check

Edit `.github/workflows/security-check-env-files.yml` and push to trigger the updated workflow.

### Adding New Environment Files

If new environment files are added (e.g., `.env.test.local`):

1. Add pattern to `frontend/.gitignore`
2. Update pre-commit hook if needed
3. Update CI/CD workflow if needed
4. Create corresponding `.example` file

## Monitoring and Auditing

### Regular Audits

Periodically verify:
- [ ] `.gitignore` is up to date
- [ ] Pre-commit hook is functioning
- [ ] CI/CD checks are passing
- [ ] All developers have hooks configured
- [ ] No `.env.local` files in git history

### GitHub Actions Dashboard

Monitor the "Security Check - Environment Files" workflow in:
- Pull requests (checks tab)
- Actions tab in repository
- Branch protection rules (can be required)

## Support

If you encounter issues:

1. Verify hooks are installed: `git config core.hooksPath`
2. Re-run setup: `./setup-hooks.sh`
3. Check `.gitignore` patterns
4. Review CI/CD workflow logs
5. Consult this document for troubleshooting steps

## Related Documentation

- [README.md](../README.md) - Main project documentation
- [.env.local.example](../frontend/.env.local.example) - Environment template
- [.githooks/pre-commit](../.githooks/pre-commit) - Pre-commit hook script
- [.github/workflows/security-check-env-files.yml](../.github/workflows/security-check-env-files.yml) - CI/CD workflow
