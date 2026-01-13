/**
 * Image display component with favorite button overlay
 */

export default function RecipeDetailImage({
  recipe,
  isEditMode,
  displayImagePreview,
  removeDisplayImage,
  onToggleFavorite,
  isTogglingFavorite,
}) {
  const imageSrc = recipe?.previewImageUrl || "/recipe-placeholder.svg";

  return (
    <div className="w-full h-64 sm:h-80 bg-wood-100 overflow-hidden relative rounded-t-xl">
      <img
        src={displayImagePreview || (removeDisplayImage ? "/recipe-placeholder.svg" : imageSrc)}
        alt={recipe?.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.src = "/recipe-placeholder.svg";
        }}
      />
      {/* Favorite button overlay - only in view mode */}
      {!isEditMode && recipe && (
        <button
          onClick={() => onToggleFavorite({ recipeId: recipe.id, isFavorite: recipe.isFavorite })}
          className={`absolute top-4 right-4 transition-colors bg-cream-50 rounded-full p-2 shadow-warm ${
            recipe.isFavorite
              ? "text-terracotta-500"
              : "text-warmgray-400 hover:text-terracotta-400"
          }`}
          disabled={isTogglingFavorite}
          aria-label={
            recipe.isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          {isTogglingFavorite ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
            </div>
          ) : (
            <svg
              className="w-8 h-8"
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
      )}
    </div>
  );
}
