import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { recipeService, recipesApi } from "../recipeService";
import { apiClient } from "../apiClient";

// Mock apiClient
vi.mock("../apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("recipeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all recipes without filters", async () => {
      const mockRecipes = [{ id: "1", title: "Recipe 1" }];
      apiClient.get.mockResolvedValue({ data: mockRecipes });

      const result = await recipeService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith("/api/recipes", { params: {} });
      expect(result).toEqual(mockRecipes);
    });

    it("should fetch recipes with search query", async () => {
      const mockRecipes = [{ id: "1", title: "Pasta" }];
      apiClient.get.mockResolvedValue({ data: mockRecipes });

      await recipeService.getAll("pasta");

      expect(apiClient.get).toHaveBeenCalledWith("/api/recipes", {
        params: { q: "pasta" },
      });
    });

    it("should fetch recipes with category filter", async () => {
      const mockRecipes = [{ id: "1", title: "Recipe 1" }];
      apiClient.get.mockResolvedValue({ data: mockRecipes });

      await recipeService.getAll("", 1);

      expect(apiClient.get).toHaveBeenCalledWith("/api/recipes", {
        params: { category: 1 },
      });
    });

    it("should fetch recipes with tag filters", async () => {
      const mockRecipes = [{ id: "1", title: "Recipe 1" }];
      apiClient.get.mockResolvedValue({ data: mockRecipes });

      await recipeService.getAll("", null, [1, 2, 3]);

      expect(apiClient.get).toHaveBeenCalledWith("/api/recipes", {
        params: { tags: "1,2,3" },
      });
    });

    it("should fetch recipes with all filters", async () => {
      const mockRecipes = [{ id: "1", title: "Vegan Pasta" }];
      apiClient.get.mockResolvedValue({ data: mockRecipes });

      await recipeService.getAll("pasta", 2, [1, 3]);

      expect(apiClient.get).toHaveBeenCalledWith("/api/recipes", {
        params: { q: "pasta", category: 2, tags: "1,3" },
      });
    });
  });

  describe("getById", () => {
    it("should fetch single recipe by ID", async () => {
      const mockRecipe = { id: "123", title: "Test Recipe" };
      apiClient.get.mockResolvedValue({ data: mockRecipe });

      const result = await recipeService.getById("123");

      expect(apiClient.get).toHaveBeenCalledWith("/api/recipes/123");
      expect(result).toEqual(mockRecipe);
    });
  });

  describe("create", () => {
    it("should create a new recipe", async () => {
      const recipeData = { title: "New Recipe", type: "manual" };
      const mockResponse = { id: "456", ...recipeData };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await recipeService.create(recipeData);

      expect(apiClient.post).toHaveBeenCalledWith("/api/recipes", recipeData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("update", () => {
    it("should update existing recipe", async () => {
      const updateData = { id: "123", title: "Updated Recipe" };
      const mockResponse = { id: "123", title: "Updated Recipe" };
      apiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await recipeService.update(updateData);

      expect(apiClient.put).toHaveBeenCalledWith("/api/recipes/123", {
        title: "Updated Recipe",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should separate id from other data in update", async () => {
      const updateData = {
        id: "789",
        title: "Updated",
        content: "New content",
      };
      apiClient.put.mockResolvedValue({ data: updateData });

      await recipeService.update(updateData);

      expect(apiClient.put).toHaveBeenCalledWith("/api/recipes/789", {
        title: "Updated",
        content: "New content",
      });
    });
  });

  describe("delete", () => {
    it("should delete recipe by ID", async () => {
      apiClient.delete.mockResolvedValue({});

      await recipeService.delete("123");

      expect(apiClient.delete).toHaveBeenCalledWith("/api/recipes/123");
    });
  });

  describe("addFavorite", () => {
    it("should add recipe to favorites", async () => {
      const mockResponse = { success: true };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await recipeService.addFavorite("123");

      expect(apiClient.post).toHaveBeenCalledWith("/api/recipes/123/favorite");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("removeFavorite", () => {
    it("should remove recipe from favorites", async () => {
      apiClient.delete.mockResolvedValue({});

      await recipeService.removeFavorite("123");

      expect(apiClient.delete).toHaveBeenCalledWith("/api/recipes/123/favorite");
    });
  });

  describe("fetchMetadata", () => {
    it("should fetch metadata from URL", async () => {
      const mockMetadata = {
        title: "Recipe Title",
        description: "Recipe Description",
      };
      apiClient.post.mockResolvedValue({ data: mockMetadata });

      const result = await recipeService.fetchMetadata(
        "https://example.com/recipe"
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/recipes/fetch-metadata",
        { url: "https://example.com/recipe" }
      );
      expect(result).toEqual(mockMetadata);
    });
  });

  describe("backward compatibility - recipesApi", () => {
    it("should export recipesApi with same methods", () => {
      expect(recipesApi).toBeDefined();
      expect(recipesApi.getAll).toBe(recipeService.getAll);
      expect(recipesApi.getById).toBe(recipeService.getById);
      expect(recipesApi.create).toBe(recipeService.create);
      expect(recipesApi.update).toBe(recipeService.update);
      expect(recipesApi.delete).toBe(recipeService.delete);
      expect(recipesApi.addFavorite).toBe(recipeService.addFavorite);
      expect(recipesApi.removeFavorite).toBe(recipeService.removeFavorite);
      expect(recipesApi.fetchMetadata).toBe(recipeService.fetchMetadata);
    });
  });
});
