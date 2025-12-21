import { describe, it, expect } from "vitest";
import {
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  ALLOWED_FILE_TYPES,
  ALLOWED_IMAGE_TYPES,
  validateFileGeneric,
  validateRecipeDocument,
  validateRecipeImage,
  formatFileSize,
} from "./fileValidation";

describe("fileValidation", () => {
  describe("constants", () => {
    it("should export MAX_FILE_SIZE as 10MB", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });

    it("should export MAX_IMAGE_SIZE as 5MB", () => {
      expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024);
    });

    it("should export ALLOWED_FILE_TYPES with correct mappings", () => {
      expect(ALLOWED_FILE_TYPES).toEqual({
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "text/plain": [".txt"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
      });
    });

    it("should export ALLOWED_IMAGE_TYPES with correct mappings", () => {
      expect(ALLOWED_IMAGE_TYPES).toEqual({
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/gif": [".gif"],
        "image/webp": [".webp"],
      });
    });
  });

  describe("validateFileGeneric", () => {
    it("should return error for no file", () => {
      const result = validateFileGeneric(null, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toBe("No file selected");
    });

    it("should return error for oversized file", () => {
      const file = new File(["a".repeat(11 * 1024 * 1024)], "test.pdf", {
        type: "application/pdf",
      });
      const result = validateFileGeneric(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toContain("File size must be less than");
      expect(result).toContain("10MB");
    });

    it("should return error for invalid MIME type", () => {
      const file = new File(["content"], "test.exe", {
        type: "application/x-msdownload",
      });
      const result = validateFileGeneric(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toBe("Invalid file type. Allowed types: PDF, DOC");
    });

    it("should validate file with valid MIME type", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      const result = validateFileGeneric(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toBeNull();
    });

    it("should fallback to extension validation when MIME type is empty", () => {
      const file = new File(["content"], "test.pdf", {
        type: "",
      });
      const result = validateFileGeneric(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toBeNull();
    });

    it("should fallback to extension validation when MIME type is invalid", () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/unknown",
      });
      const result = validateFileGeneric(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toBeNull();
    });

    it("should return error for file without extension", () => {
      const file = new File(["content"], "testfile", {
        type: "",
      });
      const result = validateFileGeneric(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toBe("Invalid file type. Allowed types: PDF, DOC");
    });

    it("should validate file with uppercase extension", () => {
      const file = new File(["content"], "test.PDF", {
        type: "",
      });
      const result = validateFileGeneric(file, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "PDF, DOC");
      expect(result).toBeNull();
    });

    it("should handle multiple extensions for same MIME type", () => {
      const file1 = new File(["content"], "test.jpg", {
        type: "image/jpeg",
      });
      const file2 = new File(["content"], "test.jpeg", {
        type: "image/jpeg",
      });
      const result1 = validateFileGeneric(file1, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "JPG, JPEG");
      const result2 = validateFileGeneric(file2, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, "JPG, JPEG");
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe("validateRecipeDocument", () => {
    it("should validate PDF file", () => {
      const file = new File(["content"], "recipe.pdf", {
        type: "application/pdf",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBeNull();
    });

    it("should validate DOC file", () => {
      const file = new File(["content"], "recipe.doc", {
        type: "application/msword",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBeNull();
    });

    it("should validate DOCX file", () => {
      const file = new File(["content"], "recipe.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBeNull();
    });

    it("should validate TXT file", () => {
      const file = new File(["content"], "recipe.txt", {
        type: "text/plain",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBeNull();
    });

    it("should validate JPG file", () => {
      const file = new File(["content"], "recipe.jpg", {
        type: "image/jpeg",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBeNull();
    });

    it("should validate PNG file", () => {
      const file = new File(["content"], "recipe.png", {
        type: "image/png",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBeNull();
    });

    it("should return error for oversized document (>10MB)", () => {
      // Create file larger than 10MB
      const largeContent = "a".repeat(11 * 1024 * 1024);
      const file = new File([largeContent], "large.pdf", {
        type: "application/pdf",
      });
      const result = validateRecipeDocument(file);
      expect(result).toContain("File size must be less than 10MB");
    });

    it("should return error for invalid document type", () => {
      const file = new File(["content"], "recipe.exe", {
        type: "application/x-msdownload",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBe("Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG");
    });

    it("should return error for no file", () => {
      const result = validateRecipeDocument(null);
      expect(result).toBe("No file selected");
    });

    it("should validate document with extension fallback", () => {
      const file = new File(["content"], "recipe.pdf", {
        type: "",
      });
      const result = validateRecipeDocument(file);
      expect(result).toBeNull();
    });
  });

  describe("validateRecipeImage", () => {
    it("should validate JPG image", () => {
      const file = new File(["content"], "image.jpg", {
        type: "image/jpeg",
      });
      const result = validateRecipeImage(file);
      expect(result).toBeNull();
    });

    it("should validate JPEG image", () => {
      const file = new File(["content"], "image.jpeg", {
        type: "image/jpeg",
      });
      const result = validateRecipeImage(file);
      expect(result).toBeNull();
    });

    it("should validate PNG image", () => {
      const file = new File(["content"], "image.png", {
        type: "image/png",
      });
      const result = validateRecipeImage(file);
      expect(result).toBeNull();
    });

    it("should validate GIF image", () => {
      const file = new File(["content"], "image.gif", {
        type: "image/gif",
      });
      const result = validateRecipeImage(file);
      expect(result).toBeNull();
    });

    it("should validate WEBP image", () => {
      const file = new File(["content"], "image.webp", {
        type: "image/webp",
      });
      const result = validateRecipeImage(file);
      expect(result).toBeNull();
    });

    it("should return error for oversized image (>5MB)", () => {
      // Create file larger than 5MB
      const largeContent = "a".repeat(6 * 1024 * 1024);
      const file = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });
      const result = validateRecipeImage(file);
      expect(result).toContain("File size must be less than 5MB");
    });

    it("should return error for invalid image type", () => {
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });
      const result = validateRecipeImage(file);
      expect(result).toBe("Invalid file type. Allowed types: JPG, PNG, GIF, WEBP");
    });

    it("should return error for no file", () => {
      const result = validateRecipeImage(null);
      expect(result).toBe("No file selected");
    });

    it("should validate image with extension fallback", () => {
      const file = new File(["content"], "image.png", {
        type: "",
      });
      const result = validateRecipeImage(file);
      expect(result).toBeNull();
    });
  });

  describe("formatFileSize", () => {
    it("should format 0 bytes", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
    });

    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500Bytes");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1KB");
      expect(formatFileSize(1536)).toBe("1.5KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1MB");
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.5MB");
    });

    it("should format gigabytes", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1GB");
      expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe("1.5GB");
    });

    it("should round to 2 decimal places", () => {
      expect(formatFileSize(1234567)).toBe("1.18MB");
    });
  });
});
