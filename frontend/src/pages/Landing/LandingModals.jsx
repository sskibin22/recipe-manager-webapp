import RecipeForm from "../../components/recipe/RecipeForm/RecipeForm";
import RandomRecipeModal from "../../components/common/RandomRecipeModal";

/**
 * Wrapper for landing page modals
 * @param {Object} props
 * @param {boolean} props.showDeleteConfirm
 * @param {number} props.selectedCount
 * @param {() => void} props.onCancelDelete
 * @param {() => void} props.onConfirmDelete
 * @param {boolean} props.isDeleting
 * @param {boolean} props.isFormOpen
 * @param {() => void} props.onCloseForm
 * @param {() => void} props.onRecipeCreated
 * @param {boolean} props.isRandomModalOpen
 * @param {() => void} props.onCloseRandom
 * @returns {JSX.Element}
 */
export default function LandingModals({
  showDeleteConfirm,
  selectedCount,
  onCancelDelete,
  onConfirmDelete,
  isDeleting,
  isFormOpen,
  onCloseForm,
  onRecipeCreated,
  isRandomModalOpen,
  onCloseRandom,
}) {
  return (
    <>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-warmgray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream-50 rounded-xl max-w-md w-full p-6 border border-wood-200 shadow-warm-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-terracotta-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-terracotta-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-warmgray-900">
                  Delete {selectedCount} Recipe{selectedCount !== 1 ? "s" : ""}?
                </h3>
              </div>
            </div>
            <p className="text-warmgray-600 mb-6">
              This action cannot be undone. The selected recipe{selectedCount !== 1 ? "s" : ""} will be permanently deleted from your collection.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-wood-200 text-warmgray-700 rounded-lg hover:bg-wood-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <RecipeForm
          onClose={onCloseForm}
          onSuccess={() => {
            onRecipeCreated();
          }}
        />
      )}

      <RandomRecipeModal isOpen={isRandomModalOpen} onClose={onCloseRandom} collectionId={null} />
    </>
  );
}
