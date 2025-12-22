/**
 * Component to display document recipe content in readonly mode
 */

import DocumentPreview from "../../DocumentPreview";

export default function DocumentRecipeView({ recipe }) {
  if (!recipe || recipe.type.toLowerCase() !== "document") return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        Recipe Document
      </h2>
      {recipe.fileContent && recipe.fileContentType ? (
        <DocumentPreview
          fileContent={recipe.fileContent}
          fileContentType={recipe.fileContentType}
          title={recipe.title}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Document content not available
          </p>
        </div>
      )}
    </div>
  );
}
