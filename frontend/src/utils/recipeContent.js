/**
 * Helper utilities for managing structured manual recipe content
 */

/**
 * Parse recipe content - handles both structured JSON and legacy plain text
 * @param {string} content - The raw content string from the recipe
 * @returns {Object} Structured content object with description, ingredients, instructions, notes
 */
export const parseRecipeContent = (content) => {
  if (!content || !content.trim()) {
    return {
      description: "",
      ingredients: "",
      instructions: "",
      notes: "",
    };
  }

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(content);
    // Validate that it's our structured format
    if (typeof parsed === "object" && parsed !== null) {
      return {
        description: parsed.description || "",
        ingredients: parsed.ingredients || "",
        instructions: parsed.instructions || "",
        notes: parsed.notes || "",
      };
    }
  } catch {
    // Not JSON or invalid JSON - treat as legacy plain text
  }

  // Legacy plain text format - return as-is in instructions field
  return {
    description: "",
    ingredients: "",
    instructions: content,
    notes: "",
  };
};

/**
 * Serialize structured content to JSON string for storage
 * @param {Object} content - Structured content object
 * @returns {string} JSON string
 */
export const serializeRecipeContent = (content) => {
  return JSON.stringify({
    description: (content.description || "").trim(),
    ingredients: (content.ingredients || "").trim(),
    instructions: (content.instructions || "").trim(),
    notes: (content.notes || "").trim(),
  });
};
