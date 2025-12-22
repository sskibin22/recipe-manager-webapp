/**
 * @typedef {import('../../types/api').PresignedUploadResponse} PresignedUploadResponse
 * @typedef {import('../../types/api').PresignedDownloadResponse} PresignedDownloadResponse
 */

import axios from "axios";
import { apiClient } from "./apiClient";

/**
 * Get presigned upload URL for cloud storage
 * @param {string} fileName - Name of file to upload
 * @param {string} contentType - MIME type of file
 * @returns {Promise<PresignedUploadResponse>} Presigned upload URL and storage key
 */
const getPresignedUploadUrl = async (fileName, contentType) => {
  const response = await apiClient.post("/api/uploads/presign", {
    fileName,
    contentType,
  });
  return response.data;
};

/**
 * Get presigned download URL for cloud storage
 * @param {string} recipeId - Recipe ID (GUID)
 * @returns {Promise<PresignedDownloadResponse>} Presigned download URL
 */
const getPresignedDownloadUrl = async (recipeId) => {
  const response = await apiClient.get("/api/uploads/presign-download", {
    params: { recipeId },
  });
  return response.data;
};

/**
 * Get presigned upload URL for collection image
 * @param {string} fileName - Name of file to upload
 * @param {string} contentType - MIME type of file
 * @returns {Promise<PresignedUploadResponse>} Presigned upload URL and storage key
 */
const getPresignedCollectionImageUploadUrl = async (fileName, contentType) => {
  const response = await apiClient.post("/api/uploads/presign-collection-image", {
    fileName,
    contentType,
  });
  return response.data;
};

/**
 * Get presigned download URL for collection image
 * @param {string} collectionId - Collection ID (GUID)
 * @returns {Promise<PresignedDownloadResponse>} Presigned download URL
 */
const getPresignedCollectionImageDownloadUrl = async (collectionId) => {
  const response = await apiClient.get("/api/uploads/presign-collection-image-download", {
    params: { collectionId },
  });
  return response.data;
};

/**
 * Upload file to presigned URL
 * @param {string} presignedUrl - Presigned upload URL
 * @param {File} file - File object to upload
 * @returns {Promise<void>}
 */
const uploadToPresignedUrl = async (presignedUrl, file) => {
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
};

export const uploadService = {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  getPresignedCollectionImageUploadUrl,
  getPresignedCollectionImageDownloadUrl,
  uploadToPresignedUrl,
};

// Legacy export for backward compatibility
export const uploadsApi = uploadService;
