import { describe, it, expect, vi, beforeEach } from "vitest";
import { userService } from "../userService";
import { apiClient } from "../apiClient";

// Mock apiClient
vi.mock("../apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should get user profile", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        displayName: "Test User",
      };
      apiClient.get.mockResolvedValue({ data: mockProfile });

      const result = await userService.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith("/api/user/profile");
      expect(result).toEqual(mockProfile);
    });
  });

  describe("updateProfile", () => {
    it("should update user profile", async () => {
      const profileData = {
        displayName: "Updated Name",
        email: "newemail@example.com",
      };
      const mockResponse = {
        id: "user-123",
        ...profileData,
      };
      apiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await userService.updateProfile(profileData);

      expect(apiClient.put).toHaveBeenCalledWith("/api/user/profile", profileData);
      expect(result).toEqual(mockResponse);
    });

    it("should allow partial profile updates", async () => {
      const profileData = {
        displayName: "New Display Name",
      };
      const mockResponse = {
        id: "user-123",
        email: "test@example.com",
        displayName: "New Display Name",
      };
      apiClient.put.mockResolvedValue({ data: mockResponse });

      const result = await userService.updateProfile(profileData);

      expect(apiClient.put).toHaveBeenCalledWith("/api/user/profile", profileData);
      expect(result).toEqual(mockResponse);
    });
  });
});
