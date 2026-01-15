/**
 * @typedef {import('../../types/recipe').Category} Category
 */

import { apiClient } from "./apiClient";

/**
 * Fetch all categories
 * @returns {Promise<Category[]>} Array of categories
 */
const getAll = async () => {
  const response = await apiClient.get("/api/categories");
  return response.data;
};

export const categoryService = {
  getAll,
};
