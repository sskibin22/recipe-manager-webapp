import { createContext, useContext, useState, useEffect, useRef } from "react";
import { authService } from "../services/firebase/firebaseAuth";
import { auth } from "../services/firebase/firebaseConfig";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);
  
  // Track if user manually signed out (to prevent auto-restoring Dev User)
  const hasSignedOut = useRef(false);

  // Development mode bypass
  const isDevelopment = import.meta.env.DEV;
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";

  useEffect(() => {
    // Development auth bypass - set dev user initially but still listen for real auth
    if (isDevelopment && bypassAuth && !hasSignedOut.current) {
      setUser({
        uid: "dev-user-001",
        email: "dev@localhost.com",
        displayName: "Dev User",
        photoURL: null,
      });
      setIdToken("dev-token");
      setLoading(false);
      // Don't return early - still set up Firebase listener below
    }

    // Always set up Firebase auth listener (even in bypass mode)
    // This allows signing out of Dev User and into a real account
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Real Firebase user signed in - clear the sign-out flag
        hasSignedOut.current = false;
        const token = await authService.getIdToken(firebaseUser);
        setIdToken(token);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        // No Firebase user - clear the user state
        setUser(null);
        setIdToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isDevelopment, bypassAuth]);

  const signInWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      await authService.signInWithGithub();
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      await authService.signInWithEmail(email, password);
    } catch (error) {
      console.error("Email sign-in error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      await authService.signUpWithEmail(email, password, displayName);
    } catch (error) {
      console.error("Email sign-up error:", error);
      throw error;
    }
  };

  const sendEmailLink = async (email) => {
    const redirectUrl = window.location.origin + "/auth/callback";
    try {
      await authService.sendSignInLink(email, redirectUrl);
    } catch (error) {
      console.error("Email link error:", error);
      throw error;
    }
  };

  const completeEmailSignIn = async () => {
    try {
      await authService.completeSignInWithEmailLink(window.location.href);
    } catch (error) {
      console.error("Complete email sign-in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    // Mark that user has explicitly signed out
    hasSignedOut.current = true;

    try {
      // Always try to sign out of Firebase (in case user is logged in with real account)
      await authService.signOut();
    } catch (error) {
      console.error("Sign-out error:", error);
      // Even if Firebase sign-out fails, still clear the user state
    }

    // Always clear the user state on sign out
    setUser(null);
    setIdToken(null);
  };

  const getToken = async () => {
    // Use the auth service for consistency
    return await authService.getIdToken(auth.currentUser);
  };

  const value = {
    user,
    loading,
    idToken,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    sendEmailLink,
    completeEmailSignIn,
    signOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
