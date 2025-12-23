import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for rotating through images with smooth transitions
 * @param {string[]} images - Array of image URLs to rotate through
 * @param {number} interval - Rotation interval in milliseconds (default: 4000ms)
 * @returns {{
 *   currentIndex: number,
 *   currentImage: string | null,
 *   isRotating: boolean
 * }}
 */
export const useImageRotation = (images, interval = 4000) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const timerRef = useRef(null);

  // Check if user prefers reduced motion for accessibility
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Don't rotate if:
    // - No images or only one image
    // - User prefers reduced motion
    if (!images || images.length <= 1 || prefersReducedMotion) {
      setIsRotating(false);
      return;
    }

    setIsRotating(true);

    // Start rotation timer
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [images, interval, prefersReducedMotion]);

  // Get current image URL
  const currentImage = images && images.length > 0 ? images[currentIndex] : null;

  return {
    currentIndex,
    currentImage,
    isRotating
  };
};
