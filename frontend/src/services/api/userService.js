/**
 * @typedef {import('../../types/user').UserProfile} UserProfile
 */

import { apiClient } from "./apiClient";

/**
 * Get current user profile
 * @returns {Promise<UserProfile>} User profile data
 */
const getProfile = async () => {
  const response = await apiClient.get("/api/user/profile");
  return response.data;
};

/**
 * Update user profile
 * @param {Partial<UserProfile>} profileData - Profile data to update
 * @returns {Promise<UserProfile>} Updated user profile
 */
const updateProfile = async (profileData) => {
  const response = await apiClient.put("/api/user/profile", profileData);
  return response.data;
};

export const userService = {
  getProfile,
  updateProfile,
};
