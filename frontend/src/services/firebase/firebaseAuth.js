import {
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
import { auth } from "./firebaseConfig";

export const authService = {
  // Google Sign-In
  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  },

  // GitHub Sign-In
  signInWithGithub: async () => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      throw error;
    }
  },

  // Email/Password Sign-In
  signInWithEmail: async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("Email sign-in error:", error);
      throw error;
    }
  },

  // Email/Password Sign-Up
  signUpWithEmail: async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Update profile with display name
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      return result.user;
    } catch (error) {
      console.error("Email sign-up error:", error);
      throw error;
    }
  },

  // Send Sign-In Link to Email
  sendSignInLink: async (email, redirectUrl) => {
    const actionCodeSettings = {
      url: redirectUrl,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
    } catch (error) {
      console.error("Send sign-in link error:", error);
      throw error;
    }
  },

  // Complete Sign-In with Email Link
  completeSignInWithEmailLink: async (emailLink) => {
    const email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
      throw new Error("Email not found in localStorage");
    }

    try {
      const result = await signInWithEmailLink(auth, email, emailLink);
      window.localStorage.removeItem("emailForSignIn");
      return result.user;
    } catch (error) {
      console.error("Complete sign-in with email link error:", error);
      throw error;
    }
  },

  // Sign Out
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  },

  // Auth State Observer
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get ID Token
  getIdToken: async (user) => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error("Get ID token error:", error);
      return null;
    }
  },
};
