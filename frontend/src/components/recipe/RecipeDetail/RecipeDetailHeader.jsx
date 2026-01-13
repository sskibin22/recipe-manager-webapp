/**
 * Header component for recipe detail page
 */

export default function RecipeDetailHeader({ onBack }) {
  return (
    <header className="header-warm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          <button
            onClick={onBack}
            className="text-warmgray-600 hover:text-warmgray-900 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-serif font-bold text-terracotta-600">Recipe Manager</h1>
        </div>
      </div>
    </header>
  );
}
