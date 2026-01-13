import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCollectionQuery, useCollectionRecipesQuery, useCollectionMutations } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import { AuthButton } from "../components/auth";
import RecipeList from "../components/recipe/RecipeList";
import AddRecipesToCollectionModal from "../components/common/AddRecipesToCollectionModal";
import RemoveRecipesFromCollectionModal from "../components/common/RemoveRecipesFromCollectionModal";
import CollectionImageUpload from "../components/common/CollectionImageUpload";
import RandomRecipeModal from "../components/common/RandomRecipeModal";
import { useState, useEffect } from "react";

/**
 * Collection detail page - view recipes in a collection
 * @returns {JSX.Element}
 */
export default function CollectionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [successMessage, setSuccessMessage] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isEditImageModalOpen, setIsEditImageModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);

  const { updateMutation, deleteMutation } = useCollectionMutations();

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      // Clear navigation state
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleUpdateCollectionImage = async ({ imageStorageKey, previewImageData }) => {
    if (!collection) return;

    try {
      await updateMutation.mutateAsync({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        imageStorageKey: imageStorageKey || undefined,
        previewImageData: previewImageData || undefined,
      });

      setSuccessMessage("Collection thumbnail updated successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Failed to update collection image:", error);
      throw error; // Re-throw so modal can show error
    }
  };

  const handleDeleteCollection = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteCollection = async () => {
    if (!collection) return;

    try {
      await deleteMutation.mutateAsync(collection.id);
      setIsDeleteConfirmOpen(false);
      // Navigate back to collections page
      navigate("/collections", { 
        state: { message: `Collection "${collection.name}" deleted successfully` } 
      });
    } catch (error) {
      console.error("Failed to delete collection:", error);
      alert("Failed to delete collection. Please try again.");
    }
  };

  const { data: collection, isLoading: isLoadingCollection } = useCollectionQuery(id, { enabled: !!user && !!id });
  const { data: recipes = [], isLoading: isLoadingRecipes, refetch } = useCollectionRecipesQuery(id, { enabled: !!user && !!id });

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
                onClick={() => setIsRandomModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Random Recipe from Collection"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span className="hidden sm:inline">Randomize</span>
              </button>
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
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setIsEditImageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            {collection.imageUrl ? "Edit" : "Add"} Thumbnail
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Recipe(s)
          </button>
          {recipes.length > 0 && (
            <button
              onClick={() => setIsRemoveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Remove Recipes
            </button>
          )}
          <button
            onClick={handleDeleteCollection}
            className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition ml-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Delete Collection
          </button>
        </div>

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

      {/* Modals */}
      {/* Delete Collection Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Delete Collection?
            </h2>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete the collection &quot;{collection?.name}&quot;?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                  <span>
                    <strong>Your recipes will NOT be deleted.</strong> Only the collection will be removed. All {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} will remain accessible in your recipe library.
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCollection}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddRecipesToCollectionModal
        collectionId={id}
        collectionName={collection?.name || ""}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <RemoveRecipesFromCollectionModal
        collectionId={id}
        collectionName={collection?.name || ""}
        recipes={recipes}
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
      />
      <CollectionImageUpload
        isOpen={isEditImageModalOpen}
        onClose={() => setIsEditImageModalOpen(false)}
        onUpload={handleUpdateCollectionImage}
        collectionName={collection?.name}
        currentImageUrl={collection?.imageUrl}
      />
      <RandomRecipeModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        collectionId={id}
      />
    </div>
  );
}
