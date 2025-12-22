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
}) {
  if (isEditMode) {
    return (
      <>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
          disabled={isSaving || uploading}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
        onClick={onEdit}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Edit Recipe
      </button>
      <button
        onClick={onDelete}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete Recipe"}
      </button>
    </>
  );
}
