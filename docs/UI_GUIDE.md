# Authentication UI - Visual Guide

## Sign In Page

The new sign-in page provides a clean, professional interface with multiple authentication options.

### Layout

```
┌─────────────────────────────────────┐
│                                     │
│        Recipe Manager               │
│   Save and organize your            │
│      favorite recipes               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Email/Password Form       │   │
│  │                             │   │
│  │  Email:                     │   │
│  │  [_____________________]    │   │
│  │                             │   │
│  │  Password:                  │   │
│  │  [_____________________]    │   │
│  │                             │   │
│  │  [Sign In Button]           │   │
│  │                             │   │
│  │  Don't have an account?     │   │
│  │  Sign up                    │   │
│  │                             │   │
│  │  ───── Or continue with ───── │   │
│  │                             │   │
│  │  [Sign in with Google]      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Sign Up Page

Click "Don't have an account? Sign up" to switch to registration mode.

```
┌─────────────────────────────────────┐
│                                     │
│        Recipe Manager               │
│   Save and organize your            │
│      favorite recipes               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Create Account Form       │   │
│  │                             │   │
│  │  Email:                     │   │
│  │  [_____________________]    │   │
│  │                             │   │
│  │  Password:                  │   │
│  │  [_____________________]    │   │
│  │                             │   │
│  │  Confirm Password:          │   │
│  │  [_____________________]    │   │
│  │                             │   │
│  │  [Create Account Button]    │   │
│  │                             │   │
│  │  Already have an account?   │   │
│  │  Sign in                    │   │
│  │                             │   │
│  │  ───── Or continue with ───── │   │
│  │                             │   │
│  │  [Sign in with Google]      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Error States

When an error occurs, a red error message appears above the buttons:

```
┌─────────────────────────────┐
│  Email:                     │
│  [user@example.com______]   │
│                             │
│  Password:                  │
│  [••••••••••____________]   │
│                             │
│  ┌─────────────────────┐   │
│  │ ⚠️ Incorrect password│   │
│  └─────────────────────┘   │
│                             │
│  [Sign In Button]           │
└─────────────────────────────┘
```

## UI Features

### Color Scheme
- **Primary Blue:** `#2563eb` (Sign In button, links)
- **Red Accent:** `#dc2626` (Sign Out button, error messages)
- **Gray Backgrounds:** `#f9fafb` (page background)
- **White Cards:** `#ffffff` (form container)

### Styling
- Rounded corners on inputs and buttons
- Subtle shadows on cards
- Smooth hover transitions
- Focus states on inputs (blue outline)
- Disabled states for loading

### Responsive Design
- Mobile-friendly layout
- Centered on all screen sizes
- Maximum width: 28rem (448px)
- Padding adjusts for mobile

### Accessibility
- Proper label associations
- Focus management
- Clear error messages
- Button states (disabled during loading)
- Keyboard navigation support

## User Flow

### New User Registration
1. **Initial State:** User sees sign-in form
2. **Action:** Click "Don't have an account? Sign up"
3. **Form Updates:** Sign-up mode with password confirmation
4. **Input:** Enter email, password, confirm password
5. **Submit:** Click "Create Account"
6. **Success:** Automatically signed in and redirected

### Existing User Sign-In
1. **Initial State:** User sees sign-in form
2. **Input:** Enter email and password
3. **Submit:** Click "Sign In"
4. **Success:** Authenticated and redirected

### Google OAuth Flow
1. **Initial State:** User sees sign-in form (either mode)
2. **Action:** Click "Sign in with Google"
3. **Popup:** Google account selection appears
4. **Selection:** Choose Google account
5. **Permissions:** Grant access (first time only)
6. **Success:** Authenticated and redirected

### Error Recovery
1. **Wrong Password:**
   - Error: "Incorrect password"
   - Action: Re-enter password or use password reset

2. **Email Not Found:**
   - Error: "No account found with this email. Please sign up."
   - Action: Click "Sign up" link below form

3. **Email Already Exists:**
   - Error: "This email is already registered. Please sign in instead."
   - Action: Click "Sign in" link below form

4. **Weak Password:**
   - Error: "Password must be at least 6 characters"
   - Action: Enter a longer password

5. **Passwords Don't Match:**
   - Error: "Passwords do not match"
   - Action: Re-enter confirmation password

## Component Structure

```
Landing.jsx
  └── AuthForm.jsx (shown when not authenticated)
      ├── Email Input Field
      ├── Password Input Field
      ├── Confirm Password Field (sign-up only)
      ├── Error Message Display (conditional)
      ├── Submit Button (Sign In / Create Account)
      ├── Toggle Link (Sign up / Sign in)
      ├── Divider ("Or continue with")
      └── Google Sign-In Button
```

## State Management

The form maintains these states:
- `isSignUp` - Boolean toggling between sign-in and sign-up modes
- `email` - User's email input
- `password` - User's password input
- `confirmPassword` - Password confirmation (sign-up only)
- `error` - Error message to display
- `loading` - Loading state during authentication

## Button States

### Primary Button (Email/Password)
- **Default:** Blue background, white text
- **Hover:** Darker blue background
- **Loading:** Gray background, disabled cursor
- **Text Changes:**
  - Sign-in mode: "Sign In"
  - Sign-up mode: "Create Account"
  - Loading: "Please wait..."

### Google Button
- **Default:** White background, gray border, gray text with Google icon
- **Hover:** Light gray background
- **Loading:** Light gray background, disabled cursor

## Form Validation

### Client-Side Validation
- ✅ Email format validation (HTML5)
- ✅ Password minimum length (6 characters)
- ✅ Password confirmation match
- ✅ Required field validation

### Server-Side Validation
- ✅ Email uniqueness (sign-up)
- ✅ Email existence (sign-in)
- ✅ Password correctness (sign-in)
- ✅ Password strength (Firebase rules)

## Testing Notes

### Manual Testing Checklist
- [ ] Form switches between sign-in and sign-up modes
- [ ] Email field accepts valid email addresses
- [ ] Password field obscures input
- [ ] Confirm password only shows in sign-up mode
- [ ] Submit button disables during loading
- [ ] Error messages display correctly
- [ ] Google button triggers OAuth popup
- [ ] Successful auth redirects to main app
- [ ] Form clears password fields when switching modes

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Labels properly associated
- [ ] Error announcements clear
