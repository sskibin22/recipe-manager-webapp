/**
 * Centralized logging service for the application
 * 
 * In development mode, logs are output to the console.
 * In production mode, logs are suppressed to avoid exposing sensitive information.
 * 
 * Future enhancement: Integrate with error monitoring service (e.g., Sentry) in production.
 */

const isDev = import.meta.env.DEV;

/**
 * Centralized logger utility
 * Provides different logging levels with environment-aware behavior
 */
export const logger = {
  /**
   * Log error messages
   * @param {string} message - Error message
   * @param {...any} args - Additional arguments to log
   */
  error: (message, ...args) => {
    if (isDev) {
      console.error(message, ...args);
    }
    // In production, optionally send to error tracking service
    // Example: errorTracker.captureException(args[0]);
  },

  /**
   * Log warning messages
   * @param {string} message - Warning message
   * @param {...any} args - Additional arguments to log
   */
  warn: (message, ...args) => {
    if (isDev) {
      console.warn(message, ...args);
    }
  },

  /**
   * Log informational messages
   * @param {string} message - Info message
   * @param {...any} args - Additional arguments to log
   */
  info: (message, ...args) => {
    if (isDev) {
      console.info(message, ...args);
    }
  },

  /**
   * Log debug messages
   * @param {string} message - Debug message
   * @param {...any} args - Additional arguments to log
   */
  debug: (message, ...args) => {
    if (isDev) {
      console.debug(message, ...args);
    }
  },
};
