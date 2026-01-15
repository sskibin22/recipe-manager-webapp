# Recipe Manager Web Application

A full-stack web application for managing personal recipe collections. Users can save recipes from external links, upload recipe documents, or manually create recipes. Recipes can also be favorited and organized.

## Tech Stack

### Backend
- **ASP.NET Core 8.0** - Minimal API
- **Entity Framework Core** - ORM with SQLite (dev) and PostgreSQL (prod)
- **Firebase Auth** - JWT authentication
- **Cloudflare R2** - Object storage (S3-compatible)

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Server state management
- **Firebase SDK** - Authentication
- **Axios** - HTTP client

### Testing
- **NUnit** - Backend unit tests
- **Vitest** - Frontend unit tests
- **Playwright** - E2E tests

## Prerequisites

- **.NET SDK 8.0** or higher
- **Node.js 18+** and npm
- **Git**
- **Firebase Project** (for authentication)
- **Cloudflare R2 Account** (for file uploads)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd recipe-manager-webapp

# Set up git hooks (recommended for security)
./setup-hooks.sh
```

**Note:** The setup script configures git hooks that prevent accidental commits of `.env.local` files containing sensitive information.

### 2. Backend Setup

```bash
cd backend

# Restore dependencies
dotnet restore

# Update appsettings.Development.json with your configuration
# or use user secrets (recommended):
dotnet user-secrets set "Firebase:ProjectId" "your-firebase-project-id"
dotnet user-secrets set "Firebase:Audience" "your-firebase-project-id"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Data Source=recipemanager.db"

# Create database
dotnet ef database update

# Run the backend
dotnet watch run
```

The backend API will be available at `https://localhost:5001` and `http://localhost:5000`.
Swagger UI: `https://localhost:5001/swagger`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file (copy from .env.local.example)
cp .env.local.example .env.local

# Edit .env.local with your configuration:
# VITE_API_BASE_URL=http://localhost:5000
# VITE_FIREBASE_API_KEY=your-api-key
# VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=your-project-id

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## GitHub Copilot Instructions

This repository includes comprehensive instructions for GitHub Copilot to help with code understanding and generation:

- **Repository-wide instructions**: `.github/copilot-instructions.md` - Comprehensive guide covering build instructions, project layout, coding standards, and best practices
- **Path-specific instructions**: Located in `.github/instructions/` directory:
  - `backend-api.instructions.md` - Backend C# API patterns and rules
  - `backend-tests.instructions.md` - Backend testing guidelines
  - `frontend-react.instructions.md` - Frontend React patterns and state management
  - `frontend-tests.instructions.md` - Frontend testing with Vitest and Playwright
  - `database-migrations.instructions.md` - EF Core migrations and database operations
  - `configuration.instructions.md` - Configuration file management

These instructions help Copilot:
- Understand the project structure and architecture
- Follow established coding patterns and best practices
- Generate code that passes CI/CD checks
- Properly handle build and test commands
- Make minimal, surgical changes

For more information on using Copilot instructions, see [GitHub's custom instructions documentation](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot).

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - **Enable Email/Password** - This allows users to sign up with email and password
   - Enable Google provider (optional)
   - Enable GitHub provider (optional)
4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Under "Your apps", add a web app
   - Copy the config values to your `.env.local`

### Email/Password Authentication
The app now supports traditional email/password sign-in alongside Google OAuth:
- Users can create an account with email and password
- Users can sign in with their email and password
- Passwords must be at least 6 characters
- Firebase handles password hashing and security

## Cloudflare R2 Setup (Optional for File Uploads)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create a bucket (e.g., "recipe-uploads")
4. Generate API credentials
5. Add credentials to backend configuration:
   ```bash
   dotnet user-secrets set "R2:AccountId" "your-account-id"
   dotnet user-secrets set "R2:AccessKeyId" "your-access-key"
   dotnet user-secrets set "R2:SecretAccessKey" "your-secret-key"
   dotnet user-secrets set "R2:BucketName" "recipe-uploads"
   ```

## Development Workflow

### Running Both Services

**Terminal 1 - Backend:**
```bash
cd backend
dotnet watch run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Running Tests

**Backend Tests:**
```bash
cd backend
dotnet test
```

**Frontend Unit Tests:**
```bash
cd frontend
npm run test
```

**E2E Tests:**
```bash
cd frontend
npx playwright install  # First time only
npm run test:e2e
```

## Project Structure

```
recipe-manager-webapp/
├── backend/
│   ├── Data/               # EF Core DbContext and migrations
│   ├── Models/             # Entity models (User, Recipe, Favorite)
│   ├── Services/           # Business logic services
│   ├── Middleware/         # Custom middleware
│   ├── Program.cs          # Application entry point
│   └── appsettings.json    # Configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.jsx         # Main app component
│   ├── public/             # Static assets
│   └── index.html          # HTML entry point
│
└── README.md
```

## API Endpoints

### Authentication
All endpoints except `/health` require a valid Firebase JWT token in the `Authorization` header.

### Recipes
- `GET /api/recipes` - List user's recipes
  - Query parameters:
    - `?q=search` - Search by title
    - `?category=1` - Filter by category ID
    - `?tags=1,2,3` - Filter by tag IDs (AND logic)
    - `?favoritesOnly=true` - Show only favorited recipes
- `GET /api/recipes/{id}` - Get single recipe
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/{id}` - Update recipe
- `DELETE /api/recipes/{id}` - Delete recipe

### Favorites
- `POST /api/recipes/{id}/favorite` - Add to favorites
- `DELETE /api/recipes/{id}/favorite` - Remove from favorites

### Collections
- `GET /api/collections` - List user's collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/{id}` - Get collection details
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection
- `GET /api/collections/{id}/recipes` - Get all recipes in collection
- `POST /api/collections/{id}/recipes/{recipeId}` - Add recipe to collection
- `DELETE /api/collections/{id}/recipes/{recipeId}` - Remove recipe from collection

### Categories
- `GET /api/categories` - List all categories

### Tags
- `GET /api/tags` - List all tags

### Uploads
- `POST /api/uploads/presign` - Get presigned upload URL
- `GET /api/uploads/presign-download?recipeId={id}` - Get presigned download URL

## Features

- ✅ User authentication (Email/Password, Google OAuth, GitHub OAuth)
- ✅ User registration with email and password
- ✅ Create recipes from external links with metadata extraction
- ✅ Upload recipe documents (PDF, images)
- ✅ Manually create recipes with rich content
- ✅ Search recipes by title
- ✅ Filter recipes by category and tags
- ✅ Mark recipes as favorites
- ✅ **Favorites-only view** - Toggle to show only favorited recipes
- ✅ **Recipe collections** - Organize recipes into named collections
- ✅ Category and tag management
- ✅ Recipe preview images
- ✅ Responsive design with Tailwind CSS
- ✅ Real-time auth state management
- ✅ Secure file uploads to R2
- ✅ Development authentication bypass for local testing

## Troubleshooting

### Backend Issues

**Issue:** EF Core migrations fail
- **Solution:** Ensure connection string is set and dotnet-ef tools are installed:
  ```bash
  dotnet tool install --global dotnet-ef
  ```
  If the global tool installation fails, you can add the tool as a local package:
  ```bash
  cd backend
  dotnet tool install dotnet-ef
  ```
  Then run migrations with:
  ```bash
  dotnet dotnet-ef migrations add InitialCreate
  dotnet dotnet-ef database update
  ```

**Issue:** Firebase authentication fails
- **Solution:** Verify Firebase project ID and audience match in appsettings

### Frontend Issues

**Issue:** Firebase initialization error
- **Solution:** Check that all VITE_FIREBASE_* environment variables are set correctly

**Issue:** CORS errors
- **Solution:** Ensure backend `appsettings.Development.json` includes your frontend URL in CORS allowed origins

## Security Best Practices

### 🔒 Protecting Sensitive Information

This project includes multiple layers of protection to prevent accidental exposure of sensitive configuration:

#### Environment Files Protection

**Never commit `.env.local` files!** These files contain environment-specific configurations and may include sensitive information.

**Safeguards in place:**
1. **`.gitignore`**: The `frontend/.gitignore` includes patterns that ignore `.env.local` and `.env.*.local` files
2. **Pre-commit Hook**: Run `./setup-hooks.sh` to install a git hook that prevents committing `.env.local` files
3. **CI/CD Checks**: GitHub Actions automatically verify no `.env.local` files are committed
4. **Template File**: Use `frontend/.env.local.example` as a template with placeholder values

#### Setting Up Environment Files Securely

```bash
# 1. Copy the example file
cd frontend
cp .env.local.example .env.local

# 2. Edit with your actual values (never commit this file!)
nano .env.local  # or use your preferred editor

# 3. Verify .env.local is ignored by git
git status  # Should NOT show .env.local
```

#### What to Do If You Accidentally Commit `.env.local`

If you accidentally commit a `.env.local` file:

```bash
# 1. Remove from git tracking (keeps local file)
git rm --cached frontend/.env.local

# 2. Commit the removal
git commit -m "Remove .env.local from version control"

# 3. If the file was pushed to remote, consider:
#    - Rotating any exposed secrets (Firebase keys, API keys, etc.)
#    - Using git-filter-repo or BFG Repo-Cleaner to remove from history
```

#### Backend Secrets Management

For backend secrets, use **dotnet user-secrets** (never commit to `appsettings.json`):

```bash
dotnet user-secrets set "Firebase:ProjectId" "your-project-id"
dotnet user-secrets set "R2:SecretAccessKey" "your-secret-key"
```

In production, use environment variables or secure secret management services.

#### Additional Security Tips

- **Regular Audits**: Periodically review `.gitignore` to ensure it's up to date
- **Code Reviews**: Always review changes before committing to catch sensitive data
- **Rotate Secrets**: If secrets are exposed, rotate them immediately
- **Use `.example` Files**: Always provide `.example` files with placeholder values for team members
- **Monitor CI/CD**: Pay attention to security check warnings in pull requests

#### Host Header Security

The application includes protection against host header injection attacks through the `AllowedHosts` configuration:

- **Development**: Defaults to `"*"` (any host) for flexibility
- **Production**: Should be set to specific domains via `ALLOWED_HOSTS` environment variable

For detailed information about configuring AllowedHosts for production deployments, see:
- **[AllowedHosts Security Guide](./docs/ALLOWED_HOSTS_SECURITY.md)** - Comprehensive security documentation

**Quick setup for production:**
```bash
# Fly.io deployment
fly secrets set ALLOWED_HOSTS="your-app.fly.dev"

# Multiple domains (semicolon-separated)
fly secrets set ALLOWED_HOSTS="your-app.fly.dev;api.yourdomain.com"
```

## Production Deployment

Ready to deploy your Recipe Manager to production? Follow our comprehensive deployment guides:

### 📚 Deployment Documentation

- **[Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Complete step-by-step instructions for deploying to production, including:
  - Firebase authentication setup
  - Neon PostgreSQL database configuration
  - Cloudflare R2 storage setup
  - Fly.io backend deployment
  - Netlify frontend deployment
  - Environment configuration
  - Testing and verification steps

- **[Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)** - Interactive checklist to track your deployment progress

### 🚀 Quick Deployment Summary

1. **Firebase** - User authentication (free tier: 10k MAU)
2. **Neon PostgreSQL** - Production database (free tier: 10 GB)
3. **Cloudflare R2** - File storage (free tier: 10 GB)
4. **Fly.io** - Backend API hosting (free tier: 3 shared VMs)
5. **Netlify** - Frontend hosting (free tier: 100 GB bandwidth)

**Total Cost**: $0/month on free tiers ✅

For detailed instructions, see the [Production Deployment Guide](./docs/PRODUCTION_DEPLOYMENT_GUIDE.md).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.