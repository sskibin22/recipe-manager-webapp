import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "./firebaseAuth";
import * as firebaseAuth from "firebase/auth";

// Mock the logger module
vi.mock("../../utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the firebase/auth module
vi.mock("firebase/auth", () => ({
  signInWithPopup: vi.fn(),
  signInWithEmailLink: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({})),
  initializeApp: vi.fn(() => ({})),
}));

// Mock the firebaseConfig module
vi.mock("./firebaseConfig", () => ({
  auth: {},
  app: {},
}));

describe("authService", () => {
  let loggerMock;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock localStorage
    globalThis.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    // Get the mocked logger
    const { logger } = await import("../../utils/logger");
    loggerMock = logger;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("signInWithGoogle", () => {
    it("should sign in with Google successfully", async () => {
      const mockUser = {
        uid: "google-user-123",
        email: "google@example.com",
        displayName: "Google User",
      };
      const mockResult = { user: mockUser };
      firebaseAuth.signInWithPopup.mockResolvedValue(mockResult);

      const result = await authService.signInWithGoogle();

      expect(firebaseAuth.GoogleAuthProvider).toHaveBeenCalled();
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it("should handle Google sign-in error", async () => {
      const error = new Error("Google sign-in failed");
      firebaseAuth.signInWithPopup.mockRejectedValue(error);

      await expect(authService.signInWithGoogle()).rejects.toThrow(
        "Google sign-in failed",
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        "Google sign-in error:",
        error,
      );
    });
  });

  describe("signInWithGithub", () => {
    it("should sign in with GitHub successfully", async () => {
      const mockUser = {
        uid: "github-user-456",
        email: "github@example.com",
        displayName: "GitHub User",
      };
      const mockResult = { user: mockUser };
      firebaseAuth.signInWithPopup.mockResolvedValue(mockResult);

      const result = await authService.signInWithGithub();

      expect(firebaseAuth.GithubAuthProvider).toHaveBeenCalled();
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it("should handle GitHub sign-in error", async () => {
      const error = new Error("GitHub sign-in failed");
      firebaseAuth.signInWithPopup.mockRejectedValue(error);

      await expect(authService.signInWithGithub()).rejects.toThrow(
        "GitHub sign-in failed",
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        "GitHub sign-in error:",
        error,
      );
    });
  });

  describe("signInWithEmail", () => {
    it("should sign in with email and password successfully", async () => {
      const mockUser = {
        uid: "email-user-789",
        email: "user@example.com",
      };
      const mockResult = { user: mockUser };
      firebaseAuth.signInWithEmailAndPassword.mockResolvedValue(mockResult);

      const result = await authService.signInWithEmail(
        "user@example.com",
        "password123",
      );

      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it("should handle email sign-in error", async () => {
      const error = new Error("Invalid credentials");
      firebaseAuth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        authService.signInWithEmail("user@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid credentials");
      expect(loggerMock.error).toHaveBeenCalledWith("Email sign-in error:", error);
    });
  });

  describe("signUpWithEmail", () => {
    it("should sign up with email and password successfully", async () => {
      const mockUser = {
        uid: "new-user-001",
        email: "newuser@example.com",
      };
      const mockResult = { user: mockUser };
      firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue(
        mockResult,
      );
      firebaseAuth.updateProfile.mockResolvedValue(undefined);

      const result = await authService.signUpWithEmail(
        "newuser@example.com",
        "password123",
        "New User",
      );

      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: "New User",
      });
      expect(result).toBe(mockUser);
    });

    it("should sign up without display name", async () => {
      const mockUser = {
        uid: "new-user-002",
        email: "another@example.com",
      };
      const mockResult = { user: mockUser };
      firebaseAuth.createUserWithEmailAndPassword.mockResolvedValue(
        mockResult,
      );

      const result = await authService.signUpWithEmail(
        "another@example.com",
        "password123",
      );

      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(firebaseAuth.updateProfile).not.toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });

    it("should handle email sign-up error", async () => {
      const error = new Error("Email already exists");
      firebaseAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        authService.signUpWithEmail("existing@example.com", "password123"),
      ).rejects.toThrow("Email already exists");
      expect(loggerMock.error).toHaveBeenCalledWith("Email sign-up error:", error);
    });
  });

  describe("sendSignInLink", () => {
    it("should send sign-in link successfully", async () => {
      firebaseAuth.sendSignInLinkToEmail.mockResolvedValue(undefined);

      await authService.sendSignInLink(
        "user@example.com",
        "https://example.com/callback",
      );

      expect(firebaseAuth.sendSignInLinkToEmail).toHaveBeenCalledWith(
        {},
        "user@example.com",
        {
          url: "https://example.com/callback",
          handleCodeInApp: true,
        },
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "emailForSignIn",
        "user@example.com",
      );
    });

    it("should handle send sign-in link error", async () => {
      const error = new Error("Failed to send link");
      firebaseAuth.sendSignInLinkToEmail.mockRejectedValue(error);

      await expect(
        authService.sendSignInLink("user@example.com", "https://example.com"),
      ).rejects.toThrow("Failed to send link");
      expect(loggerMock.error).toHaveBeenCalledWith(
        "Send sign-in link error:",
        error,
      );
    });
  });

  describe("completeSignInWithEmailLink", () => {
    it("should complete sign-in with email link successfully", async () => {
      const mockUser = {
        uid: "link-user-123",
        email: "user@example.com",
      };
      const mockResult = { user: mockUser };
      localStorage.getItem.mockReturnValue("user@example.com");
      firebaseAuth.signInWithEmailLink.mockResolvedValue(mockResult);

      const result =
        await authService.completeSignInWithEmailLink("https://example.com");

      expect(localStorage.getItem).toHaveBeenCalledWith("emailForSignIn");
      expect(firebaseAuth.signInWithEmailLink).toHaveBeenCalledWith(
        {},
        "user@example.com",
        "https://example.com",
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith("emailForSignIn");
      expect(result).toBe(mockUser);
    });

    it("should throw error when email not found in localStorage", async () => {
      localStorage.getItem.mockReturnValue(null);

      await expect(
        authService.completeSignInWithEmailLink("https://example.com"),
      ).rejects.toThrow("Email not found in localStorage");
    });

    it("should handle complete sign-in error", async () => {
      const error = new Error("Invalid link");
      localStorage.getItem.mockReturnValue("user@example.com");
      firebaseAuth.signInWithEmailLink.mockRejectedValue(error);

      await expect(
        authService.completeSignInWithEmailLink("https://example.com"),
      ).rejects.toThrow("Invalid link");
      expect(loggerMock.error).toHaveBeenCalledWith(
        "Complete sign-in with email link error:",
        error,
      );
    });
  });

  describe("signOut", () => {
    it("should sign out successfully", async () => {
      firebaseAuth.signOut.mockResolvedValue(undefined);

      await authService.signOut();

      expect(firebaseAuth.signOut).toHaveBeenCalled();
    });

    it("should handle sign-out error", async () => {
      const error = new Error("Sign-out failed");
      firebaseAuth.signOut.mockRejectedValue(error);

      await expect(authService.signOut()).rejects.toThrow("Sign-out failed");
      expect(loggerMock.error).toHaveBeenCalledWith("Sign-out error:", error);
    });
  });

  describe("onAuthStateChanged", () => {
    it("should set up auth state observer", () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      firebaseAuth.onAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = authService.onAuthStateChanged(mockCallback);

      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(
        {},
        mockCallback,
      );
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe("getIdToken", () => {
    it("should get ID token from user", async () => {
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue("mock-token-123"),
      };

      const token = await authService.getIdToken(mockUser);

      expect(mockUser.getIdToken).toHaveBeenCalled();
      expect(token).toBe("mock-token-123");
    });

    it("should return null when user is null", async () => {
      const token = await authService.getIdToken(null);

      expect(token).toBeNull();
    });

    it("should return null on error", async () => {
      const mockUser = {
        getIdToken: vi.fn().mockRejectedValue(new Error("Token error")),
      };

      const token = await authService.getIdToken(mockUser);

      expect(token).toBeNull();
      expect(loggerMock.error).toHaveBeenCalledWith(
        "Get ID token error:",
        expect.any(Error),
      );
    });
  });
});
