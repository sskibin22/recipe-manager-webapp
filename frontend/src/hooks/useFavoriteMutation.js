/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeService } from "../services/api";

/**
 * Custom hook for toggling favorite status of a recipe
 * @param {string} recipeId - Recipe ID to toggle favorite for
 * @param {Object} [options={}] - Additional options
 * @param {() => void} [options.onSuccess] - Success callback
 * @param {(error: Error) => void} [options.onError] - Error callback
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, { recipeId: string, isFavorite: boolean }>} Mutation result
 */
export const useToggleFavoriteMutation = (recipeId, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, isFavorite }) => {
      if (isFavorite) {
        await recipeService.removeFavorite(recipeId);
      } else {
        await recipeService.addFavorite(recipeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      options.onSuccess?.();
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
};
