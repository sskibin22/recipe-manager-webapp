# Recipe Manager MVP – Development Instructions

## Overview

This is a focused, low-cost MVP: React SPA with a minimal ASP.NET Core API, external JWT-based auth, and free-tier storage/database. Use Firebase Auth for email + social login, Neon Postgres for data, and Cloudflare R2 for uploads. Deploy frontend to Netlify and backend to Fly.io. Keep schemas and endpoints lean, and use Vite + Tailwind CSS for quick UI building.

## Primary Technology Stack (Concrete Recommendations)

- **Backend**: ASP.NET Core Minimal API + EF Core; Dev DB: SQLite; Prod DB: Neon Postgres.
- **Auth**: Firebase Auth with email magic link + Google/GitHub; validate JWT in ASP.NET via `JwtBearer` and Firebase JWKS; map `sub` to `User`.
- **Storage**: Cloudflare R2 for uploaded docs via presigned URLs; S3 SDK with R2 endpoint; per-user object keys; CORS to frontend origin.
- **Frontend**: React + Vite + Tailwind CSS; React Router; TanStack Query for server state; Firebase SDK for auth.
- **Deployment**: Frontend on Netlify; Backend on Fly.io; add env vars for DB connection, Firebase `ProjectId`/issuer, R2 keys; enable HTTPS.
- **Tooling**: VS Code REST Client, `.env` management, ESLint/Prettier, `dotnet format`.

## Implementation Steps

1. Initialize backend Minimal API with EF Core; add `User`, `Recipe`, `Favorite` models and migrations.
2. Integrate JWT auth (`JwtBearer`) using Firebase Auth; map `sub` to `User` on first request.
3. Implement endpoints: recipes CRUD, `favorite` toggle, `q` title search; add `uploads/presign` for R2.
4. Configure Neon Postgres (prod) and SQLite (dev); wire connection strings via env vars.
5. Set up Cloudflare R2 bucket + CORS; add presigned S3 client in API; secure per-user keys.
6. Scaffold React (Vite) with Tailwind CSS, React Router, TanStack Query, Firebase SDK for auth.
7. Build landing page: add recipe via link/manual/upload; list, search, and favorite recipes.
8. Deploy: frontend on Netlify; backend on Fly.io; connect Neon and R2; set env vars and HTTPS.
9. Add basic tooling: `.env`/user-secrets, VS Code REST Client, ESLint/Prettier, `dotnet format`.

## Reference Material

### Backend Stack
- **Approach: ASP.NET Core Minimal API + EF Core**: Faster to scaffold, fewer moving parts than MVC, ideal for a small CRUD API; still supports filters/middleware and swagger.
- **Database: SQLite for dev, PostgreSQL for prod**: 
  - SQLite: zero setup, works well with EF Core; great for local dev/testing.
  - PostgreSQL: reliable and widely supported on free hosts; good migrations story with EF Core.
- **Hosting (primary)**: 
  - **Fly.io Free**: 1 shared-cpu-1x VM, ~256MB RAM; free/low-cost, global deployment, built-in TLS; supports persistent volumes for Postgres if you run PG yourself (not ideal on free tier). Better to use managed PG elsewhere.
  - **Render Free**: Free Web Service sleeps after inactivity, cold starts; Managed PostgreSQL Starter is paid now, but they sometimes provide trial credits; can still run API on free service and use external DB.
- **Hosting (backup)**:
  - **Railway**: Free usage limited by credits; simple deploys; managed Postgres often deprecates truly free tiers—check monthly credits.
  - **Azure App Service Free (F1)**: Extremely limited, no custom domains; better use Azure Static Web Apps for frontend and external DB/API.
- **Recommended pairing**:
  - Dev: Minimal API + EF Core + SQLite.
  - Prod: Minimal API on Fly.io; DB on **Neon** (Postgres serverless, generous free tier) or **Supabase Postgres** free. Use connection string via env vars.
- **Auth integration feasibility**: Minimal API works cleanly with JWT bearer middleware; easy to validate external tokens (Firebase, Supabase, Auth0). Swagger supports auth via security schemes.

### Auth Options
- **Firebase Auth (primary)**:
  - **Pricing**: Generous free: phone auth paid; email/password, email link (passwordless), Google/GitHub OAuth free; MAU limits are high for small apps.
  - **ASP.NET integration**: Validate ID tokens with Google `JwtBearer` using Firebase project keys (JWKS). Client SDK in React is straightforward; email magic links supported.
  - **Pros**: Simple, robust SDKs, passwordless, multiple providers, good docs.
  - **Cons**: Vendor lock-in; custom claims require admin SDK or callable functions.
- **Supabase Auth (backup)**:
  - **Pricing**: Free tier includes Auth with email/password, magic links, social providers; generous monthly limits (check current caps).
  - **ASP.NET integration**: Validate JWT via Supabase’s JWKS; React SDK is clean; can unify with Supabase Storage if chosen.
  - **Pros**: First-party storage and Postgres; nice dev experience.
  - **Cons**: Tight coupling if using their DB/storage; rate limits on free tier.
- **Auth0 / Clerk**:
  - **Auth0**: Free tier has user/app limits; great ASP.NET examples; can be overkill; free limits may be reduced.
  - **Clerk**: Free dev tier, but production free limits vary; excellent React components; ASP.NET JWT works; potential future cost.
- **Azure AD B2C**: Powerful, but setup overhead and enterprise-oriented; free usage limits exist but complexity high for a solo MVP.
- **Recommendation**: Pick **Firebase Auth** for fastest path (email magic links + Google/GitHub). Backup: **Supabase Auth** if you want to combine with Supabase Storage or prefer Postgres-centric tooling.
- **Token verification on ASP.NET**:
  - Use `JwtBearer` with `Authority` pointing to the provider (Firebase: `https://securetoken.google.com/{projectId}`; Supabase: their issuer).
  - Validate audience (`aud`) and issuer (`iss`) and decode via provider JWKS; map `sub` to your `User` table.

### Storage Options
- **Uploaded documents/object storage (primary)**: **Cloudflare R2** free tier.
  - **Pricing**: Free up to 10GB storage and generous egress to Cloudflare; S3-compatible API.
  - **Integration**: Use AWS S3 SDK in ASP.NET with custom endpoint; create presigned URLs server-side; set CORS on bucket for your frontend domain. Secure uploads by scoping object keys per user and requiring JWT to request presigned URLs.
- **Backups/Alternatives**:
  - **Supabase Storage**: Free tier with public/private buckets; simple SDK; easy presigned URL flow; pairs nicely if you use Supabase Auth.
  - **Firebase Storage**: Free tier, but egress and rules complexity; security with Firebase rules tied to Auth; good React SDK; ASP.NET presigned is less direct (usually client uploads via Firebase SDK).
  - **AWS S3**: Free tier exists but requires card, potential cost surprises; safer to avoid for strictly free MVP.
- **User/account data & recipes**: Store app user profiles and recipe records in Postgres (Neon/Supabase), with external auth’s `sub`/UID as foreign key. Do not store passwords if using external auth.
- **CORS/SDK notes**:
  - Set bucket CORS to allow your frontend origin for `PUT`, `GET`, and `HEAD`. For presigned URLs, CORS applies to the storage endpoint.
  - For R2 with S3 SDK, ensure `ServiceURL` uses `https://<accountid>.r2.cloudflarestorage.com`.

### Frontend Stack
- **Build tool**: **React + Vite**: Fast dev server, simple config, modern tooling; CRA is deprecated and slower.
- **UI library**: **Tailwind CSS** chosen for utility-first styling, minimal dependencies, and fast build times.
  - Alternative: Chakra UI for component library with accessible building blocks and easy theming (slightly more bundle weight).
  - Not recommended: MUI (too powerful and heavy for MVP scope).
- **Routing**: **React Router** for SPA routes (landing, auth callback, recipe list/detail, upload).
- **State management**: **TanStack Query** for server state (recipes, favorites); local state via React; avoid global stores initially. Auth state via provider SDK.

### API Design
- **Auth scheme**: JWT Bearer from provider; client attaches `Authorization: Bearer <token>`; ASP.NET validates and sets `User` principal.
- **Middleware**:
  - `JwtBearerOptions` with `Authority` and `TokenValidationParameters` for `ValidAudience`, `ValidIssuer`.
  - Custom middleware to ensure a `User` record exists for `sub` at first request.
- **Entities (minimal schema)**:
  - `User`: `Id` (GUID), `AuthSub` (string, unique), `Email` (nullable if provider hides), `DisplayName`, `CreatedAt`.
  - `Recipe`: `Id` (GUID), `UserId` (FK), `Title`, `Type` (enum: Link, Document, Manual), `Url` (for external link), `StorageKey` (for uploaded doc), `Content` (text for manual), `CreatedAt`, `UpdatedAt`.
  - `Favorite`: `UserId` (FK), `RecipeId` (FK), `CreatedAt`. Composite PK `(UserId, RecipeId)`.
- **Endpoints**:
  - `POST /api/recipes`: Create (link/manual); for document type, client first requests presigned upload, then creates recipe with `StorageKey`.
  - `GET /api/recipes`: List user’s recipes; supports `q` title search param.
  - `GET /api/recipes/{id}`: Get one (owned by user).
  - `PUT /api/recipes/{id}`: Update title/content/type/url (owned).
  - `DELETE /api/recipes/{id}`: Delete; if document, optionally delete object via presigned delete or server-side SDK.
  - `POST /api/recipes/{id}/favorite`: Toggle on.
  - `DELETE /api/recipes/{id}/favorite`: Toggle off.
  - `POST /api/uploads/presign`: Returns presigned `PUT` URL and `StorageKey` scoped to current user; accepts `contentType` and optional `filename`.
  - `GET /api/uploads/presign-download?recipeId=...`: Optional; returns time-limited download URL for documents owned by user.
- **Search**: Simple `LIKE` on title; consider trigram or full-text later; limit to user scope.
- **Validation**: Enforce max document size (e.g., 10MB to stay within free tiers), allowed mime types (PDF, images).

### Deployment
- **Frontend**:
  - **Netlify or Vercel Free**: One-click Git deploys, HTTPS, environment variables; SPA routing handled via config (`_redirects` for Netlify, `vercel.json` rewrites).
- **Backend**:
  - **Fly.io Free**: Deploy via `flyctl`; set env vars for DB connection and JWT `Authority`, `Audience`. TLS via Fly by default.
  - **Render Free (backup)**: Simple build/deploy from Git; note sleep/cold starts; set env vars in dashboard.
- **Database**:
  - **Neon Free**: Serverless Postgres, generous free; copy connection string to backend env var; SSL required.
  - **Supabase Free (alt)**: If you choose Supabase Auth/Storage, can also use their Postgres; mind row/storage limits.
- **SSL & domains**: Netlify/Vercel auto-SSL; Fly.io provides certs; custom domains free on Netlify/Vercel; Fly custom domains supported.
- **Idle/sleep limits**: Render free services sleep; Fly free may have resource caps; keep-alives not recommended; accept cold starts for MVP.

### Testing/Dev Tooling
- **Local run**:
  - Backend: ASP.NET watch + SQLite; use EF migrations.
  - Frontend: Vite dev server; point to localhost API; set CORS permissive in dev.
- **Env management**:
  - Backend: `.env`-style via `dotnet user-secrets` or `appsettings.Development.json`; never commit secrets.
  - Frontend: `.env.local` for Vite (`VITE_*` vars).
- **API testing**:
  - Use VS Code REST Client or Postman; keep a `requests.http` with sample calls including `Authorization`.
- **Lint/format**:
  - Backend: `dotnet format`.
  - Frontend: ESLint + Prettier minimal config; TypeScript optional but recommended for models.
- **Basic checks**:
  - Health endpoint: `GET /health` unauthenticated for uptime checks.
  - Seed script for local dev: create sample user mapping and recipes.

### Concrete Recommendations (Primary Path)
- Backend: ASP.NET Core Minimal API + EF Core; Dev DB: SQLite; Prod DB: Neon Postgres.
- Auth: Firebase Auth with email magic link + Google/GitHub; validate JWT in ASP.NET via `JwtBearer` and Firebase JWKS; map `sub` to `User`.
- Storage: Cloudflare R2 for uploaded docs via presigned URLs; S3 SDK with R2 endpoint; per-user object keys; CORS to frontend origin.
- Frontend: React + Vite + Tailwind CSS; React Router; TanStack Query for server state; Firebase SDK for auth.
- Deployment: Frontend on Netlify; Backend on Fly.io; add env vars for DB connection, Firebase `ProjectId`/issuer, R2 keys; enable HTTPS.
- Tooling: VS Code REST Client, `.env` management, ESLint/Prettier, `dotnet format`.

### Key Free Tier Notes & Caveats
- Firebase Auth: Email link and OAuth are free; phone auth billed. Ensure domain is whitelisted.
- Cloudflare R2: Free storage up to ~10GB; egress to Internet may have limits—egress to Cloudflare services is free; measure download traffic.
- Neon Postgres: Free compute/storage tiers with cold resume on inactivity; connection limits apply; use pooling.
- Fly.io: Free VM resources limited; consider region near you; watch for app sleeping or OOM on low RAM.
- Netlify/Vercel: Build minutes and bandwidth have limits; fine for small MVP; avoid large files.