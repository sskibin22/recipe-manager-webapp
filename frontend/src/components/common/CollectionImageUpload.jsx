import { useState } from "react";
import { validateImage } from "../../utils/fileValidation";
import { uploadService } from "../../services/api/uploadService";
import { logger } from "../../utils/logger";

/**
 * Reusable modal component for uploading/editing collection thumbnail images
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Function} props.onUpload - Callback when upload completes successfully
 * @param {string} [props.collectionName] - Name of collection (for display)
 * @param {string} [props.currentImageUrl] - Current image URL (if exists)
 * @returns {JSX.Element}
 */
export default function CollectionImageUpload({ 
  isOpen, 
  onClose, 
  onUpload, 
  collectionName,
  currentImageUrl 
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  // Generate unique ID using crypto API for better uniqueness guarantees
  const [fileInputId] = useState(() => `collection-image-${crypto.randomUUID()}`);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImage(file);
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

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageError("");
    setIsUploading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setImageError("Please select an image");
      return;
    }

    try {
      setIsUploading(true);
      let imageStorageKey = null;
      let previewImageData = null;

      // Upload image
      try {
        // Try to upload to R2 first (production)
        const { uploadUrl, key } = await uploadService.getPresignedCollectionImageUploadUrl(
          selectedImage.name,
          selectedImage.type
        );
        
        // Check if we got a real presigned URL or a placeholder (local development)
        const isPlaceholder = uploadUrl.includes('placeholder-upload') || uploadUrl.includes('localhost');
        
        if (isPlaceholder) {
          // Local development: send image as base64 data URI
          logger.info('Local development mode: sending image as base64 data');
          previewImageData = imagePreview; // imagePreview is already a data URI from FileReader
        } else {
          // Production: upload to R2
          await uploadService.uploadToPresignedUrl(uploadUrl, selectedImage);
          imageStorageKey = key;
        }
      } catch (error) {
        logger.error("Failed to upload collection image:", error);
        
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

      // Call parent callback with upload results
      await onUpload({ imageStorageKey, previewImageData });
      
      // Success - close modal and reset state
      handleClose();
    } catch (error) {
      logger.error("Failed to update collection image:", error);
      setImageError("Failed to update image. Please try again.");
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {currentImageUrl ? "Update" : "Add"} Collection Thumbnail
        </h2>
        {collectionName && (
          <p className="text-sm text-gray-600 mb-4">
            Collection: <span className="font-medium">{collectionName}</span>
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection Image
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
            ) : currentImageUrl ? (
              <div className="space-y-2">
                <div className="relative">
                  <img
                    src={currentImageUrl}
                    alt="Current thumbnail"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                    <p className="text-white text-sm font-medium">Current Image</p>
                  </div>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                  <input
                    type="file"
                    id={fileInputId}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor={fileInputId}
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
                      Click to select a new image
                    </p>
                  </label>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  id={fileInputId}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label
                  htmlFor={fileInputId}
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
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : currentImageUrl ? "Update Image" : "Add Image"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
