/**
 * @typedef {import('../types/recipe').Tag} Tag
 */

import { useQuery } from "@tanstack/react-query";
import { tagService } from "../services/api";

/**
 * Custom hook for fetching tags list
 * @param {Object} [options={}] - Additional React Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<Tag[], Error>} Query result
 */
export const useTagsQuery = (options = {}) => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: tagService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes - tags rarely change
    ...options,
  });
};
