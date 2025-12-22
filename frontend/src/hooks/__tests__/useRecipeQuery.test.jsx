import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRecipeQuery } from "../useRecipeQuery";
import { recipeService } from "../../services/api";

// Mock recipeService
vi.mock("../../services/api", () => ({
  recipeService: {
    getById: vi.fn(),
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

describe("useRecipeQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch a single recipe by ID", async () => {
    const mockRecipe = { id: "123", title: "Test Recipe" };
    recipeService.getById.mockResolvedValue(mockRecipe);

    const { result } = renderHook(() => useRecipeQuery("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.getById).toHaveBeenCalledWith("123");
    expect(result.current.data).toEqual(mockRecipe);
  });

  it("should use correct query key", async () => {
    const mockRecipe = { id: "456", title: "Another Recipe" };
    recipeService.getById.mockResolvedValue(mockRecipe);

    const { result } = renderHook(() => useRecipeQuery("456"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Query key should be ["recipe", id]
    expect(result.current.data).toEqual(mockRecipe);
  });

  it("should not fetch when ID is null or undefined", async () => {
    const { result } = renderHook(() => useRecipeQuery(null), {
      wrapper: createWrapper(),
    });

    // Query should not execute when ID is null
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(recipeService.getById).not.toHaveBeenCalled();
  });

  it("should not fetch when ID is empty string", async () => {
    const { result } = renderHook(() => useRecipeQuery(""), {
      wrapper: createWrapper(),
    });

    // Query should not execute when ID is empty
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(recipeService.getById).not.toHaveBeenCalled();
  });

  it("should support custom options", async () => {
    const mockRecipe = { id: "789", title: "Custom Recipe" };
    recipeService.getById.mockResolvedValue(mockRecipe);

    const { result } = renderHook(
      () => useRecipeQuery("789", { enabled: false }),
      {
        wrapper: createWrapper(),
      }
    );

    // Query should not execute when enabled is false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(recipeService.getById).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const error = new Error("Recipe not found");
    recipeService.getById.mockRejectedValue(error);

    const { result } = renderHook(() => useRecipeQuery("999"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
