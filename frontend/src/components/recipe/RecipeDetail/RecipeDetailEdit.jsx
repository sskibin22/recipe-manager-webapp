/**
 * Edit mode container component for recipe detail
 */

import LinkRecipeEdit from "./LinkRecipeEdit";
import DocumentRecipeEdit from "./DocumentRecipeEdit";
import ManualRecipeEdit from "./ManualRecipeEdit";
import CategoryTagsEdit from "./CategoryTagsEdit";
import RecipeDetailMetadata from "./RecipeDetailMetadata";

export default function RecipeDetailEdit({ recipe, editState }) {
  if (!recipe) return null;

  const recipeType = recipe.type.toLowerCase();

  return (
    <>
      {/* Title and Metadata Section */}
      <div className="p-6 border-b border-wood-200">
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-warmgray-700 mb-2"
          >
            Recipe Title
          </label>
          <input
            id="title"
            type="text"
            value={editState.editedTitle}
            onChange={(e) => editState.setEditedTitle(e.target.value)}
            className={`w-full px-4 py-2 text-2xl font-serif font-bold border rounded-lg bg-cream-50 focus:ring-2 focus:ring-terracotta-400 focus:border-transparent ${
              editState.validationErrors.title
                ? "border-terracotta-500"
                : "border-wood-300"
            }`}
            placeholder="Enter recipe title"
          />
          {editState.validationErrors.title && (
            <p className="mt-1 text-sm text-terracotta-600">
              {editState.validationErrors.title}
            </p>
          )}
        </div>

        <RecipeDetailMetadata recipe={recipe} />
      </div>

      {/* Type-Specific Content Section */}
      <div className="p-6">
        {recipeType === "link" && (
          <LinkRecipeEdit
            editedUrl={editState.editedUrl}
            setEditedUrl={editState.setEditedUrl}
            validationErrors={editState.validationErrors}
            fetchingMetadata={editState.fetchingMetadata}
            metadata={editState.metadata}
            editedMetadataTitle={editState.editedMetadataTitle}
            setEditedMetadataTitle={editState.setEditedMetadataTitle}
            editedPreviewImageUrl={editState.editedPreviewImageUrl}
            setEditedPreviewImageUrl={editState.setEditedPreviewImageUrl}
            editedDescription={editState.editedDescription}
            setEditedDescription={editState.setEditedDescription}
            editedSiteName={editState.editedSiteName}
            setEditedSiteName={editState.setEditedSiteName}
          />
        )}
        {recipeType === "document" && (
          <DocumentRecipeEdit
            recipe={recipe}
            file={editState.file}
            validationErrors={editState.validationErrors}
            onFileChange={editState.handleFileChange}
            description={editState.editedDocumentDescription}
            onDescriptionChange={editState.setEditedDocumentDescription}
          />
        )}
        {recipeType === "manual" && (
          <ManualRecipeEdit
            editedManualDescription={editState.editedManualDescription}
            setEditedManualDescription={editState.setEditedManualDescription}
            editedManualIngredients={editState.editedManualIngredients}
            setEditedManualIngredients={editState.setEditedManualIngredients}
            editedManualInstructions={editState.editedManualInstructions}
            setEditedManualInstructions={editState.setEditedManualInstructions}
            editedManualNotes={editState.editedManualNotes}
            setEditedManualNotes={editState.setEditedManualNotes}
            validationErrors={editState.validationErrors}
          />
        )}
      </div>

      {/* Category and Tags Section */}
      <CategoryTagsEdit
        editedCategoryId={editState.editedCategoryId}
        setEditedCategoryId={editState.setEditedCategoryId}
        editedTagIds={editState.editedTagIds}
        setEditedTagIds={editState.setEditedTagIds}
      />
    </>
  );
}
