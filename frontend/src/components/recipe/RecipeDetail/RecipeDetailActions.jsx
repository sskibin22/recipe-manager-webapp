/**
 * Action buttons component for recipe detail page
 */

export default function RecipeDetailActions({
  isEditMode,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  isDeleting,
  isSaving,
  uploading,
  onAddToCollection,
}) {
  if (isEditMode) {
    return (
      <>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-wood-200 text-warmgray-700 rounded-lg hover:bg-wood-300 transition-colors"
          disabled={isSaving || uploading}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors disabled:opacity-50 shadow-warm flex items-center gap-2"
          disabled={isSaving || uploading}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uploading...
            </>
          ) : isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <button
        onClick={onAddToCollection}
        className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors flex items-center gap-2"
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
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
          />
        </svg>
        Add to Collection
      </button>
      <button
        onClick={onEdit}
        className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition-colors shadow-warm"
      >
        Edit Recipe
      </button>
      <button
        onClick={onDelete}
        className="px-4 py-2 bg-wood-600 text-white rounded-lg hover:bg-wood-700 transition-colors disabled:opacity-50"
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete Recipe"}
      </button>
    </>
  );
}
