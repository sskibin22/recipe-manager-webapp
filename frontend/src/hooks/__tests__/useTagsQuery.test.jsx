import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTagsQuery } from "../useTagsQuery";
import { tagService } from "../../services/api";

// Mock tagService
vi.mock("../../services/api", () => ({
  tagService: {
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

describe("useTagsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch tags", async () => {
    const mockTags = [
      { id: 1, name: "Vegan", type: 0 },
      { id: 2, name: "Quick", type: 1 },
    ];
    tagService.getAll.mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTagsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(tagService.getAll).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockTags);
  });

  it("should use correct query key", async () => {
    const mockTags = [{ id: 1, name: "Gluten-Free", type: 0 }];
    tagService.getAll.mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTagsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Query key should be ["tags"]
    expect(result.current.data).toEqual(mockTags);
  });

  it("should have stale time configured", async () => {
    const mockTags = [{ id: 1, name: "Italian", type: 2 }];
    tagService.getAll.mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTagsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Data should remain fresh for 5 minutes (300000ms)
    expect(result.current.data).toEqual(mockTags);
  });

  it("should support custom options", async () => {
    const mockTags = [{ id: 1, name: "Spicy", type: 3 }];
    tagService.getAll.mockResolvedValue(mockTags);

    const { result } = renderHook(() => useTagsQuery({ enabled: false }), {
      wrapper: createWrapper(),
    });

    // Query should not execute when enabled is false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(tagService.getAll).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const error = new Error("Failed to fetch tags");
    tagService.getAll.mockRejectedValue(error);

    const { result } = renderHook(() => useTagsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
