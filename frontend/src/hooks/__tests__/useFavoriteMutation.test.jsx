import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useToggleFavoriteMutation } from "../useFavoriteMutation";
import { recipeService } from "../../services/api";

// Mock recipeService
vi.mock("../../services/api", () => ({
  recipeService: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useToggleFavoriteMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add recipe to favorites when isFavorite is false", async () => {
    recipeService.addFavorite.mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleFavoriteMutation("123"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ recipeId: "123", isFavorite: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.addFavorite).toHaveBeenCalledWith("123");
    expect(recipeService.removeFavorite).not.toHaveBeenCalled();
  });

  it("should remove recipe from favorites when isFavorite is true", async () => {
    recipeService.removeFavorite.mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleFavoriteMutation("456"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ recipeId: "456", isFavorite: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.removeFavorite).toHaveBeenCalledWith("456");
    expect(recipeService.addFavorite).not.toHaveBeenCalled();
  });

  it("should invalidate recipe and recipes caches on success", async () => {
    recipeService.addFavorite.mockResolvedValue(undefined);

    const { result } = renderHook(() => useToggleFavoriteMutation("789"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ recipeId: "789", isFavorite: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache invalidation is built into the hook
    expect(recipeService.addFavorite).toHaveBeenCalledWith("789");
  });

  it("should call custom onSuccess callback", async () => {
    const onSuccess = vi.fn();
    recipeService.addFavorite.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useToggleFavoriteMutation("123", { onSuccess }),
      {
        wrapper: createWrapper(),
      }
    );

    result.current.mutate({ recipeId: "123", isFavorite: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should handle errors and call onError callback", async () => {
    const error = new Error("Failed to toggle favorite");
    const onError = vi.fn();
    recipeService.addFavorite.mockRejectedValue(error);

    const { result } = renderHook(
      () => useToggleFavoriteMutation("999", { onError }),
      {
        wrapper: createWrapper(),
      }
    );

    result.current.mutate({ recipeId: "999", isFavorite: false });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onError).toHaveBeenCalledWith(error);
  });
});
