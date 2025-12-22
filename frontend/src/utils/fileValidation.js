// File validation constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

/**
 * Generic file validation helper
 * @param {File} file - The file to validate
 * @param {number} maxSize - Maximum file size in bytes
 * @param {Object} allowedTypes - Object mapping MIME types to extensions
 * @param {string} typeDescription - Human-readable description of allowed types
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateFileGeneric = (file, maxSize, allowedTypes, typeDescription) => {
  if (!file) {
    return "No file selected";
  }

  // Check file size
  if (file.size > maxSize) {
    return `File size must be less than ${maxSize / (1024 * 1024)}MB (selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
  }

  // Check file type by MIME type first
  let isValidType = Object.keys(allowedTypes).includes(file.type);

  // If MIME type check fails or is empty, check by file extension
  if (!isValidType || !file.type) {
    const fileName = file.name.toLowerCase();
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex === -1) {
      return `Invalid file type. Allowed types: ${typeDescription}`;
    }
    const fileExtension = fileName.substring(dotIndex);
    const allowedExtensions = Object.values(allowedTypes).flat();
    isValidType = allowedExtensions.includes(fileExtension);
  }

  if (!isValidType) {
    return `Invalid file type. Allowed types: ${typeDescription}`;
  }

  return null; // Valid file
};

/**
 * Validate recipe document files (PDF, DOC, DOCX, TXT, JPG, PNG)
 * @param {File} file - The file to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateRecipeDocument = (file) => {
  return validateFileGeneric(
    file,
    MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES,
    "PDF, DOC, DOCX, TXT, JPG, PNG"
  );
};

/**
 * Validate image files (JPG, PNG, GIF, WEBP)
 * @param {File} file - The file to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateImage = (file) => {
  return validateFileGeneric(
    file,
    MAX_IMAGE_SIZE,
    ALLOWED_IMAGE_TYPES,
    "JPG, PNG, GIF, WEBP"
  );
};

/**
 * Validate recipe image files (JPG, PNG, GIF, WEBP)
 * @param {File} file - The file to validate
 * @returns {string|null} Error message if invalid, null if valid
 * @deprecated Use validateImage instead
 */
export const validateRecipeImage = (file) => {
  return validateImage(file);
};

/**
 * Validate collection image files (JPG, PNG, GIF, WEBP)
 * @param {File} file - The file to validate
 * @returns {string|null} Error message if invalid, null if valid
 * @deprecated Use validateImage instead
 */
export const validateCollectionImage = (file) => {
  return validateImage(file);
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "2.5MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + sizes[i];
};
