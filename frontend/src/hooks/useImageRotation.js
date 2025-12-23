import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for rotating through images with smooth transitions
 * @param {string[]} images - Array of image URLs to rotate through
 * @param {number} interval - Rotation interval in milliseconds (default: 5000ms)
 * @returns {{
 *   currentIndex: number,
 *   previousIndex: number | null,
 *   currentImage: string | null,
 *   previousImage: string | null,
 *   isRotating: boolean
 * }}
 */
export const useImageRotation = (images, interval = 5000) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const timerRef = useRef(null);

  // Check if user prefers reduced motion for accessibility
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Determine if rotation should be active (derived state)
  const isRotating = !prefersReducedMotion && images && images.length > 1;

  useEffect(() => {
    // Don't rotate if conditions aren't met
    if (!isRotating) {
      return;
    }

    // Start rotation timer
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        setPreviousIndex(prevIndex);
        return (prevIndex + 1) % images.length;
      });
    }, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [images, interval, isRotating]);

  // Get current and previous image URLs
  const currentImage = images && images.length > 0 ? images[currentIndex] : null;
  const previousImage = previousIndex !== null && images && images.length > 0 
    ? images[previousIndex] 
    : null;

  return {
    currentIndex,
    previousIndex,
    currentImage,
    previousImage,
    isRotating
  };
};
