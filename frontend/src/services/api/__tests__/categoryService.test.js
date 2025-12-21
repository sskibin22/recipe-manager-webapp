import { describe, it, expect, vi, beforeEach } from "vitest";
import { categoryService, categoriesApi } from "../categoryService";
import { apiClient } from "../apiClient";

// Mock apiClient
vi.mock("../apiClient", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("categoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all categories", async () => {
      const mockCategories = [
        { id: 1, name: "Breakfast", color: "#FCD34D" },
        { id: 2, name: "Lunch", color: "#34D399" },
      ];
      apiClient.get.mockResolvedValue({ data: mockCategories });

      const result = await categoryService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith("/api/categories");
      expect(result).toEqual(mockCategories);
    });

    it("should return empty array when no categories", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      const result = await categoryService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("backward compatibility - categoriesApi", () => {
    it("should export categoriesApi with same methods", () => {
      expect(categoriesApi).toBeDefined();
      expect(categoriesApi.getAll).toBe(categoryService.getAll);
    });
  });
});
