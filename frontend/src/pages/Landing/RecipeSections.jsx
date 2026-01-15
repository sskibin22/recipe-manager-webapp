import CollapsibleSection from "../../components/common/CollapsibleSection";
import RecipeList from "../../components/recipe/RecipeList";

/**
 * Recipe list sections for favorites and all recipes
 * @param {Object} props
 * @param {boolean} props.isLoading
 * @param {any[]} props.recipes
 * @param {any[]} props.favoriteRecipes
 * @param {any[]} props.otherRecipes
 * @param {string} props.searchQuery
 * @param {number} props.activeFilterCount
 * @param {boolean} props.isSelectionMode
 * @param {Set<string>} props.selectedIds
 * @param {(id: string) => void} props.onToggleSelect
 * @param {() => void} props.onAddRecipe
 * @returns {JSX.Element}
 */
export default function RecipeSections({
  isLoading,
  recipes,
  favoriteRecipes,
  otherRecipes,
  searchQuery,
  activeFilterCount,
  isSelectionMode,
  selectedIds,
  onToggleSelect,
  onAddRecipe,
}) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-warmgray-600">Loading recipes...</div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-serif font-medium text-warmgray-900 mb-2">No recipes found</h3>
          <p className="text-warmgray-600 mb-4">
            {searchQuery || activeFilterCount > 0 ? "Try adjusting your search or filters" : "Get started by adding your first recipe"}
          </p>
          {!searchQuery && activeFilterCount === 0 && (
            <button
              onClick={onAddRecipe}
              className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition shadow-warm"
            >
              Add Recipe
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {favoriteRecipes.length > 0 && (
        <CollapsibleSection title="Favorites" count={favoriteRecipes.length} defaultExpanded={true} storageKey="recipes-favorites-expanded">
          <RecipeList
            recipes={favoriteRecipes}
            isLoading={false}
            error={null}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
          />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="All Recipes" count={otherRecipes.length} defaultExpanded={true} storageKey="recipes-all-expanded">
        {otherRecipes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-serif font-medium text-warmgray-900 mb-2">No other recipes</h3>
              <p className="text-warmgray-600 mb-4">
                {searchQuery || activeFilterCount > 0 ? "All matching recipes are in your favorites" : "All your recipes are favorited"}
              </p>
            </div>
          </div>
        ) : (
          <RecipeList
            recipes={otherRecipes}
            isLoading={false}
            error={null}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
          />
        )}
      </CollapsibleSection>
    </>
  );
}
