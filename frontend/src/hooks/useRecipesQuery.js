/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 */

import { useQuery } from "@tanstack/react-query";
import { recipeService } from "../services/api";

/**
 * Custom hook for fetching recipes list with filters
 * @param {string} [searchQuery=""] - Search term to filter by title
 * @param {number|null} [categoryId=null] - Category ID to filter by
 * @param {number[]} [tagIds=[]] - Tag IDs to filter by (AND logic)
 * @param {Object} [options={}] - Additional React Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<Recipe[], Error>} Query result
 */
export const useRecipesQuery = (searchQuery = "", categoryId = null, tagIds = [], options = {}) => {
  return useQuery({
    queryKey: ["recipes", searchQuery, categoryId, tagIds],
    queryFn: () => recipeService.getAll(searchQuery, categoryId, tagIds),
    ...options,
  });
};
