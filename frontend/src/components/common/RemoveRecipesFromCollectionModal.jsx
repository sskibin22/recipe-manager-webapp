import { useState } from "react";
import { useCollectionMutations } from "../../hooks";

/**
 * Modal for removing multiple recipes from a collection (batch operation)
 * @param {Object} props
 * @param {string} props.collectionId - Collection ID to remove recipes from
 * @param {string} props.collectionName - Collection name for display
 * @param {Array} props.recipes - Array of recipe objects in the collection
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @returns {JSX.Element}
 */
const RemoveRecipesFromCollectionModal = ({ collectionId, collectionName, recipes, isOpen, onClose }) => {
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { removeRecipesBatchMutation } = useCollectionMutations();

  const handleToggleRecipe = (recipeId) => {
    setSelectedRecipeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRecipeIds.size === recipes.length) {
      setSelectedRecipeIds(new Set());
    } else {
      setSelectedRecipeIds(new Set(recipes.map((r) => r.id)));
    }
  };

  const handleRemoveClick = () => {
    if (selectedRecipeIds.size === 0) return;
    setShowConfirmation(true);
  };

  const handleConfirmRemove = async () => {
    setError(null);
    setSuccess(false);

    try {
      await removeRecipesBatchMutation.mutateAsync({
        collectionId,
        recipeIds: Array.from(selectedRecipeIds),
      });

      setSuccess(true);
      setShowConfirmation(false);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to remove recipes from collection");
      setShowConfirmation(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setSelectedRecipeIds(new Set());
    setShowConfirmation(false);
    onClose();
  };

  const allSelected = recipes.length > 0 && selectedRecipeIds.size === recipes.length;
  const someSelected = selectedRecipeIds.size > 0 && !allSelected;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Remove Recipes</h2>
            <p className="text-sm text-gray-600 mt-1">
              from {collectionName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              {selectedRecipeIds.size} {selectedRecipeIds.size === 1 ? "recipe" : "recipes"} removed successfully!
            </p>
          </div>
        )}

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto p-4">
          {recipes.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <p className="text-gray-600">No recipes in this collection</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="mb-3 flex items-center justify-between pb-2 border-b border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {allSelected ? "Deselect All" : "Select All"}
                  </span>
                </label>
                {selectedRecipeIds.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedRecipeIds.size} selected
                  </span>
                )}
              </div>

              {/* Recipe Items */}
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <label
                    key={recipe.id}
                    className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipeIds.has(recipe.id)}
                      onChange={() => handleToggleRecipe(recipe.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{recipe.title}</p>
                      {recipe.description && (
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {recipe.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {recipe.category.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 capitalize">{recipe.type}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            disabled={removeRecipesBatchMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemoveClick}
            disabled={
              selectedRecipeIds.size === 0 ||
              removeRecipesBatchMutation.isPending ||
              recipes.length === 0
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removeRecipesBatchMutation.isPending
              ? "Removing..."
              : `Remove ${selectedRecipeIds.size > 0 ? `${selectedRecipeIds.size} ` : ""}${
                  selectedRecipeIds.size === 1 ? "Recipe" : "Recipes"
                }`}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Removal</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to remove {selectedRecipeIds.size}{" "}
              {selectedRecipeIds.size === 1 ? "recipe" : "recipes"} from {collectionName}?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              <strong>Note:</strong> Recipes will only be removed from this collection. The recipes themselves will NOT be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveRecipesFromCollectionModal;
