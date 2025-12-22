import { useState } from "react";

/**
 * Custom hook for managing recipe form state
 * @returns {Object} Form state and handlers
 */
export const useRecipeForm = () => {
  const [recipeType, setRecipeType] = useState("link");
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [error, setError] = useState("");

  // Link recipe specific state
  const [url, setUrl] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [siteName, setSiteName] = useState("");

  // Manual recipe specific state
  const [manualDescription, setManualDescription] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");
  const [manualInstructions, setManualInstructions] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setRecipeType("link");
    setSelectedCategoryId(null);
    setSelectedTagIds([]);
    setError("");
    setPreviewImageUrl("");
    setDescription("");
    setSiteName("");
    setManualDescription("");
    setManualIngredients("");
    setManualInstructions("");
    setManualNotes("");
  };

  return {
    // Common state
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

    // Link recipe state
    url,
    setUrl,
    previewImageUrl,
    setPreviewImageUrl,
    description,
    setDescription,
    siteName,
    setSiteName,

    // Manual recipe state
    manualDescription,
    setManualDescription,
    manualIngredients,
    setManualIngredients,
    manualInstructions,
    setManualInstructions,
    manualNotes,
    setManualNotes,

    // Actions
    resetForm,
  };
};
