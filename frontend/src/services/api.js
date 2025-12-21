/**
 * DEPRECATED: This file is maintained for backward compatibility only.
 * 
 * All API services have been refactored into domain-specific modules in /services/api/
 * New code should import from '/services/api' or specific service modules.
 * 
 * Legacy code using this file will continue to work without changes.
 * 
 * @see /services/api/index.js for the new module structure
 */

// Re-export everything from the new modular API structure
export * from "./api/index";

// Ensure default export is preserved
export { default } from "./api/index";
