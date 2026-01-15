# Recipe Manager - Production Deployment Guide

**Last Updated**: January 12, 2026

This comprehensive guide will walk you through deploying the Recipe Manager web application to production, including setting up all required cloud services, databases, and hosting platforms.

---

## 📋 Overview

Your application requires the following services to run in production:

1. **Firebase** - User authentication (email/password, Google OAuth)
2. **Neon PostgreSQL** - Production database
3. **Cloudflare R2** - Object storage for uploaded recipe documents
4. **Fly.io** - Backend API hosting
5. **Netlify** - Frontend hosting

**Estimated Total Cost**: $0/month (all services have generous free tiers)

**Estimated Setup Time**: 2-3 hours

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Frontend                         │
│              (Netlify - Static Site)                 │
│         https://recipemanager.netlify.app            │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ HTTPS API Calls
                       │
┌──────────────────────▼──────────────────────────────┐
│                   Backend API                        │
│            (Fly.io - Docker Container)               │
│          https://recipemanager.fly.dev               │
└───┬──────────────────┬───────────────────┬──────────┘
    │                  │                   │
    │                  │                   │
    ▼                  ▼                   ▼
┌──────────┐    ┌─────────────┐    ┌──────────────┐
│ Firebase │    │    Neon     │    │ Cloudflare   │
│   Auth   │    │ PostgreSQL  │    │      R2      │
│  (JWT)   │    │  (Database) │    │  (Storage)   │
└──────────┘    └─────────────┘    └──────────────┘
```

---

## 📝 Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] GitHub account (for repository hosting and OAuth)
- [ ] Google account (for Firebase and OAuth)
- [ ] Credit/debit card (required for Cloudflare and Fly.io verification, but won't be charged on free tier)
- [ ] Domain name (optional, but recommended for production)
- [ ] Your Recipe Manager repository pushed to GitHub

---

## 🚀 Step-by-Step Deployment Instructions

---

### **PHASE 1: Firebase Authentication Setup**

Firebase will handle user authentication with email/password and Google OAuth.

#### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `recipe-manager-prod` (or your preferred name)
4. Click **Continue**
5. **Google Analytics**: Toggle OFF (not needed for this app)
6. Click **Create project**
7. Wait for project creation (~30 seconds)
8. Click **Continue** when done

#### 1.2 Enable Authentication Methods

1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"** button
3. Go to **"Sign-in method"** tab

**Enable Email/Password:**
1. Click on **"Email/Password"** provider
2. Toggle **"Enable"** switch ON
3. Leave **"Email link (passwordless sign-in)"** OFF (we use password-based)
4. Click **"Save"**

**Enable Google OAuth:**
1. Click on **"Google"** provider
2. Toggle **"Enable"** switch ON
3. Select **"Project support email"** from dropdown (your Google account email)
4. Click **"Save"**

**Optional - Enable GitHub OAuth:**
1. Click on **"GitHub"** provider
2. Toggle **"Enable"** switch ON
3. You'll need to register an OAuth app in GitHub (see section 1.3)

#### 1.3 Register GitHub OAuth App (Optional)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in details:
   - **Application name**: `Recipe Manager`
   - **Homepage URL**: `https://recipemanager.netlify.app` (update with your domain)
   - **Authorization callback URL**: Copy from Firebase (e.g., `https://recipe-manager-prod.firebaseapp.com/__/auth/handler`)
4. Click **"Register application"**
5. Copy **Client ID**
6. Click **"Generate a new client secret"** and copy the secret
7. Go back to Firebase Authentication → GitHub provider
8. Paste **Client ID** and **Client secret**
9. Click **"Save"**

#### 1.4 Register Web App in Firebase

1. In Firebase Console, click **Project Settings** (⚙️ gear icon next to "Project Overview")
2. Scroll down to **"Your apps"** section
3. Click the **web icon** (`</>`)
4. Register app:
   - **App nickname**: `Recipe Manager Web`
   - **Hosting**: Leave unchecked (we're using Netlify)
5. Click **"Register app"**
6. **Copy the Firebase configuration object** (you'll need this later):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "recipe-manager-prod.firebaseapp.com",
  projectId: "recipe-manager-prod",
  storageBucket: "recipe-manager-prod.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

7. Click **"Continue to console"**

#### 1.5 Save Firebase Credentials

**Create a temporary file** to store these values (you'll need them later):

```
Firebase Project ID: recipe-manager-prod
Firebase API Key: AIzaSy...
Firebase Auth Domain: recipe-manager-prod.firebaseapp.com
Firebase App ID: 1:1234567890:web:abcdef123456
```

---

### **PHASE 2: Neon PostgreSQL Database Setup**

Neon provides a serverless PostgreSQL database with a generous free tier.

#### 2.1 Create Neon Account

1. Go to [Neon Console](https://console.neon.tech/)
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with **GitHub** (easiest) or email
4. Complete account verification

#### 2.2 Create Database Project

1. After login, click **"Create Project"** or **"New Project"**
2. Configure project:
   - **Project name**: `recipemanager-prod`
   - **Region**: Choose closest to your users (e.g., `US East (Ohio)` or `EU West (Frankfurt)`)
   - **Postgres version**: Keep default (16 or latest)
   - **Compute size**: Keep default (0.25 vCPU, 1 GB RAM - Free tier)
3. Click **"Create Project"**

#### 2.3 Get Connection String

1. After project creation, you'll see the **Connection Details** panel
2. Copy the **Connection String** (Pooled connection):

```
postgres://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Important Notes:**
- Use the **Pooled connection string** (not direct connection)
- The password is only shown once - save it securely!
- If you lose it, you can reset it in project settings

3. **Save this connection string** - you'll need it for backend deployment

#### 2.4 Configure Database (Optional)

1. Click on **"SQL Editor"** in the left sidebar
2. You can run SQL queries here to verify connection
3. EF Core migrations will automatically create tables on first deployment

---

### **PHASE 3: Cloudflare R2 Storage Setup**

Cloudflare R2 provides S3-compatible object storage for uploaded recipe documents.

#### 3.1 Create Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Sign Up"**
3. Enter email and create password
4. Verify email address
5. Complete account setup

#### 3.2 Enable R2 Storage

1. In Cloudflare dashboard, click **"R2"** in the left sidebar
2. Click **"Purchase R2 Plan"** (Don't worry, free tier is 10GB storage + 1M requests/month)
3. Add payment method (required for verification, but won't be charged on free tier)
4. Click **"Enable R2"**

#### 3.3 Create R2 Bucket

1. Click **"Create bucket"**
2. Configure bucket:
   - **Bucket name**: `recipemanager-uploads` (must be globally unique, add suffix if taken)
   - **Location**: Choose **"Automatic"** or region closest to your users
3. Click **"Create bucket"**
4. Bucket created successfully ✓

#### 3.4 Configure CORS (Required for uploads)

1. Click on your bucket name (`recipemanager-uploads`)
2. Go to **"Settings"** tab
3. Scroll to **"CORS Policy"**
4. Click **"Edit"**
5. Add the following CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "https://recipemanager.netlify.app",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

6. Click **"Save"**

**Note**: Update `https://recipemanager.netlify.app` with your actual Netlify domain later.

#### 3.5 Create API Tokens

1. Go back to R2 overview page
2. Click **"Manage R2 API Tokens"** on the right side
3. Click **"Create API Token"**
4. Configure token:
   - **Token name**: `recipemanager-backend`
   - **Permissions**: Select **"Object Read & Write"**
   - **TTL**: Leave default (no expiration)
   - **Scope**: Select **"Apply to specific buckets only"**
   - Check your bucket: `recipemanager-uploads`
5. Click **"Create API Token"**
6. **Copy and save these credentials** (shown only once):

```
Access Key ID: abc123def456...
Secret Access Key: xyz789uvw012...
Account ID: 1234567890abcdef
```

7. **Find your Account ID**: It's shown in the top of the page or in the API token details

**Save these values:**
```
R2 Account ID: 1234567890abcdef
R2 Access Key ID: abc123def456...
R2 Secret Access Key: xyz789uvw012...
R2 Bucket Name: recipemanager-uploads
```

---

### **PHASE 4: Backend Deployment (Fly.io)**

Fly.io will host your ASP.NET Core backend API in a Docker container.

#### 4.1 Install Fly.io CLI

**On Windows (PowerShell):**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Verify installation:**
```powershell
fly version
```

#### 4.2 Create Fly.io Account and Sign In

```powershell
fly auth signup
```

Or if you already have an account:
```powershell
fly auth login
```

Follow the browser prompts to complete authentication.

#### 4.3 Create Dockerfile for Backend

Navigate to your backend directory and create a `Dockerfile`:

```powershell
cd C:\src\Projects\RecipeManager\recipe-manager-webapp\backend
```

Create file `Dockerfile`:

```dockerfile
# Use official .NET SDK image for build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy remaining files and build
COPY . ./
RUN dotnet publish -c Release -o /app/publish

# Use runtime image for final container
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Set environment variable for port
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "RecipeManager.Api.dll"]
```

#### 4.4 Initialize Fly.io App

```powershell
fly launch
```

You'll be prompted:
- **App name**: `recipemanager-api` (or your preferred name, must be globally unique)
- **Region**: Choose closest to your users (e.g., `ord` for Chicago, `lhr` for London)
- **Setup PostgreSQL**: Select **"No"** (we're using Neon)
- **Deploy now**: Select **"No"** (we need to set secrets first)

This creates a `fly.toml` file in your backend directory.

#### 4.5 Configure fly.toml

Edit the generated `fly.toml` file:

```toml
app = "recipemanager-api"
primary_region = "ord"

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

#### 4.6 Set Environment Variables (Secrets)

Fly.io uses secrets for sensitive environment variables. Set them using the CLI:

```powershell
# Database connection string (from Neon)
fly secrets set ConnectionStrings__DefaultConnection="postgres://username:password@ep-xxx.neon.tech/neondb?sslmode=require"

# Firebase configuration
fly secrets set Firebase__ProjectId="recipe-manager-prod"
fly secrets set Firebase__Audience="recipe-manager-prod"

# Cloudflare R2 configuration
fly secrets set R2__AccountId="1234567890abcdef"
fly secrets set R2__AccessKeyId="abc123def456..."
fly secrets set R2__SecretAccessKey="xyz789uvw012..."
fly secrets set R2__BucketName="recipemanager-uploads"

# CORS - Add your frontend URL
fly secrets set Cors__AllowedOrigins__0="https://recipemanager.netlify.app"

# Security: Restrict allowed host headers (replace with your actual domain)
fly secrets set ALLOWED_HOSTS="recipemanager-api.fly.dev"

# Set environment to Production
fly secrets set ASPNETCORE_ENVIRONMENT="Production"
```

**Note**: Replace the example values with your actual credentials from previous steps.

**Security Note**: The `ALLOWED_HOSTS` setting restricts which host headers your API will accept, preventing host header injection attacks. Set it to your Fly.io app domain (e.g., `recipemanager-api.fly.dev`). If you have a custom domain, use semicolons to separate multiple domains: `recipemanager-api.fly.dev;api.yourdomain.com`

**Important**: Use double underscores (`__`) to represent nested JSON configuration (`:` doesn't work in environment variables).

#### 4.7 Update Backend appsettings.json

Ensure your `appsettings.json` has placeholders for production (it should already):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Firebase": {
    "ProjectId": "",
    "Audience": ""
  },
  "R2": {
    "AccountId": "",
    "AccessKeyId": "",
    "SecretAccessKey": "",
    "BucketName": ""
  }
}
```

#### 4.8 Apply Database Migrations

Before deploying, ensure your database schema is ready. Run migrations against Neon database:

**Update connection string temporarily** in `appsettings.json` or use environment variable:

```powershell
$env:ConnectionStrings__DefaultConnection="postgres://username:password@ep-xxx.neon.tech/neondb?sslmode=require"
dotnet ef database update --context ApplicationDbContext
```

This creates all tables in your Neon PostgreSQL database.

#### 4.9 Deploy Backend to Fly.io

```powershell
fly deploy
```

This will:
1. Build your Docker image
2. Push it to Fly.io registry
3. Deploy the container
4. Start your application

**Wait for deployment to complete** (~2-5 minutes first time)

#### 4.10 Verify Backend Deployment

```powershell
# Check app status
fly status

# View logs
fly logs

# Open in browser
fly open
```

Visit `https://recipemanager-api.fly.dev/health` (replace with your app name) to verify the health endpoint.

You should see: `"Healthy"`

**If you see errors**, check logs:
```powershell
fly logs
```

Common issues:
- Database connection errors: Verify connection string
- Port errors: Ensure `ASPNETCORE_URLS=http://+:8080` is set
- Secrets not loading: Re-run `fly secrets set` commands

#### 4.11 Get Backend URL

Your backend API URL is:
```
https://recipemanager-api.fly.dev
```

**Save this URL** - you'll need it for frontend configuration.

---

### **PHASE 5: Frontend Deployment (Netlify)**

Netlify will host your React frontend as a static site with automatic deployments from Git.

#### 5.1 Prepare Frontend for Production

Navigate to frontend directory:

```powershell
cd C:\src\Projects\RecipeManager\recipe-manager-webapp\frontend
```

#### 5.2 Create netlify.toml Configuration

Create file `netlify.toml` in the frontend directory:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

This configures:
- Build command
- Output directory
- SPA routing (redirects all routes to index.html)
- Node.js version

#### 5.3 Update .gitignore (Ensure .env.local is ignored)

Verify `.gitignore` includes:

```
.env.local
.env.production.local
```

**Never commit environment files with secrets!**

#### 5.4 Commit Configuration Files

```powershell
git add netlify.toml
git commit -m "Add Netlify configuration"
git push origin main
```

#### 5.5 Create Netlify Account and Connect Repository

1. Go to [Netlify](https://www.netlify.com/)
2. Click **"Sign up"**
3. Choose **"Sign up with GitHub"** (easiest)
4. Authorize Netlify to access your GitHub account

#### 5.6 Create New Site from Git

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify if prompted
4. Select your repository: `recipe-manager-webapp`
5. Configure build settings:
   - **Branch to deploy**: `main`
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. Click **"Show advanced"** → **"New variable"**

#### 5.7 Set Environment Variables in Netlify

Add the following environment variables (from Firebase configuration saved earlier):

| Key | Value | Example |
|-----|-------|---------|
| `VITE_API_BASE_URL` | Your Fly.io backend URL | `https://recipemanager-api.fly.dev` |
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `recipe-manager-prod.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `recipe-manager-prod` |
| `VITE_BYPASS_AUTH` | Set to `false` (production) | `false` |

**Important**: 
- All frontend environment variables must start with `VITE_`
- Set `VITE_BYPASS_AUTH` to `false` for production (or omit it entirely)

#### 5.8 Deploy Frontend

Click **"Deploy site"**

Netlify will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Build the app (`npm run build`)
4. Deploy to CDN

**Wait for deployment** (~2-5 minutes)

#### 5.9 Get Frontend URL

Netlify assigns a random subdomain like: `https://cheerful-unicorn-123abc.netlify.app`

You can customize it:
1. Go to **"Site settings"** → **"Change site name"**
2. Enter: `recipemanager` (or your preferred name)
3. Your URL becomes: `https://recipemanager.netlify.app`

**Save this URL** - you need to update CORS and Firebase.

---

### **PHASE 6: Final Configuration Updates**

Now that all services are deployed, update configurations with actual URLs.

#### 6.1 Update Backend CORS

Add your Netlify frontend URL to backend CORS:

```powershell
cd C:\src\Projects\RecipeManager\recipe-manager-webapp\backend

# Update Fly.io secret
fly secrets set Cors__AllowedOrigins__0="https://recipemanager.netlify.app"

# Add additional origins if needed (e.g., custom domain)
fly secrets set Cors__AllowedOrigins__1="https://www.yourdomain.com"
```

#### 6.2 Update Cloudflare R2 CORS

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Click on your bucket (`recipemanager-uploads`)
3. Go to **Settings** → **CORS Policy**
4. Update the CORS policy with your actual Netlify URL:

```json
[
  {
    "AllowedOrigins": [
      "https://recipemanager.netlify.app",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click **"Save"**

#### 6.3 Update Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`recipe-manager-prod`)
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add your Netlify domain: `recipemanager.netlify.app`
6. Click **"Add"**

This allows Firebase authentication to work on your production domain.

#### 6.4 Redeploy Backend (Apply CORS Changes)

```powershell
cd C:\src\Projects\RecipeManager\recipe-manager-webapp\backend
fly deploy
```

#### 6.5 Verify Frontend Deployment

Visit your Netlify site: `https://recipemanager.netlify.app`

You should see the Recipe Manager landing page.

---

### **PHASE 7: Testing and Verification**

#### 7.1 Test Authentication

1. Visit `https://recipemanager.netlify.app`
2. Click **"Sign In"** button
3. Try **"Sign up with email"**:
   - Enter email and password
   - Should create account successfully
4. Try **"Sign in with Google"**:
   - Should redirect to Google OAuth
   - Should sign in successfully

**If authentication fails:**
- Check browser console for errors
- Verify Firebase configuration in Netlify environment variables
- Verify Firebase authorized domains includes your Netlify URL

#### 7.2 Test Recipe Creation

**Test Link Recipe:**
1. Click **"Add Recipe"**
2. Select **"From Link"**
3. Enter title: `Test Recipe`
4. Enter URL: `https://example.com/recipe`
5. Click **"Save"**
6. Should create successfully and appear in list

**Test Manual Recipe:**
1. Click **"Add Recipe"**
2. Select **"Manual Recipe"**
3. Enter title: `Manual Test`
4. Enter content in rich text editor
5. Click **"Save"**
6. Should create successfully

**Test Document Upload:**
1. Click **"Add Recipe"**
2. Select **"Document Upload"**
3. Enter title: `Upload Test`
4. Select a PDF or image file
5. Click **"Save"**
6. Should upload to R2 and create recipe

**If document upload fails:**
- Check browser console for CORS errors
- Verify R2 CORS policy includes your Netlify URL
- Check backend logs: `fly logs`

#### 7.3 Test Search and Favorites

1. Search for recipes using the search bar
2. Click the heart icon to favorite a recipe
3. Filter by favorites
4. Unfavorite a recipe

#### 7.4 Test Recipe Detail View

1. Click on a recipe card
2. Should navigate to `/recipe/:id`
3. View full recipe details
4. Test delete functionality
5. Test favorite toggle

#### 7.5 Monitor Backend Logs

```powershell
fly logs --app recipemanager-api
```

Check for errors or warnings.

#### 7.6 Check Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project
3. Open **SQL Editor**
4. Run query to verify data:

```sql
SELECT * FROM "Users" LIMIT 10;
SELECT * FROM "Recipes" LIMIT 10;
SELECT * FROM "Favorites" LIMIT 10;
```

#### 7.7 Check R2 Storage

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Click on your bucket
3. Verify uploaded files appear

---

## 🔧 Production Configuration Summary

Save these URLs and credentials securely (use a password manager):

### **Service URLs**
- Frontend: `https://recipemanager.netlify.app`
- Backend API: `https://recipemanager-api.fly.dev`
- Database: `ep-xxx.neon.tech` (Neon PostgreSQL)

### **Firebase**
- Project ID: `recipe-manager-prod`
- API Key: `AIzaSy...`
- Auth Domain: `recipe-manager-prod.firebaseapp.com`

### **Neon PostgreSQL**
- Connection String: `postgres://...@ep-xxx.neon.tech/neondb`

### **Cloudflare R2**
- Account ID: `1234567890abcdef`
- Bucket Name: `recipemanager-uploads`
- Access Key ID: `abc123...`
- Secret Access Key: `xyz789...`

---

## 🚨 Post-Deployment Security Checklist

- [ ] All secrets stored securely (not in code or Git)
- [ ] CORS configured with specific origins (not `*`)
- [ ] Firebase authorized domains configured
- [ ] R2 bucket CORS policy configured
- [ ] HTTPS enforced on all services (Netlify and Fly.io do this by default)
- [ ] Environment variables set correctly in Netlify and Fly.io
- [ ] Production database uses strong password
- [ ] Database connection uses SSL (`sslmode=require`)
- [ ] No development bypass authentication in production (`VITE_BYPASS_AUTH=false` or omitted)

---

## 📊 Monitoring and Maintenance

### **Monitor Backend Health**
```powershell
# Check app status
fly status --app recipemanager-api

# View logs
fly logs --app recipemanager-api

# SSH into container (for debugging)
fly ssh console --app recipemanager-api
```

### **Monitor Frontend Deployments**

1. Go to Netlify dashboard
2. Click on your site
3. View **"Deploys"** tab for build logs and history

### **Monitor Database Usage**

1. Go to [Neon Console](https://console.neon.tech/)
2. View **"Monitoring"** tab
3. Check storage usage, connection count, query performance

### **Monitor R2 Usage**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. View **"Metrics"** for storage and request statistics

---

## 🔄 Continuous Deployment Setup

### **Automatic Frontend Deploys**

Netlify automatically deploys on every push to `main` branch.

To disable:
1. Go to Netlify site settings
2. **Build & deploy** → **Continuous deployment**
3. Toggle off **"Auto publishing"**

### **Automatic Backend Deploys (Optional)**

Setup GitHub Actions to auto-deploy backend on push:

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Fly.io

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Setup:**
1. Get Fly.io API token: `fly auth token`
2. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
3. Add secret: `FLY_API_TOKEN` with your token
4. Push workflow file to GitHub

---

## 🐛 Troubleshooting Production Issues

### **Issue: Frontend shows "Network Error" or "Unable to reach API"**

**Solutions:**
1. Verify backend is running: `fly status --app recipemanager-api`
2. Check backend logs: `fly logs --app recipemanager-api`
3. Verify `VITE_API_BASE_URL` in Netlify matches your Fly.io URL
4. Check CORS configuration on backend allows your Netlify domain

### **Issue: Authentication fails with 401 Unauthorized**

**Solutions:**
1. Verify Firebase project ID in backend matches your Firebase project
2. Check Firebase configuration in frontend (Netlify environment variables)
3. Ensure Firebase authorized domains includes your Netlify URL
4. Check backend logs for JWT validation errors

### **Issue: Database connection errors**

**Solutions:**
1. Verify Neon database is active (not sleeping)
2. Check connection string in Fly.io secrets: `fly secrets list`
3. Verify SSL mode is enabled (`sslmode=require`)
4. Check Neon dashboard for connection issues

### **Issue: File uploads fail or return 403 Forbidden**

**Solutions:**
1. Verify R2 CORS policy includes your Netlify domain
2. Check R2 API token has Object Read & Write permissions
3. Verify backend R2 configuration (account ID, access keys)
4. Check backend logs for R2 errors

### **Issue: Fly.io app crashes or restarts frequently**

**Solutions:**
1. Check logs for errors: `fly logs --app recipemanager-api`
2. Increase memory: Edit `fly.toml` → `memory_mb = 512` → `fly deploy`
3. Check database connection pool exhaustion
4. Review application errors in logs

### **Issue: Netlify build fails**

**Solutions:**
1. Check build logs in Netlify dashboard
2. Verify environment variables are set correctly
3. Check `netlify.toml` configuration
4. Ensure `package.json` scripts are correct
5. Try deploying manually: `npm run build` locally to reproduce error

---

## 💰 Cost Monitoring

### **Free Tier Limits**

| Service | Free Tier | Upgrade Cost |
|---------|-----------|--------------|
| **Firebase Auth** | 10,000 MAU (Monthly Active Users) | $0.0055/user/month above 10k |
| **Neon PostgreSQL** | 10 GB storage, 100 hours compute | $19/month for Pro |
| **Cloudflare R2** | 10 GB storage, 1M Class B operations/month | Pay per use: $0.015/GB/month |
| **Fly.io** | 3 shared-cpu-1x VMs, 256MB RAM each | $1.94/month per GB RAM |
| **Netlify** | 100 GB bandwidth/month, 300 build minutes | $19/month for Pro |

**Expected Usage** (100-500 users/month):
- Firebase Auth: Free tier
- Neon: Free tier (< 10 GB, < 100 hours)
- R2: Free tier (< 10 GB storage)
- Fly.io: Free tier (3 VMs)
- Netlify: Free tier (< 100 GB bandwidth)

**Total Cost: $0/month** ✅

---

## 🎉 Congratulations!

Your Recipe Manager application is now running in production! 🚀

**What you've accomplished:**
✅ Firebase authentication with email and Google OAuth
✅ PostgreSQL database hosted on Neon
✅ Object storage with Cloudflare R2
✅ Backend API deployed to Fly.io
✅ Frontend deployed to Netlify
✅ HTTPS enabled on all services
✅ Automatic deployments configured
✅ Production-ready architecture

**Next Steps:**
1. Add custom domain (optional)
2. Set up monitoring and alerts
3. Configure backups for database
4. Add more features and improve UX
5. Share with users and gather feedback!

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Fly.io Documentation](https://fly.io/docs/)
- [Netlify Documentation](https://docs.netlify.com/)
- [ASP.NET Core Deployment](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

## 🆘 Need Help?

If you encounter issues not covered in this guide:

1. Check service status pages:
   - [Firebase Status](https://status.firebase.google.com/)
   - [Fly.io Status](https://status.flyio.net/)
   - [Netlify Status](https://www.netlifystatus.com/)
   - [Cloudflare Status](https://www.cloudflarestatus.com/)

2. Review application logs:
   - Backend: `fly logs --app recipemanager-api`
   - Frontend: Netlify dashboard → Deploys → View logs

3. Check GitHub Issues for known problems

4. Reach out to community forums:
   - [Fly.io Community](https://community.fly.io/)
   - [Netlify Support Community](https://answers.netlify.com/)
   - [Firebase Discord](https://discord.gg/firebase)

---

**Document Version**: 1.0
**Last Updated**: January 12, 2026
