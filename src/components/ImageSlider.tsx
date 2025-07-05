import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaGlobe } from 'react-icons/fa';

interface ImageSliderProps {
  images: string[];
  altText: string;
  autoRotate?: boolean;
  rotationInterval?: number;
  showAttribution?: boolean;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ 
  images, 
  altText, 
  autoRotate = true, 
  rotationInterval = 5000,
  showAttribution = true
}) => {
  // Limit images to a maximum of 4
  const limitedImages = images.slice(0, 4);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const autoRotateTimerRef = useRef<number | null>(null);
  const imagesRef = useRef<string[]>(limitedImages);

  // Preload all images on component mount
  useEffect(() => {
    let mounted = true;
    imagesRef.current = limitedImages;
    
    // Reset states when images change
    setFailedImages(new Set());
    setLoadedImages(new Set());
    setAllImagesFailed(false);
    setCurrentIndex(0);
    
    // Preload all images to verify which ones work
    const preloadImages = async () => {
      const promises = limitedImages.map((src, index) => 
        new Promise<number>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(index);
          img.onerror = () => resolve(-1);
          img.src = src;
        })
      );
      
      const results = await Promise.all(promises);
      
      if (!mounted) return;
      
      const failed = new Set<number>();
      const loaded = new Set<number>();
      
      results.forEach((result, i) => {
        if (result === -1) {
          failed.add(i);
        } else {
          loaded.add(result);
        }
      });
      
      setFailedImages(failed);
      setLoadedImages(loaded);
      setAllImagesFailed(failed.size >= limitedImages.length);
      
      // If current image is among failed, find the first working one
      if (failed.has(currentIndex) && loaded.size > 0) {
        const validIndices = Array.from(loaded);
        if (validIndices.length > 0) {
          setCurrentIndex(validIndices[0]);
        }
      }
      
      setIsInitialized(true);
    };
    
    preloadImages();
    
    return () => {
      mounted = false;
    };
  }, [images]);

  // Setup auto-rotation if enabled
  useEffect(() => {
    if (!autoRotate || isHovered || !isInitialized || allImagesFailed || loadedImages.size <= 1) {
      if (autoRotateTimerRef.current) {
        window.clearInterval(autoRotateTimerRef.current);
        autoRotateTimerRef.current = null;
      }
      return;
    }
    
    autoRotateTimerRef.current = window.setInterval(() => {
      goToNext();
    }, rotationInterval);
    
    return () => {
      if (autoRotateTimerRef.current) {
        window.clearInterval(autoRotateTimerRef.current);
        autoRotateTimerRef.current = null;
      }
    };
  }, [autoRotate, rotationInterval, isHovered, isInitialized, allImagesFailed, loadedImages.size, currentIndex]);

  // Get valid image indices (excluding failed ones)
  const getValidImageIndices = (): number[] => {
    return Array.from(loadedImages).sort((a, b) => a - b);
  };

  // Navigation handlers
  const goToPrevious = () => {
    const validIndices = getValidImageIndices();
    if (validIndices.length <= 1) return;
    
    const currentPosition = validIndices.indexOf(currentIndex);
    const prevPosition = currentPosition <= 0 ? validIndices.length - 1 : currentPosition - 1;
    setCurrentIndex(validIndices[prevPosition]);
  };

  const goToNext = () => {
    const validIndices = getValidImageIndices();
    if (validIndices.length <= 1) return;
    
    const currentPosition = validIndices.indexOf(currentIndex);
    const nextPosition = (currentPosition + 1) % validIndices.length;
    setCurrentIndex(validIndices[nextPosition]);
  };

  // Handle image load error during runtime
  const handleImageError = (index: number) => {
    // Mark this image as failed
    const newFailedImages = new Set(failedImages);
    newFailedImages.add(index);
    
    // Remove from loaded images
    const newLoadedImages = new Set(loadedImages);
    newLoadedImages.delete(index);
    
    setFailedImages(newFailedImages);
    setLoadedImages(newLoadedImages);
    
    // Check if all images have failed
    if (newLoadedImages.size === 0) {
      setAllImagesFailed(true);
      return;
    }
    
    // If current image failed, go to next valid one
    if (index === currentIndex) {
      const validIndices = Array.from(newLoadedImages);
      if (validIndices.length > 0) {
        setCurrentIndex(validIndices[0]);
      }
    }
  };

  // Early return if no images or all failed
  if (!isInitialized || !images || images.length === 0 || allImagesFailed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">
        <FaGlobe className="text-white text-6xl opacity-30" />
        <span className="text-white text-xl ml-4 font-medium">Image not available</span>
      </div>
    );
  }

  // Calculate if we should show navigation
  const shouldShowNavigation = loadedImages.size > 1;

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${altText} - ${currentIndex + 1}`}
          className="absolute w-full h-full object-cover object-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onError={() => handleImageError(currentIndex)}
        />
      </AnimatePresence>

      {/* Only show navigation controls if there are multiple viable images */}
      {shouldShowNavigation && (
        <>
          {/* Left arrow */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 z-10 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-300 focus:outline-none"
            aria-label="Previous image"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Right arrow */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 z-10 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-300 focus:outline-none"
            aria-label="Next image"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
          
          {/* Dots indicator - only show for loaded images */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {getValidImageIndices().map((index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/80'
                } transition-colors duration-300 focus:outline-none`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageSlider; 