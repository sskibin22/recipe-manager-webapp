/**
 * Custom hook for recipe detail data fetching and basic operations
 * Centralizes recipe query, delete mutation, and favorite toggle mutation
 */

import { useRecipeQuery, useDeleteRecipeMutation, useToggleFavoriteMutation } from "../../../hooks";

/**
 * Hook for managing recipe detail data and operations
 * @param {string} id - Recipe ID
 * @param {Object} options - Configuration options
 * @param {() => void} [options.onDeleteSuccess] - Callback for successful deletion
 * @returns {Object} Recipe data and operation functions
 */
export const useRecipeDetail = (id, options = {}) => {
  const { data: recipe, isLoading, error } = useRecipeQuery(id);

  const deleteMutation = useDeleteRecipeMutation({
    onSuccess: options.onDeleteSuccess,
  });

  const toggleFavoriteMutation = useToggleFavoriteMutation(id);

  return {
    recipe,
    isLoading,
    error,
    deleteRecipe: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
  };
};
