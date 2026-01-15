import { useState } from "react";
import { useManualRecipeFields } from "./useManualRecipeFields";

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

  // Document recipe specific state
  const [documentDescription, setDocumentDescription] = useState("");

  // Manual recipe specific state (shared hook with edit flow)
  const {
    description: manualDescription,
    setDescription: setManualDescription,
    ingredients: manualIngredients,
    setIngredients: setManualIngredients,
    instructions: manualInstructions,
    setInstructions: setManualInstructions,
    notes: manualNotes,
    setNotes: setManualNotes,
    resetManualFields,
    validateManualFields,
  } = useManualRecipeFields();

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
    setDocumentDescription("");
    resetManualFields();
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

    // Document recipe state
    documentDescription,
    setDocumentDescription,

    // Manual recipe state
    manualDescription,
    setManualDescription,
    manualIngredients,
    setManualIngredients,
    manualInstructions,
    setManualInstructions,
    manualNotes,
    setManualNotes,
    validateManualFields,

    // Actions
    resetForm,
  };
};
