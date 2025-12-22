/**
 * Component to display manual recipe content in readonly mode
 */

import { parseRecipeContent } from "../../utils/recipeContent";

/**
 * @param {Object} props
 * @param {string} props.content - JSON string of recipe content
 * @returns {JSX.Element|null}
 */
export default function ManualRecipeReadonlyView({ content }) {
  if (!content) return null;

  const parsedContent = parseRecipeContent(content);

  return (
    <div className="prose max-w-none space-y-6">
      {parsedContent.description && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Description
          </h2>
          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg text-base border border-gray-200">
            {parsedContent.description}
          </pre>
        </div>
      )}

      {parsedContent.ingredients && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Ingredients
          </h2>
          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg text-base border border-gray-200">
            {parsedContent.ingredients}
          </pre>
        </div>
      )}

      {parsedContent.instructions && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Instructions
          </h2>
          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg text-base border border-gray-200">
            {parsedContent.instructions}
          </pre>
        </div>
      )}

      {parsedContent.notes && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Notes
          </h2>
          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg text-base border border-gray-200">
            {parsedContent.notes}
          </pre>
        </div>
      )}
    </div>
  );
}
