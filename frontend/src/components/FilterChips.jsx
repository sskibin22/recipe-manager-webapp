/**
 * @typedef {import('../types/recipe').RecipeType} RecipeType
 * @typedef {Object} FilterState
 * @property {number[]} [categories] - Array of category IDs
 * @property {RecipeType[]} [types] - Array of recipe types
 */

import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "../services/api";

/**
 * Filter chips component - displays active filters as removable chips
 * @param {Object} props
 * @param {FilterState} props.filters - Current filter state
 * @param {(categoryId: number) => void} props.onRemoveCategory - Callback to remove category filter
 * @param {(type: RecipeType) => void} props.onRemoveType - Callback to remove type filter
 * @param {() => void} props.onClearAll - Callback to clear all filters
 * @returns {JSX.Element|null}
 */
const FilterChips = ({ filters, onRemoveCategory, onRemoveType, onClearAll }) => {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const selectedCategories = categories.filter((cat) =>
    filters.categories?.includes(cat.id)
  );
  const selectedTypes = filters.types || [];

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedTypes.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm font-medium text-gray-700">Active filters:</span>

      {/* Category chips */}
      {selectedCategories.map((category) => (
        <div
          key={category.id}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span>{category.name}</span>
          <button
            onClick={() => onRemoveCategory(category.id)}
            className="ml-1 hover:text-blue-900 transition"
            aria-label={`Remove ${category.name} filter`}
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
      ))}

      {/* Type chips */}
      {selectedTypes.map((type) => (
        <div
          key={type}
          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
        >
          <span>{type}</span>
          <button
            onClick={() => onRemoveType(type)}
            className="ml-1 hover:text-green-900 transition"
            aria-label={`Remove ${type} filter`}
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
      ))}

      {/* Clear all button */}
      <button
        onClick={onClearAll}
        className="text-sm text-gray-600 hover:text-gray-900 underline transition"
      >
        Clear all
      </button>
    </div>
  );
};

export default FilterChips;