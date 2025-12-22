/**
 * @typedef {import('../services/api/collectionService').Collection} Collection
 */

import { useQuery } from "@tanstack/react-query";
import { collectionService } from "../services/api";

/**
 * Custom hook for fetching all collections
 * @param {Object} [options={}] - Additional React Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<Collection[], Error>} Query result
 */
export const useCollectionsQuery = (options = {}) => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => collectionService.getAll(),
    ...options,
  });
};

/**
 * Custom hook for fetching single collection
 * @param {string} collectionId - Collection ID (GUID)
 * @param {Object} [options={}] - Additional React Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<Collection, Error>} Query result
 */
export const useCollectionQuery = (collectionId, options = {}) => {
  return useQuery({
    queryKey: ["collections", collectionId],
    queryFn: () => collectionService.getById(collectionId),
    enabled: !!collectionId,
    ...options,
  });
};

/**
 * Custom hook for fetching recipes in a collection
 * @param {string} collectionId - Collection ID (GUID)
 * @param {Object} [options={}] - Additional React Query options
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../types/recipe').Recipe[], Error>} Query result
 */
export const useCollectionRecipesQuery = (collectionId, options = {}) => {
  return useQuery({
    queryKey: ["collections", collectionId, "recipes"],
    queryFn: () => collectionService.getRecipes(collectionId),
    enabled: !!collectionId,
    ...options,
  });
};
