import { createContext, useContext, useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Real Firebase user signed in - clear the sign-out flag
        hasSignedOut.current = false;
        const token = await firebaseUser.getIdToken();
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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Email sign-in error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // Update the user's profile with the display name (e.g., "John Doe")
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }
    } catch (error) {
      console.error("Email sign-up error:", error);
      throw error;
    }
  };

  const sendEmailLink = async (email) => {
    const actionCodeSettings = {
      url: window.location.origin + "/auth/callback",
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
    } catch (error) {
      console.error("Email link error:", error);
      throw error;
    }
  };

  const completeEmailSignIn = async () => {
    if (signInWithEmailLink(auth, window.location.href)) {
      const email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        throw new Error("Email not found. Please try signing in again.");
      }
      try {
        await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem("emailForSignIn");
      } catch (error) {
        console.error("Complete email sign-in error:", error);
        throw error;
      }
    }
  };

  const signOut = async () => {
    // Mark that user has explicitly signed out
    hasSignedOut.current = true;
    
    try {
      // Always try to sign out of Firebase (in case user is logged in with real account)
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      // Even if Firebase sign-out fails, still clear the user state
    }
    
    // Always clear the user state on sign out
    setUser(null);
    setIdToken(null);
  };

  const getToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
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
