import { describe, it, expect } from "vitest";
import {
  sortCollections,
  filterCollectionsBySearch,
  getSortLabel,
  SORT_OPTIONS,
  SORT_STORAGE_KEY,
} from "./collectionSort";

describe("collectionSort", () => {
  // Mock collection data
  const mockCollections = [
    {
      id: "1",
      name: "Breakfast Recipes",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-20T15:00:00Z",
    },
    {
      id: "2",
      name: "Dinner Ideas",
      createdAt: "2024-01-10T10:00:00Z",
      updatedAt: "2024-01-25T15:00:00Z",
    },
    {
      id: "3",
      name: "appetizers",
      createdAt: "2024-01-20T10:00:00Z",
      updatedAt: "2024-01-18T15:00:00Z",
    },
    {
      id: "4",
      name: "Desserts",
      createdAt: "2024-01-05T10:00:00Z",
      updatedAt: "2024-01-22T15:00:00Z",
    },
  ];

  describe("sortCollections", () => {
    it("should return empty array for empty input", () => {
      const result = sortCollections([], "name-asc");
      expect(result).toEqual([]);
    });

    it("should return undefined/null as-is", () => {
      expect(sortCollections(null, "name-asc")).toBeNull();
      expect(sortCollections(undefined, "name-asc")).toBeUndefined();
    });

    it("should not mutate the original array", () => {
      const original = [...mockCollections];
      sortCollections(mockCollections, "name-asc");
      expect(mockCollections).toEqual(original);
    });

    it("should sort by name ascending (A-Z) case-insensitively", () => {
      const result = sortCollections(mockCollections, "name-asc");
      expect(result.map(c => c.name)).toEqual([
        "appetizers",
        "Breakfast Recipes",
        "Desserts",
        "Dinner Ideas",
      ]);
    });

    it("should sort by name descending (Z-A) case-insensitively", () => {
      const result = sortCollections(mockCollections, "name-desc");
      expect(result.map(c => c.name)).toEqual([
        "Dinner Ideas",
        "Desserts",
        "Breakfast Recipes",
        "appetizers",
      ]);
    });

    it("should sort by creation date newest first", () => {
      const result = sortCollections(mockCollections, "created-newest");
      expect(result.map(c => c.id)).toEqual(["3", "1", "2", "4"]);
    });

    it("should sort by creation date oldest first", () => {
      const result = sortCollections(mockCollections, "created-oldest");
      expect(result.map(c => c.id)).toEqual(["4", "2", "1", "3"]);
    });

    it("should sort by update date most recently updated first", () => {
      const result = sortCollections(mockCollections, "updated-newest");
      expect(result.map(c => c.id)).toEqual(["2", "4", "1", "3"]);
    });

    it("should default to most recently updated for unknown sort option", () => {
      const result = sortCollections(mockCollections, "unknown-option");
      expect(result.map(c => c.id)).toEqual(["2", "4", "1", "3"]);
    });

    it("should default to most recently updated when no sort option provided", () => {
      const result = sortCollections(mockCollections);
      expect(result.map(c => c.id)).toEqual(["2", "4", "1", "3"]);
    });
  });

  describe("filterCollectionsBySearch", () => {
    it("should return all collections for empty search query", () => {
      const result = filterCollectionsBySearch(mockCollections, "");
      expect(result).toHaveLength(4);
    });

    it("should return all collections for whitespace-only search query", () => {
      const result = filterCollectionsBySearch(mockCollections, "   ");
      expect(result).toHaveLength(4);
    });

    it("should return all collections for null/undefined search query", () => {
      expect(filterCollectionsBySearch(mockCollections, null)).toHaveLength(4);
      expect(filterCollectionsBySearch(mockCollections, undefined)).toHaveLength(4);
    });

    it("should return empty array for empty collections input", () => {
      const result = filterCollectionsBySearch([], "breakfast");
      expect(result).toEqual([]);
    });

    it("should filter collections by name (case-insensitive)", () => {
      const result = filterCollectionsBySearch(mockCollections, "breakfast");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Breakfast Recipes");
    });

    it("should filter collections by partial name match", () => {
      const result = filterCollectionsBySearch(mockCollections, "dinn");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Dinner Ideas");
    });

    it("should filter collections case-insensitively", () => {
      const result = filterCollectionsBySearch(mockCollections, "APPETIZERS");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("appetizers");
    });

    it("should return multiple matches when applicable", () => {
      const result = filterCollectionsBySearch(mockCollections, "e");
      // Should match: Breakfast Recipes, Dinner Ideas, appetizers, Desserts
      expect(result.length).toBeGreaterThan(1);
    });

    it("should trim whitespace from search query", () => {
      const result = filterCollectionsBySearch(mockCollections, "  breakfast  ");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Breakfast Recipes");
    });

    it("should return empty array when no matches found", () => {
      const result = filterCollectionsBySearch(mockCollections, "xyz123");
      expect(result).toEqual([]);
    });
  });

  describe("getSortLabel", () => {
    it("should return correct label for name-asc", () => {
      expect(getSortLabel("name-asc")).toBe("Name (A-Z)");
    });

    it("should return correct label for name-desc", () => {
      expect(getSortLabel("name-desc")).toBe("Name (Z-A)");
    });

    it("should return correct label for created-newest", () => {
      expect(getSortLabel("created-newest")).toBe("Newest First");
    });

    it("should return correct label for created-oldest", () => {
      expect(getSortLabel("created-oldest")).toBe("Oldest First");
    });

    it("should return correct label for updated-newest", () => {
      expect(getSortLabel("updated-newest")).toBe("Recently Updated");
    });

    it("should return default label for unknown option", () => {
      expect(getSortLabel("unknown")).toBe("Recently Updated");
    });
  });

  describe("SORT_OPTIONS", () => {
    it("should export array of sort options", () => {
      expect(Array.isArray(SORT_OPTIONS)).toBe(true);
      expect(SORT_OPTIONS.length).toBe(5);
    });

    it("should have correct structure for each option", () => {
      SORT_OPTIONS.forEach(option => {
        expect(option).toHaveProperty("value");
        expect(option).toHaveProperty("label");
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
      });
    });

    it("should have updated-newest as first option (default)", () => {
      expect(SORT_OPTIONS[0].value).toBe("updated-newest");
    });
  });

  describe("SORT_STORAGE_KEY", () => {
    it("should export storage key constant", () => {
      expect(SORT_STORAGE_KEY).toBe("collections-sort-preference");
    });
  });
});
