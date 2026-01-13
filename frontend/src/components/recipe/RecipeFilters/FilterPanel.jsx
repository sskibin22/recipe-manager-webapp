/**
 * @typedef {import('../../../types/recipe').RecipeType} RecipeType
 */

import { useState, useEffect, useRef } from "react";
import { useCategoriesQuery } from "../../../hooks";

const RECIPE_TYPES = [
  { value: "Manual", label: "Manual" },
  { value: "Link", label: "Link" },
  { value: "Document", label: "Document" },
];

/**
 * @typedef {Object} FilterState
 * @property {number[]} categories - Array of category IDs
 * @property {RecipeType[]} types - Array of recipe types
 */

/**
 * Filter panel component - side panel for filtering recipes
 * @param {Object} props
 * @param {FilterState} props.filters - Current filter state
 * @param {(filters: FilterState) => void} props.onFiltersChange - Callback when filters are applied
 * @param {() => void} props.onClose - Callback when panel is closed
 * @returns {JSX.Element}
 */
const FilterPanel = ({ filters, onFiltersChange, onClose }) => {
  const panelRef = useRef(null);
  const [selectedCategories, setSelectedCategories] = useState(
    filters.categories || []
  );
  const [selectedTypes, setSelectedTypes] = useState(filters.types || []);

  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleCategoryToggle = (categoryId) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    setSelectedCategories(newCategories);
  };

  const handleTypeToggle = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
  };

  const handleApply = () => {
    onFiltersChange({
      categories: selectedCategories,
      types: selectedTypes,
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    onFiltersChange({
      categories: [],
      types: [],
    });
  };

  const activeFilterCount =
    selectedCategories.length + selectedTypes.length;

  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-md shadow-lg border border-gray-200 z-50"
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close filter panel"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Category</h4>
          {categoriesLoading ? (
            <div className="text-xs text-gray-400 py-1">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-xs text-gray-400 py-1">No categories</div>
          ) : (
            <div className="space-y-1">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1.5 text-xs text-gray-700">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Type Filter */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-600 mb-2">Type</h4>
          <div className="space-y-1">
            {RECIPE_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded transition"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.value)}
                  onChange={() => handleTypeToggle(type.value)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={handleClear}
            disabled={activeFilterCount === 0}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;