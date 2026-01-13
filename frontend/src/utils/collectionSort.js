/**
 * Utility functions for sorting and filtering collections
 */

/**
 * Sort options for collections
 * @typedef {'name-asc' | 'name-desc' | 'created-newest' | 'created-oldest' | 'updated-newest'} SortOption
 */

/**
 * Sort collections based on the selected sort option
 * @param {Array} collections - Array of collection objects
 * @param {SortOption} sortOption - Sort option to apply
 * @returns {Array} Sorted array of collections
 */
export const sortCollections = (collections, sortOption) => {
  if (!collections || collections.length === 0) {
    return collections;
  }

  // Create a copy to avoid mutating the original array
  const sorted = [...collections];

  switch (sortOption) {
    case 'name-asc':
      return sorted.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    
    case 'name-desc':
      return sorted.sort((a, b) => 
        b.name.localeCompare(a.name, undefined, { sensitivity: 'base' })
      );
    
    case 'created-newest':
      return sorted.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    
    case 'created-oldest':
      return sorted.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    
    case 'updated-newest':
      return sorted.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    
    default:
      // Default to most recently updated
      return sorted.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
  }
};

/**
 * Filter collections by search query (case-insensitive, searches name)
 * @param {Array} collections - Array of collection objects
 * @param {string} searchQuery - Search query string
 * @returns {Array} Filtered array of collections
 */
export const filterCollectionsBySearch = (collections, searchQuery) => {
  if (!collections || collections.length === 0) {
    return collections;
  }

  if (!searchQuery || searchQuery.trim() === '') {
    return collections;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return collections.filter(collection => 
    collection.name.toLowerCase().includes(query)
  );
};

/**
 * Get display label for sort option
 * @param {SortOption} sortOption - Sort option
 * @returns {string} Human-readable label
 */
export const getSortLabel = (sortOption) => {
  const labels = {
    'name-asc': 'Name (A-Z)',
    'name-desc': 'Name (Z-A)',
    'created-newest': 'Newest First',
    'created-oldest': 'Oldest First',
    'updated-newest': 'Recently Updated',
  };
  
  return labels[sortOption] || 'Recently Updated';
};

/**
 * Available sort options for collections
 */
export const SORT_OPTIONS = [
  { value: 'updated-newest', label: 'Recently Updated' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'created-newest', label: 'Newest First' },
  { value: 'created-oldest', label: 'Oldest First' },
];

/**
 * Session storage key for persisting sort preference
 */
export const SORT_STORAGE_KEY = 'collections-sort-preference';
