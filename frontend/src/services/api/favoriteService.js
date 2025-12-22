import { apiClient } from "./apiClient";

/**
 * Add recipe to favorites
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<Object>} API response
 */
const add = async (recipeId) => {
  const response = await apiClient.post(`/api/recipes/${recipeId}/favorite`);
  return response.data;
};

/**
 * Remove recipe from favorites
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<void>}
 */
const remove = async (recipeId) => {
  await apiClient.delete(`/api/recipes/${recipeId}/favorite`);
};

export const favoriteService = {
  add,
  remove,
};
