/**
 * @typedef {import('../../../types/recipe').Recipe} Recipe
 */

import RecipeCard from "../RecipeCard/RecipeCard";

/**
 * Recipe list component - displays a grid of recipe cards
 * @param {Object} props
 * @param {Recipe[]} props.recipes - Array of recipes to display
 * @param {boolean} props.isLoading - Loading state
 * @param {Error|null} props.error - Error object if fetch failed
 * @returns {JSX.Element}
 */
const RecipeList = ({ recipes, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          Failed to load recipes. Please try again.
        </p>
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No recipes found</p>
        <p className="text-gray-400 mt-2">
          Add your first recipe to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};

export default RecipeList;
