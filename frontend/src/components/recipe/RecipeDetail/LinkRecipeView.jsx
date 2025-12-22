/**
 * Component to display link recipe content in readonly mode
 */

export default function LinkRecipeView({ recipe }) {
  if (!recipe || recipe.type.toLowerCase() !== "link") return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        Recipe Link
      </h2>
      {recipe.url ? (
        <a
          href={recipe.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline break-all text-base"
        >
          {recipe.url}
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
