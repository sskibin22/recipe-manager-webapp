/**
 * @typedef {import('../../types/api').ApiError} ApiError
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let getTokenFunction = null;

/**
 * Set the function to retrieve authentication token
 * @param {() => Promise<string|null>} tokenGetter - Function that returns a promise resolving to the auth token
 */
export const setTokenGetter = (tokenGetter) => {
  getTokenFunction = tokenGetter;
};

// Request interceptor for authentication
apiClient.interceptors.request.use(
  async (config) => {
    if (getTokenFunction) {
      const token = await getTokenFunction();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Extracts a user-friendly error message from an error object.
 * Supports both RFC 7807 Problem Details format and legacy error format.
 * 
 * @param {ApiError} error - The error object from an API call
 * @returns {string} User-friendly error message
 * 
 * @example
 * // RFC 7807 format
 * getErrorMessage({ response: { data: { title: "Not Found", detail: "Recipe not found" } } })
 * // Returns: "Recipe not found"
 * 
 * @example
 * // Legacy format
 * getErrorMessage({ response: { data: { message: "Recipe not found" } } })
 * // Returns: "Recipe not found"
 * 
 * @example
 * // Fallback
 * getErrorMessage({ message: "Network Error" })
 * // Returns: "Network Error"
 */
export const getErrorMessage = (error) => {
  // Null/undefined safety check
  if (!error) {
    return "An unexpected error occurred";
  }

  if (error.response?.data) {
    // RFC 7807 Problem Details format (new)
    if (error.response.data.detail) {
      return error.response.data.detail;
    }
    // Problem Details with title only (fallback)
    if (error.response.data.title) {
      return error.response.data.title;
    }
    // Legacy format (old)
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }
  // Default fallback message
  return error.message || "An unexpected error occurred";
};
