/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 */

import { useQuery } from "@tanstack/react-query";
import { recipeService } from "../services/api";

/**
 * Custom hook for fetching a single recipe by ID
 * @param {string} id - Recipe ID (GUID)
 * @param {Object} [options={}] - Additional React Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<Recipe, Error>} Query result
 */
export const useRecipeQuery = (id, options = {}) => {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: () => recipeService.getById(id),
    enabled: !!id,
    ...options,
  });
};
