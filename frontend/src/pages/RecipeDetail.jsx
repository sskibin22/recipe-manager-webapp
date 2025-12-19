import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recipesApi, uploadsApi } from "../services/api";
import { useState } from "react";
import DocumentPreview from "../components/DocumentPreview";

// File validation constants (matching RecipeForm)
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

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedUrl, setEditedUrl] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [file, setFile] = useState(null);
  const [displayImageFile, setDisplayImageFile] = useState(null);
  const [removeDisplayImage, setRemoveDisplayImage] = useState(false);
  const [displayImagePreview, setDisplayImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => recipesApi.getById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: recipesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      navigate("/");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (recipe.isFavorite) {
        await recipesApi.removeFavorite(id);
      } else {
        await recipesApi.addFavorite(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => recipesApi.update({ id, ...data }),
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData(["recipe", id], updatedRecipe);
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setIsEditMode(false);
      setValidationErrors({});
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = () => {
    setEditedTitle(recipe.title);
    setEditedUrl(recipe.url || "");
    setEditedContent(recipe.content || "");
    setValidationErrors({});
    setFile(null);
    setDisplayImageFile(null);
    setRemoveDisplayImage(false);
    setDisplayImagePreview(null);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setValidationErrors({});
    setFile(null);
    setDisplayImageFile(null);
    setRemoveDisplayImage(false);
    setDisplayImagePreview(null);
  };

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
      return `File size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB (selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
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
      // Remove file error if it exists
      const { file: _, ...rest } = validationErrors;
      setValidationErrors(rest);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setValidationErrors({ ...validationErrors, file: validationError });
      setFile(null);
      // Clear the input
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    // Remove file error if it exists
    const { file: _, ...rest } = validationErrors;
    setValidationErrors(rest);
  };

  const handleDisplayImageChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setDisplayImageFile(null);
      setDisplayImagePreview(null);
      const { displayImage: _, ...rest } = validationErrors;
      setValidationErrors(rest);
      return;
    }

    const validationError = validateImageFile(selectedFile);
    if (validationError) {
      setValidationErrors({ ...validationErrors, displayImage: validationError });
      setDisplayImageFile(null);
      setDisplayImagePreview(null);
      e.target.value = "";
      return;
    }

    setDisplayImageFile(selectedFile);
    setRemoveDisplayImage(false);
    
    // Create preview URL for the selected image
    const previewUrl = URL.createObjectURL(selectedFile);
    setDisplayImagePreview(previewUrl);
    
    // Remove error if it exists
    const { displayImage: _, ...rest } = validationErrors;
    setValidationErrors(rest);
  };

  const handleRemoveDisplayImage = () => {
    setRemoveDisplayImage(true);
    setDisplayImageFile(null);
    setDisplayImagePreview(null);
    const { displayImage: _, ...rest } = validationErrors;
    setValidationErrors(rest);
  };

  const validateForm = () => {
    const errors = {};

    if (!editedTitle.trim()) {
      errors.title = "Title is required";
    }

    if (recipe.type.toLowerCase() === "link") {
      if (!editedUrl.trim()) {
        errors.url = "URL is required for link recipes";
      } else {
        try {
          new URL(editedUrl);
        } catch {
          errors.url = "Please enter a valid URL";
        }
      }
    }

    if (recipe.type.toLowerCase() === "manual" && !editedContent.trim()) {
      errors.content = "Content is required for manual recipes";
    }

    return errors;
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

  const handleSave = async () => {
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    let updateData = {
      title: editedTitle,
      type: recipe.type,
      url: recipe.type.toLowerCase() === "link" ? editedUrl : recipe.url,
      content:
        recipe.type.toLowerCase() === "manual" ? editedContent : recipe.content,
    };

    try {
      setUploading(true);

      // Handle document upload if user selected a new file
      if (recipe.type.toLowerCase() === "document" && file) {
        // Get presigned upload URL
        const presignData = await uploadsApi.getPresignedUploadUrl(
          file.name,
          file.type,
        );

        // Upload file to R2
        await uploadsApi.uploadToPresignedUrl(presignData.uploadUrl, file);

        updateData.storageKey = presignData.key;
      }

      // Handle display image upload/removal
      if (removeDisplayImage) {
        // Clear the preview image
        updateData.previewImageUrl = null;
      } else if (displayImageFile) {
        // Upload new display image
        updateData.previewImageUrl = await uploadDisplayImage(displayImageFile);
      } else {
        // Keep existing preview image
        updateData.previewImageUrl = recipe.previewImageUrl;
      }

      setUploading(false);

      // Mutation has its own error handling via onError callback
      updateMutation.mutate(updateData);
    } catch (err) {
      setUploading(false);
      setValidationErrors({
        ...validationErrors,
        upload: err.message || "Failed to upload file",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

  // Determine image source (use placeholder if no preview image)
  const imageSrc = recipe?.previewImageUrl || "/recipe-placeholder.svg";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold text-blue-600">Recipe Manager</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {updateMutation.isError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Failed to update recipe:{" "}
              {updateMutation.error?.message || "Unknown error"}
            </p>
          </div>
        )}

        {updateMutation.isSuccess && !isEditMode && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Recipe updated successfully!</p>
          </div>
        )}

        {validationErrors.upload && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Upload error: {validationErrors.upload}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Preview Image Section - Always shown for consistent layout */}
          <div className="w-full h-64 sm:h-80 bg-gray-200 overflow-hidden relative">
            <img
              src={displayImagePreview || (removeDisplayImage ? "/recipe-placeholder.svg" : imageSrc)}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/recipe-placeholder.svg";
              }}
            />
            {/* Favorite button overlay on image */}
            {!isEditMode && (
              <button
                onClick={() => toggleFavoriteMutation.mutate()}
                className={`absolute top-4 right-4 transition-colors bg-white rounded-full p-2 shadow-lg ${
                  recipe.isFavorite
                    ? "text-yellow-500"
                    : "text-gray-400 hover:text-yellow-500"
                }`}
                disabled={toggleFavoriteMutation.isPending}
                aria-label={
                  recipe.isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                {toggleFavoriteMutation.isPending ? (
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

          {/* Display Image Upload Controls - Only in Edit Mode */}
          {isEditMode && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Display Image
              </h3>
              
              {recipe.previewImageUrl && !removeDisplayImage && !displayImageFile && (
                <div className="mb-3 flex items-center gap-3">
                  <p className="text-sm text-gray-600">Current image is displayed above</p>
                  <button
                    type="button"
                    onClick={handleRemoveDisplayImage}
                    className="text-sm text-red-600 hover:text-red-700 hover:underline"
                  >
                    Remove Image
                  </button>
                </div>
              )}

              {removeDisplayImage && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    Image will be removed when you save
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="displayImageEdit"
                  className="block text-sm font-medium mb-1"
                >
                  {recipe.previewImageUrl && !removeDisplayImage
                    ? "Replace Display Image (Optional)"
                    : "Upload Display Image (Optional)"}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP
                </p>
                <input
                  type="file"
                  id="displayImageEdit"
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
                {validationErrors.displayImage && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.displayImage}
                  </p>
                )}
              </div>
            </div>
          )}

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
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className={`w-full px-4 py-2 text-2xl font-bold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.title
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter recipe title"
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.title}
                  </p>
                )}
              </div>
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {recipe.title}
              </h1>
            )}

            {/* Recipe Type, Site Name, and Dates */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {getRecipeTypeIcon()}
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

            {/* Description Section */}
            {recipe.description && (
              <div className="mt-4">
                <p className="text-gray-700 text-base leading-relaxed">
                  {recipe.description}
                </p>
              </div>
            )}
          </div>

          {/* Type-Specific Content Section */}
          <div className="p-6">
            {recipe.type.toLowerCase() === "link" && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">
                  Recipe Link
                </h2>
                {isEditMode ? (
                  <div>
                    <input
                      type="url"
                      value={editedUrl}
                      onChange={(e) => setEditedUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.url
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="https://example.com/recipe"
                    />
                    {validationErrors.url && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.url}
                      </p>
                    )}
                  </div>
                ) : recipe.url ? (
                  <a
                    href={recipe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline break-all text-base"
                  >
                    {recipe.url}
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ) : null}
              </div>
            )}

            {recipe.type.toLowerCase() === "document" && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">
                  Recipe Document
                </h2>
                {isEditMode ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Replace document (optional)
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT,
                      JPG, PNG
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
                    {validationErrors.file && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.file}
                      </p>
                    )}
                    {recipe.fileContent && recipe.fileContentType && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-3">
                          Current document preview:
                        </p>
                        <DocumentPreview
                          fileContent={recipe.fileContent}
                          fileContentType={recipe.fileContentType}
                          title={recipe.title}
                        />
                      </div>
                    )}
                  </div>
                ) : recipe.fileContent && recipe.fileContentType ? (
                  <DocumentPreview
                    fileContent={recipe.fileContent}
                    fileContentType={recipe.fileContentType}
                    title={recipe.title}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      Document content not available
                    </p>
                  </div>
                )}
              </div>
            )}

            {recipe.type.toLowerCase() === "manual" && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">
                  Recipe Instructions
                </h2>
                {isEditMode ? (
                  <div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={12}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans ${
                        validationErrors.content
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter recipe content..."
                    />
                    {validationErrors.content && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.content}
                      </p>
                    )}
                  </div>
                ) : recipe.content ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 p-6 rounded-lg text-base">
                      {recipe.content}
                    </pre>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={updateMutation.isPending || uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={updateMutation.isPending || uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Recipe
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Recipe"}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
