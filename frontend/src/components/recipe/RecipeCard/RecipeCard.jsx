/**
 * @typedef {import('../../../types/recipe').Recipe} Recipe
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recipesApi } from "../../../services/api";
import { parseRecipeContent } from "../../../utils/recipeContent";
import { CategoryBadge, TagBadge } from "../../common/Badge";
import AddToCollectionModal from "../../common/AddToCollectionModal";

/**
 * Helper function to extract preview text from Manual recipe content
 * @param {string} content - Raw recipe content string
 * @returns {string} Preview text
 */
const getManualRecipePreview = (content) => {
  const parsedContent = parseRecipeContent(content);
  // Try description first, then ingredients, then instructions
  return parsedContent.description || 
         parsedContent.ingredients || 
         parsedContent.instructions || 
         "";
};

/**
 * Recipe card component - displays a recipe in card format
 * @param {Object} props
 * @param {Recipe} props.recipe - Recipe object to display
 * @returns {JSX.Element}
 */
const RecipeCard = ({ recipe }) => {
  const queryClient = useQueryClient();
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (recipe.isFavorite) {
        await recipesApi.removeFavorite(recipe.id);
      } else {
        await recipesApi.addFavorite(recipe.id);
      }
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["recipes"] });

      // Snapshot previous value
      const previousRecipes = queryClient.getQueryData(["recipes"]);

      // Optimistically update cache
      queryClient.setQueryData(["recipes"], (old) => {
        if (!old) return old;
        return old.map((r) =>
          r.id === recipe.id ? { ...r, isFavorite: !r.isFavorite } : r
        );
      });

      // Return context with snapshot
      return { previousRecipes };
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const getRecipeTypeIcon = () => {
    const type = recipe.type.toLowerCase();
    switch (type) {
      case "link":
        return (
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
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        );
      case "document":
        return (
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
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case "manual":
        return (
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    toggleFavoriteMutation.mutate();
  };

  // Determine image source (use placeholder if no preview image)
  const imageSrc = recipe.previewImageUrl || "/recipe-placeholder.svg";

  return (
    <>
      <Link
        to={`/recipe/${recipe.id}`}
        className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
      >
        {/* Preview Image - Always shown for consistent layout */}
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          <img
            src={imageSrc}
            alt={recipe.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Use placeholder if image fails to load
              e.target.src = "/recipe-placeholder.svg";
            }}
          />
        </div>

        <div className="p-4">
          {/* Header with Type Icon, Category, and Favorite Button */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-600 flex-wrap">
              {getRecipeTypeIcon()}
              <span className="text-xs uppercase tracking-wide">
                {recipe.type}
              </span>
              {recipe.siteName && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 truncate max-w-[150px]">
                    {recipe.siteName}
                  </span>
                </>
              )}
              {recipe.category && (
                <CategoryBadge category={recipe.category} />
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsCollectionModalOpen(true);
                }}
                className="text-gray-400 hover:text-blue-600 transition"
                aria-label="Add to collection"
                title="Add to collection"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                  />
                </svg>
              </button>
            <button
              onClick={handleFavoriteClick}
              disabled={toggleFavoriteMutation.isPending}
              className={`transition-colors ${
                recipe.isFavorite
                  ? "text-yellow-500"
                  : "text-gray-300 hover:text-yellow-500"
              } ${toggleFavoriteMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label={
                recipe.isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              {toggleFavoriteMutation.isPending ? (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                </div>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill={recipe.isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {recipe.title}
        </h3>

        {/* Description (if available) */}
        {recipe.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {recipe.description}
          </p>
        )}

        {/* Recipe URL Preview (for link type without description) */}
        {recipe.type.toLowerCase() === "link" &&
          recipe.url &&
          !recipe.description && (
            <p className="text-sm text-gray-500 truncate">{recipe.url}</p>
          )}

        {/* Content Preview (for manual type without description) */}
        {recipe.type.toLowerCase() === "manual" &&
          recipe.content &&
          !recipe.description && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {getManualRecipePreview(recipe.content)}
            </p>
          )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recipe.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400 mt-3">
          Added {new Date(recipe.createdAt).toLocaleDateString()}
        </p>
      </div>
      </Link>

      {/* Add to Collection Modal - Outside Link to prevent navigation on interaction */}
      <AddToCollectionModal
        recipeId={recipe.id}
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
      />
    </>
  );
};

export default RecipeCard;
