/**
 * @typedef {import('../../types/recipe').Tag} Tag
 */

import { apiClient } from "./apiClient";

/**
 * Fetch all tags
 * @returns {Promise<Tag[]>} Array of tags
 */
const getAll = async () => {
  const response = await apiClient.get("/api/tags");
  return response.data;
};

export const tagService = {
  getAll,
};

// Legacy export for backward compatibility
export const tagsApi = tagService;
