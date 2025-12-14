# Recipe Manager Web Application

A full-stack web application for managing personal recipe collections. Users can save recipes from external links, upload recipe documents, or manually create recipes.

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
```

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

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google and GitHub providers
   - Enable Email/Password (for magic links)
4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Under "Your apps", add a web app
   - Copy the config values to your `.env.local`

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
- `GET /api/recipes` - List user's recipes (supports `?q=search` query)
- `GET /api/recipes/{id}` - Get single recipe
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/{id}` - Update recipe
- `DELETE /api/recipes/{id}` - Delete recipe

### Favorites
- `POST /api/recipes/{id}/favorite` - Add to favorites
- `DELETE /api/recipes/{id}/favorite` - Remove from favorites

### Uploads
- `POST /api/uploads/presign` - Get presigned upload URL
- `GET /api/uploads/presign-download?recipeId={id}` - Get presigned download URL

## Features

- ✅ User authentication (Google, GitHub OAuth + Email magic links)
- ✅ Create recipes from external links
- ✅ Upload recipe documents
- ✅ Manually create recipes
- ✅ Search recipes by title
- ✅ Mark recipes as favorites
- ✅ Responsive design with Tailwind CSS
- ✅ Real-time auth state management
- ✅ Secure file uploads to R2

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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.