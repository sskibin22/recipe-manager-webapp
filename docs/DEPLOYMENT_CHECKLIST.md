# Production Deployment Checklist

Use this checklist to track your deployment progress. Check off items as you complete them.

---

## 📋 Pre-Deployment

- [ ] Repository pushed to GitHub
- [ ] GitHub account created
- [ ] Google account ready
- [ ] Credit/debit card ready for service verification
- [ ] Read full deployment guide ([PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md))

---

## 🔥 Phase 1: Firebase Setup

- [ ] Created Firebase project
- [ ] Enabled Email/Password authentication
- [ ] Enabled Google OAuth
- [ ] (Optional) Enabled GitHub OAuth
- [ ] Registered web app in Firebase
- [ ] Copied Firebase config (API Key, Project ID, Auth Domain)
- [ ] Saved Firebase credentials securely

---

## 🐘 Phase 2: Neon PostgreSQL Setup

- [ ] Created Neon account
- [ ] Created new database project
- [ ] Selected appropriate region
- [ ] Copied connection string (pooled)
- [ ] Saved connection string securely
- [ ] Verified database connection in SQL editor

---

## ☁️ Phase 3: Cloudflare R2 Setup

- [ ] Created Cloudflare account
- [ ] Enabled R2 storage
- [ ] Added payment method (for verification)
- [ ] Created R2 bucket with unique name
- [ ] Configured CORS policy on bucket
- [ ] Created API token with Object Read & Write permissions
- [ ] Copied Account ID, Access Key ID, Secret Access Key
- [ ] Saved R2 credentials securely

---

## 🚀 Phase 4: Backend Deployment (Fly.io)

- [ ] Installed Fly.io CLI (`fly version` works)
- [ ] Created Fly.io account and logged in (`fly auth login`)
- [ ] Created `Dockerfile` in `/backend` directory
- [ ] Initialized Fly.io app (`fly launch`)
- [ ] Configured `fly.toml` file
- [ ] Set all secrets in Fly.io:
  - [ ] Database connection string
  - [ ] Firebase Project ID and Audience
  - [ ] R2 Account ID, Access Key ID, Secret Access Key, Bucket Name
  - [ ] CORS allowed origins
  - [ ] ASPNETCORE_ENVIRONMENT=Production
- [ ] Applied database migrations to Neon database
- [ ] Deployed backend to Fly.io (`fly deploy`)
- [ ] Verified deployment (`fly status`)
- [ ] Tested health endpoint (`/health` returns "Healthy")
- [ ] Saved backend URL (e.g., `https://recipemanager-api.fly.dev`)

---

## 🌐 Phase 5: Frontend Deployment (Netlify)

- [ ] Created `netlify.toml` in `/frontend` directory
- [ ] Verified `.env.local` is in `.gitignore`
- [ ] Committed and pushed `netlify.toml` to GitHub
- [ ] Created Netlify account (signed up with GitHub)
- [ ] Connected repository to Netlify
- [ ] Configured build settings (base: `frontend`, build: `npm run build`, publish: `frontend/dist`)
- [ ] Set environment variables in Netlify:
  - [ ] `VITE_API_BASE_URL` (Fly.io backend URL)
  - [ ] `VITE_FIREBASE_API_KEY`
  - [ ] `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] `VITE_FIREBASE_PROJECT_ID`
  - [ ] `VITE_BYPASS_AUTH=false` (or omitted)
- [ ] Deployed frontend to Netlify
- [ ] Verified deployment successful
- [ ] Customized site name (optional)
- [ ] Saved frontend URL (e.g., `https://recipemanager.netlify.app`)

---

## 🔧 Phase 6: Final Configuration

- [ ] Updated backend CORS with Netlify URL (`fly secrets set Cors__AllowedOrigins__0=...`)
- [ ] Updated R2 CORS policy with Netlify URL
- [ ] Added Netlify domain to Firebase authorized domains
- [ ] Redeployed backend (`fly deploy`)
- [ ] Verified frontend loads at Netlify URL

---

## ✅ Phase 7: Testing & Verification

### Authentication Tests
- [ ] Visited frontend URL
- [ ] Tested email/password sign up
- [ ] Tested email/password sign in
- [ ] Tested Google OAuth sign in
- [ ] Verified authentication token works with backend

### Recipe CRUD Tests
- [ ] Created recipe from link
- [ ] Created manual recipe
- [ ] Uploaded recipe document (PDF/image)
- [ ] Viewed recipe list
- [ ] Viewed recipe detail page
- [ ] Edited recipe
- [ ] Deleted recipe

### Feature Tests
- [ ] Searched for recipes
- [ ] Favorited recipe
- [ ] Unfavorited recipe
- [ ] Filtered by favorites
- [ ] Verified categories work (if implemented)
- [ ] Verified tags work (if implemented)

### Infrastructure Tests
- [ ] Checked backend logs (`fly logs`)
- [ ] Verified data in Neon database (SQL Editor)
- [ ] Verified files in R2 bucket
- [ ] Checked Netlify deployment logs
- [ ] No console errors in browser DevTools

---

## 🔐 Security Checklist

- [ ] All secrets stored securely (password manager)
- [ ] No secrets committed to Git
- [ ] CORS uses specific origins (not `*`)
- [ ] Firebase authorized domains configured
- [ ] R2 CORS policy configured
- [ ] HTTPS enforced everywhere (automatic with Netlify/Fly.io)
- [ ] Database uses SSL connection (`sslmode=require`)
- [ ] Strong database password
- [ ] Development auth bypass disabled in production

---

## 📊 Monitoring Setup

- [ ] Bookmarked backend URL
- [ ] Bookmarked frontend URL
- [ ] Bookmarked Firebase Console
- [ ] Bookmarked Neon Console
- [ ] Bookmarked Cloudflare Dashboard
- [ ] Bookmarked Fly.io Dashboard
- [ ] Bookmarked Netlify Dashboard
- [ ] Tested `fly logs` command
- [ ] Know how to check Netlify deploy logs
- [ ] Know how to query Neon database

---

## 🎯 Optional Enhancements

- [ ] Set up custom domain
- [ ] Configure automatic backend deployments (GitHub Actions)
- [ ] Set up monitoring/alerting (e.g., Sentry, LogRocket)
- [ ] Configure database backups
- [ ] Add email verification to Firebase Auth
- [ ] Set up error tracking
- [ ] Configure CDN caching rules
- [ ] Add rate limiting to API endpoints

---

## 📝 Documentation

- [ ] Saved all credentials securely
- [ ] Documented service URLs
- [ ] Created runbook for common tasks
- [ ] Documented deployment process for team
- [ ] Added production URLs to README

---

## ✨ Success Criteria

Your deployment is successful when:

✅ Users can visit frontend URL and see landing page
✅ Users can sign up with email/password
✅ Users can sign in with Google OAuth
✅ Users can create recipes (all 3 types)
✅ Users can upload documents to R2
✅ Users can search and favorite recipes
✅ All features work without errors
✅ Backend health endpoint returns "Healthy"
✅ No errors in browser console
✅ No errors in backend logs

---

## 🆘 Troubleshooting

If something doesn't work:

1. **Check this list** - Did you skip any steps?
2. **Review logs** - Backend: `fly logs`, Frontend: Netlify deploy logs
3. **Verify environment variables** - Netlify dashboard and `fly secrets list`
4. **Check CORS** - Most common production issue
5. **Read the detailed guide** - [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)

---

## 🎉 Done!

Once all items are checked, your Recipe Manager is live in production!

**Share your success**: Tweet about it, show it to friends, add it to your portfolio!

---

**Last Updated**: January 12, 2026
