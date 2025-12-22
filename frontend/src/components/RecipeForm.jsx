/**
 * @typedef {import('../types/recipe').RecipeCreateData} RecipeCreateData
 * @typedef {import('../types/recipe').RecipeType} RecipeType
 * @typedef {import('../types/recipe').MetadataResponse} MetadataResponse
 */

import { useState, useEffect, useRef } from "react";
import { recipesApi, uploadsApi, getErrorMessage } from "../services/api";
import { useCreateRecipeMutation } from "../hooks";
import { serializeRecipeContent } from "../utils/recipeContent";
import { validateRecipeDocument, validateRecipeImage } from "../utils/fileValidation";
import CategorySelector from "./CategorySelector";
import TagSelector from "./TagSelector";

/**
 * Recipe form component for creating new recipes
 * @param {Object} props
 * @param {() => void} props.onClose - Callback when form is closed
 * @param {() => void} [props.onSuccess] - Callback when recipe is successfully created
 * @returns {JSX.Element}
 */
const RecipeForm = ({ onClose, onSuccess }) => {
  const [recipeType, setRecipeType] = useState("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [displayImageFile, setDisplayImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Manual recipe structured fields
  const [manualDescription, setManualDescription] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");
  const [manualInstructions, setManualInstructions] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  // Metadata state
  const [metadata, setMetadata] = useState(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [siteName, setSiteName] = useState("");

  // Category and tags state
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const urlDebounceRef = useRef(null);

  const createRecipeMutation = useCreateRecipeMutation({
    onSuccess: () => {
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (errorMessage) => {
      setError(errorMessage);
    },
  });

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setFile(null);
    setDisplayImageFile(null);
    setError("");
    setRecipeType("link");
    setMetadata(null);
    setPreviewImageUrl("");
    setDescription("");
    setSiteName("");
    // Reset manual recipe fields
    setManualDescription("");
    setManualIngredients("");
    setManualInstructions("");
    setManualNotes("");
    // Reset category and tags
    setSelectedCategoryId(null);
    setSelectedTagIds([]);
  };

  // Clear metadata when switching away from link type
  useEffect(() => {
    if (recipeType !== "link") {
      setMetadata(null);
      setPreviewImageUrl("");
      setDescription("");
      setSiteName("");
    }
  }, [recipeType]);

  // Fetch metadata when URL changes (debounced)
  useEffect(() => {
    if (recipeType !== "link" || !url.trim()) {
      return;
    }

    // Clear previous timeout
    if (urlDebounceRef.current) {
      clearTimeout(urlDebounceRef.current);
    }

    // Set new timeout for fetching metadata
    urlDebounceRef.current = setTimeout(async () => {
      try {
        // Basic URL validation
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(url.trim())) {
          return; // Don't fetch if URL is not valid
        }

        setFetchingMetadata(true);
        const fetchedMetadata = await recipesApi.fetchMetadata(url.trim());

        if (fetchedMetadata) {
          setMetadata(fetchedMetadata);

          // Auto-fill fields if they're empty
          if (!title && fetchedMetadata.title) {
            setTitle(fetchedMetadata.title);
          }
          if (!description && fetchedMetadata.description) {
            setDescription(fetchedMetadata.description);
          }
          if (!previewImageUrl && fetchedMetadata.imageUrl) {
            setPreviewImageUrl(fetchedMetadata.imageUrl);
          }
          if (!siteName && fetchedMetadata.siteName) {
            setSiteName(fetchedMetadata.siteName);
          }
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
        // Don't show error to user, just log it
      } finally {
        setFetchingMetadata(false);
      }
    }, 800); // 800ms debounce

    // Cleanup on unmount or when URL changes
    return () => {
      if (urlDebounceRef.current) {
        clearTimeout(urlDebounceRef.current);
      }
    };
  }, [url, recipeType, title, description, previewImageUrl, siteName]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      setError("");
      return;
    }

    const validationError = validateRecipeDocument(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      // Clear the input
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleDisplayImageChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setDisplayImageFile(null);
      setError("");
      return;
    }

    const validationError = validateRecipeImage(selectedFile);
    if (validationError) {
      setError(validationError);
      setDisplayImageFile(null);
      // Clear the input
      e.target.value = "";
      return;
    }

    setDisplayImageFile(selectedFile);
    setError("");
  };

  const generateImageFilename = (file) => {
    return `image-${Date.now()}-${file.name}`;
  };

  const uploadDisplayImage = async (imageFile) => {
    const imagePresignData = await uploadsApi.getPresignedUploadUrl(
      generateImageFilename(imageFile),
      imageFile.type,
    );
    await uploadsApi.uploadToPresignedUrl(
      imagePresignData.uploadUrl,
      imageFile,
    );
    return imagePresignData.key;
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
        // Only include metadata fields for link recipes
        recipeData.previewImageUrl = previewImageUrl.trim() || null;
        recipeData.description = description.trim() || null;
        recipeData.siteName = siteName.trim() || null;
      } else if (recipeType === "document") {
        if (!file) {
          setError("File is required for document recipes");
          return;
        }

        setUploading(true);

        // Get presigned upload URL for document
        const presignData = await uploadsApi.getPresignedUploadUrl(
          file.name,
          file.type,
        );

        // Upload file to R2
        await uploadsApi.uploadToPresignedUrl(presignData.uploadUrl, file);

        recipeData.storageKey = presignData.key;

        // Upload display image if provided
        if (displayImageFile) {
          recipeData.previewImageUrl = await uploadDisplayImage(displayImageFile);
        }

        setUploading(false);
      } else if (recipeType === "manual") {
        // Validate that at least ingredients or instructions are provided
        if (!manualIngredients.trim() && !manualInstructions.trim()) {
          setError("Either Ingredients or Instructions must be provided for manual recipes");
          return;
        }
        
        // Serialize structured content to JSON
        recipeData.content = serializeRecipeContent({
          description: manualDescription,
          ingredients: manualIngredients,
          instructions: manualInstructions,
          notes: manualNotes,
        });

        // Upload display image if provided
        if (displayImageFile) {
          setUploading(true);
          recipeData.previewImageUrl = await uploadDisplayImage(displayImageFile);
          setUploading(false);
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
      setUploading(false);
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Add New Recipe</h2>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Favorite Recipe"
              />
            </div>

            {/* Recipe Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Recipe Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="link"
                    checked={recipeType === "link"}
                    onChange={(e) => setRecipeType(e.target.value)}
                    className="mr-2"
                  />
                  Link
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="document"
                    checked={recipeType === "document"}
                    onChange={(e) => setRecipeType(e.target.value)}
                    className="mr-2"
                  />
                  Document
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={recipeType === "manual"}
                    onChange={(e) => setRecipeType(e.target.value)}
                    className="mr-2"
                  />
                  Manual
                </label>
              </div>
            </div>

            {/* Conditional Fields Based on Type */}
            {recipeType === "link" && (
              <div className="mb-4">
                <label htmlFor="url" className="block text-sm font-medium mb-1">
                  Recipe URL *
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/recipe"
                />
                {fetchingMetadata && (
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></span>
                    Fetching recipe preview...
                  </p>
                )}
              </div>
            )}

            {/* Metadata Preview for Link Recipes */}
            {recipeType === "link" && metadata && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Recipe Preview (Editable)
                </h4>

                {/* Preview Image URL */}
                <div className="mb-3">
                  <label
                    htmlFor="previewImageUrl"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Preview Image URL
                  </label>
                  <input
                    type="url"
                    id="previewImageUrl"
                    value={previewImageUrl}
                    onChange={(e) => setPreviewImageUrl(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  {previewImageUrl && (
                    <div className="mt-2">
                      <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="h-24 w-auto rounded border border-gray-300 object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label
                    htmlFor="description"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="2"
                    maxLength="500"
                    placeholder="Brief description..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>

                {/* Site Name */}
                <div>
                  <label
                    htmlFor="siteName"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Site Name
                  </label>
                  <input
                    type="text"
                    id="siteName"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength="256"
                    placeholder="Recipe source"
                  />
                </div>
              </div>
            )}

            {recipeType === "document" && (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="file"
                    className="block text-sm font-medium mb-1"
                  >
                    Upload Document *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT, JPG,
                    PNG
                  </p>
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  {file && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {file.name} (
                      {(file.size / (1024 * 1024)).toFixed(2)}MB)
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="displayImage"
                    className="block text-sm font-medium mb-1"
                  >
                    Display Image (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP
                  </p>
                  <input
                    type="file"
                    id="displayImage"
                    onChange={handleDisplayImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                  />
                  {displayImageFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {displayImageFile.name} (
                      {(displayImageFile.size / (1024 * 1024)).toFixed(2)}MB)
                    </p>
                  )}
                </div>
              </>
            )}

            {recipeType === "manual" && (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="manualDescription"
                    className="block text-sm font-medium mb-1"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="manualDescription"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="A brief overview of the recipe..."
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="manualIngredients"
                    className="block text-sm font-medium mb-1"
                  >
                    Ingredients *
                  </label>
                  <textarea
                    id="manualIngredients"
                    value={manualIngredients}
                    onChange={(e) => setManualIngredients(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="8"
                    placeholder="- 2 cups flour&#10;- 1 cup sugar&#10;- 3 eggs&#10;- ..."
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="manualInstructions"
                    className="block text-sm font-medium mb-1"
                  >
                    Instructions *
                  </label>
                  <textarea
                    id="manualInstructions"
                    value={manualInstructions}
                    onChange={(e) => setManualInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="10"
                    placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients...&#10;3. ..."
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="manualNotes"
                    className="block text-sm font-medium mb-1"
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    id="manualNotes"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Additional tips, variations, or storage instructions..."
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="displayImage"
                    className="block text-sm font-medium mb-1"
                  >
                    Display Image (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP
                  </p>
                  <input
                    type="file"
                    id="displayImage"
                    onChange={handleDisplayImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                  />
                  {displayImageFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {displayImageFile.name} (
                      {(displayImageFile.size / (1024 * 1024)).toFixed(2)}MB)
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Category Selector */}
            <div className="mb-4">
              <CategorySelector
                selectedCategoryId={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />
            </div>

            {/* Tag Selector */}
            <div className="mb-4">
              <TagSelector
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
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
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={uploading || createRecipeMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
