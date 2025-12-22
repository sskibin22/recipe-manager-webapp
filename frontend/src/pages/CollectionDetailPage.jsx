import { useParams, useNavigate } from "react-router-dom";
import { useCollectionQuery, useCollectionRecipesQuery, useCollectionMutations } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import { AuthButton } from "../components/auth";
import RecipeList from "../components/recipe/RecipeList";

/**
 * Collection detail page - view recipes in a collection
 * @returns {JSX.Element}
 */
export default function CollectionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: collection, isLoading: isLoadingCollection } = useCollectionQuery(id, { enabled: !!user && !!id });
  const { data: recipes = [], isLoading: isLoadingRecipes, refetch } = useCollectionRecipesQuery(id, { enabled: !!user && !!id });
  const { removeRecipeMutation } = useCollectionMutations();

  // Future: handleRemoveRecipe for removing recipes from collection
  // Currently recipes can only be removed from the main recipe list

  const isLoading = isLoadingCollection || isLoadingRecipes;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Collection not found</h2>
          <button
            onClick={() => navigate("/collections")}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/collections")}
                className="text-gray-700 hover:text-gray-900 transition"
                title="Back to Collections"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
                {collection.description && (
                  <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="text-gray-700 hover:text-gray-900 transition"
                title="Back to Recipes"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>
              </button>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {recipes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recipes in this collection yet
              </h3>
              <p className="text-gray-600 mb-4">
                Add recipes to this collection from your recipe list.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Browse Recipes
              </button>
            </div>
          </div>
        ) : (
          <RecipeList recipes={recipes} onUpdate={refetch} />
        )}
      </main>
    </div>
  );
}
