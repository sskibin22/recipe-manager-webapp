import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Authentication form component - handles sign in and sign up
 * @returns {JSX.Element}
 */
const AuthForm = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim()) {
          setError("First name and last name are required");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        const displayName = `${firstName.trim()} ${lastName.trim()}`;
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      console.error("Authentication error:", err);

      // User-friendly error messages
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else if (err.code === "auth/operation-not-allowed") {
        setError(
          "Email/Password authentication is not enabled. Please enable it in Firebase Console.",
        );
      } else {
        setError(
          `Authentication failed: ${err.message || "Please try again."}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {isSignUp && (
          <>
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-warmgray-700 mb-1"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className="w-full px-3 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
                placeholder="John"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-warmgray-700 mb-1"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                className="w-full px-3 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-warmgray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-3 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-warmgray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="w-full px-3 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        {isSignUp && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-warmgray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
        )}

        {error && (
          <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded-lg">
            <p className="text-sm text-terracotta-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors disabled:bg-wood-400 disabled:cursor-not-allowed font-medium shadow-warm"
        >
          {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      {/* Toggle Sign In / Sign Up */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setFirstName("");
            setLastName("");
            setPassword("");
            setConfirmPassword("");
          }}
          className="text-sm text-terracotta-600 hover:text-terracotta-700 hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-wood-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-cream-100 text-warmgray-500">Or continue with</span>
        </div>
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full px-4 py-2 bg-cream-50 border border-wood-300 text-warmgray-700 rounded-lg hover:bg-wood-50 transition-colors disabled:bg-wood-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
};

export default AuthForm;
