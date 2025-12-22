import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} from "../useRecipeMutations";
import { recipeService, getErrorMessage } from "../../services/api";

// Mock services
vi.mock("../../services/api", () => ({
  recipeService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  getErrorMessage: vi.fn((error) => error.message || "An error occurred"),
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

describe("useCreateRecipeMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a recipe and invalidate recipes cache", async () => {
    const mockRecipe = { id: "123", title: "New Recipe" };
    recipeService.create.mockResolvedValue(mockRecipe);

    const { result } = renderHook(() => useCreateRecipeMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: "New Recipe", type: "manual" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.create).toHaveBeenCalledTimes(1);
    expect(recipeService.create.mock.calls[0][0]).toEqual({
      title: "New Recipe",
      type: "manual",
    });
    expect(result.current.data).toEqual(mockRecipe);
  });

  it("should call custom onSuccess callback", async () => {
    const mockRecipe = { id: "456", title: "Another Recipe" };
    const onSuccess = vi.fn();
    recipeService.create.mockResolvedValue(mockRecipe);

    const { result } = renderHook(
      () => useCreateRecipeMutation({ onSuccess }),
      {
        wrapper: createWrapper(),
      }
    );

    result.current.mutate({ title: "Another Recipe", type: "link" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledWith(
      mockRecipe,
      { title: "Another Recipe", type: "link" },
      undefined
    );
  });

  it("should handle errors and call onError callback", async () => {
    const error = new Error("Failed to create recipe");
    const onError = vi.fn();
    recipeService.create.mockRejectedValue(error);

    const { result } = renderHook(() => useCreateRecipeMutation({ onError }), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: "Failed Recipe", type: "manual" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onError).toHaveBeenCalledWith(
      "Failed to create recipe",
      error,
      { title: "Failed Recipe", type: "manual" },
      undefined
    );
  });
});

describe("useUpdateRecipeMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a recipe and invalidate caches", async () => {
    const mockRecipe = { id: "123", title: "Updated Recipe" };
    recipeService.update.mockResolvedValue(mockRecipe);

    const { result } = renderHook(() => useUpdateRecipeMutation("123"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: "123", title: "Updated Recipe" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.update).toHaveBeenCalledTimes(1);
    expect(recipeService.update.mock.calls[0][0]).toEqual({
      id: "123",
      title: "Updated Recipe",
    });
    expect(result.current.data).toEqual(mockRecipe);
  });

  it("should call custom onSuccess callback", async () => {
    const mockRecipe = { id: "456", title: "Modified Recipe" };
    const onSuccess = vi.fn();
    recipeService.update.mockResolvedValue(mockRecipe);

    const { result } = renderHook(
      () => useUpdateRecipeMutation("456", { onSuccess }),
      {
        wrapper: createWrapper(),
      }
    );

    result.current.mutate({ id: "456", title: "Modified Recipe" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledWith(
      mockRecipe,
      { id: "456", title: "Modified Recipe" },
      undefined
    );
  });

  it("should handle errors and call onError callback", async () => {
    const error = new Error("Failed to update recipe");
    const onError = vi.fn();
    recipeService.update.mockRejectedValue(error);

    const { result } = renderHook(
      () => useUpdateRecipeMutation("789", { onError }),
      {
        wrapper: createWrapper(),
      }
    );

    result.current.mutate({ id: "789", title: "Failed Update" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onError).toHaveBeenCalledWith(
      "Failed to update recipe",
      error,
      { id: "789", title: "Failed Update" },
      undefined
    );
  });
});

describe("useDeleteRecipeMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a recipe and invalidate recipes cache", async () => {
    recipeService.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRecipeMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("123");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(recipeService.delete).toHaveBeenCalledTimes(1);
    expect(recipeService.delete.mock.calls[0][0]).toBe("123");
  });

  it("should call custom onSuccess callback", async () => {
    const onSuccess = vi.fn();
    recipeService.delete.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useDeleteRecipeMutation({ onSuccess }),
      {
        wrapper: createWrapper(),
      }
    );

    result.current.mutate("456");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledWith(undefined, "456", undefined);
  });

  it("should handle errors and call onError callback", async () => {
    const error = new Error("Failed to delete recipe");
    const onError = vi.fn();
    recipeService.delete.mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteRecipeMutation({ onError }), {
      wrapper: createWrapper(),
    });

    result.current.mutate("789");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onError).toHaveBeenCalledWith(
      "Failed to delete recipe",
      error,
      "789",
      undefined
    );
  });
});
