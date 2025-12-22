/**
 * Refactored Recipe Detail Page - Orchestrator Component
 * Uses custom hooks and sub-components for cleaner code
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { useRecipeDetail, useRecipeEdit } from "../hooks";
import { getErrorMessage } from "../services/api";
import RecipeDetailHeader from "../components/recipe/RecipeDetail/RecipeDetailHeader";
import RecipeDetailImage from "../components/recipe/RecipeDetail/RecipeDetailImage";
import DisplayImageEdit from "../components/recipe/RecipeDetail/DisplayImageEdit";
import RecipeDetailView from "../components/recipe/RecipeDetail/RecipeDetailView";
import RecipeDetailEdit from "../components/recipe/RecipeDetail/RecipeDetailEdit";
import RecipeDetailActions from "../components/recipe/RecipeDetail/RecipeDetailActions";


/**
 * Recipe detail page component - displays and edits single recipe
 * @returns {JSX.Element}
 */
export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Custom hooks for data and edit state
  const {
    recipe,
    isLoading,
    error,
    deleteRecipe,
    isDeleting,
    toggleFavorite,
    isTogglingFavorite,
  } = useRecipeDetail(id, {
    onDeleteSuccess: () => navigate("/"),
  });

  const editState = useRecipeEdit(recipe, id);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      deleteRecipe(id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Recipe not found
        </h2>
        <Link to="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RecipeDetailHeader onBack={() => navigate("/")} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Update Error Message */}
        {editState.updateError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Failed to update recipe: {getErrorMessage(editState.updateError)}
            </p>
          </div>
        )}

        {/* Update Success Message */}
        {editState.updateSuccess && !editState.isEditMode && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Recipe updated successfully!</p>
          </div>
        )}

        {/* Upload Error Message */}
        {editState.validationErrors.upload && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Upload error: {editState.validationErrors.upload}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-visible">
          {/* Recipe Image */}
          <RecipeDetailImage
            recipe={recipe}
            isEditMode={editState.isEditMode}
            displayImagePreview={editState.displayImagePreview}
            removeDisplayImage={editState.removeDisplayImage}
            onToggleFavorite={toggleFavorite}
            isTogglingFavorite={isTogglingFavorite}
          />

          {/* Display Image Edit Controls */}
          {editState.isEditMode && (
            <DisplayImageEdit
              recipe={recipe}
              displayImageFile={editState.displayImageFile}
              removeDisplayImage={editState.removeDisplayImage}
              validationErrors={editState.validationErrors}
              onDisplayImageChange={editState.handleDisplayImageChange}
              onRemoveDisplayImage={editState.handleRemoveDisplayImage}
            />
          )}

          {/* View or Edit Mode */}
          {editState.isEditMode ? (
            <RecipeDetailEdit recipe={recipe} editState={editState} />
          ) : (
            <RecipeDetailView recipe={recipe} />
          )}

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <RecipeDetailActions
              isEditMode={editState.isEditMode}
              onEdit={editState.enterEditMode}
              onDelete={handleDelete}
              onSave={editState.saveChanges}
              onCancel={editState.cancelEdit}
              isDeleting={isDeleting}
              isSaving={editState.isSaving}
              uploading={editState.uploading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
