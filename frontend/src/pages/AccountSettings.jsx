import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile, updateUserProfile, getErrorMessage } from "../services/api";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import { getAuth } from "firebase/auth";

/**
 * Account settings page component - user profile and password management
 * @returns {JSX.Element}
 */
const AccountSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setFormData((prev) => ({
          ...prev,
          displayName: profile.displayName || "",
          email: profile.email || "",
        }));
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage({ type: "", text: "" });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      // Update display name in Firebase
      if (formData.displayName !== user.displayName) {
        await updateProfile(currentUser, {
          displayName: formData.displayName,
        });
      }

      // Update email in Firebase
      if (formData.email !== user.email) {
        await updateEmail(currentUser, formData.email);
      }

      // Update profile in backend
      await updateUserProfile({
        displayName: formData.displayName,
        email: formData.email,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      await updatePassword(currentUser, formData.newPassword);

      setMessage({ type: "success", text: "Password updated successfully!" });
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Error updating password:", error);
      let errorMessage = "Failed to update password. Please try again.";

      if (error.code === "auth/requires-recent-login") {
        errorMessage =
          "Please sign out and sign in again before changing your password.";
      }

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-warmgray-600 hover:text-warmgray-900 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Recipes
        </button>
      </div>

      <div className="bg-cream-100 shadow-warm rounded-xl p-6 border border-wood-200">
        <h1 className="text-3xl font-serif font-bold text-warmgray-900 mb-6">
          Account Settings
        </h1>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success"
                ? "bg-sage-50 text-sage-800 border border-sage-200"
                : "bg-terracotta-50 text-terracotta-800 border border-terracotta-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Settings */}
        <section className="mb-8">
          <h2 className="text-xl font-serif font-semibold text-warmgray-800 mb-4">
            Profile Information
          </h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-warmgray-700 mb-1"
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-warmgray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 disabled:bg-wood-400 disabled:cursor-not-allowed transition-colors shadow-warm"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </section>

        <hr className="my-8 border-wood-200" />

        {/* Password Settings */}
        <section>
          <h2 className="text-xl font-serif font-semibold text-warmgray-800 mb-4">
            Change Password
          </h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-warmgray-700 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
                placeholder="Enter new password"
                minLength="6"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-warmgray-700 mb-1"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
                placeholder="Confirm new password"
                minLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.newPassword}
              className="px-6 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 disabled:bg-wood-400 disabled:cursor-not-allowed transition-colors shadow-warm"
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AccountSettings;
