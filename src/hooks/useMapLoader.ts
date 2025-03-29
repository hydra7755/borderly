import { useState, useEffect } from 'react';

interface MapLoaderState {
  isLoaded: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

export function useMapLoader(): MapLoaderState {
  const [state, setState] = useState<MapLoaderState>({
    isLoaded: false,
    hasError: false,
    errorMessage: null
  });

  useEffect(() => {
    const loadMap = async () => {
      try {
        // Test if react-simple-maps can be loaded
        await import('react-simple-maps');
        setState({ isLoaded: true, hasError: false, errorMessage: null });
      } catch (error) {
        console.error('Failed to load react-simple-maps:', error);
        setState({ 
          isLoaded: false, 
          hasError: true, 
          errorMessage: error instanceof Error ? error.message : 'Unknown error loading map' 
        });
      }
    };

    loadMap();
  }, []);

  return state;
}

export default useMapLoader; 