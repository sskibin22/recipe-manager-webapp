/**
 * @typedef {import('../types/recipe').Category} Category
 */

import { useQuery } from "@tanstack/react-query";
import { categoryService } from "../services/api";

/**
 * Custom hook for fetching categories list
 * @param {Object} [options={}] - Additional React Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<Category[], Error>} Query result
 */
export const useCategoriesQuery = (options = {}) => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories rarely change
    ...options,
  });
};
