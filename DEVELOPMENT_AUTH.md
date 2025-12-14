# Development Authentication Setup

## Overview

When developing locally, you can bypass Google/Firebase authentication to speed up testing. This authentication bypass is **only available in Development mode** and will not work in production.

## Backend Setup

The backend automatically bypasses authentication when:
1. Running in Development environment (`ASPNETCORE_ENVIRONMENT=Development`)
2. `Development:BypassAuthentication` is set to `true` in `appsettings.Development.json`

### Configuration

In `backend/appsettings.Development.json`:

```json
{
  "Development": {
    "BypassAuthentication": true,
    "TestUser": {
      "AuthSub": "dev-user-001",
      "Email": "dev@localhost.com",
      "DisplayName": "Dev User"
    }
  }
}
```

### How It Works

- **DevelopmentAuthMiddleware** automatically injects a test user's claims into the request pipeline
- The test user is automatically created in the database on first request
- All API endpoints work as if you're authenticated as the test user
- No tokens or Firebase configuration needed

### Disabling Development Auth

Set `BypassAuthentication` to `false` in `appsettings.Development.json` to use real Firebase authentication even in development.

## Frontend Setup

The frontend bypasses authentication when:
1. Running in development mode (`npm run dev`)
2. `VITE_BYPASS_AUTH=true` is set in `.env.local`

### Configuration

In `frontend/.env.local`:

```env
VITE_BYPASS_AUTH=true
```

### How It Works

- AuthContext automatically creates a mock user when bypass is enabled
- No Firebase authentication popup appears
- API calls work as normal (backend handles the authentication)
- You appear as "Dev User" in the application

### Disabling Development Auth

Set `VITE_BYPASS_AUTH=false` or remove the line from `.env.local` to use real Firebase authentication.

## Quick Start

1. **Ensure backend is configured:**
   ```bash
   cd backend
   # Check appsettings.Development.json has BypassAuthentication: true
   ```

2. **Ensure frontend is configured:**
   ```bash
   cd frontend
   # Check .env.local has VITE_BYPASS_AUTH=true
   ```

3. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   dotnet run

   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

4. **Open the app** at http://localhost:5173 - you'll automatically be signed in as "Dev User"

## Production Deployment

⚠️ **Security Note:** The authentication bypass automatically disables itself in production:
- Backend: Only works when `IsDevelopment()` is true
- Frontend: Only works when `import.meta.env.DEV` is true
- Never deployed to production servers

When deploying:
- Backend reads from `appsettings.Production.json` (no bypass config)
- Frontend builds without the bypass code (Vite removes DEV checks)
- Firebase authentication is required

## Testing Real Authentication Locally

To test real Google authentication in development:

1. Set `VITE_BYPASS_AUTH=false` in `frontend/.env.local`
2. Set `BypassAuthentication: false` in `backend/appsettings.Development.json`
3. Restart both servers
4. Use Google sign-in as normal

## Troubleshooting

**Issue:** Still seeing Firebase auth prompts with bypass enabled
- **Solution:** Restart the frontend dev server after changing `.env.local`

**Issue:** API returns 401 Unauthorized
- **Solution:** Check backend `appsettings.Development.json` has `BypassAuthentication: true`

**Issue:** User not showing in database
- **Solution:** Make at least one API request (e.g., create a recipe) to trigger user creation
