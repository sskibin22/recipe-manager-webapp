import { useState, useEffect, useRef } from "react";
import { recipesApi, uploadsApi } from "../services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

const RecipeForm = ({ onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [recipeType, setRecipeType] = useState("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [displayImageFile, setDisplayImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Metadata state
  const [metadata, setMetadata] = useState(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [siteName, setSiteName] = useState("");

  const urlDebounceRef = useRef(null);

  const createRecipeMutation = useMutation({
    mutationFn: recipesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to create recipe");
    },
  });

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setContent("");
    setFile(null);
    setDisplayImageFile(null);
    setError("");
    setRecipeType("link");
    setMetadata(null);
    setPreviewImageUrl("");
    setDescription("");
    setSiteName("");
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

  const validateFile = (file) => {
    if (!file) {
      return "No file selected";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB (selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
    }

    // Check file type by MIME type first
    let isValidType = Object.keys(ALLOWED_FILE_TYPES).includes(file.type);

    // If MIME type check fails or is empty, check by file extension
    if (!isValidType || !file.type) {
      const fileName = file.name.toLowerCase();
      const dotIndex = fileName.lastIndexOf(".");
      if (dotIndex === -1) {
        return "Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG";
      }
      const fileExtension = fileName.substring(dotIndex);
      const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat();
      isValidType = allowedExtensions.includes(fileExtension);
    }

    if (!isValidType) {
      return "Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG";
    }

    return null; // Valid file
  };

  const validateImageFile = (file) => {
    if (!file) {
      return "No file selected";
    }

    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      return `Image size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB (selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
    }

    // Check file type by MIME type first
    let isValidType = Object.keys(ALLOWED_IMAGE_TYPES).includes(file.type);

    // If MIME type check fails or is empty, check by file extension
    if (!isValidType || !file.type) {
      const fileName = file.name.toLowerCase();
      const dotIndex = fileName.lastIndexOf(".");
      if (dotIndex === -1) {
        return "Invalid file type. Allowed types: JPG, PNG, GIF, WEBP";
      }
      const fileExtension = fileName.substring(dotIndex);
      const allowedExtensions = Object.values(ALLOWED_IMAGE_TYPES).flat();
      isValidType = allowedExtensions.includes(fileExtension);
    }

    if (!isValidType) {
      return "Invalid file type. Allowed types: JPG, PNG, GIF, WEBP";
    }

    return null; // Valid file
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      setError("");
      return;
    }

    const validationError = validateFile(selectedFile);
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

    const validationError = validateImageFile(selectedFile);
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
          const imagePresignData = await uploadsApi.getPresignedUploadUrl(
            `image-${Date.now()}-${displayImageFile.name}`,
            displayImageFile.type,
          );
          await uploadsApi.uploadToPresignedUrl(
            imagePresignData.uploadUrl,
            displayImageFile,
          );
          // Store the uploaded image URL - use the key to construct the URL
          recipeData.previewImageUrl = imagePresignData.key;
        }

        setUploading(false);
      } else if (recipeType === "manual") {
        if (!content.trim()) {
          setError("Content is required for manual recipes");
          return;
        }
        recipeData.content = content.trim();

        // Upload display image if provided
        if (displayImageFile) {
          setUploading(true);
          const imagePresignData = await uploadsApi.getPresignedUploadUrl(
            `image-${Date.now()}-${displayImageFile.name}`,
            displayImageFile.type,
          );
          await uploadsApi.uploadToPresignedUrl(
            imagePresignData.uploadUrl,
            displayImageFile,
          );
          // Store the uploaded image URL - use the key to construct the URL
          recipeData.previewImageUrl = imagePresignData.key;
          setUploading(false);
        }
      }

      createRecipeMutation.mutate(recipeData);
    } catch (err) {
      setUploading(false);
      setError(err.message || "Failed to create recipe");
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
                    htmlFor="content"
                    className="block text-sm font-medium mb-1"
                  >
                    Recipe Content *
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="10"
                    placeholder="Ingredients:&#10;- ...&#10;&#10;Instructions:&#10;1. ..."
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
