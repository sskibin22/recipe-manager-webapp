import { useState, useEffect } from "react";
import { useCollectionsQuery, useCollectionMutations } from "../../hooks";
import { collectionService } from "../../services/api";

/**
 * Modal for adding/removing a recipe to/from collections
 * @param {Object} props
 * @param {string} props.recipeId - Recipe ID to add/remove
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal closes
 * @returns {JSX.Element}
 */
const AddToCollectionModal = ({ recipeId, isOpen, onClose }) => {
  const { data: collections = [], isLoading } = useCollectionsQuery({ enabled: isOpen });
  const { addRecipeMutation, removeRecipeMutation } = useCollectionMutations();
  const [selectedCollections, setSelectedCollections] = useState(new Set());
  const [initialCollections, setInitialCollections] = useState(new Set());
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check which collections already contain this recipe
  useEffect(() => {
    if (!isOpen || !recipeId || collections.length === 0) return;

    const checkCollections = async () => {
      try {
        // Single API call to get all collections containing this recipe
        const collectionIds = await collectionService.getCollectionsContainingRecipe(recipeId);
        const collectionsWithRecipe = new Set(collectionIds);
        
        setInitialCollections(collectionsWithRecipe);
        setSelectedCollections(new Set(collectionsWithRecipe));
      } catch (err) {
        console.error(`Failed to fetch collections for recipe ${recipeId}:`, err);
        setError("Failed to load collection membership");
      }
    };

    checkCollections();
  }, [isOpen, recipeId, collections]);

  const handleToggleCollection = (collectionId) => {
    setSelectedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    try {
      // Determine which collections to add to and which to remove from
      const toAdd = [...selectedCollections].filter(id => !initialCollections.has(id));
      const toRemove = [...initialCollections].filter(id => !selectedCollections.has(id));

      // Execute add/remove operations
      const promises = [];
      
      toAdd.forEach(collectionId => {
        promises.push(
          addRecipeMutation.mutateAsync({ collectionId, recipeId })
        );
      });

      toRemove.forEach(collectionId => {
        promises.push(
          removeRecipeMutation.mutateAsync({ collectionId, recipeId })
        );
      });

      await Promise.all(promises);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to update collections");
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setSelectedCollections(new Set(initialCollections));
    onClose();
  };

  if (!isOpen) return null;

  const hasChanges = 
    selectedCollections.size !== initialCollections.size ||
    ![...selectedCollections].every(id => initialCollections.has(id));

  const isSaving = addRecipeMutation.isPending || removeRecipeMutation.isPending;

  return (
    <div className="fixed inset-0 bg-warmgray-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-cream-50 rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto border border-wood-200 shadow-warm-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif font-bold text-warmgray-900">
            Add to Collections
          </h2>
          <button
            onClick={handleClose}
            className="text-warmgray-400 hover:text-warmgray-600 transition"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl">
            <p className="text-sm text-terracotta-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-sage-50 border border-sage-200 rounded-xl">
            <p className="text-sm text-sage-800">Collections updated successfully!</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-600 mx-auto"></div>
            <p className="text-warmgray-600 mt-2">Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-warmgray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
              />
            </svg>
            <p className="text-warmgray-600 mb-2">No collections yet</p>
            <p className="text-sm text-warmgray-500">Create a collection first to organize your recipes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((collection) => (
              <label
                key={collection.id}
                className="flex items-start p-3 rounded-xl border border-wood-200 hover:bg-wood-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selectedCollections.has(collection.id)}
                  onChange={() => handleToggleCollection(collection.id)}
                  className="mt-1 h-4 w-4 text-terracotta-600 focus:ring-terracotta-400 border-wood-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-warmgray-900">{collection.name}</p>
                  {collection.description && (
                    <p className="text-sm text-warmgray-600 mt-0.5">
                      {collection.description}
                    </p>
                  )}
                  <p className="text-xs text-warmgray-500 mt-1">
                    {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-warmgray-700 hover:bg-wood-100 rounded-lg transition"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving || collections.length === 0}
            className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition shadow-warm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCollectionModal;
