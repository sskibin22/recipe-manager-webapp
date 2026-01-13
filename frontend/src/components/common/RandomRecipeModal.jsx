import { useState, useEffect } from "react";
import { recipeService } from "../../services/api";
import RecipeCard from "../recipe/RecipeCard/RecipeCard";

/**
 * Modal that displays a random recipe with "randomize again" functionality
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {string|null} [props.collectionId=null] - Optional collection ID to filter random selection
 * @returns {JSX.Element}
 */
const RandomRecipeModal = ({ isOpen, onClose, collectionId = null }) => {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch random recipe
  const fetchRandomRecipe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const randomRecipe = await recipeService.getRandom(collectionId);
      setRecipe(randomRecipe);
    } catch (err) {
      console.error("Error fetching random recipe:", err);
      if (err.response?.status === 404) {
        setError("No recipes available");
      } else {
        setError("Failed to load random recipe. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch random recipe when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRandomRecipe();
    } else {
      // Reset state when modal closes
      setRecipe(null);
      setError(null);
    }
  }, [isOpen, collectionId]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-warmgray-900/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-cream-50 rounded-xl shadow-warm-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-wood-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-wood-200">
          <h2 className="text-2xl font-serif font-bold text-warmgray-900">Random Recipe</h2>
          <button
            onClick={onClose}
            className="text-warmgray-400 hover:text-warmgray-600 transition"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-warmgray-600 mb-4">{error}</p>
              {error === "No recipes available" ? (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-wood-200 text-warmgray-700 rounded-lg hover:bg-wood-300 transition"
                >
                  Close
                </button>
              ) : (
                <button
                  onClick={fetchRandomRecipe}
                  className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition shadow-warm"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {recipe && !isLoading && !error && (
            <>
              {/* Recipe Card */}
              <div className="mb-6">
                <RecipeCard recipe={recipe} />
              </div>

              {/* Randomize Again Button */}
              <div className="flex justify-center">
                <button
                  onClick={fetchRandomRecipe}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition shadow-warm disabled:opacity-50 disabled:cursor-not-allowed"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Randomize Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RandomRecipeModal;
