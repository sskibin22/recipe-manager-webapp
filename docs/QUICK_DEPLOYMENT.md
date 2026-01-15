# Production Deployment Quick Start

**Time Required**: 2-3 hours  
**Cost**: $0/month (free tiers)  
**Difficulty**: Intermediate

---

## 🎯 What You're Building

```
User Browser → Netlify (Frontend) → Fly.io (Backend) → Neon (Database)
                                 ↓
                         Firebase (Auth) + R2 (Storage)
```

---

## ⚡ Quick Command Reference

### **Phase 1: Firebase (15 minutes)**
1. Create project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Email/Password and Google authentication
3. Register web app and copy config

### **Phase 2: Neon PostgreSQL (10 minutes)**
1. Sign up at [console.neon.tech](https://console.neon.tech/)
2. Create project → Copy connection string
3. Apply migrations:
   ```powershell
   $env:ConnectionStrings__DefaultConnection="postgres://..."
   dotnet ef database update --context ApplicationDbContext
   ```

### **Phase 3: Cloudflare R2 (15 minutes)**
1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/)
2. R2 → Create bucket → Configure CORS
3. Generate API token → Copy credentials

### **Phase 4: Deploy Backend to Fly.io (30 minutes)**

```powershell
# Install Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Initialize (from /backend directory)
cd backend
fly launch
# Answer: No to PostgreSQL, No to deploy now

# Set secrets
fly secrets set ConnectionStrings__DefaultConnection="postgres://..."
fly secrets set Firebase__ProjectId="your-project-id"
fly secrets set Firebase__Audience="your-project-id"
fly secrets set R2__AccountId="your-account-id"
fly secrets set R2__AccessKeyId="your-access-key"
fly secrets set R2__SecretAccessKey="your-secret-key"
fly secrets set R2__BucketName="your-bucket-name"
fly secrets set Cors__AllowedOrigins__0="https://recipemanager.netlify.app"
fly secrets set ASPNETCORE_ENVIRONMENT="Production"
fly secrets set ALLOWED_HOSTS="your-app.fly.dev"  # Security: Restrict allowed host headers

# Deploy
fly deploy

# Verify
fly status
fly open
```

### **Phase 5: Deploy Frontend to Netlify (20 minutes)**

1. Create `netlify.toml` in `/frontend`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Push to GitHub:
   ```powershell
   git add netlify.toml
   git commit -m "Add Netlify config"
   git push
   ```

3. Sign up at [netlify.com](https://www.netlify.com/) with GitHub
4. Import repository → Configure:
   - Base: `frontend`
   - Build: `npm run build`
   - Publish: `frontend/dist`
5. Add environment variables:
   - `VITE_API_BASE_URL` = `https://your-app.fly.dev`
   - `VITE_FIREBASE_API_KEY` = Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` = Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID` = Firebase project ID
   - `VITE_BYPASS_AUTH` = `false`
6. Deploy!

### **Phase 6: Final Updates (15 minutes)**

1. Update backend CORS:
   ```powershell
   fly secrets set Cors__AllowedOrigins__0="https://your-site.netlify.app"
   fly deploy
   ```

2. Update R2 CORS in Cloudflare dashboard

3. Add Netlify domain to Firebase authorized domains

### **Phase 7: Test Everything (15 minutes)**

✅ Sign up with email/password  
✅ Sign in with Google  
✅ Create recipe from link  
✅ Upload recipe document  
✅ Create manual recipe  
✅ Search recipes  
✅ Favorite recipe  

---

## 🔑 Credentials Tracker

Copy this template and fill in as you go:

```
=== FIREBASE ===
Project ID: _________________
API Key: _________________
Auth Domain: _________________

=== NEON DATABASE ===
Connection String: _________________

=== CLOUDFLARE R2 ===
Account ID: _________________
Bucket Name: _________________
Access Key ID: _________________
Secret Access Key: _________________

=== FLY.IO ===
App Name: _________________
Backend URL: https://_________________.fly.dev

=== NETLIFY ===
Site Name: _________________
Frontend URL: https://_________________.netlify.app
```

---

## 🚨 Common Issues

**Backend won't start:**
```powershell
fly logs  # Check for errors
fly secrets list  # Verify secrets are set
```

**Frontend shows network error:**
- Check `VITE_API_BASE_URL` in Netlify
- Verify CORS in backend includes Netlify URL

**Authentication fails:**
- Add Netlify domain to Firebase authorized domains
- Check Firebase config in Netlify environment variables

**Uploads fail:**
- Update R2 CORS with Netlify URL
- Verify R2 credentials in Fly.io secrets

---

## 📊 Service Dashboards

Bookmark these:
- Firebase: https://console.firebase.google.com/
- Neon: https://console.neon.tech/
- Cloudflare: https://dash.cloudflare.com/
- Fly.io: https://fly.io/dashboard
- Netlify: https://app.netlify.com/

---

## 🆘 Need More Help?

See the detailed guide: [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)

Use the checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

**Last Updated**: January 12, 2026
