/**
 * @file Type definitions for Recipe, Category, and Tag entities
 */

/**
 * @typedef {Object} Category
 * @property {number} id - Category ID
 * @property {string} name - Category name
 * @property {string} color - Category color (hex or tailwind class)
 */

/**
 * @typedef {Object} Tag
 * @property {number} id - Tag ID
 * @property {string} name - Tag name
 * @property {string} color - Tag color (hex or tailwind class)
 * @property {string} type - Tag type/category
 */

/**
 * @typedef {'Link'|'Document'|'Manual'} RecipeType
 * The type of recipe storage
 */

/**
 * @typedef {Object} Recipe
 * @property {string} id - Recipe ID (GUID)
 * @property {string} title - Recipe title
 * @property {RecipeType} type - Recipe type
 * @property {string} [url] - External recipe URL (for Link type)
 * @property {string} [storageKey] - Storage key for uploaded document (for Document type)
 * @property {string} [content] - Recipe content (JSON string for Manual type)
 * @property {string} [previewImageUrl] - Preview image URL or storage key
 * @property {string} [description] - Recipe description
 * @property {string} [siteName] - Source site name (for Link type)
 * @property {string} createdAt - ISO 8601 datetime
 * @property {string} updatedAt - ISO 8601 datetime
 * @property {string} [fileContent] - Base64 encoded file content (for Document type)
 * @property {string} [fileContentType] - MIME type of file
 * @property {boolean} isFavorite - Whether recipe is favorited by current user
 * @property {Category} [category] - Recipe category
 * @property {Tag[]} tags - Recipe tags
 */

/**
 * @typedef {Object} RecipeContent
 * @property {string} description - Recipe description/overview
 * @property {string} ingredients - Recipe ingredients list
 * @property {string} instructions - Recipe cooking instructions
 * @property {string} notes - Additional notes or tips
 */

/**
 * @typedef {Object} RecipeCreateData
 * @property {string} title - Recipe title
 * @property {RecipeType} type - Recipe type
 * @property {string} [url] - External URL (for Link type)
 * @property {string} [storageKey] - Storage key (for Document type)
 * @property {string} [content] - Recipe content JSON (for Manual type)
 * @property {string} [previewImageUrl] - Preview image URL or storage key
 * @property {string} [description] - Description
 * @property {string} [siteName] - Site name
 * @property {number} [categoryId] - Category ID
 * @property {number[]} [tagIds] - Tag IDs
 */

/**
 * @typedef {Object} RecipeUpdateData
 * @property {string} id - Recipe ID
 * @property {string} [title] - Recipe title
 * @property {string} [url] - External URL (for Link type)
 * @property {string} [storageKey] - Storage key (for Document type)
 * @property {string} [content] - Recipe content JSON (for Manual type)
 * @property {string} [previewImageUrl] - Preview image URL
 * @property {string} [description] - Description
 * @property {string} [siteName] - Site name
 * @property {number} [categoryId] - Category ID
 * @property {number[]} [tagIds] - Tag IDs
 */

/**
 * @typedef {Object} MetadataResponse
 * @property {string} [title] - Page title extracted from metadata
 * @property {string} [description] - Page description
 * @property {string} [imageUrl] - Preview image URL
 * @property {string} [siteName] - Website name
 */

export {};
