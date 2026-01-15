import { useCallback, useState } from "react";

/**
 * Shared manual recipe field state for create and edit flows.
 * Consolidates state management and validation used by useRecipeForm and useRecipeEdit.
 * @param {Object} [initialValues]
 * @param {string} [initialValues.description]
 * @param {string} [initialValues.ingredients]
 * @param {string} [initialValues.instructions]
 * @param {string} [initialValues.notes]
 * @returns {Object} Manual recipe field state and helpers
 */
export const useManualRecipeFields = (initialValues = {}) => {
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [ingredients, setIngredients] = useState(initialValues.ingredients ?? "");
  const [instructions, setInstructions] = useState(initialValues.instructions ?? "");
  const [notes, setNotes] = useState(initialValues.notes ?? "");

  /**
   * Reset manual fields to provided values (or blanks)
   * @param {Object} [values]
   */
  const resetManualFields = useCallback((values = {}) => {
    setDescription(values.description ?? "");
    setIngredients(values.ingredients ?? "");
    setInstructions(values.instructions ?? "");
    setNotes(values.notes ?? "");
  }, []);

  /**
   * Validate manual recipe content ensuring key fields are populated.
   * @param {string} [message] Custom error message
   * @returns {string} Validation error message or empty string when valid
   */
  const validateManualFields = useCallback(
    (message = "Either Ingredients or Instructions must be provided") => {
      if (!ingredients.trim() && !instructions.trim()) {
        return message;
      }
      return "";
    },
    [ingredients, instructions],
  );

  return {
    description,
    setDescription,
    ingredients,
    setIngredients,
    instructions,
    setInstructions,
    notes,
    setNotes,
    resetManualFields,
    validateManualFields,
  };
};
