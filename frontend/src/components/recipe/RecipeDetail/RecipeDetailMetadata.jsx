/**
 * Component to display recipe metadata (type, site name, dates, category, tags)
 */

import { CategoryBadge, TagBadge } from "../../common/Badge";

/**
 * Get icon for recipe type
 */
function getRecipeTypeIcon(type) {
  const lowerType = type?.toLowerCase();
  switch (lowerType) {
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
}

export default function RecipeDetailMetadata({ recipe }) {
  if (!recipe) return null;

  return (
    <div>
      {/* Recipe Type, Site Name, and Dates */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {getRecipeTypeIcon(recipe.type)}
          <span className="uppercase tracking-wide font-medium">
            {recipe.type}
          </span>
        </div>
        {recipe.siteName && (
          <span className="text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {recipe.siteName}
          </span>
        )}
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">
          Added {new Date(recipe.createdAt).toLocaleDateString()}
        </span>
        {recipe.updatedAt !== recipe.createdAt && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              Updated {new Date(recipe.updatedAt).toLocaleDateString()}
            </span>
          </>
        )}
      </div>

      {/* Description */}
      {recipe.description && (
        <div className="mt-4">
          <p className="text-gray-700 text-base leading-relaxed">
            {recipe.description}
          </p>
        </div>
      )}

      {/* Category and Tags */}
      <div className="mt-4 space-y-3">
        {recipe.category && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Category
            </h3>
            <CategoryBadge category={recipe.category} />
          </div>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
