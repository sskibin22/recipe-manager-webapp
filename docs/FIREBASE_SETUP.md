# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with Email/Password and Google sign-in for the Recipe Manager application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "Recipe Manager")
   - Enable Google Analytics (optional)
   - Click **"Create project"**

## Step 2: Enable Email/Password Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click the **"Get started"** button if this is your first time
3. Go to the **"Sign-in method"** tab
4. Find **"Email/Password"** in the list of providers
5. Click on it and toggle the switch to **"Enable"**
6. Click **"Save"**

### Email/Password Features
- ✅ Users can create accounts with email and password
- ✅ Firebase automatically handles password hashing and security
- ✅ Minimum password length is 6 characters
- ✅ Email verification can be enabled (optional)

## Step 3: Enable Google Sign-In (Optional)

1. In the **"Sign-in method"** tab, find **"Google"**
2. Click on it and toggle the switch to **"Enable"**
3. Select a **Project support email** from the dropdown
4. Click **"Save"**

## Step 4: Register Your Web App

1. Go to **Project Settings** (click the gear icon ⚙️ next to "Project Overview")
2. Scroll down to **"Your apps"** section
3. Click the **web icon** (`</>`) to add a web app
4. Enter a nickname (e.g., "Recipe Manager Web")
5. Check **"Also set up Firebase Hosting"** (optional)
6. Click **"Register app"**

## Step 5: Get Your Firebase Configuration

After registering your app, you'll see a Firebase configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**Copy these values** - you'll need them for the next step.

## Step 6: Configure Your Application

### Backend Configuration

Edit `backend/appsettings.Development.json`:

```json
{
  "Firebase": {
    "ProjectId": "your-project-id",
    "Audience": "your-project-id"
  }
}
```

Or use user secrets (recommended for production):

```bash
cd backend
dotnet user-secrets set "Firebase:ProjectId" "your-project-id"
dotnet user-secrets set "Firebase:Audience" "your-project-id"
```

### Frontend Configuration

Edit `frontend/.env.local`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

**Important:** If you're using the development authentication bypass (`VITE_BYPASS_AUTH=true`), you can skip the Firebase configuration for local testing.

## Step 7: Test Authentication

### Testing Email/Password Sign Up

1. Start both backend and frontend servers
2. Navigate to the sign-in page
3. Click **"Don't have an account? Sign up"**
4. Enter an email and password (minimum 6 characters)
5. Confirm the password
6. Click **"Create Account"**
7. You should be automatically signed in

### Testing Email/Password Sign In

1. On the sign-in page, enter your registered email and password
2. Click **"Sign In"**
3. You should be authenticated and redirected to the app

### Testing Google Sign In

1. On the sign-in page, click **"Sign in with Google"**
2. A popup will appear to select your Google account
3. Select an account and grant permissions
4. You should be authenticated and redirected to the app

## Troubleshooting

### "auth/email-already-in-use" Error
This means the email is already registered. Use the sign-in form instead of sign-up.

### "auth/invalid-credential" Error
This usually means:
- Wrong password for the email
- User doesn't exist (use sign-up instead)

### "auth/configuration-not-found" Error
Firebase Email/Password provider is not enabled. Go back to Step 2.

### Google Sign-In Not Working
Make sure you:
1. Enabled Google provider in Firebase Console
2. Selected a support email
3. Added your domain to authorized domains (usually automatic for localhost)

### "auth/unauthorized-domain" Error
Your domain isn't authorized:
1. Go to Firebase Console > Authentication > Settings
2. Add your domain under "Authorized domains"
3. For local development, `localhost` should already be there

## Security Best Practices

### For Development
- ✅ Use `.env.local` for frontend secrets (gitignored by default)
- ✅ Use user secrets for backend configuration
- ✅ Never commit API keys to Git
- ✅ Use development authentication bypass for rapid testing

### For Production
- ✅ Set up environment variables in your hosting platform
- ✅ Enable email verification (optional)
- ✅ Set up password reset flows
- ✅ Configure Firebase security rules (see below)
- ✅ Enable Firebase App Check to prevent abuse
- ✅ Set domain restrictions on API keys
- ✅ Enable reCAPTCHA for abuse prevention
- ✅ Monitor authentication logs in Firebase Console

### Firebase Security Rules
Configure security rules to protect your data:

**Firestore Example:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /recipes/{recipeId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
  }
}
```

**Storage Example:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recipes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase App Check
Enable App Check to protect against abuse:
1. Go to Firebase Console > App Check
2. Register your app with reCAPTCHA v3
3. Add the App Check SDK to your frontend:
```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```
4. Enforce App Check in Firebase Console for each service

### Domain Restrictions
Limit API key usage to authorized domains:
1. Firebase Console > Project Settings > API Keys
2. Click on your browser key
3. Under "Application restrictions", select "HTTP referrers"
4. Add your production domain (e.g., `https://yourapp.com/*`)
5. Keep `http://localhost:*` for development

For more security details, see [SECURITY_ENV_FILES.md](./SECURITY_ENV_FILES.md).

## Optional Enhancements

### Enable Email Verification

1. In Firebase Console > Authentication > Templates
2. Customize the email verification template
3. In your code, call `sendEmailVerification()` after sign-up
4. Check `user.emailVerified` before allowing access

### Enable Password Reset

1. In Firebase Console > Authentication > Templates
2. Customize the password reset email
3. Use `sendPasswordResetEmail(auth, email)` in your app
4. Create a password reset UI component

### Customize Email Templates

1. Go to Firebase Console > Authentication > Templates
2. Click on each template type (verification, password reset, etc.)
3. Customize the subject line and body
4. Add your app logo and branding

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Pricing](https://firebase.google.com/pricing) - Free tier is generous for small apps
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

## Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Check the Firebase Console > Authentication > Users to verify user creation
3. Review Firebase authentication logs for debugging
4. See DEVELOPMENT_AUTH.md for local development without Firebase
