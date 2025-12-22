/**
 * Document recipe fields component - File upload inputs
 * @param {Object} props
 * @param {File|null} props.file - Selected document file
 * @param {(e: Event) => void} props.onFileChange - Callback when document file changes
 * @param {File|null} props.displayImageFile - Selected display image file
 * @param {(e: Event) => void} props.onDisplayImageChange - Callback when display image changes
 * @returns {JSX.Element}
 */
const DocumentRecipeFields = ({
  file,
  onFileChange,
  displayImageFile,
  onDisplayImageChange,
}) => {
  return (
    <>
      <div className="mb-4">
        <label htmlFor="file" className="block text-sm font-medium mb-1">
          Upload Document *
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG
        </p>
        <input
          type="file"
          id="file"
          onChange={onFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        />
        {file && (
          <p className="text-xs text-green-600 mt-1">
            Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="displayImage" className="block text-sm font-medium mb-1">
          Display Image (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP
        </p>
        <input
          type="file"
          id="displayImage"
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
      </div>
    </>
  );
};

export default DocumentRecipeFields;
