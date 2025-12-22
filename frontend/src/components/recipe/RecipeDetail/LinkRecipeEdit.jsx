/**
 * Edit component for link recipe fields
 */

export default function LinkRecipeEdit({
  editedUrl,
  setEditedUrl,
  validationErrors,
  fetchingMetadata,
  metadata,
  editedMetadataTitle,
  setEditedMetadataTitle,
  editedPreviewImageUrl,
  setEditedPreviewImageUrl,
  editedDescription,
  setEditedDescription,
  editedSiteName,
  setEditedSiteName,
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        Recipe Link
      </h2>
      <div>
        <input
          type="url"
          value={editedUrl}
          onChange={(e) => setEditedUrl(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            validationErrors.url
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="https://example.com/recipe"
        />
        {fetchingMetadata && (
          <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
            <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></span>
            Fetching recipe preview...
          </p>
        )}
        {validationErrors.url && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.url}
          </p>
        )}

        {/* Metadata Preview for Link Recipes */}
        {metadata && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Recipe Metadata (Editable)
            </h4>

            {/* Title */}
            <div className="mb-3">
              <label
                htmlFor="editedMetadataTitle"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Title
              </label>
              <input
                type="text"
                id="editedMetadataTitle"
                value={editedMetadataTitle}
                onChange={(e) => setEditedMetadataTitle(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Recipe title from URL"
              />
            </div>

            {/* Preview Image URL */}
            <div className="mb-3">
              <label
                htmlFor="editedPreviewImageUrl"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Preview Image URL
              </label>
              <input
                type="url"
                id="editedPreviewImageUrl"
                value={editedPreviewImageUrl}
                onChange={(e) => setEditedPreviewImageUrl(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              {editedPreviewImageUrl && (
                <div className="mt-2">
                  <img
                    src={editedPreviewImageUrl}
                    alt="Preview"
                    className="h-24 w-auto rounded border border-gray-300 object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-3">
              <label
                htmlFor="editedDescription"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Description
              </label>
              <textarea
                id="editedDescription"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows="2"
                maxLength="500"
                placeholder="Brief description..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {editedDescription.length}/500 characters
              </p>
            </div>

            {/* Site Name */}
            <div>
              <label
                htmlFor="editedSiteName"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Site Name
              </label>
              <input
                type="text"
                id="editedSiteName"
                value={editedSiteName}
                onChange={(e) => setEditedSiteName(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                maxLength="256"
                placeholder="Recipe source"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
