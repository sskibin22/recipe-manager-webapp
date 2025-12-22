import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, setTokenGetter, getErrorMessage } from "../apiClient";

describe("apiClient", () => {
  it("should be configured with correct base URL", () => {
    expect(apiClient.defaults.baseURL).toBeDefined();
  });

  it("should have correct default headers", () => {
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });
});

describe("setTokenGetter", () => {
  beforeEach(() => {
    // Reset the token getter
    setTokenGetter(null);
  });

  it("should accept a token getter function", () => {
    const mockTokenGetter = vi.fn(() => Promise.resolve("test-token"));
    expect(() => setTokenGetter(mockTokenGetter)).not.toThrow();
  });

  it("should allow setting token getter to null", () => {
    expect(() => setTokenGetter(null)).not.toThrow();
  });
});

describe("getErrorMessage", () => {
  it("should return default message for null error", () => {
    expect(getErrorMessage(null)).toBe("An unexpected error occurred");
  });

  it("should return default message for undefined error", () => {
    expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
  });

  it("should extract RFC 7807 detail field", () => {
    const error = {
      response: {
        data: {
          title: "Not Found",
          detail: "Recipe not found",
        },
      },
    };
    expect(getErrorMessage(error)).toBe("Recipe not found");
  });

  it("should extract RFC 7807 title field when detail is missing", () => {
    const error = {
      response: {
        data: {
          title: "Bad Request",
        },
      },
    };
    expect(getErrorMessage(error)).toBe("Bad Request");
  });

  it("should extract legacy message field", () => {
    const error = {
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    };
    expect(getErrorMessage(error)).toBe("Invalid credentials");
  });

  it("should fallback to error.message", () => {
    const error = {
      message: "Network Error",
    };
    expect(getErrorMessage(error)).toBe("Network Error");
  });

  it("should return default message when no error info available", () => {
    const error = {};
    expect(getErrorMessage(error)).toBe("An unexpected error occurred");
  });

  it("should prioritize detail over title", () => {
    const error = {
      response: {
        data: {
          title: "Not Found",
          detail: "Recipe with ID 123 not found",
          message: "Old message format",
        },
      },
    };
    expect(getErrorMessage(error)).toBe("Recipe with ID 123 not found");
  });

  it("should prioritize title over message", () => {
    const error = {
      response: {
        data: {
          title: "Unauthorized",
          message: "Old message format",
        },
      },
    };
    expect(getErrorMessage(error)).toBe("Unauthorized");
  });
});
