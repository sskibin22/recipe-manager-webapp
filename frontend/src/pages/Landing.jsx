import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipesQuery, useBulkSelect } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import { AuthButton, AuthForm } from "../components/auth";
import RecipeList from "../components/recipe/RecipeList";
import RecipeForm from "../components/recipe/RecipeForm/RecipeForm";
import { SearchBar, FilterPanel, FilterChips } from "../components/recipe/RecipeFilters";
import CollapsibleSection from "../components/common/CollapsibleSection";
import RandomRecipeModal from "../components/common/RandomRecipeModal";
import { recipesApi } from "../services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Landing page component - main recipe list view
 * @returns {JSX.Element}
 */
export default function Landing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    types: [],
  });

  // Bulk selection state
  const {
    isSelectionMode,
    selectedIds,
    selectedCount,
    toggleSelectionMode,
    toggleSelect,
    selectAll,
    clearSelection,
    exitSelectionMode,
  } = useBulkSelect();

  // Calculate active filter count
  const activeFilterCount = (filters.categories?.length || 0) + (filters.types?.length || 0);

  // Fetch recipes with client-side type filtering since backend doesn't support multiple types
  // Convert filters to API parameters
  const categoryId = filters.categories?.length === 1 ? filters.categories[0] : null;
  
  const {
    data: allRecipes = [],
    isLoading,
    refetch,
  } = useRecipesQuery(searchQuery, categoryId, [], false, null, { enabled: !!user });

  // Apply client-side filtering for types and multiple categories
  const recipes = allRecipes.filter((recipe) => {
    // Filter by types if any are selected
    if (filters.types?.length > 0) {
      if (!filters.types.includes(recipe.type)) {
        return false;
      }
    }

    // Filter by multiple categories if more than one is selected
    if (filters.categories?.length > 1) {
      if (!recipe.category || !filters.categories.includes(recipe.category.id)) {
        return false;
      }
    }

    return true;
  });

  // Separate recipes into favorites and non-favorites
  const { favoriteRecipes, otherRecipes } = useMemo(() => {
    const favorites = [];
    const others = [];
    
    recipes.forEach((recipe) => {
      if (recipe.isFavorite) {
        favorites.push(recipe);
      } else {
        others.push(recipe);
      }
    });
    
    return { favoriteRecipes: favorites, otherRecipes: others };
  }, [recipes]);

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (recipeIds) => {
      return await recipesApi.bulkDelete(recipeIds);
    },
    onSuccess: (data) => {
      // Invalidate recipes query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      exitSelectionMode();
      // Show success message (you could add a toast notification here)
      console.log(`Successfully deleted ${data.deletedCount} recipes`);
    },
    onError: (error) => {
      console.error("Failed to delete recipes:", error);
      // Show error message (you could add a toast notification here)
    },
  });

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    bulkDeleteMutation.mutate(idsToDelete);
    setShowDeleteConfirm(false);
  };

  const cancelBulkDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleSelectAll = () => {
    selectAll(recipes);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRemoveCategory = (categoryId) => {
    setFilters({
      ...filters,
      categories: filters.categories.filter((id) => id !== categoryId),
    });
  };

  const handleRemoveType = (type) => {
    setFilters({
      ...filters,
      types: filters.types.filter((t) => t !== type),
    });
  };

  const handleClearAllFilters = () => {
    setFilters({
      categories: [],
      types: [],
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Recipe Manager
            </h1>
            <p className="text-lg text-gray-600">
              Save and organize your favorite recipes
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Recipe Manager</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRandomModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Random Recipe"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span className="hidden sm:inline">Randomize</span>
              </button>
              <button
                onClick={() => navigate("/collections")}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="My Collections"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                  />
                </svg>
                <span className="hidden sm:inline">Collections</span>
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Account Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          {/* Selection mode banner */}
          {isSelectionMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-900 font-medium">
                  {selectedCount} recipe{selectedCount !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-blue-700 hover:text-blue-900 font-medium text-sm"
                >
                  Select All ({recipes.length})
                </button>
                <button
                  onClick={clearSelection}
                  className="text-blue-700 hover:text-blue-900 font-medium text-sm"
                >
                  Clear Selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={exitSelectionMode}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-start">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex gap-4">
              {!isSelectionMode && (
                <>
                  <div className="relative flex-1 sm:flex-initial">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`w-full sm:w-auto px-4 py-2 text-gray-700 hover:text-gray-900 transition whitespace-nowrap flex items-center justify-center gap-2 border-b-2 ${
                        activeFilterCount > 0 || isFilterOpen
                          ? "border-blue-600"
                          : "border-transparent hover:border-gray-300"
                      }`}
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
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      <span className="text-sm">Filter</span>
                      {activeFilterCount > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium text-white bg-blue-600 rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                      <svg
                        className={`w-3 h-3 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isFilterOpen && (
                      <FilterPanel
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onClose={() => setIsFilterOpen(false)}
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex-1 sm:flex-initial px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    Add Recipe
                  </button>
                </>
              )}
              {!isSelectionMode && recipes.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className="flex-1 sm:flex-initial px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition whitespace-nowrap"
                >
                  Select
                </button>
              )}
            </div>
          </div>

          {/* Filter chips */}
          <FilterChips
            filters={filters}
            onRemoveCategory={handleRemoveCategory}
            onRemoveType={handleRemoveType}
            onClearAll={handleClearAllFilters}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading recipes...</div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recipes found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || activeFilterCount > 0
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first recipe"}
              </p>
              {!searchQuery && activeFilterCount === 0 && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Recipe
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Favorites Section */}
            {favoriteRecipes.length > 0 && (
              <CollapsibleSection
                title="Favorites"
                count={favoriteRecipes.length}
                defaultExpanded={true}
                storageKey="recipes-favorites-expanded"
              >
                <RecipeList 
                  recipes={favoriteRecipes} 
                  onUpdate={refetch}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              </CollapsibleSection>
            )}

            {/* All Recipes Section */}
            <CollapsibleSection
              title="All Recipes"
              count={otherRecipes.length}
              defaultExpanded={true}
              storageKey="recipes-all-expanded"
            >
              {otherRecipes.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No other recipes
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery || activeFilterCount > 0
                        ? "All matching recipes are in your favorites"
                        : "All your recipes are favorited"}
                    </p>
                  </div>
                </div>
              ) : (
                <RecipeList 
                  recipes={otherRecipes} 
                  onUpdate={refetch}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              )}
            </CollapsibleSection>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete {selectedCount} Recipe{selectedCount !== 1 ? "s" : ""}?
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. The selected recipe{selectedCount !== 1 ? "s" : ""} will be
                permanently deleted from your collection.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {bulkDeleteMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isFormOpen && (
          <RecipeForm
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              refetch();
            }}
          />
        )}

        {/* Random Recipe Modal */}
        <RandomRecipeModal
          isOpen={isRandomModalOpen}
          onClose={() => setIsRandomModalOpen(false)}
          collectionId={null}
        />
      </main>
    </div>
  );
}
