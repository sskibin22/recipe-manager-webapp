/**
 * Link recipe fields component - URL input and metadata preview
 * @param {Object} props
 * @param {string} props.url - URL value
 * @param {(url: string) => void} props.onUrlChange - Callback when URL changes
 * @param {boolean} props.fetchingMetadata - Whether metadata is being fetched
 * @param {Object|null} props.metadata - Fetched metadata
 * @param {string} props.previewImageUrl - Preview image URL
 * @param {(url: string) => void} props.onPreviewImageUrlChange - Callback for preview image URL
 * @param {string} props.description - Description value
 * @param {(desc: string) => void} props.onDescriptionChange - Callback for description
 * @param {string} props.siteName - Site name value
 * @param {(name: string) => void} props.onSiteNameChange - Callback for site name
 * @returns {JSX.Element}
 */
const LinkRecipeFields = ({
  url,
  onUrlChange,
  fetchingMetadata,
  metadata,
  previewImageUrl,
  onPreviewImageUrlChange,
  description,
  onDescriptionChange,
  siteName,
  onSiteNameChange,
}) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="url" className="block text-sm font-medium mb-1">
          Recipe URL *
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/recipe"
        />
        {fetchingMetadata && (
          <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
            <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></span>
            Fetching recipe preview...
          </p>
        )}
      </div>

      {/* Metadata Preview for Link Recipes */}
      {metadata && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Recipe Preview (Editable)
          </h4>

          {/* Preview Image URL */}
          <div className="mb-3">
            <label
              htmlFor="previewImageUrl"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Preview Image URL
            </label>
            <input
              type="url"
              id="previewImageUrl"
              value={previewImageUrl}
              onChange={(e) => onPreviewImageUrlChange(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {previewImageUrl && (
              <div className="mt-2">
                <img
                  src={previewImageUrl}
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
              htmlFor="description"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows="2"
              maxLength="500"
              placeholder="Brief description..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Site Name */}
          <div>
            <label
              htmlFor="siteName"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Site Name
            </label>
            <input
              type="text"
              id="siteName"
              value={siteName}
              onChange={(e) => onSiteNameChange(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength="256"
              placeholder="Recipe source"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LinkRecipeFields;
