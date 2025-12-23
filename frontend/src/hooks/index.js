/**
 * Shared React Query hooks for Recipe Manager
 * 
 * This module provides centralized React Query hooks for:
 * - Recipe queries (list and single)
 * - Recipe mutations (create, update, delete)
 * - Category queries
 * - Tag queries
 * - Favorite mutations
 * - Collection queries and mutations
 * 
 * All hooks include:
 * - Consistent query keys
 * - Automatic cache invalidation
 * - Built-in error handling
 * - Support for custom options
 */

// Query hooks
export { useRecipesQuery } from "./useRecipesQuery";
export { useRecipeQuery } from "./useRecipeQuery";
export { useCategoriesQuery } from "./useCategoriesQuery";
export { useTagsQuery } from "./useTagsQuery";
export { useCollectionsQuery, useCollectionQuery, useCollectionRecipesQuery } from "./useCollectionsQuery";

// Mutation hooks
export {
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} from "./useRecipeMutations";

export { useToggleFavoriteMutation } from "./useFavoriteMutation";
export { useCollectionMutations } from "./useCollectionMutations";

// Component-specific hooks
export { useRecipeForm } from "./useRecipeForm";
export { useFileUpload } from "./useFileUpload";
export { useMetadataFetch } from "./useMetadataFetch";
export { useRecipeDetail } from "./useRecipeDetail";
export { useRecipeEdit } from "./useRecipeEdit";
export { useImageRotation } from "./useImageRotation";
export { useBulkSelect } from "./useBulkSelect";
