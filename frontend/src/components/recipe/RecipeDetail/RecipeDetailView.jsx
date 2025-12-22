/**
 * Read-only view component for recipe detail
 */

import LinkRecipeView from "./LinkRecipeView";
import DocumentRecipeView from "./DocumentRecipeView";
import ManualRecipeView from "./ManualRecipeView";
import RecipeDetailMetadata from "./RecipeDetailMetadata";

export default function RecipeDetailView({ recipe, isEditMode, editedTitle }) {
  if (!recipe) return null;

  const recipeType = recipe.type.toLowerCase();

  return (
    <>
      {/* Title and Metadata Section */}
      <div className="p-6 border-b border-gray-200">
        {isEditMode ? (
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Recipe Title
            </label>
            <input
              id="title"
              type="text"
              value={editedTitle}
              readOnly
              className="w-full px-4 py-2 text-2xl font-bold border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {recipe.title}
          </h1>
        )}

        <RecipeDetailMetadata recipe={recipe} />
      </div>

      {/* Type-Specific Content Section */}
      <div className="p-6">
        {recipeType === "link" && <LinkRecipeView recipe={recipe} />}
        {recipeType === "document" && <DocumentRecipeView recipe={recipe} />}
        {recipeType === "manual" && <ManualRecipeView recipe={recipe} />}
      </div>
    </>
  );
}
