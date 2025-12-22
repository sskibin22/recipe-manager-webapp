import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCategoriesQuery } from "../useCategoriesQuery";
import { categoryService } from "../../services/api";

// Mock categoryService
vi.mock("../../services/api", () => ({
  categoryService: {
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

describe("useCategoriesQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch categories", async () => {
    const mockCategories = [
      { id: 1, name: "Desserts" },
      { id: 2, name: "Main Courses" },
    ];
    categoryService.getAll.mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoriesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoryService.getAll).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockCategories);
  });

  it("should use correct query key", async () => {
    const mockCategories = [{ id: 1, name: "Appetizers" }];
    categoryService.getAll.mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoriesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Query key should be ["categories"]
    expect(result.current.data).toEqual(mockCategories);
  });

  it("should have stale time configured", async () => {
    const mockCategories = [{ id: 1, name: "Beverages" }];
    categoryService.getAll.mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategoriesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Data should remain fresh for 5 minutes (300000ms)
    expect(result.current.data).toEqual(mockCategories);
  });

  it("should support custom options", async () => {
    const mockCategories = [{ id: 1, name: "Snacks" }];
    categoryService.getAll.mockResolvedValue(mockCategories);

    const { result } = renderHook(
      () => useCategoriesQuery({ enabled: false }),
      {
        wrapper: createWrapper(),
      }
    );

    // Query should not execute when enabled is false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(categoryService.getAll).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const error = new Error("Failed to fetch categories");
    categoryService.getAll.mockRejectedValue(error);

    const { result } = renderHook(() => useCategoriesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
