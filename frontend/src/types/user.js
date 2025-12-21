/**
 * @file Type definitions for User and authentication-related entities
 */

/**
 * @typedef {Object} User
 * @property {string} uid - User ID
 * @property {string} email - User email
 * @property {string|null} displayName - User display name
 * @property {string|null} photoURL - User photo URL
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - User profile ID (GUID)
 * @property {string} authSub - Firebase authentication subject ID
 * @property {string} email - User email
 * @property {string} [displayName] - User display name
 * @property {string} createdAt - ISO 8601 datetime
 */

export {};
