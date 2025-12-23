import { useState, useCallback, useMemo } from "react";

/**
 * Custom hook for managing bulk selection state
 * @returns {Object} Bulk selection state and handlers
 * @property {boolean} isSelectionMode - Whether bulk selection mode is active
 * @property {Set<string>} selectedIds - Set of selected recipe IDs
 * @property {number} selectedCount - Count of selected recipes
 * @property {Function} toggleSelectionMode - Toggle bulk selection mode on/off
 * @property {Function} toggleSelect - Toggle selection for a single recipe
 * @property {Function} selectAll - Select all provided recipes
 * @property {Function} clearSelection - Clear all selections
 * @property {Function} exitSelectionMode - Exit selection mode and clear selections
 */
export const useBulkSelect = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      const newMode = !prev;
      // Clear selections when exiting selection mode
      if (!newMode) {
        setSelectedIds(new Set());
      }
      return newMode;
    });
  }, []);

  const toggleSelect = useCallback((recipeId) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((recipes) => {
    const allIds = recipes.map((recipe) => recipe.id);
    setSelectedIds(new Set(allIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  return {
    isSelectionMode,
    selectedIds,
    selectedCount,
    toggleSelectionMode,
    toggleSelect,
    selectAll,
    clearSelection,
    exitSelectionMode,
  };
};
