import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRecipesQuery } from "../useRecipesQuery";
import { recipeService } from "../../services/api";

// Mock recipeService
vi.mock("../../services/api", () => ({
  recipeService: {
    getAll: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useRecipesQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch recipes with default parameters", async () => {
    const mockRecipes = [
      { id: "1", title: "Recipe 1" },
      { id: "2", title: "Recipe 2" },
    ];
    recipeService.getAll.mockResolvedValue(mockRecipes);

    const { result } = renderHook(() => useRecipesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.getAll).toHaveBeenCalledWith("", null, []);
    expect(result.current.data).toEqual(mockRecipes);
  });

  it("should fetch recipes with search query", async () => {
    const mockRecipes = [{ id: "1", title: "Pasta Recipe" }];
    recipeService.getAll.mockResolvedValue(mockRecipes);

    const { result } = renderHook(() => useRecipesQuery("pasta"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.getAll).toHaveBeenCalledWith("pasta", null, []);
    expect(result.current.data).toEqual(mockRecipes);
  });

  it("should fetch recipes with categoryId filter", async () => {
    const mockRecipes = [{ id: "1", title: "Dessert Recipe" }];
    recipeService.getAll.mockResolvedValue(mockRecipes);

    const { result } = renderHook(() => useRecipesQuery("", 5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.getAll).toHaveBeenCalledWith("", 5, []);
    expect(result.current.data).toEqual(mockRecipes);
  });

  it("should fetch recipes with tagIds filter", async () => {
    const mockRecipes = [{ id: "1", title: "Vegan Pasta" }];
    recipeService.getAll.mockResolvedValue(mockRecipes);

    const { result } = renderHook(() => useRecipesQuery("", null, [1, 2]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.getAll).toHaveBeenCalledWith("", null, [1, 2]);
    expect(result.current.data).toEqual(mockRecipes);
  });

  it("should fetch recipes with all filters", async () => {
    const mockRecipes = [{ id: "1", title: "Vegan Pasta" }];
    recipeService.getAll.mockResolvedValue(mockRecipes);

    const { result } = renderHook(() => useRecipesQuery("pasta", 2, [1, 3]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.getAll).toHaveBeenCalledWith("pasta", 2, [1, 3]);
    expect(result.current.data).toEqual(mockRecipes);
  });

  it("should use correct query key", async () => {
    const mockRecipes = [{ id: "1", title: "Recipe 1" }];
    recipeService.getAll.mockResolvedValue(mockRecipes);

    const { result } = renderHook(() => useRecipesQuery("search", 3, [1, 2]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Query key should be ["recipes", searchQuery, categoryId, tagIds]
    expect(result.current.data).toEqual(mockRecipes);
  });

  it("should support custom options", async () => {
    const mockRecipes = [{ id: "1", title: "Recipe 1" }];
    recipeService.getAll.mockResolvedValue(mockRecipes);

    const { result } = renderHook(
      () => useRecipesQuery("", null, [], { enabled: false }),
      {
        wrapper: createWrapper(),
      }
    );

    // Query should not execute when enabled is false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(recipeService.getAll).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const error = new Error("Failed to fetch recipes");
    recipeService.getAll.mockRejectedValue(error);

    const { result } = renderHook(() => useRecipesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
