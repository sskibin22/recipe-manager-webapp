// Export all from individual service modules
export * from "./apiClient";
export * from "./recipeService";
export * from "./categoryService";
export * from "./tagService";
export * from "./favoriteService";
export * from "./uploadService";
export * from "./userService";
export * from "./collectionService";

// Import services for unified API object
import { recipeService } from "./recipeService";
import { categoryService } from "./categoryService";
import { tagService } from "./tagService";
import { favoriteService } from "./favoriteService";
import { uploadService } from "./uploadService";
import { userService } from "./userService";
import { collectionService } from "./collectionService";

// Unified API object for convenience
export const api = {
  recipes: recipeService,
  categories: categoryService,
  tags: tagService,
  favorites: favoriteService,
  uploads: uploadService,
  user: userService,
  collections: collectionService,
};

// Re-export individual function names for backward compatibility with existing imports
// These match the original api.js exports
export { recipeService as recipesApi } from "./recipeService";
export { categoryService as categoriesApi } from "./categoryService";
export { tagService as tagsApi } from "./tagService";
export { uploadService as uploadsApi } from "./uploadService";

// Export individual functions for backward compatibility
export const fetchRecipes = recipeService.getAll;
export const fetchRecipe = recipeService.getById;
export const createRecipe = recipeService.create;
export const updateRecipe = recipeService.update;
export const deleteRecipe = recipeService.delete;
export const addFavorite = recipeService.addFavorite;
export const removeFavorite = recipeService.removeFavorite;
export const fetchMetadata = recipeService.fetchMetadata;

export const fetchCategories = categoryService.getAll;
export const fetchTags = tagService.getAll;

export const getPresignedUploadUrl = uploadService.getPresignedUploadUrl;
export const getPresignedDownloadUrl = uploadService.getPresignedDownloadUrl;
export const uploadToPresignedUrl = uploadService.uploadToPresignedUrl;

export const getUserProfile = userService.getProfile;
export const updateUserProfile = userService.updateProfile;

// Default export of apiClient for backward compatibility
export { apiClient as default } from "./apiClient";
