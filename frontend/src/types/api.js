/**
 * @file Type definitions for API-related entities and responses
 */

/**
 * @typedef {Object} PresignedUploadResponse
 * @property {string} uploadUrl - Presigned URL for uploading to cloud storage
 * @property {string} key - Storage key for the uploaded file
 */

/**
 * @typedef {Object} PresignedDownloadResponse
 * @property {string} downloadUrl - Presigned URL for downloading from cloud storage
 */

/**
 * @typedef {Object} ApiError
 * @property {Object} [response] - HTTP response object (Axios format)
 * @property {Object} [response.data] - Response body
 * @property {string} [response.data.detail] - RFC 7807 Problem Details: detailed error message
 * @property {string} [response.data.title] - RFC 7807 Problem Details: error title
 * @property {string} [response.data.message] - Legacy format: error message
 * @property {string} [message] - Fallback error message
 */

/**
 * @typedef {Object} QueryParams
 * @property {string} [q] - Search query string
 * @property {number} [category] - Category ID filter
 * @property {string} [tags] - Comma-separated tag IDs filter
 */

export {};
