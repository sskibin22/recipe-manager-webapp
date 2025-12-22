/**
 * Custom hook for managing recipe edit mode state
 * Handles all edit-related state and operations
 */

import { useState, useEffect, useRef } from "react";
import { useUpdateRecipeMutation } from "./useRecipeMutations";
import { recipesApi, uploadsApi, getErrorMessage } from "../services/api";
import { parseRecipeContent, serializeRecipeContent } from "../utils/recipeContent";
import { validateRecipeDocument, validateRecipeImage } from "../utils/fileValidation";

/**
 * Hook for managing recipe edit state and operations
 * @param {Object} recipe - Current recipe data
 * @param {string} recipeId - Recipe ID for mutations
 * @returns {Object} Edit state and operation functions
 */
export const useRecipeEdit = (recipe, recipeId) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedUrl, setEditedUrl] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [file, setFile] = useState(null);
  const [displayImageFile, setDisplayImageFile] = useState(null);
  const [removeDisplayImage, setRemoveDisplayImage] = useState(false);
  const [displayImagePreview, setDisplayImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Manual recipe structured fields
  const [editedManualDescription, setEditedManualDescription] = useState("");
  const [editedManualIngredients, setEditedManualIngredients] = useState("");
  const [editedManualInstructions, setEditedManualInstructions] = useState("");
  const [editedManualNotes, setEditedManualNotes] = useState("");

  // Link recipe metadata
  const [metadata, setMetadata] = useState(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [editedMetadataTitle, setEditedMetadataTitle] = useState("");
  const [editedPreviewImageUrl, setEditedPreviewImageUrl] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedSiteName, setEditedSiteName] = useState("");

  // Document recipe description
  const [editedDocumentDescription, setEditedDocumentDescription] = useState("");

  // Category and tags
  const [editedCategoryId, setEditedCategoryId] = useState(null);
  const [editedTagIds, setEditedTagIds] = useState([]);

  const urlDebounceRef = useRef(null);

  const updateMutation = useUpdateRecipeMutation(recipeId, {
    onSuccess: () => {
      setIsEditMode(false);
      setValidationErrors({});
    },
  });

  // Fetch metadata when URL changes for Link recipes (debounced)
  useEffect(() => {
    if (!isEditMode || !recipe || recipe.type.toLowerCase() !== "link" || !editedUrl.trim()) {
      return;
    }

    if (urlDebounceRef.current) {
      clearTimeout(urlDebounceRef.current);
    }

    urlDebounceRef.current = setTimeout(async () => {
      try {
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(editedUrl.trim())) {
          return;
        }

        setFetchingMetadata(true);
        const fetchedMetadata = await recipesApi.fetchMetadata(editedUrl.trim());

        if (fetchedMetadata) {
          setMetadata(fetchedMetadata);
          if (fetchedMetadata.title) setEditedMetadataTitle(fetchedMetadata.title);
          if (fetchedMetadata.description) setEditedDescription(fetchedMetadata.description);
          if (fetchedMetadata.imageUrl) setEditedPreviewImageUrl(fetchedMetadata.imageUrl);
          if (fetchedMetadata.siteName) setEditedSiteName(fetchedMetadata.siteName);
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
      } finally {
        setFetchingMetadata(false);
      }
    }, 800);

    return () => {
      if (urlDebounceRef.current) {
        clearTimeout(urlDebounceRef.current);
      }
    };
  }, [editedUrl, isEditMode, recipe]);

  const enterEditMode = () => {
    if (!recipe) return;

    setEditedTitle(recipe.title);
    setEditedUrl(recipe.url || "");
    setValidationErrors({});
    setFile(null);
    setDisplayImageFile(null);
    setRemoveDisplayImage(false);
    setDisplayImagePreview(null);
    setIsEditMode(true);

    // Initialize metadata fields for Link recipes
    if (recipe.type.toLowerCase() === "link") {
      setEditedMetadataTitle(recipe.title || "");
      setEditedPreviewImageUrl(recipe.previewImageUrl || "");
      setEditedDescription(recipe.description || "");
      setEditedSiteName(recipe.siteName || "");
      setMetadata(null);
    }

    // Initialize description for Document recipes
    if (recipe.type.toLowerCase() === "document") {
      setEditedDocumentDescription(recipe.description || "");
    }

    // Initialize category and tags
    setEditedCategoryId(recipe.category?.id || null);
    setEditedTagIds(recipe.tags?.map(tag => tag.id) || []);

    // Parse structured content for Manual recipes
    if (recipe.type.toLowerCase() === "manual") {
      const parsedContent = parseRecipeContent(recipe.content);
      setEditedManualDescription(parsedContent.description);
      setEditedManualIngredients(parsedContent.ingredients);
      setEditedManualInstructions(parsedContent.instructions);
      setEditedManualNotes(parsedContent.notes);
    }
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setValidationErrors({});
    setFile(null);
    setDisplayImageFile(null);
    setRemoveDisplayImage(false);
    setDisplayImagePreview(null);
    setMetadata(null);
    setEditedMetadataTitle("");
    setEditedPreviewImageUrl("");
    setEditedDescription("");
    setEditedSiteName("");
    setEditedDocumentDescription("");
    setEditedManualDescription("");
    setEditedManualIngredients("");
    setEditedManualInstructions("");
    setEditedManualNotes("");
    setEditedCategoryId(null);
    setEditedTagIds([]);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      const { file: _, ...rest } = validationErrors;
      setValidationErrors(rest);
      return;
    }

    const validationError = validateRecipeDocument(selectedFile);
    if (validationError) {
      setValidationErrors({ ...validationErrors, file: validationError });
      setFile(null);
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
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

    const validationError = validateRecipeImage(selectedFile);
    if (validationError) {
      setValidationErrors({ ...validationErrors, displayImage: validationError });
      setDisplayImageFile(null);
      setDisplayImagePreview(null);
      e.target.value = "";
      return;
    }

    setDisplayImageFile(selectedFile);
    setRemoveDisplayImage(false);

    const previewUrl = URL.createObjectURL(selectedFile);
    setDisplayImagePreview(previewUrl);

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

    if (recipe.type.toLowerCase() === "manual") {
      if (!editedManualIngredients.trim() && !editedManualInstructions.trim()) {
        errors.content = "Either Ingredients or Instructions must be provided";
      }
    }

    return errors;
  };

  const generateImageFilename = (file) => {
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    return `image-${uniqueId}-${file.name}`;
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

  const saveChanges = async () => {
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
        recipe.type.toLowerCase() === "manual"
          ? serializeRecipeContent({
              description: editedManualDescription,
              ingredients: editedManualIngredients,
              instructions: editedManualInstructions,
              notes: editedManualNotes,
            })
          : recipe.content,
      categoryId: editedCategoryId,
      tagIds: editedTagIds,
    };

    try {
      setUploading(true);

      // Handle document upload
      if (recipe.type.toLowerCase() === "document" && file) {
        const presignData = await uploadsApi.getPresignedUploadUrl(
          file.name,
          file.type,
        );
        await uploadsApi.uploadToPresignedUrl(presignData.uploadUrl, file);
        updateData.storageKey = presignData.key;
      }

      // Handle display image upload/removal
      if (removeDisplayImage) {
        updateData.previewImageUrl = null;
      } else if (displayImageFile) {
        updateData.previewImageUrl = await uploadDisplayImage(displayImageFile);
      } else if (recipe.type.toLowerCase() === "link") {
        // For Link recipes, use the edited metadata fields
        if (editedMetadataTitle.trim()) {
          updateData.title = editedMetadataTitle.trim();
        }
        updateData.previewImageUrl = editedPreviewImageUrl.trim() || null;
        updateData.description = editedDescription.trim() || null;
        updateData.siteName = editedSiteName.trim() || null;
      } else if (recipe.type.toLowerCase() === "document") {
        // For Document recipes, include description
        updateData.description = editedDocumentDescription.trim() || null;
        updateData.previewImageUrl = recipe.previewImageUrl;
      } else {
        updateData.previewImageUrl = recipe.previewImageUrl;
      }

      setUploading(false);
      updateMutation.mutate({ id: recipeId, ...updateData });
    } catch (err) {
      setUploading(false);
      setValidationErrors({
        ...validationErrors,
        upload: getErrorMessage(err),
      });
    }
  };

  return {
    // Edit mode state
    isEditMode,
    enterEditMode,
    cancelEdit,

    // Title and URL
    editedTitle,
    setEditedTitle,
    editedUrl,
    setEditedUrl,

    // Manual recipe fields
    editedManualDescription,
    setEditedManualDescription,
    editedManualIngredients,
    setEditedManualIngredients,
    editedManualInstructions,
    setEditedManualInstructions,
    editedManualNotes,
    setEditedManualNotes,

    // Link metadata
    metadata,
    fetchingMetadata,
    editedMetadataTitle,
    setEditedMetadataTitle,
    editedPreviewImageUrl,
    setEditedPreviewImageUrl,
    editedDescription,
    setEditedDescription,
    editedSiteName,
    setEditedSiteName,

    // Document description
    editedDocumentDescription,
    setEditedDocumentDescription,

    // Category and tags
    editedCategoryId,
    setEditedCategoryId,
    editedTagIds,
    setEditedTagIds,

    // Files
    file,
    handleFileChange,
    displayImageFile,
    handleDisplayImageChange,
    removeDisplayImage,
    handleRemoveDisplayImage,
    displayImagePreview,

    // Validation and saving
    validationErrors,
    saveChanges,
    uploading,
    isSaving: updateMutation.isPending,
    updateError: updateMutation.error,
    updateSuccess: updateMutation.isSuccess,
  };
};
