import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCollectionsQuery, useCollectionMutations } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import { AuthButton } from "../components/auth";
import { validateCollectionImage } from "../utils/fileValidation";
import { uploadService } from "../services/api/uploadService";
import CollectionImageUpload from "../components/common/CollectionImageUpload";
import CollectionThumbnail from "../components/common/CollectionThumbnail";
import {
  sortCollections,
  filterCollectionsBySearch,
  SORT_OPTIONS,
  SORT_STORAGE_KEY,
} from "../utils/collectionSort";

/**
 * Collections page - list all user collections
 * @returns {JSX.Element}
 */
export default function CollectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [isEditImageModalOpen, setIsEditImageModalOpen] = useState(false);

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState(() => {
    // Load sort preference from session storage
    return sessionStorage.getItem(SORT_STORAGE_KEY) || "updated-newest";
  });

  const { data: collections = [], isLoading, refetch } = useCollectionsQuery({ enabled: !!user });
  const { createMutation, deleteMutation, updateMutation } = useCollectionMutations();

  // Persist sort option to session storage
  useEffect(() => {
    sessionStorage.setItem(SORT_STORAGE_KEY, sortOption);
  }, [sortOption]);

  // Apply search and sort to collections
  const displayedCollections = useMemo(() => {
    let filtered = filterCollectionsBySearch(collections, searchQuery);
    return sortCollections(filtered, sortOption);
  }, [collections, searchQuery, sortOption]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateCollectionImage(file);
    if (error) {
      setImageError(error);
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    setImageError("");
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageError("");
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      setIsUploading(true);
      let imageStorageKey = null;
      let previewImageData = null;

      // Upload image if selected
      if (selectedImage) {
        try {
          // Try to upload to R2 first (production)
          const { uploadUrl, key } = await uploadService.getPresignedCollectionImageUploadUrl(
            selectedImage.name,
            selectedImage.type
          );
          
          // Check if we got a real presigned URL or a placeholder (local development)
          // Backend returns placeholder URLs like "http://localhost:5172/placeholder-upload/{key}"
          // when R2 is not configured (local development mode)
          const isPlaceholder = uploadUrl.includes('placeholder-upload') || uploadUrl.includes('localhost');
          
          if (isPlaceholder) {
            // Local development: send image as base64 data URI
            console.log('Local development mode: sending image as base64 data');
            previewImageData = imagePreview; // imagePreview is already a data URI from FileReader
          } else {
            // Production: upload to R2
            await uploadService.uploadToPresignedUrl(uploadUrl, selectedImage);
            imageStorageKey = key;
          }
        } catch (error) {
          console.error("Failed to upload collection image:", error);
          
          // Provide specific error messages based on error type
          let errorMessage = "Failed to upload image. Please try again.";
          if (error.response?.status === 413) {
            errorMessage = "Image file is too large. Please use an image under 5MB.";
          } else if (error.response?.status === 400) {
            errorMessage = "Invalid image format. Please use JPEG, PNG, GIF, or WebP.";
          } else if (!navigator.onLine) {
            errorMessage = "No internet connection. Please check your network and try again.";
          } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
            errorMessage = "Upload timed out. Please try again with a smaller image.";
          }
          
          setImageError(errorMessage);
          setIsUploading(false);
          return;
        }
      }

      const newCollection = await createMutation.mutateAsync({
        name: newCollectionName,
        description: newCollectionDescription || undefined,
        imageStorageKey: imageStorageKey || undefined,
        previewImageData: previewImageData || undefined,
      });
      
      setNewCollectionName("");
      setNewCollectionDescription("");
      setSelectedImage(null);
      setImagePreview(null);
      setImageError("");
      setIsCreateModalOpen(false);
      setIsUploading(false);
      
      // Redirect to bulk selection page
      navigate(`/collections/${newCollection.id}/add-recipes`);
    } catch (error) {
      console.error("Failed to create collection:", error);
      setIsUploading(false);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!confirm("Are you sure you want to delete this collection? Recipes will not be deleted.")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(collectionId);
      refetch();
    } catch (error) {
      console.error("Failed to delete collection:", error);
    }
  };

  const handleOpenEditImage = (collectionId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent navigation to collection detail
    }
    setEditingCollectionId(collectionId);
    setIsEditImageModalOpen(true);
  };

  const handleCloseEditImage = () => {
    setEditingCollectionId(null);
    setIsEditImageModalOpen(false);
  };

  const handleUpdateCollectionImage = async ({ imageStorageKey, previewImageData }) => {
    if (!editingCollectionId) return;

    try {
      const collection = collections.find(c => c.id === editingCollectionId);
      if (!collection) return;

      await updateMutation.mutateAsync({
        id: editingCollectionId,
        name: collection.name,
        description: collection.description,
        imageStorageKey: imageStorageKey || undefined,
        previewImageData: previewImageData || undefined,
      });
      // React Query will automatically invalidate and refetch the collections query
    } catch (error) {
      console.error("Failed to update collection image:", error);
      throw error; // Re-throw so modal can show error
    }
  };

  // Helper function for submit button text
  const getSubmitButtonText = () => {
    if (isUploading) return "Uploading...";
    if (createMutation.isPending) return "Creating...";
    return "Create";
  };

  // Get the currently editing collection (optimized to avoid duplicate lookups)
  const editingCollection = editingCollectionId 
    ? collections.find(c => c.id === editingCollectionId)
    : null;

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
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
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Collections</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/settings")}
                className="text-gray-700 hover:text-gray-900 transition"
                title="Account Settings"
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
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar: Create button, Search, and Sort */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Collection
          </button>

          {/* Search and Sort Controls - only show when collections exist */}
          {collections.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
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
                  d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No collections yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create collections to organize your recipes by theme, occasion, or any category you like.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Your First Collection
              </button>
            </div>
          </div>
        ) : displayedCollections.length === 0 ? (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No collections found
              </h3>
              <p className="text-gray-600 mb-4">
                No collections match your search &quot;{searchQuery}&quot;. Try a different search term.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden cursor-pointer relative group"
                onClick={() => navigate(`/collections/${collection.id}`)}
              >
                {/* Collection Thumbnail with auto-rotating recipe images */}
                <CollectionThumbnail
                  collection={collection}
                  onEditImage={(e) => handleOpenEditImage(collection.id, e)}
                />
                
                {/* Collection Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {collection.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {collection.recipeCount} {collection.recipeCount === 1 ? "recipe" : "recipes"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection.id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition"
                      title="Delete collection"
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Collection Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create New Collection
              </h2>
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Meal Prep Monday, Quick Dinners"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="What's this collection about?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Image (optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    JPEG, PNG, GIF, or WebP. Max 5MB.
                  </p>
                  
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                        title="Remove image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                      <input
                        type="file"
                        id="collection-image"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="collection-image"
                        className="cursor-pointer"
                      >
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">
                          Click to upload an image
                        </p>
                      </label>
                    </div>
                  )}
                  
                  {imageError && (
                    <p className="mt-2 text-sm text-red-600">{imageError}</p>
                  )}
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNewCollectionName("");
                      setNewCollectionDescription("");
                      setSelectedImage(null);
                      setImagePreview(null);
                      setImageError("");
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {getSubmitButtonText()}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Collection Image Modal */}
        <CollectionImageUpload
          isOpen={isEditImageModalOpen}
          onClose={handleCloseEditImage}
          onUpload={handleUpdateCollectionImage}
          collectionName={editingCollection?.name}
          currentImageUrl={editingCollection?.imageUrl}
        />
      </main>
    </div>
  );
}
