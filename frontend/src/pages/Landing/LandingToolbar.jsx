import { SearchBar, FilterPanel } from "../../components/recipe/RecipeFilters";

/**
 * Toolbar with search, filters, and primary actions
 * @param {Object} props
 * @param {string} props.searchQuery
 * @param {(value: string) => void} props.onSearchChange
 * @param {{categories: number[], types: ('Link'|'Document'|'Manual')[]}} props.filters
 * @param {boolean} props.isFilterOpen
 * @param {() => void} props.onToggleFilter
 * @param {() => void} props.onCloseFilter
 * @param {(filters: any) => void} props.onFiltersChange
 * @param {number} props.activeFilterCount
 * @param {boolean} props.isSelectionMode
 * @param {boolean} props.hasRecipes
 * @param {() => void} props.onToggleSelectionMode
 * @param {() => void} props.onOpenForm
 * @returns {JSX.Element}
 */
export default function LandingToolbar({
  searchQuery,
  onSearchChange,
  filters,
  isFilterOpen,
  onToggleFilter,
  onCloseFilter,
  onFiltersChange,
  activeFilterCount,
  isSelectionMode,
  hasRecipes,
  onToggleSelectionMode,
  onOpenForm,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-start">
      <div className="flex-1">
        <SearchBar value={searchQuery} onChange={onSearchChange} />
      </div>
      <div className="flex gap-4">
        {!isSelectionMode && (
          <>
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={onToggleFilter}
                className={`w-full sm:w-auto px-4 py-2 text-warmgray-700 hover:text-warmgray-900 transition whitespace-nowrap flex items-center justify-center gap-2 border-b-2 ${
                  activeFilterCount > 0 || isFilterOpen ? "border-terracotta-600" : "border-transparent hover:border-wood-400"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="text-sm">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium text-white bg-terracotta-600 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <svg className={`w-3 h-3 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isFilterOpen && <FilterPanel filters={filters} onFiltersChange={onFiltersChange} onClose={onCloseFilter} />}
            </div>
            <button
              onClick={onOpenForm}
              className="flex-1 sm:flex-initial px-6 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition shadow-warm whitespace-nowrap"
            >
              Add Recipe
            </button>
          </>
        )}
        {!isSelectionMode && hasRecipes && (
          <button
            onClick={onToggleSelectionMode}
            className="flex-1 sm:flex-initial px-6 py-2 bg-wood-200 text-warmgray-700 rounded-lg hover:bg-wood-300 transition whitespace-nowrap"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}
