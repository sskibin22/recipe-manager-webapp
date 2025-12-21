import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadService, uploadsApi } from "../uploadService";
import { apiClient } from "../apiClient";
import axios from "axios";

// Mock apiClient and axios
vi.mock("../apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("axios", () => ({
  default: {
    put: vi.fn(),
  },
}));

describe("uploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPresignedUploadUrl", () => {
    it("should get presigned upload URL", async () => {
      const mockResponse = {
        uploadUrl: "https://storage.example.com/upload",
        storageKey: "recipes/test-file.pdf",
      };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await uploadService.getPresignedUploadUrl(
        "test-file.pdf",
        "application/pdf"
      );

      expect(apiClient.post).toHaveBeenCalledWith("/api/uploads/presign", {
        fileName: "test-file.pdf",
        contentType: "application/pdf",
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("should get presigned download URL", async () => {
      const mockResponse = {
        downloadUrl: "https://storage.example.com/download/recipe-123",
      };
      apiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await uploadService.getPresignedDownloadUrl("recipe-123");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/uploads/presign-download",
        {
          params: { recipeId: "recipe-123" },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("uploadToPresignedUrl", () => {
    it("should upload file to presigned URL", async () => {
      const mockFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const presignedUrl = "https://storage.example.com/upload";

      axios.put.mockResolvedValue({});

      await uploadService.uploadToPresignedUrl(presignedUrl, mockFile);

      expect(axios.put).toHaveBeenCalledWith(presignedUrl, mockFile, {
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    });

    it("should use correct content type from file", async () => {
      const mockFile = new File(["image data"], "test.jpg", {
        type: "image/jpeg",
      });
      const presignedUrl = "https://storage.example.com/upload";

      axios.put.mockResolvedValue({});

      await uploadService.uploadToPresignedUrl(presignedUrl, mockFile);

      expect(axios.put).toHaveBeenCalledWith(presignedUrl, mockFile, {
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
    });
  });

  describe("backward compatibility - uploadsApi", () => {
    it("should export uploadsApi with same methods", () => {
      expect(uploadsApi).toBeDefined();
      expect(uploadsApi.getPresignedUploadUrl).toBe(
        uploadService.getPresignedUploadUrl
      );
      expect(uploadsApi.getPresignedDownloadUrl).toBe(
        uploadService.getPresignedDownloadUrl
      );
      expect(uploadsApi.uploadToPresignedUrl).toBe(
        uploadService.uploadToPresignedUrl
      );
    });
  });
});
