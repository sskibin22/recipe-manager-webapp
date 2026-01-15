import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRecipesQuery, useBulkSelect } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import { FilterChips } from "../components/recipe/RecipeFilters";
import { AuthForm } from "../components/auth";
import { recipeService } from "../services/api";
import { logger } from "../utils/logger";
import LandingHeader from "./Landing/LandingHeader";
import LandingToolbar from "./Landing/LandingToolbar";
import BulkActionBar from "./Landing/BulkActionBar";
import RecipeSections from "./Landing/RecipeSections";
import LandingModals from "./Landing/LandingModals";

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
  const [filters, setFilters] = useState(/** @type {{categories: number[], types: ('Link'|'Document'|'Manual')[]}} */ ({
    categories: [],
    types: [],
  }));

  const {
    isSelectionMode,
    selectedIds,
    selectedCount,
    toggleSelectionMode,
    toggleSelect,
    selectAll,
    clearSelection,
    exitSelectionMode,
  } = /** @type {any} */ (useBulkSelect());

  const activeFilterCount = (filters.categories?.length || 0) + (filters.types?.length || 0);
  const categoryId = filters.categories?.length === 1 ? filters.categories[0] : null;

  const {
    data: allRecipes = [],
    isLoading,
    refetch,
  } = useRecipesQuery(searchQuery, categoryId, [], false, null, { enabled: !!user });

  const recipes = useMemo(
    () =>
      allRecipes.filter((recipe) => {
        if (filters.types?.length > 0 && !filters.types.includes(recipe.type)) {
          return false;
        }

        if (filters.categories?.length > 1) {
          if (!recipe.category || !filters.categories.includes(recipe.category.id)) {
            return false;
          }
        }

        return true;
      }),
    [allRecipes, filters],
  );

  const { favoriteRecipes, otherRecipes } = useMemo(() => {
    const favorites = /** @type {any[]} */ ([]);
    const others = /** @type {any[]} */ ([]);

    recipes.forEach((recipe) => {
      if (recipe.isFavorite) {
        favorites.push(recipe);
      } else {
        others.push(recipe);
      }
    });

    return { favoriteRecipes: favorites, otherRecipes: others };
  }, [recipes]);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (/** @type {string[]} */ recipeIds) => {
      return await recipeService.bulkDelete(recipeIds);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      exitSelectionMode();
      logger.info(`Successfully deleted ${data.deletedCount} recipes`);
    },
    onError: (error) => {
      logger.error("Failed to delete recipes:", error);
    },
  });

  const handleBulkDelete = () => setShowDeleteConfirm(true);
  const confirmBulkDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    bulkDeleteMutation.mutate(idsToDelete);
    setShowDeleteConfirm(false);
  };
  const cancelBulkDelete = () => setShowDeleteConfirm(false);
  const handleSelectAll = () => selectAll(recipes);

  /**
   * @param {{categories: number[], types: ('Link'|'Document'|'Manual')[]}} newFilters
   */
  const handleFiltersChange = (newFilters) => setFilters(newFilters);

  /**
   * @param {number} categoryId
   */
  const handleRemoveCategory = (categoryId) => {
    setFilters({
      ...filters,
      categories: filters.categories.filter((id) => id !== categoryId),
    });
  };

  /**
   * @param {'Link'|'Document'|'Manual'} type
   */
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
        <div className="text-lg text-warmgray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-cream-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold text-warmgray-900 mb-2">Recipe Manager</h1>
            <p className="text-lg text-warmgray-600 font-sans">Save and organize your favorite recipes</p>
          </div>
          <div className="bg-cream-100 rounded-xl shadow-warm border border-wood-200 p-8">
            <AuthForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <LandingHeader
        onOpenRandom={() => setIsRandomModalOpen(true)}
        onNavigateCollections={() => navigate("/collections")}
        onNavigateSettings={() => navigate("/settings")}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-4">
          <BulkActionBar
            isSelectionMode={isSelectionMode}
            selectedCount={selectedCount}
            totalCount={recipes.length}
            onSelectAll={handleSelectAll}
            onClearSelection={clearSelection}
            onDeleteSelected={handleBulkDelete}
            onCancel={exitSelectionMode}
            isDeleting={bulkDeleteMutation.isPending}
          />

          <LandingToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            isFilterOpen={isFilterOpen}
            onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
            onCloseFilter={() => setIsFilterOpen(false)}
            onFiltersChange={handleFiltersChange}
            activeFilterCount={activeFilterCount}
            isSelectionMode={isSelectionMode}
            hasRecipes={recipes.length > 0}
            onToggleSelectionMode={toggleSelectionMode}
            onOpenForm={() => setIsFormOpen(true)}
          />

          <FilterChips
            filters={filters}
            onRemoveCategory={handleRemoveCategory}
            onRemoveType={handleRemoveType}
            onClearAll={handleClearAllFilters}
          />
        </div>

        <RecipeSections
          isLoading={isLoading}
          recipes={recipes}
          favoriteRecipes={favoriteRecipes}
          otherRecipes={otherRecipes}
          searchQuery={searchQuery}
          activeFilterCount={activeFilterCount}
          isSelectionMode={isSelectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onAddRecipe={() => setIsFormOpen(true)}
        />

        <LandingModals
          showDeleteConfirm={showDeleteConfirm}
          selectedCount={selectedCount}
          onCancelDelete={cancelBulkDelete}
          onConfirmDelete={confirmBulkDelete}
          isDeleting={bulkDeleteMutation.isPending}
          isFormOpen={isFormOpen}
          onCloseForm={() => setIsFormOpen(false)}
          onRecipeCreated={() => {
            setIsFormOpen(false);
            refetch();
          }}
          isRandomModalOpen={isRandomModalOpen}
          onCloseRandom={() => setIsRandomModalOpen(false)}
        />
      </main>
    </div>
  );
}
