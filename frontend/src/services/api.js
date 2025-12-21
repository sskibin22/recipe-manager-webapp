/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 * @typedef {import('../types/recipe').RecipeCreateData} RecipeCreateData
 * @typedef {import('../types/recipe').RecipeUpdateData} RecipeUpdateData
 * @typedef {import('../types/recipe').Category} Category
 * @typedef {import('../types/recipe').Tag} Tag
 * @typedef {import('../types/recipe').MetadataResponse} MetadataResponse
 * @typedef {import('../types/api').PresignedUploadResponse} PresignedUploadResponse
 * @typedef {import('../types/api').PresignedDownloadResponse} PresignedDownloadResponse
 * @typedef {import('../types/api').ApiError} ApiError
 * @typedef {import('../types/user').UserProfile} UserProfile
 */

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiClient = axios.create({
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
  (error) => {
    return Promise.reject(error);
  },
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

// Recipe API
/**
 * Fetch all recipes with optional filters
 * @param {string} [searchQuery=""] - Search term to filter by title
 * @param {number|null} [categoryId=null] - Category ID to filter by
 * @param {number[]} [tagIds=[]] - Tag IDs to filter by (AND logic)
 * @returns {Promise<Recipe[]>} Array of recipes
 */
export const fetchRecipes = async (searchQuery = "", categoryId = null, tagIds = []) => {
  const params = {};
  if (searchQuery) params.q = searchQuery;
  if (categoryId) params.category = categoryId;
  if (tagIds && tagIds.length > 0) params.tags = tagIds.join(',');
  
  const response = await apiClient.get("/api/recipes", { params });
  return response.data;
};

/**
 * Fetch single recipe by ID
 * @param {string} id - Recipe ID (GUID)
 * @returns {Promise<Recipe>} Recipe object
 */
export const fetchRecipe = async (id) => {
  const response = await apiClient.get(`/api/recipes/${id}`);
  return response.data;
};

/**
 * Create new recipe
 * @param {RecipeCreateData} recipeData - Recipe data
 * @returns {Promise<Recipe>} Created recipe
 */
export const createRecipe = async (recipeData) => {
  const response = await apiClient.post("/api/recipes", recipeData);
  return response.data;
};

/**
 * Update existing recipe
 * @param {RecipeUpdateData} recipeData - Recipe data including ID
 * @returns {Promise<Recipe>} Updated recipe
 */
export const updateRecipe = async ({ id, ...recipeData }) => {
  const response = await apiClient.put(`/api/recipes/${id}`, recipeData);
  return response.data;
};

/**
 * Delete recipe by ID
 * @param {string} id - Recipe ID (GUID)
 * @returns {Promise<void>}
 */
export const deleteRecipe = async (id) => {
  await apiClient.delete(`/api/recipes/${id}`);
};

// Categories API
/**
 * Fetch all categories
 * @returns {Promise<Category[]>} Array of categories
 */
export const fetchCategories = async () => {
  const response = await apiClient.get("/api/categories");
  return response.data;
};

// Tags API
/**
 * Fetch all tags
 * @returns {Promise<Tag[]>} Array of tags
 */
export const fetchTags = async () => {
  const response = await apiClient.get("/api/tags");
  return response.data;
};

// Favorite API
/**
 * Add recipe to favorites
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<Object>} API response
 */
export const addFavorite = async (recipeId) => {
  const response = await apiClient.post(`/api/recipes/${recipeId}/favorite`);
  return response.data;
};

/**
 * Remove recipe from favorites
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<void>}
 */
export const removeFavorite = async (recipeId) => {
  await apiClient.delete(`/api/recipes/${recipeId}/favorite`);
};

// Metadata API
/**
 * Fetch metadata from external URL
 * @param {string} url - External URL to fetch metadata from
 * @returns {Promise<MetadataResponse>} Extracted metadata
 */
export const fetchMetadata = async (url) => {
  const response = await apiClient.post("/api/recipes/fetch-metadata", { url });
  return response.data;
};

// Upload API
/**
 * Get presigned upload URL for cloud storage
 * @param {string} fileName - Name of file to upload
 * @param {string} contentType - MIME type of file
 * @returns {Promise<PresignedUploadResponse>} Presigned upload URL and storage key
 */
export const getPresignedUploadUrl = async (fileName, contentType) => {
  const response = await apiClient.post("/api/uploads/presign", {
    fileName,
    contentType,
  });
  return response.data;
};

/**
 * Get presigned download URL for cloud storage
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<PresignedDownloadResponse>} Presigned download URL
 */
export const getPresignedDownloadUrl = async (recipeId) => {
  const response = await apiClient.get("/api/uploads/presign-download", {
    params: { recipeId },
  });
  return response.data;
};

/**
 * Upload file to presigned URL
 * @param {string} presignedUrl - Presigned upload URL
 * @param {File} file - File object to upload
 * @returns {Promise<void>}
 */
export const uploadToPresignedUrl = async (presignedUrl, file) => {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
};

// Object-style API exports for component compatibility
export const recipesApi = {
  getAll: fetchRecipes,
  getById: fetchRecipe,
  create: createRecipe,
  update: updateRecipe,
  delete: deleteRecipe,
  addFavorite,
  removeFavorite,
  fetchMetadata,
};

export const categoriesApi = {
  getAll: fetchCategories,
};

export const tagsApi = {
  getAll: fetchTags,
};

export const uploadsApi = {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  uploadToPresignedUrl,
};

// User Profile API
/**
 * Get current user profile
 * @returns {Promise<UserProfile>} User profile data
 */
export const getUserProfile = async () => {
  const response = await apiClient.get("/api/user/profile");
  return response.data;
};

/**
 * Update user profile
 * @param {Partial<UserProfile>} profileData - Profile data to update
 * @returns {Promise<UserProfile>} Updated user profile
 */
export const updateUserProfile = async (profileData) => {
  const response = await apiClient.put("/api/user/profile", profileData);
  return response.data;
};

export default apiClient;
