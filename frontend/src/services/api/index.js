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

// Default export of apiClient for backward compatibility
export { apiClient as default } from "./apiClient";
