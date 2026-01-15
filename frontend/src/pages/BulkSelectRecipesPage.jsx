import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipesQuery, useCollectionQuery, useCollectionMutations } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import { AuthButton } from "../components/auth";
import { CategoryBadge, TagBadge } from "../components/common/Badge";
import { logger } from "../utils/logger";

/**
 * Bulk recipe selection page for adding multiple recipes to a collection
 * Displayed after creating a new collection
 * @returns {JSX.Element}
 */
export default function BulkSelectRecipesPage() {
  const { id: collectionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch collection details
  const { data: collection, isLoading: isLoadingCollection } = useCollectionQuery(
    collectionId,
    { enabled: !!user && !!collectionId }
  );

  // Fetch all user recipes
  const { data: recipes = [], isLoading: isLoadingRecipes } = useRecipesQuery(
    searchQuery,
    null, // no category filter
    [], // no tag filter
    false, // not favorites only
    { enabled: !!user }
  );

  const { addRecipesBatchMutation } = useCollectionMutations();

  const isLoading = isLoadingCollection || isLoadingRecipes;

  // Filter recipes based on search
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const query = searchQuery.toLowerCase();
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(query)
    );
  }, [recipes, searchQuery]);

  const handleToggleRecipe = (recipeId) => {
    setSelectedRecipeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredRecipes.map(r => r.id));
    setSelectedRecipeIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedRecipeIds(new Set());
  };

  const handleAddRecipes = async () => {
    if (selectedRecipeIds.size === 0) {
      // Skip to collection detail if no recipes selected
      navigate(`/collections/${collectionId}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addRecipesBatchMutation.mutateAsync({
        collectionId,
        recipeIds: Array.from(selectedRecipeIds),
      });

      // Success - navigate to collection detail page
      navigate(`/collections/${collectionId}`, {
        state: { message: `Successfully added ${selectedRecipeIds.size} recipe${selectedRecipeIds.size === 1 ? '' : 's'}` }
      });
    } catch (err) {
      logger.error("Failed to add recipes:", err);
      setError(err.message || "Failed to add recipes. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate(`/collections/${collectionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Collection not found</h2>
          <button
            onClick={() => navigate("/collections")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/collections")}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Back to Collections"
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
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Recipes to "{collection.name}"</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Select recipes to add to your collection
                </p>
              </div>
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and bulk actions bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {selectedRecipeIds.size} recipe{selectedRecipeIds.size === 1 ? '' : 's'} selected
              </span>
              <button
                onClick={handleSelectAll}
                disabled={filteredRecipes.length === 0}
                className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                disabled={selectedRecipeIds.size === 0}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Recipe grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "No recipes found" : "No recipes yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? "Try a different search term"
                  : "Create some recipes first, then add them to collections"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => {
              const isSelected = selectedRecipeIds.has(recipe.id);
              return (
                <div
                  key={recipe.id}
                  onClick={() => handleToggleRecipe(recipe.id)}
                  className={`
                    bg-white rounded-lg shadow-sm border-2 transition cursor-pointer
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <div
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition
                            ${isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                            }
                          `}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Recipe content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-2 truncate">
                          {recipe.title}
                        </h3>
                        
                        {/* Recipe type badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${recipe.type === 'Link' ? 'bg-blue-100 text-blue-700' : ''}
                            ${recipe.type === 'Document' ? 'bg-purple-100 text-purple-700' : ''}
                            ${recipe.type === 'Manual' ? 'bg-green-100 text-green-700' : ''}
                          `}>
                            {recipe.type}
                          </span>
                        </div>

                        {/* Category and tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {recipe.category && <CategoryBadge category={recipe.category} />}
                          {recipe.tags?.slice(0, 2).map((tag) => (
                            <TagBadge key={tag.id} tag={tag} />
                          ))}
                          {recipe.tags?.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{recipe.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons - fixed at bottom */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t shadow-lg mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip - Add Recipes Later
              </button>
              <button
                onClick={handleAddRecipes}
                disabled={isSubmitting || (selectedRecipeIds.size === 0 && filteredRecipes.length > 0)}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? "Adding Recipes..." 
                  : selectedRecipeIds.size === 0 
                    ? "Continue to Collection" 
                    : `Add ${selectedRecipeIds.size} Recipe${selectedRecipeIds.size === 1 ? '' : 's'}`
                }
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
