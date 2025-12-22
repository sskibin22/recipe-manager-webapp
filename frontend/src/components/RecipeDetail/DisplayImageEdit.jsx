/**
 * Display image upload/edit controls component
 */

export default function DisplayImageEdit({
  recipe,
  displayImageFile,
  removeDisplayImage,
  validationErrors,
  onDisplayImageChange,
  onRemoveDisplayImage,
}) {
  return (
    <div className="p-4 bg-blue-50 border-b border-blue-200">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        Display Image
      </h3>

      {recipe.previewImageUrl && !removeDisplayImage && !displayImageFile && (
        <div className="mb-3 flex items-center gap-3">
          <p className="text-sm text-gray-600">Current image is displayed above</p>
          <button
            type="button"
            onClick={onRemoveDisplayImage}
            className="text-sm text-red-600 hover:text-red-700 hover:underline"
          >
            Remove Image
          </button>
        </div>
      )}

      {removeDisplayImage && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Image will be removed when you save
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="displayImageEdit"
          className="block text-sm font-medium mb-1"
        >
          {recipe.previewImageUrl && !removeDisplayImage
            ? "Replace Display Image (Optional)"
            : "Upload Display Image (Optional)"}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP
        </p>
        <input
          type="file"
          id="displayImageEdit"
          onChange={onDisplayImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          accept=".jpg,.jpeg,.png,.gif,.webp"
        />
        {displayImageFile && (
          <p className="text-xs text-green-600 mt-1">
            Selected: {displayImageFile.name} (
            {(displayImageFile.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
        )}
        {validationErrors.displayImage && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.displayImage}
          </p>
        )}
      </div>
    </div>
  );
}
