import { describe, it, expect, vi, beforeEach } from "vitest";
import { tagService, tagsApi } from "../tagService";
import { apiClient } from "../apiClient";

// Mock apiClient
vi.mock("../apiClient", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("tagService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all tags", async () => {
      const mockTags = [
        { id: 1, name: "Vegetarian", color: "#10B981", type: 0 },
        { id: 2, name: "Vegan", color: "#059669", type: 0 },
        { id: 7, name: "Quick (<30 min)", color: "#3B82F6", type: 1 },
      ];
      apiClient.get.mockResolvedValue({ data: mockTags });

      const result = await tagService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith("/api/tags");
      expect(result).toEqual(mockTags);
    });

    it("should return empty array when no tags", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      const result = await tagService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("backward compatibility - tagsApi", () => {
    it("should export tagsApi with same methods", () => {
      expect(tagsApi).toBeDefined();
      expect(tagsApi.getAll).toBe(tagService.getAll);
    });
  });
});
