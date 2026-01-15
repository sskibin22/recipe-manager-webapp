/**
 * @typedef {import('../../../types/recipe').RecipeCreateData} RecipeCreateData
 * @typedef {import('../../../types/recipe').RecipeType} RecipeType
 */

import { useEffect } from "react";
import { getErrorMessage } from "../../../services/api";
import {
  useCreateRecipeMutation,
  useRecipeForm,
  useFileUpload,
  useMetadataFetch,
} from "../../../hooks";
import { serializeRecipeContent } from "../../../utils/recipeContent";
import {
  RecipeTypeSelector,
  LinkRecipeFields,
  DocumentRecipeFields,
  ManualRecipeFields,
  RecipeMetadataFields,
} from "./index";

/**
 * Recipe form component for creating new recipes
 * @param {Object} props
 * @param {() => void} props.onClose - Callback when form is closed
 * @param {() => void} [props.onSuccess] - Callback when recipe is successfully created
 * @returns {JSX.Element}
 */
const RecipeForm = ({ onClose, onSuccess }) => {
  // Form state management
  const formState = useRecipeForm();
  const {
    recipeType,
    setRecipeType,
    title,
    setTitle,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedTagIds,
    setSelectedTagIds,
    error,
    setError,
    url,
    setUrl,
    previewImageUrl,
    setPreviewImageUrl,
    description,
    setDescription,
    siteName,
    setSiteName,
    documentDescription,
    setDocumentDescription,
    manualDescription,
    setManualDescription,
    manualIngredients,
    setManualIngredients,
    manualInstructions,
    setManualInstructions,
    manualNotes,
    setManualNotes,
    validateManualFields,
    resetForm,
  } = formState;

  // File upload management
  const fileUploadState = useFileUpload();
  const {
    file,
    displayImageFile,
    uploading,
    uploadFile,
    uploadDisplayImage,
    handleFileChange: handleFileChangeBase,
    handleDisplayImageChange: handleDisplayImageChangeBase,
  } = fileUploadState;

  // Metadata fetching for link recipes
  const { metadata, setMetadata, fetching: fetchingMetadata } = useMetadataFetch(
    url,
    recipeType,
  );

  // Recipe creation mutation
  const createRecipeMutation = useCreateRecipeMutation({
    onSuccess: () => {
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    },
  });

  // Auto-fill title and metadata fields when metadata is fetched
  useEffect(() => {
    if (metadata && recipeType === "link") {
      if (!title && metadata.title) {
        setTitle(metadata.title);
      }
      if (!description && metadata.description) {
        setDescription(metadata.description);
      }
      if (!previewImageUrl && metadata.imageUrl) {
        setPreviewImageUrl(metadata.imageUrl);
      }
      if (!siteName && metadata.siteName) {
        setSiteName(metadata.siteName);
      }
    }
  }, [
    metadata,
    recipeType,
    title,
    description,
    previewImageUrl,
    siteName,
    setTitle,
    setDescription,
    setPreviewImageUrl,
    setSiteName,
  ]);

  // Clear metadata when switching away from link type
  useEffect(() => {
    if (recipeType !== "link") {
      setMetadata(null);
      setPreviewImageUrl("");
      setDescription("");
      setSiteName("");
    }
  }, [recipeType, setMetadata, setPreviewImageUrl, setDescription, setSiteName]);

  // Wrapped file change handlers that update error state
  const handleFileChange = (e) => {
    const errorMsg = handleFileChangeBase(e);
    if (errorMsg) {
      setError(errorMsg);
    } else {
      setError("");
    }
  };

  const handleDisplayImageChange = (e) => {
    const errorMsg = handleDisplayImageChangeBase(e);
    if (errorMsg) {
      setError(errorMsg);
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      let recipeData = {
        title: title.trim(),
        type: recipeType,
      };

      if (recipeType === "link") {
        if (!url.trim()) {
          setError("URL is required for link recipes");
          return;
        }
        recipeData.url = url.trim();
        recipeData.previewImageUrl = previewImageUrl.trim() || null;
        recipeData.description = description.trim() || null;
        recipeData.siteName = siteName.trim() || null;
      } else if (recipeType === "document") {
        if (!file) {
          setError("File is required for document recipes");
          return;
        }

        const storageKey = await uploadFile(file, file.name, file.type);
        recipeData.storageKey = storageKey;
        recipeData.description = documentDescription.trim() || null;

        if (displayImageFile) {
          recipeData.previewImageUrl = await uploadDisplayImage(displayImageFile);
        }
    } else if (recipeType === "manual") {
      const manualError = validateManualFields(
        "Either Ingredients or Instructions must be provided for manual recipes",
      );
      if (manualError) {
        setError(manualError);
        return;
      }

        recipeData.content = serializeRecipeContent({
          description: manualDescription,
          ingredients: manualIngredients,
          instructions: manualInstructions,
          notes: manualNotes,
        });

        if (displayImageFile) {
          recipeData.previewImageUrl = await uploadDisplayImage(displayImageFile);
        }
      }

      // Add category and tags to recipe data
      if (selectedCategoryId) {
        recipeData.categoryId = selectedCategoryId;
      }
      if (selectedTagIds.length > 0) {
        recipeData.tagIds = selectedTagIds;
      }

      createRecipeMutation.mutate(recipeData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-warmgray-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 rounded-xl shadow-warm-lg border border-wood-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-serif font-bold text-warmgray-900 mb-4">Add New Recipe</h2>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-warmgray-700 mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent"
                placeholder="My Favorite Recipe"
              />
            </div>

            {/* Recipe Type Selector */}
            <RecipeTypeSelector
              recipeType={recipeType}
              onChange={setRecipeType}
            />

            {/* Conditional Fields Based on Type */}
            {recipeType === "link" && (
              <LinkRecipeFields
                url={url}
                onUrlChange={setUrl}
                fetchingMetadata={fetchingMetadata}
                metadata={metadata}
                previewImageUrl={previewImageUrl}
                onPreviewImageUrlChange={setPreviewImageUrl}
                description={description}
                onDescriptionChange={setDescription}
                siteName={siteName}
                onSiteNameChange={setSiteName}
              />
            )}

            {recipeType === "document" && (
              <DocumentRecipeFields
                file={file}
                onFileChange={handleFileChange}
                displayImageFile={displayImageFile}
                onDisplayImageChange={handleDisplayImageChange}
                description={documentDescription}
                onDescriptionChange={setDocumentDescription}
              />
            )}

            {recipeType === "manual" && (
              <ManualRecipeFields
                description={manualDescription}
                onDescriptionChange={setManualDescription}
                ingredients={manualIngredients}
                onIngredientsChange={setManualIngredients}
                instructions={manualInstructions}
                onInstructionsChange={setManualInstructions}
                notes={manualNotes}
                onNotesChange={setManualNotes}
                displayImageFile={displayImageFile}
                onDisplayImageChange={handleDisplayImageChange}
              />
            )}

            {/* Category and Tags */}
            <RecipeMetadataFields
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
              selectedTagIds={selectedTagIds}
              onTagsChange={setSelectedTagIds}
            />

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-terracotta-50 border border-terracotta-300 text-terracotta-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 border border-wood-300 text-warmgray-700 rounded-lg hover:bg-wood-50 transition"
                disabled={uploading || createRecipeMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 disabled:opacity-50 shadow-warm transition"
                disabled={uploading || createRecipeMutation.isPending}
              >
                {uploading
                  ? "Uploading..."
                  : createRecipeMutation.isPending
                    ? "Creating..."
                    : "Add Recipe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecipeForm;
