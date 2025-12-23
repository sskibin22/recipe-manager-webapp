import { useImageRotation } from "../../hooks";

/**
 * Component to display collection thumbnail with auto-rotating recipe images
 * @param {Object} props
 * @param {Object} props.collection - Collection data
 * @param {Function} props.onEditImage - Callback when edit image button clicked
 * @returns {JSX.Element}
 */
export default function CollectionThumbnail({ collection, onEditImage }) {
  const { imageUrl, recipePreviewImages = [] } = collection;
  
  // Use rotating images only if:
  // 1. No custom thumbnail is uploaded (imageUrl is null/empty)
  // 2. There are recipe images available
  const shouldRotate = !imageUrl && recipePreviewImages.length > 0;
  
  const { currentImage, isRotating } = useImageRotation(
    shouldRotate ? recipePreviewImages : [],
    4000 // 4 second interval
  );

  // Determine which image to display
  const displayImage = imageUrl || currentImage;

  // If custom thumbnail exists, display it
  if (imageUrl) {
    return (
      <div className="w-full h-48 bg-gray-100 relative">
        <img
          src={imageUrl}
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        {/* Edit Image Button - Shows on hover */}
        <button
          onClick={onEditImage}
          className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition opacity-0 group-hover:opacity-100"
          title="Edit thumbnail image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-gray-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        </button>
      </div>
    );
  }

  // If rotating recipe images are available, display them with fade transition
  if (shouldRotate && displayImage) {
    return (
      <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
        <img
          key={currentImage} // Force re-mount on image change for fade effect
          src={displayImage}
          alt={`${collection.name} preview`}
          className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
          style={{ animation: isRotating ? 'fadeIn 0.5s ease-in-out' : 'none' }}
        />
        {/* Rotating indicator - subtle dot animation */}
        {isRotating && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {recipePreviewImages.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === (currentImage === recipePreviewImages[index] ? 0 : recipePreviewImages.indexOf(currentImage))
                    ? 'bg-white'
                    : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
        {/* Add Image Button - Shows on hover */}
        <button
          onClick={onEditImage}
          className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition opacity-0 group-hover:opacity-100"
          title="Add thumbnail image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-gray-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Fallback: Display placeholder with folder icon
  return (
    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
      <svg
        className="w-16 h-16 text-gray-400"
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
      {/* Add Image Button - Shows on hover */}
      <button
        onClick={onEditImage}
        className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-md transition opacity-0 group-hover:opacity-100"
        title="Add thumbnail image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-gray-700"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </button>
    </div>
  );
}
