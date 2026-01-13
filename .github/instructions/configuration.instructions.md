---
applyTo: "**/appsettings*.json,**/.env*,**/package.json,**/*.csproj,**/vite.config.*,**/playwright.config.*,**/tailwind.config.*"
---

# Configuration Files Instructions

## Backend Configuration Files

### appsettings.json (Production)
- **NEVER** commit secrets or sensitive data
- Contains production configuration
- Connection strings should use environment variables
- CORS origins should be production domains only

### appsettings.Development.json (Development)
- Contains development-specific settings
- CORS allows `http://localhost:5173` for frontend
- May contain local database connection string
- Should have `Development.BypassAuthentication: true` for testing

### User Secrets (Sensitive Data)
Manage with `dotnet user-secrets`:
```bash
# Set secret
dotnet user-secrets set "Firebase:ProjectId" "your-project-id"

# List secrets
dotnet user-secrets list

# Remove secret
dotnet user-secrets remove "Firebase:ProjectId"
```

Never commit to appsettings.json:
- Firebase credentials
- R2 access keys
- Database passwords
- API keys

### RecipeManager.Api.csproj
- **ALWAYS** run `dotnet restore` after modifying
- Contains package references
- Defines target framework (.NET 8.0)
- Includes EF Core tools reference

## Frontend Configuration Files

### package.json
- **ALWAYS** run `npm install` after modifying
- Contains npm scripts:
  - `dev` - Start dev server
  - `build` - Production build
  - `test` - Run Vitest unit tests
  - `test:e2e` - Run Playwright E2E tests
  - `lint` - Run ESLint
- Contains dependencies (React, TanStack Query, etc.)

### .env.local (Frontend Environment Variables)
**CRITICAL**: All variables MUST be prefixed with `VITE_`

Required variables:
```bash
VITE_API_BASE_URL=http://localhost:5172
VITE_BYPASS_AUTH=true  # Required for Playwright tests
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
```

**CRITICAL**: Restart dev server after changing `.env.local` for changes to take effect!

### vite.config.js
- Configures Vite build tool
- Sets up dev server port (default: 5173)
- Configures proxy settings
- Sets up build output directory

### playwright.config.js
- Configures Playwright E2E tests
- Sets base URL: `http://localhost:5173`
- Configures `webServer.reuseExistingServer: true`
- Defines browser types (Chromium, Firefox, WebKit)
- Sets test timeouts and retries

### tailwind.config.js
- Configures Tailwind CSS
- Defines theme extensions
- Sets up content paths for purging
- Configures plugins

## CORS Configuration

### Backend CORS Setup (appsettings.Development.json)
```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

### Common CORS Issues
- **Frontend cannot reach API**: Verify frontend origin in CORS config
- **Production CORS errors**: Add production frontend URL to allowed origins
- **Credentials not included**: Use `credentials: 'include'` in frontend fetch

## Environment Variable Best Practices

### Backend
- Use user secrets for development
- Use environment variables in production (Fly.io secrets)
- Never commit secrets to git
- Document required variables in README

### Frontend
- Prefix with `VITE_` for Vite to expose them
- Never commit `.env.local` to git
- Document required variables in README
- Restart dev server after changes

## Critical Rules
- **NEVER** commit `.env.local` or `.env` files
- **NEVER** commit secrets in `appsettings.json`
- **ALWAYS** restart services after config changes
- **ALWAYS** run `dotnet restore` after `.csproj` changes
- **ALWAYS** run `npm install` after `package.json` changes
- **ALWAYS** document new environment variables in README
