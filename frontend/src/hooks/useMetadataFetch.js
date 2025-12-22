import { useState, useEffect, useRef } from "react";
import { recipesApi } from "../services/api";

/**
 * Custom hook for fetching metadata from URL with debouncing
 * @param {string} url - URL to fetch metadata from
 * @param {string} recipeType - Current recipe type
 * @param {Object} options - Configuration options
 * @param {number} [options.debounceMs=800] - Debounce delay in milliseconds
 * @param {boolean} [options.autoFillTitle=true] - Auto-fill title from metadata
 * @param {boolean} [options.autoFillDescription=true] - Auto-fill description from metadata
 * @param {boolean} [options.autoFillPreviewImage=true] - Auto-fill preview image from metadata
 * @param {boolean} [options.autoFillSiteName=true] - Auto-fill site name from metadata
 * @returns {Object} Metadata state and handlers
 */
export const useMetadataFetch = (url, recipeType, options = {}) => {
  const {
    debounceMs = 800,
    autoFillTitle = true,
    autoFillDescription = true,
    autoFillPreviewImage = true,
    autoFillSiteName = true,
  } = options;

  const [metadata, setMetadata] = useState(null);
  const [fetching, setFetching] = useState(false);
  const urlDebounceRef = useRef(null);

  useEffect(() => {
    if (recipeType !== "link" || !url.trim()) {
      return;
    }

    // Clear previous timeout
    if (urlDebounceRef.current) {
      clearTimeout(urlDebounceRef.current);
    }

    // Set new timeout for fetching metadata
    urlDebounceRef.current = setTimeout(async () => {
      try {
        // Basic URL validation
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(url.trim())) {
          return; // Don't fetch if URL is not valid
        }

        setFetching(true);
        const fetchedMetadata = await recipesApi.fetchMetadata(url.trim());

        if (fetchedMetadata) {
          setMetadata(fetchedMetadata);
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
        // Don't show error to user, just log it
      } finally {
        setFetching(false);
      }
    }, debounceMs);

    // Cleanup on unmount or when URL changes
    return () => {
      if (urlDebounceRef.current) {
        clearTimeout(urlDebounceRef.current);
      }
    };
  }, [url, recipeType, debounceMs]);

  /**
   * Auto-fill form fields from metadata
   * @param {Object} currentValues - Current form values to check before auto-filling
   * @returns {Object} Values to auto-fill
   */
  const getAutoFillValues = (currentValues = {}) => {
    if (!metadata) return {};

    const autoFill = {};

    if (autoFillTitle && !currentValues.title && metadata.title) {
      autoFill.title = metadata.title;
    }
    if (autoFillDescription && !currentValues.description && metadata.description) {
      autoFill.description = metadata.description;
    }
    if (autoFillPreviewImage && !currentValues.previewImageUrl && metadata.imageUrl) {
      autoFill.previewImageUrl = metadata.imageUrl;
    }
    if (autoFillSiteName && !currentValues.siteName && metadata.siteName) {
      autoFill.siteName = metadata.siteName;
    }

    return autoFill;
  };

  return {
    metadata,
    setMetadata,
    fetching,
    getAutoFillValues,
  };
};
