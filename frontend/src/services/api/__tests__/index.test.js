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
});
