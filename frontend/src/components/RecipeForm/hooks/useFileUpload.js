import { useState } from "react";
import { uploadsApi } from "../../../services/api";
import { validateRecipeDocument, validateRecipeImage } from "../../../utils/fileValidation";

/**
 * Custom hook for file upload management
 * @returns {Object} File upload state and handlers
 */
export const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [displayImageFile, setDisplayImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Upload a file to presigned URL
   * @param {File} file - File to upload
   * @param {string} fileName - File name for storage
   * @param {string} contentType - Content type of the file
   * @returns {Promise<string>} Storage key
   */
  const uploadFile = async (file, fileName, contentType) => {
    setUploading(true);
    try {
      const presignData = await uploadsApi.getPresignedUploadUrl(fileName, contentType);
      await uploadsApi.uploadToPresignedUrl(presignData.uploadUrl, file);
      return presignData.key;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Generate a unique filename for images
   * @param {File} file - Original file
   * @returns {string} Generated filename
   */
  const generateImageFilename = (file) => {
    return `image-${Date.now()}-${file.name}`;
  };

  /**
   * Upload display image and return storage key
   * @param {File} imageFile - Image file to upload
   * @returns {Promise<string>} Storage key
   */
  const uploadDisplayImage = async (imageFile) => {
    const imagePresignData = await uploadsApi.getPresignedUploadUrl(
      generateImageFilename(imageFile),
      imageFile.type,
    );
    await uploadsApi.uploadToPresignedUrl(imagePresignData.uploadUrl, imageFile);
    return imagePresignData.key;
  };

  /**
   * Handle file selection for document upload
   * @param {Event} e - Change event
   * @returns {string|null} Error message or null if valid
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return null;
    }

    const validationError = validateRecipeDocument(selectedFile);
    if (validationError) {
      setFile(null);
      e.target.value = "";
      return validationError;
    }

    setFile(selectedFile);
    return null;
  };

  /**
   * Handle file selection for display image
   * @param {Event} e - Change event
   * @returns {string|null} Error message or null if valid
   */
  const handleDisplayImageChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setDisplayImageFile(null);
      return null;
    }

    const validationError = validateRecipeImage(selectedFile);
    if (validationError) {
      setDisplayImageFile(null);
      e.target.value = "";
      return validationError;
    }

    setDisplayImageFile(selectedFile);
    return null;
  };

  return {
    file,
    setFile,
    displayImageFile,
    setDisplayImageFile,
    uploading,
    uploadFile,
    uploadDisplayImage,
    handleFileChange,
    handleDisplayImageChange,
  };
};
