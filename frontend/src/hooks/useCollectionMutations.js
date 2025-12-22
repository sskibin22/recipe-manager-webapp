import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionService } from "../services/api";

/**
 * Custom hook for collection mutations (create, update, delete, add/remove recipes)
 * @returns {Object} Object containing mutation functions
 */
export const useCollectionMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: collectionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => collectionService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", variables.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: collectionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  const addRecipeMutation = useMutation({
    mutationFn: ({ collectionId, recipeId }) => 
      collectionService.addRecipe(collectionId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections", variables.collectionId, "recipes"] });
    },
  });

  const removeRecipeMutation = useMutation({
    mutationFn: ({ collectionId, recipeId }) => 
      collectionService.removeRecipe(collectionId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections", variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections", variables.collectionId, "recipes"] });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    addRecipeMutation,
    removeRecipeMutation,
  };
};
