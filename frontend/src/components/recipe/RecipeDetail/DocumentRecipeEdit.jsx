/**
 * Edit component for document recipe fields
 */

import DocumentPreview from "../../common/DocumentPreview";

export default function DocumentRecipeEdit({
  recipe,
  file,
  validationErrors,
  onFileChange,
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        Recipe Document
      </h2>
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Replace document (optional)
        </p>
        <p className="text-xs text-gray-500 mb-2">
          Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT,
          JPG, PNG
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
            Selected: {file.name} (
            {(file.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
        )}
        {validationErrors.file && (
          <p className="mt-1 text-sm text-red-600">
            {validationErrors.file}
          </p>
        )}
        {recipe.fileContent && recipe.fileContentType && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Current document preview:
            </p>
            <DocumentPreview
              fileContent={recipe.fileContent}
              fileContentType={recipe.fileContentType}
              title={recipe.title}
            />
          </div>
        )}
      </div>
    </div>
  );
}
