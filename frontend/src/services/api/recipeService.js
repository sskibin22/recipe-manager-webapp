/**
 * @typedef {import('../../types/recipe').Recipe} Recipe
 * @typedef {import('../../types/recipe').RecipeCreateData} RecipeCreateData
 * @typedef {import('../../types/recipe').RecipeUpdateData} RecipeUpdateData
 * @typedef {import('../../types/recipe').MetadataResponse} MetadataResponse
 */

import { apiClient } from "./apiClient";

/**
 * Fetch all recipes with optional filters
 * @param {string} [searchQuery=""] - Search term to filter by title
 * @param {number|null} [categoryId=null] - Category ID to filter by
 * @param {number[]} [tagIds=[]] - Tag IDs to filter by (AND logic)
 * @param {boolean} [favoritesOnly=false] - Filter to show only favorited recipes
 * @returns {Promise<Recipe[]>} Array of recipes
 */
const getAll = async (searchQuery = "", categoryId = null, tagIds = [], favoritesOnly = false) => {
  const params = {};
  if (searchQuery) params.q = searchQuery;
  if (categoryId) params.category = categoryId;
  if (tagIds && tagIds.length > 0) params.tags = tagIds.join(',');
  if (favoritesOnly) params.favoritesOnly = true;
  
  const response = await apiClient.get("/api/recipes", { params });
  return response.data;
};

/**
 * Fetch single recipe by ID
 * @param {string} id - Recipe ID (GUID)
 * @returns {Promise<Recipe>} Recipe object
 */
const getById = async (id) => {
  const response = await apiClient.get(`/api/recipes/${id}`);
  return response.data;
};

/**
 * Create new recipe
 * @param {RecipeCreateData} recipeData - Recipe data
 * @returns {Promise<Recipe>} Created recipe
 */
const create = async (recipeData) => {
  const response = await apiClient.post("/api/recipes", recipeData);
  return response.data;
};

/**
 * Update existing recipe
 * @param {RecipeUpdateData} recipeData - Recipe data including ID
 * @returns {Promise<Recipe>} Updated recipe
 */
const update = async ({ id, ...recipeData }) => {
  const response = await apiClient.put(`/api/recipes/${id}`, recipeData);
  return response.data;
};

/**
 * Delete recipe by ID
 * @param {string} id - Recipe ID (GUID)
 * @returns {Promise<void>}
 */
const deleteRecipe = async (id) => {
  await apiClient.delete(`/api/recipes/${id}`);
};

/**
 * Add recipe to favorites
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<Object>} API response
 */
const addFavorite = async (recipeId) => {
  const response = await apiClient.post(`/api/recipes/${recipeId}/favorite`);
  return response.data;
};

/**
 * Remove recipe from favorites
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<void>}
 */
const removeFavorite = async (recipeId) => {
  await apiClient.delete(`/api/recipes/${recipeId}/favorite`);
};

/**
 * Fetch metadata from external URL
 * @param {string} url - External URL to fetch metadata from
 * @returns {Promise<MetadataResponse>} Extracted metadata
 */
const fetchMetadata = async (url) => {
  const response = await apiClient.post("/api/recipes/fetch-metadata", { url });
  return response.data;
};

export const recipeService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteRecipe,
  addFavorite,
  removeFavorite,
  fetchMetadata,
};

// Legacy export for backward compatibility
export const recipesApi = recipeService;
