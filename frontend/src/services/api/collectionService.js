/**
 * @typedef {Object} Collection
 * @property {string} id - Collection ID (GUID)
 * @property {string} userId - User ID (GUID)
 * @property {string} name - Collection name
 * @property {string} [description] - Optional description
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {number} recipeCount - Number of recipes in collection
 */

/**
 * @typedef {Object} CreateCollectionData
 * @property {string} name - Collection name
 * @property {string} [description] - Optional description
 */

import { apiClient } from "./apiClient";

/**
 * Get all collections for the current user
 * @returns {Promise<Collection[]>} Array of collections
 */
const getAll = async () => {
  const response = await apiClient.get("/api/collections");
  return response.data;
};

/**
 * Get single collection by ID
 * @param {string} id - Collection ID (GUID)
 * @returns {Promise<Collection>} Collection object
 */
const getById = async (id) => {
  const response = await apiClient.get(`/api/collections/${id}`);
  return response.data;
};

/**
 * Create new collection
 * @param {CreateCollectionData} collectionData - Collection data
 * @returns {Promise<Collection>} Created collection
 */
const create = async (collectionData) => {
  const response = await apiClient.post("/api/collections", collectionData);
  return response.data;
};

/**
 * Update existing collection
 * @param {string} id - Collection ID (GUID)
 * @param {CreateCollectionData} collectionData - Collection data
 * @returns {Promise<Collection>} Updated collection
 */
const update = async (id, collectionData) => {
  const response = await apiClient.put(`/api/collections/${id}`, collectionData);
  return response.data;
};

/**
 * Delete collection
 * @param {string} id - Collection ID (GUID)
 * @returns {Promise<void>}
 */
const deleteCollection = async (id) => {
  await apiClient.delete(`/api/collections/${id}`);
};

/**
 * Get all recipes in a collection
 * @param {string} collectionId - Collection ID (GUID)
 * @returns {Promise<import('../../types/recipe').Recipe[]>} Array of recipes
 */
const getRecipes = async (collectionId) => {
  const response = await apiClient.get(`/api/collections/${collectionId}/recipes`);
  return response.data;
};

/**
 * Add recipe to collection
 * @param {string} collectionId - Collection ID (GUID)
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<Object>} API response
 */
const addRecipe = async (collectionId, recipeId) => {
  const response = await apiClient.post(`/api/collections/${collectionId}/recipes/${recipeId}`);
  return response.data;
};

/**
 * Remove recipe from collection
 * @param {string} collectionId - Collection ID (GUID)
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<void>}
 */
const removeRecipe = async (collectionId, recipeId) => {
  await apiClient.delete(`/api/collections/${collectionId}/recipes/${recipeId}`);
};

/**
 * Add multiple recipes to collection (batch operation)
 * @param {string} collectionId - Collection ID (GUID)
 * @param {string[]} recipeIds - Array of recipe IDs (GUIDs)
 * @returns {Promise<Object>} API response with addedCount
 */
const addRecipesBatch = async (collectionId, recipeIds) => {
  const response = await apiClient.post(
    `/api/collections/${collectionId}/recipes/batch`,
    { recipeIds }
  );
  return response.data;
};

/**
 * Remove multiple recipes from collection (batch operation)
 * @param {string} collectionId - Collection ID (GUID)
 * @param {string[]} recipeIds - Array of recipe IDs (GUIDs)
 * @returns {Promise<void>}
 */
const removeRecipesBatch = async (collectionId, recipeIds) => {
  await apiClient.delete(`/api/collections/${collectionId}/recipes/batch`, {
    data: { recipeIds },
  });
};

export const collectionService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteCollection,
  getRecipes,
  addRecipe,
  removeRecipe,
  addRecipesBatch,
  removeRecipesBatch,
};
