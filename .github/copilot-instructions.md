# Recipe Manager Web Application - Coding Agent Instructions

## High Level Details

**Repository Purpose**: Recipe Manager is a web application for managing personal recipe collections. Users can save recipes from external links, upload recipe documents, or manually create recipes through a web form. The application includes search, favorites, and authentication via email and third-party providers.

**Project Type**: Full-stack web application (monorepo structure)
- **Backend**: ASP.NET Core 8.0 Minimal API with Entity Framework Core
- **Frontend**: React 18+ SPA with Vite build tooling
- **Database**: SQLite (development), PostgreSQL (production via Neon)
- **Authentication**: Firebase Auth (email magic links, Google, GitHub OAuth)
- **Storage**: Cloudflare R2 (S3-compatible) for uploaded documents
- **Deployment**: Netlify (frontend), Fly.io (backend)

**Tech Stack Summary**:
- Languages: C# (.NET 8), JavaScript/TypeScript (React)
- Frontend: React, Vite, Tailwind CSS, React Router, TanStack Query
- Backend: ASP.NET Core Minimal API, EF Core, JWT Bearer authentication
- Databases: SQLite (dev), PostgreSQL (prod)
- Cloud Services: Firebase Auth, Cloudflare R2, Neon Postgres
- Testing: Playwright (E2E), NUnit (.NET unit tests), Vitest (frontend unit tests)

**Cost Constraint**: All services must use free tiers or be extremely affordable for solo developer use.

## Build Instructions

### Prerequisites
- **.NET SDK 8.0** (verify with `dotnet --version`)
- **Node.js 18+** and **npm 9+** (verify with `node --version` and `npm --version`)
- **Git** for version control
- **Visual Studio Code** recommended

### Backend Setup and Build

**Location**: `/backend` directory

**Initial Setup** (first time only):
```powershell
cd backend
dotnet restore
dotnet tool restore
```

**Database Setup**:
```powershell
# Apply migrations (creates SQLite database in development)
dotnet ef database update
```

**Build**:
```powershell
dotnet build
```

**Run** (development with hot reload):
```powershell
dotnet watch run
```
- Default URL: `https://localhost:5001` and `http://localhost:5000`
- Swagger UI available at: `https://localhost:5001/swagger`

**Test**:
```powershell
dotnet test
```

**Format Code**:
```powershell
dotnet format
```

**Environment Variables** (use `dotnet user-secrets` or `appsettings.Development.json`):
- `ConnectionStrings:DefaultConnection` - Database connection string
- `Firebase:ProjectId` - Firebase project ID for JWT validation
- `Firebase:Audience` - Firebase audience (typically project ID)
- `R2:AccountId` - Cloudflare R2 account ID
- `R2:AccessKeyId` - R2 access key
- `R2:SecretAccessKey` - R2 secret key
- `R2:BucketName` - R2 bucket name

**Important**: ALWAYS run `dotnet restore` after pulling changes that modify `.csproj` files. ALWAYS apply database migrations with `dotnet ef database update` before running the application after schema changes.

### Frontend Setup and Build

**Location**: `/frontend` directory

**Initial Setup** (first time only):
```powershell
cd frontend
npm install
```

**Build** (development with hot reload):
```powershell
npm run dev
```
- Default URL: `http://localhost:5173`
- Vite dev server with HMR

**Build** (production):
```powershell
npm run build
```
- Output: `/frontend/dist` directory

**Preview Production Build**:
```powershell
npm run preview
```

**Test**:
```powershell
npm run test
```

**End-to-End Tests** (Playwright):
```powershell
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode (interactive debugging)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```
- Tests located in `/frontend/e2e` or `/frontend/tests/e2e`
- Playwright config in `playwright.config.js` or `playwright.config.ts`
- Uses Playwright MCP server for browser automation
- Tests run against `http://localhost:5173` (dev server) or production build

**Lint**:
```powershell
npm run lint
```

**Format Code**:
```powershell
npm run format
```

**Environment Variables** (create `.env.local` file in `/frontend`):
- `VITE_API_BASE_URL` - Backend API URL (e.g., `http://localhost:5172`)
- `VITE_BYPASS_AUTH` - Set to `"true"` for development mode auth bypass (required for Playwright tests)
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID

**Important**: ALWAYS run `npm install` after pulling changes that modify `package.json`. Environment variables MUST be prefixed with `VITE_` to be accessible in the frontend code. Run `npx playwright install` after first checkout or Playwright version updates.

### Full Stack Development Workflow

1. **Start Backend**:
   ```powershell
   cd backend
   dotnet watch run
   ```

2. **Start Frontend** (in separate terminal):
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Verify CORS**: Ensure backend `appsettings.Development.json` allows `http://localhost:5173` origin.

4. **Run E2E Tests** (optional, in separate terminal):
   ```powershell
   cd frontend
   npm run test:e2e
   ```

### Common Issues and Workarounds

- **Issue**: EF Core migrations fail with "No database provider configured"
  - **Solution**: Ensure connection string is set in `appsettings.Development.json` or user secrets

- **Issue**: Frontend cannot reach backend API
  - **Solution**: Check CORS configuration in backend; verify `VITE_API_BASE_URL` in frontend `.env.local`

- **Issue**: Vite dev server fails to start on port 5173
  - **Solution**: Port may be in use; Vite will automatically try next available port

- **Issue**: JWT validation fails with 401 Unauthorized
  - **Solution**: Verify Firebase project ID and audience match in backend configuration; check token expiry

- **Issue**: `dotnet run` fails with "Couldn't find a project to run"
  - **Solution**: Use full project path: `dotnet run --project C:\src\Projects\RecipeManager\recipe-manager-webapp\backend\RecipeManager.Api.csproj`
  - **Note**: PowerShell working directory may not persist correctly between terminal commands; always use absolute paths or the `--project` flag

- **Issue**: Hot reload (`dotnet watch`) doesn't pick up configuration changes
  - **Solution**: Some changes (like JSON serialization options, middleware configuration) require full restart. Stop the server and use `dotnet run --project <full-path-to-csproj>` instead of `dotnet watch run`

- **Issue**: "A possible object cycle was detected" JSON serialization error when creating/updating entities
  - **Solution**: Return anonymous DTOs instead of full Entity Framework entities from API endpoints to avoid circular reference issues with navigation properties. Example:
    ```csharp
    return Results.Created($"/api/recipes/{recipe.Id}", new
    {
        recipe.Id,
        recipe.Title,
        recipe.Type,
        // ... other properties (exclude navigation properties)
    });
    ```

- **Issue**: Playwright tests fail to start or browsers not found
  - **Solution**: Run `npx playwright install` to install required browser binaries; ensure both backend and frontend are running for E2E tests

- **Issue**: Playwright tests time out waiting for localhost
  - **Solution**: Verify backend is running on expected port (5000/5001); check `baseURL` in `playwright.config.js` matches actual dev server URL

- **Issue**: Tests fail or behave unexpectedly after making code changes
  - **Solution**: ALWAYS run `dotnet clean` followed by `dotnet build` after making code changes, especially changes to entities, DTOs, or API endpoints. Build artifacts can become stale and cause mysterious test failures
  - **Note**: This is particularly important when:
    - Modifying entity models or adding/removing properties
    - Changing API endpoint signatures or return types
    - Updating middleware or configuration
    - Fixing serialization issues (e.g., circular references)
  - **Best Practice**: Make it a habit to run `dotnet clean; dotnet build` before running tests after any code changes

- **Issue**: SQLite error "no such column" when querying database after pulling changes
  - **Solution**: Database schema is out of sync with the code. Apply pending migrations with `dotnet ef database update --context ApplicationDbContext`
  - **Note**: This happens when entity models have been updated and migrations created but not applied to your local database
  - **Best Practice**: ALWAYS run `dotnet ef database update --context ApplicationDbContext` after pulling changes that include new migration files in `/backend/Migrations/`

## Project Layout

### Repository Structure

```
/
├── .github/
│   ├── instructions/          # Coding agent instructions
│   └── workflows/             # GitHub Actions CI/CD (future)
├── backend/                   # ASP.NET Core API
│   ├── Program.cs            # Application entry point and Minimal API endpoints
│   ├── Models/               # Entity models (User, Recipe, Favorite)
│   ├── Data/                 # EF Core DbContext and migrations
│   ├── Services/             # Business logic (RecipeService, StorageService)
│   ├── Middleware/           # Custom middleware (UserEnsurer)
│   ├── appsettings.json      # Production configuration
│   ├── appsettings.Development.json  # Development configuration
│   └── RecipeManager.Api.csproj      # Project file
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Application entry point
│   │   ├── components/       # React components (RecipeList, RecipeForm, etc.)
│   │   ├── pages/            # Page components (Landing, AuthCallback)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client and Firebase auth
│   │   └── styles/           # Tailwind CSS and global styles
│   ├── e2e/                  # Playwright E2E tests
│   │   ├── auth.spec.js      # Authentication flow tests
│   │   ├── recipes.spec.js   # Recipe CRUD tests
│   │   └── search.spec.js    # Search and favorites tests
│   ├── public/               # Static assets
│   ├── index.html            # HTML entry point
│   ├── vite.config.js        # Vite configuration
│   ├── playwright.config.js  # Playwright E2E test configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── package.json          # Node dependencies and scripts
│   └── .env.local            # Local environment variables (not committed)
├── README.md                 # Project documentation
└── plan-recipeManager.prompt.md  # Original development plan
```

### Backend Architecture

**Database Schema**:
- `User` table: `Id` (GUID, PK), `AuthSub` (string, unique), `Email`, `DisplayName`, `CreatedAt`
- `Recipe` table: `Id` (GUID, PK), `UserId` (FK), `Title`, `Type` (enum: Link/Document/Manual), `Url`, `StorageKey`, `Content`, `CreatedAt`, `UpdatedAt`
- `Favorite` table: Composite PK `(UserId, RecipeId)`, `CreatedAt`

**API Endpoints**:
- `GET /health` - Health check (unauthenticated)
- `POST /api/recipes` - Create recipe (requires auth)
- `GET /api/recipes` - List user recipes with optional `?q=searchTerm` (requires auth)
- `GET /api/recipes/{id}` - Get single recipe (requires auth, ownership check)
- `PUT /api/recipes/{id}` - Update recipe (requires auth, ownership check)
- `DELETE /api/recipes/{id}` - Delete recipe (requires auth, ownership check)
- `POST /api/recipes/{id}/favorite` - Add to favorites (requires auth)
- `DELETE /api/recipes/{id}/favorite` - Remove from favorites (requires auth)
- `POST /api/uploads/presign` - Get presigned upload URL for R2 (requires auth)
- `GET /api/uploads/presign-download?recipeId={id}` - Get presigned download URL (requires auth)

**Authentication Flow**:
1. Frontend authenticates user via Firebase SDK (email magic link, Google, or GitHub)
2. Frontend obtains Firebase ID token
3. Frontend includes token in `Authorization: Bearer <token>` header
4. Backend validates token via Firebase JWKS (`https://securetoken.google.com/{projectId}`)
5. Custom middleware ensures `User` record exists for `sub` claim on first request
6. Endpoints use `[Authorize]` attribute or manual JWT validation

**Key Configuration Files**:
- `appsettings.json` - Production settings (no secrets)
- `appsettings.Development.json` - Development settings (CORS, logging)
- User secrets (managed via `dotnet user-secrets`) - Sensitive keys
- `Program.cs` - Service registration, middleware pipeline, endpoint definitions

### Frontend Architecture

**Routing** (React Router):
- `/` - Landing page (recipe list, search, add recipe)
- `/auth/callback` - OAuth callback handler
- `/recipe/:id` - Recipe detail view

**State Management**:
- **Server State**: TanStack Query for recipes, favorites (caching, refetching)
- **Auth State**: Firebase SDK context provider
- **Local State**: React `useState` for forms, UI toggles

**Key Components**:
- `RecipeList` - Display recipes with search and favorite toggle
- `RecipeForm` - Modal/form for adding recipes (link, upload, manual)
- `RecipeCard` - Individual recipe display
- `AuthButton` - Login/logout with Firebase UI
- `UploadManager` - Handles presigned URL flow for document uploads

**API Client**:
- Axios or fetch wrapper in `/services/api.js`
- Automatically attaches Firebase ID token to requests
- Base URL from `VITE_API_BASE_URL` environment variable

**Styling**:
- Tailwind CSS utility classes
- Minimal custom CSS in `/styles`
- Responsive design (mobile-first)

### CI/CD and Validation

**Pre-commit Checks** (future):
- Backend: `dotnet build`, `dotnet test`, `dotnet format --verify-no-changes`
- Frontend: `npm run build`, `npm run lint`, `npm run test`
- E2E: `npm run test:e2e` (Playwright tests against running stack)

**Deployment Pipelines** (future):
- **Frontend**: Netlify auto-deploy from `main` branch (`/frontend` directory)
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Environment variables set in Netlify dashboard
- **Backend**: Fly.io auto-deploy from `main` branch
  - Deploy command: `flyctl deploy`
  - Environment variables set via `flyctl secrets set`

**Playwright MCP Server Integration**:
- Playwright MCP server provides browser automation capabilities for E2E testing
- Tests use headless browser by default (can run headed with `--headed` flag)
- Playwright automatically handles browser downloads and updates
- Tests can be debugged interactively using `npm run test:e2e:ui`
- CI/CD pipelines should run Playwright tests with full stack deployed

### Validation Steps for Changes

**CRITICAL**: After making ANY changes to the codebase, ALWAYS run and verify that all unit tests pass before considering the work complete. This is a mandatory step for all code changes.

1. **Backend Changes**:
   - Run `dotnet build` - must succeed
   - **Run `dotnet test` - ALL tests MUST pass (mandatory for every backend change)**
   - Run `dotnet format --verify-no-changes` - no formatting issues
   - If schema changed, create migration: `dotnet ef migrations add <MigrationName>`
   - Test endpoints via Swagger UI or VS Code REST Client

2. **Frontend Changes**:
   - Run `npm run build` - must succeed
   - Run `npm run lint` - no linting errors
   - **Run `npm run test` - ALL unit tests MUST pass (mandatory for every frontend change)**
   - Run `npm run test:e2e` - E2E tests pass (requires backend running)
   - Verify in browser at `http://localhost:5173`
   - Test auth flow, recipe CRUD, search, favorites

3. **Full Integration Test**:
   - Start backend (`dotnet watch run`)
   - Start frontend (`npm run dev`)
   - Run E2E tests (`npm run test:e2e`)
   - Test complete user flows: sign in, add recipe (all 3 types), search, favorite, delete
   - Verify Playwright tests cover critical paths: authentication, recipe creation (link/upload/manual), search, favorites toggle

### Dependencies and Non-Obvious Relationships

- Backend depends on Firebase for JWT validation (requires Firebase project setup)
- Frontend depends on backend API availability (check CORS configuration)
- Backend depends on Cloudflare R2 for document storage (requires bucket setup)
- Production backend depends on Neon Postgres (requires database provisioning)
- Frontend depends on environment variables at build time (Vite inlines them)

### Key Files to Review

**Backend Entry Point** (`/backend/Program.cs`):
- Configures services: EF Core, JWT authentication, CORS, Swagger
- Defines middleware pipeline: auth, user ensurer, exception handling
- Maps all Minimal API endpoints

**Frontend Entry Point** (`/frontend/src/main.jsx`):
- Initializes React app
- Sets up Firebase SDK
- Wraps app with providers (Router, Query, Auth)

**Playwright Test Configuration** (`/frontend/playwright.config.js`):
- Defines base URL, browser configurations, and test settings
- Configures test timeouts and retries
- Sets up web server options for local testing
- Specifies browser types (Chromium, Firefox, WebKit)

**Database Context** (`/backend/Data/ApplicationDbContext.cs`):
- Defines entity models and relationships
- Configures indexes, constraints, and conventions

## Instructions for Coding Agent

**Trust these instructions**: Only perform searches if information here is incomplete or found to be incorrect. The instructions above provide validated commands and architecture details.

**When implementing features**:
1. Start with backend models and migrations
2. Add corresponding API endpoints in `Program.cs`
3. Test endpoints via Swagger before moving to frontend
4. Create frontend components and integrate with TanStack Query
5. Write Playwright E2E tests for critical user flows
6. Test full flow in browser and via automated tests

**Always**:
- Run `dotnet restore` after modifying `.csproj`
- Run `npm install` after modifying `package.json`
- Run `npx playwright install` after Playwright version updates
- **Apply migrations with `dotnet ef database update --context ApplicationDbContext` after creating them OR after pulling changes that include new migration files**
- Run `dotnet ef database update --context ApplicationDbContext` immediately after pulling changes if you see new files in `/backend/Migrations/` to avoid "no such column" errors
- Verify CORS allows frontend origin during local development
- Check environment variables are set correctly for both backend and frontend
- Use `dotnet format` for backend code formatting
- Use `npm run lint` for frontend code linting
- **Run `dotnet test` in `/backend` directory after ANY backend code changes to verify all unit tests pass**
- **Run `npm run test` in `/frontend` directory after ANY frontend code changes to verify all unit tests pass**
- Run `npm run test:e2e` to validate E2E flows after significant changes

**Playwright E2E Testing Guidelines**:
- Use Playwright MCP server for all browser automation testing
- Write E2E tests for critical user journeys: authentication, recipe CRUD, search, favorites
- Test files located in `/frontend/tests/e2e/` directory (NOT `/frontend/e2e/`)
- Use descriptive test names: `test('user can add recipe via external link', ...)`
- Ensure backend is running before executing E2E tests
- Use page object model pattern for maintainable tests
- Set appropriate timeouts for async operations (Firebase auth, API calls)
- Clean up test data after test runs (delete created recipes)
- Run E2E tests in CI/CD before deployment

**CRITICAL: Playwright Testing Setup for Copilot Agents** ⚠️
When running Playwright tests, you MUST follow these steps in order to avoid repeated failures:

1. **Enable Development Authentication Bypass**:
   - BEFORE running tests, set `VITE_BYPASS_AUTH=true` in `/frontend/.env.local`
   - This is REQUIRED because Playwright tests cannot handle Firebase authentication flows
   - Without this, tests will fail because they cannot log in
   - After changing `.env.local`, you MUST restart the frontend dev server for changes to take effect

2. **Start Backend with SQLite and Auth Bypass**:
   ```powershell
   cd backend
   dotnet run --project C:\src\Projects\RecipeManager\recipe-manager-webapp\backend\RecipeManager.Api.csproj
   ```
   - Backend MUST be running on `http://localhost:5172` (or update frontend `.env.local` to match)
   - Backend automatically uses SQLite in development mode
   - Backend automatically bypasses JWT validation when `Development:BypassAuthentication: true` in `appsettings.Development.json`
   - Use FULL PROJECT PATH with `--project` flag to avoid "Couldn't find a project to run" errors
   - Let backend run in background terminal

3. **Start Frontend Dev Server**:
   ```powershell
   Set-Location -Path "C:\src\Projects\RecipeManager\recipe-manager-webapp\frontend"
   npm run dev
   ```
   - Frontend MUST be running on `http://localhost:5173` before tests run
   - Vite dev server will use the `VITE_BYPASS_AUTH=true` setting from `.env.local`
   - Verify the app shows "Dev User" logged in when you visit `http://localhost:5173`
   - Let frontend run in background terminal
   - Use `Set-Location -Path` with absolute path to ensure correct directory

4. **Run Playwright Tests**:
   ```powershell
   Set-Location -Path "C:\src\Projects\RecipeManager\recipe-manager-webapp\frontend"
   npx playwright test --workers=1
   ```
   - Use `--workers=1` to avoid conflicts with shared SQLite database
   - Tests will automatically use the running frontend server (configured in `playwright.config.js`)
   - Playwright config has `webServer.reuseExistingServer: true` so it won't start a new server
   - Use absolute path with `Set-Location` to ensure correct directory

5. **Verify Tests Are Running Correctly**:
   - Tests should show "Dev User" logged in (not authentication forms)
   - Most tests (48+) should pass; a few may fail due to test logic issues (not auth issues)
   - If tests fail with "authentication form not found" errors, it means `VITE_BYPASS_AUTH` is not set correctly
   - If tests timeout or cannot connect, verify both backend and frontend are running

6. **Common Playwright Test Failures and Solutions**:
   - **"authentication form when not logged in" test fails**: This is EXPECTED with auth bypass enabled (test expects no auth)
   - **"strict mode violation" errors**: Tests need to use more specific locators (e.g., use `first()` or filter by role)
   - **Timeout errors**: Increase timeout or ensure backend/frontend are responding quickly
   - **Connection refused errors**: Verify backend is running on expected port and frontend `.env.local` has correct `VITE_API_BASE_URL`

7. **Taking Screenshots During Tests**:
   - Playwright automatically captures screenshots on test failures
   - Screenshots saved to `/frontend/test-results/` directory
   - Use Playwright MCP browser tools to manually take screenshots for verification
   - Verify screenshots show the app in logged-in state with "Dev User" visible

8. **Environment Variables Checklist**:
   - `/frontend/.env.local`: `VITE_BYPASS_AUTH=true` ✅
   - `/frontend/.env.local`: `VITE_API_BASE_URL=http://localhost:5172` ✅
   - `/backend/appsettings.Development.json`: `Development.BypassAuthentication: true` ✅
   - `/backend/appsettings.Development.json`: `ConnectionStrings.DefaultConnection: "Data Source=recipemanager.db"` ✅

**Summary for Copilot Agents**:
The #1 reason Playwright tests fail is **not enabling VITE_BYPASS_AUTH=true** in the frontend .env.local file. ALWAYS check this first when tests fail with authentication-related errors. Tests cannot log in via Firebase, so development mode auth bypass MUST be enabled.

**Cost Awareness**:
- Keep document uploads under 10MB (R2 free tier consideration)
- Use pagination for recipe lists (database performance)
- Implement connection pooling for Neon Postgres (connection limits)
- Monitor Firebase Auth usage (stay within free MAU limits)
