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
 * @param {Error} error - The error object from an API call
 * @param {Object} [error.response] - The HTTP response object (Axios format)
 * @param {Object} [error.response.data] - The response body
 * @param {string} [error.response.data.detail] - RFC 7807 Problem Details: detailed error message
 * @param {string} [error.response.data.title] - RFC 7807 Problem Details: error title
 * @param {string} [error.response.data.message] - Legacy format: error message
 * @param {string} [error.message] - Fallback error message
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
export const fetchRecipes = async (searchQuery = "", categoryId = null, tagIds = []) => {
  const params = {};
  if (searchQuery) params.q = searchQuery;
  if (categoryId) params.category = categoryId;
  if (tagIds && tagIds.length > 0) params.tags = tagIds.join(',');
  
  const response = await apiClient.get("/api/recipes", { params });
  return response.data;
};

export const fetchRecipe = async (id) => {
  const response = await apiClient.get(`/api/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (recipeData) => {
  const response = await apiClient.post("/api/recipes", recipeData);
  return response.data;
};

export const updateRecipe = async ({ id, ...recipeData }) => {
  const response = await apiClient.put(`/api/recipes/${id}`, recipeData);
  return response.data;
};

export const deleteRecipe = async (id) => {
  await apiClient.delete(`/api/recipes/${id}`);
};

// Categories API
export const fetchCategories = async () => {
  const response = await apiClient.get("/api/categories");
  return response.data;
};

// Tags API
export const fetchTags = async () => {
  const response = await apiClient.get("/api/tags");
  return response.data;
};

// Favorite API
export const addFavorite = async (recipeId) => {
  const response = await apiClient.post(`/api/recipes/${recipeId}/favorite`);
  return response.data;
};

export const removeFavorite = async (recipeId) => {
  await apiClient.delete(`/api/recipes/${recipeId}/favorite`);
};

// Metadata API
export const fetchMetadata = async (url) => {
  const response = await apiClient.post("/api/recipes/fetch-metadata", { url });
  return response.data;
};

// Upload API
export const getPresignedUploadUrl = async (fileName, contentType) => {
  const response = await apiClient.post("/api/uploads/presign", {
    fileName,
    contentType,
  });
  return response.data;
};

export const getPresignedDownloadUrl = async (recipeId) => {
  const response = await apiClient.get("/api/uploads/presign-download", {
    params: { recipeId },
  });
  return response.data;
};

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
export const getUserProfile = async () => {
  const response = await apiClient.get("/api/user/profile");
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await apiClient.put("/api/user/profile", profileData);
  return response.data;
};

export default apiClient;
