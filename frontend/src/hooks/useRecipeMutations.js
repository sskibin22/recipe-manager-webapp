/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 * @typedef {import('../types/recipe').RecipeCreateData} RecipeCreateData
 * @typedef {import('../types/recipe').RecipeUpdateData} RecipeUpdateData
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeService, getErrorMessage } from "../services/api";

/**
 * Custom hook for creating a new recipe
 * @param {Object} [options={}] - Additional options
 * @param {(data: Recipe, variables: RecipeCreateData, context: any) => void} [options.onSuccess] - Success callback
 * @param {(errorMessage: string, error: Error, variables: RecipeCreateData, context: any) => void} [options.onError] - Error callback
 * @returns {import('@tanstack/react-query').UseMutationResult<Recipe, Error, RecipeCreateData>} Mutation result
 */
export const useCreateRecipeMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeService.create,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(getErrorMessage(error), error, variables, context);
    },
  });
};

/**
 * Custom hook for updating an existing recipe
 * @param {string} recipeId - Recipe ID for cache invalidation
 * @param {Object} [options={}] - Additional options
 * @param {(data: Recipe, variables: RecipeUpdateData, context: any) => void} [options.onSuccess] - Success callback
 * @param {(errorMessage: string, error: Error, variables: RecipeUpdateData, context: any) => void} [options.onError] - Error callback
 * @returns {import('@tanstack/react-query').UseMutationResult<Recipe, Error, RecipeUpdateData>} Mutation result
 */
export const useUpdateRecipeMutation = (recipeId, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeService.update,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(getErrorMessage(error), error, variables, context);
    },
  });
};

/**
 * Custom hook for deleting a recipe
 * @param {Object} [options={}] - Additional options
 * @param {(data: any, variables: string, context: any) => void} [options.onSuccess] - Success callback
 * @param {(errorMessage: string, error: Error, variables: string, context: any) => void} [options.onError] - Error callback
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, string>} Mutation result
 */
export const useDeleteRecipeMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recipeService.delete,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(getErrorMessage(error), error, variables, context);
    },
  });
};
