import { describe, it, expect } from "vitest";
import * as apiModule from "../index";

describe("api/index - barrel exports", () => {
  describe("service exports", () => {
    it("should export recipeService", () => {
      expect(apiModule.recipeService).toBeDefined();
      expect(typeof apiModule.recipeService.getAll).toBe("function");
      expect(typeof apiModule.recipeService.getById).toBe("function");
      expect(typeof apiModule.recipeService.create).toBe("function");
      expect(typeof apiModule.recipeService.update).toBe("function");
      expect(typeof apiModule.recipeService.delete).toBe("function");
    });

    it("should export categoryService", () => {
      expect(apiModule.categoryService).toBeDefined();
      expect(typeof apiModule.categoryService.getAll).toBe("function");
    });

    it("should export tagService", () => {
      expect(apiModule.tagService).toBeDefined();
      expect(typeof apiModule.tagService.getAll).toBe("function");
    });

    it("should export favoriteService", () => {
      expect(apiModule.favoriteService).toBeDefined();
      expect(typeof apiModule.favoriteService.add).toBe("function");
      expect(typeof apiModule.favoriteService.remove).toBe("function");
    });

    it("should export uploadService", () => {
      expect(apiModule.uploadService).toBeDefined();
      expect(typeof apiModule.uploadService.getPresignedUploadUrl).toBe("function");
      expect(typeof apiModule.uploadService.getPresignedDownloadUrl).toBe("function");
      expect(typeof apiModule.uploadService.uploadToPresignedUrl).toBe("function");
    });

    it("should export userService", () => {
      expect(apiModule.userService).toBeDefined();
      expect(typeof apiModule.userService.getProfile).toBe("function");
      expect(typeof apiModule.userService.updateProfile).toBe("function");
    });
  });

  describe("legacy exports for backward compatibility", () => {
    it("should export recipesApi", () => {
      expect(apiModule.recipesApi).toBeDefined();
      expect(apiModule.recipesApi).toBe(apiModule.recipeService);
    });

    it("should export categoriesApi", () => {
      expect(apiModule.categoriesApi).toBeDefined();
      expect(apiModule.categoriesApi).toBe(apiModule.categoryService);
    });

    it("should export tagsApi", () => {
      expect(apiModule.tagsApi).toBeDefined();
      expect(apiModule.tagsApi).toBe(apiModule.tagService);
    });

    it("should export uploadsApi", () => {
      expect(apiModule.uploadsApi).toBeDefined();
      expect(apiModule.uploadsApi).toBe(apiModule.uploadService);
    });
  });

  describe("individual function exports for backward compatibility", () => {
    it("should export recipe functions", () => {
      expect(typeof apiModule.fetchRecipes).toBe("function");
      expect(typeof apiModule.fetchRecipe).toBe("function");
      expect(typeof apiModule.createRecipe).toBe("function");
      expect(typeof apiModule.updateRecipe).toBe("function");
      expect(typeof apiModule.deleteRecipe).toBe("function");
      expect(typeof apiModule.addFavorite).toBe("function");
      expect(typeof apiModule.removeFavorite).toBe("function");
      expect(typeof apiModule.fetchMetadata).toBe("function");
    });

    it("should export category functions", () => {
      expect(typeof apiModule.fetchCategories).toBe("function");
    });

    it("should export tag functions", () => {
      expect(typeof apiModule.fetchTags).toBe("function");
    });

    it("should export upload functions", () => {
      expect(typeof apiModule.getPresignedUploadUrl).toBe("function");
      expect(typeof apiModule.getPresignedDownloadUrl).toBe("function");
      expect(typeof apiModule.uploadToPresignedUrl).toBe("function");
    });

    it("should export user functions", () => {
      expect(typeof apiModule.getUserProfile).toBe("function");
      expect(typeof apiModule.updateUserProfile).toBe("function");
    });
  });

  describe("utility exports", () => {
    it("should export apiClient", () => {
      expect(apiModule.apiClient).toBeDefined();
      expect(apiModule.apiClient.defaults).toBeDefined();
    });

    it("should export setTokenGetter", () => {
      expect(typeof apiModule.setTokenGetter).toBe("function");
    });

    it("should export getErrorMessage", () => {
      expect(typeof apiModule.getErrorMessage).toBe("function");
    });

    it("should export default (apiClient)", () => {
      expect(apiModule.default).toBeDefined();
      expect(apiModule.default).toBe(apiModule.apiClient);
    });
  });

  describe("unified api object", () => {
    it("should export unified api object", () => {
      expect(apiModule.api).toBeDefined();
      expect(apiModule.api.recipes).toBe(apiModule.recipeService);
      expect(apiModule.api.categories).toBe(apiModule.categoryService);
      expect(apiModule.api.tags).toBe(apiModule.tagService);
      expect(apiModule.api.favorites).toBe(apiModule.favoriteService);
      expect(apiModule.api.uploads).toBe(apiModule.uploadService);
      expect(apiModule.api.user).toBe(apiModule.userService);
    });
  });

  describe("function references match service methods", () => {
    it("should reference recipeService methods", () => {
      expect(apiModule.fetchRecipes).toBe(apiModule.recipeService.getAll);
      expect(apiModule.fetchRecipe).toBe(apiModule.recipeService.getById);
      expect(apiModule.createRecipe).toBe(apiModule.recipeService.create);
      expect(apiModule.updateRecipe).toBe(apiModule.recipeService.update);
      expect(apiModule.deleteRecipe).toBe(apiModule.recipeService.delete);
      expect(apiModule.fetchMetadata).toBe(apiModule.recipeService.fetchMetadata);
    });

    it("should reference categoryService methods", () => {
      expect(apiModule.fetchCategories).toBe(apiModule.categoryService.getAll);
    });

    it("should reference tagService methods", () => {
      expect(apiModule.fetchTags).toBe(apiModule.tagService.getAll);
    });

    it("should reference uploadService methods", () => {
      expect(apiModule.getPresignedUploadUrl).toBe(
        apiModule.uploadService.getPresignedUploadUrl
      );
      expect(apiModule.getPresignedDownloadUrl).toBe(
        apiModule.uploadService.getPresignedDownloadUrl
      );
      expect(apiModule.uploadToPresignedUrl).toBe(
        apiModule.uploadService.uploadToPresignedUrl
      );
    });

    it("should reference userService methods", () => {
      expect(apiModule.getUserProfile).toBe(apiModule.userService.getProfile);
      expect(apiModule.updateUserProfile).toBe(apiModule.userService.updateProfile);
    });
  });
});
