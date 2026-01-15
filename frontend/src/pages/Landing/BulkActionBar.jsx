/**
 * Selection mode action bar for bulk operations
 * @param {Object} props
 * @param {boolean} props.isSelectionMode
 * @param {number} props.selectedCount
 * @param {number} props.totalCount
 * @param {() => void} props.onSelectAll
 * @param {() => void} props.onClearSelection
 * @param {() => void} props.onDeleteSelected
 * @param {() => void} props.onCancel
 * @param {boolean} props.isDeleting
 * @returns {JSX.Element | null}
 */
export default function BulkActionBar({
  isSelectionMode,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onCancel,
  isDeleting,
}) {
  if (!isSelectionMode) {
    return null;
  }

  return (
    <div className="bg-sage-50 border border-sage-300 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sage-900 font-medium">
          {selectedCount} recipe{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <button onClick={onSelectAll} className="text-sage-700 hover:text-sage-900 font-medium text-sm">
          Select All ({totalCount})
        </button>
        <button onClick={onClearSelection} className="text-sage-700 hover:text-sage-900 font-medium text-sm">
          Clear Selection
        </button>
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <button
            onClick={onDeleteSelected}
            disabled={isDeleting}
            className="px-4 py-2 bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Selected
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-wood-200 text-warmgray-700 rounded-lg hover:bg-wood-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
