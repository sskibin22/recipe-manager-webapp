import { describe, it, expect, vi, beforeEach } from "vitest";
import { favoriteService } from "../favoriteService";
import { apiClient } from "../apiClient";

// Mock apiClient
vi.mock("../apiClient", () => ({
  apiClient: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("favoriteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("add", () => {
    it("should add recipe to favorites", async () => {
      const mockResponse = { success: true };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await favoriteService.add("recipe-123");

      expect(apiClient.post).toHaveBeenCalledWith("/api/recipes/recipe-123/favorite");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("remove", () => {
    it("should remove recipe from favorites", async () => {
      apiClient.delete.mockResolvedValue({});

      await favoriteService.remove("recipe-456");

      expect(apiClient.delete).toHaveBeenCalledWith("/api/recipes/recipe-456/favorite");
    });
  });
});
