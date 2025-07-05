// src/utils/localStorageHelper.ts

const APP_PROGRESS_PREFIX = 'visaAppProgress_';

interface SavedProgress {
  currentStep: string; // Consider using the Step type if importable
  applicationData: any; // Using 'any' for now, refine with a proper type
}

// Saves the current application state and step to local storage
export const saveApplicationProgress = (applicationId: string, progress: SavedProgress) => {
  try {
    const key = `${APP_PROGRESS_PREFIX}${applicationId}`;
    // Be cautious about storing large data like file data URLs in localStorage
    // Consider omitting large fields or using IndexedDB for files
    const dataToSave = {
        ...progress,
        applicationData: {
            ...progress.applicationData,
            passportFile: null, // Don't save File objects directly
            passportScan: null, // Don't save File objects directly
            photoId: null, // Don't save File objects directly
            additionalDocuments: [], // Don't save File objects directly
            // Keep photoSrc (data URL) for now, but be mindful of size
        }
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
    // console.log(`[LocalStorage] Saved progress for ${key}`);
  } catch (error) {
    console.error("[LocalStorage] Error saving application progress:", error);
    // Handle potential storage quota exceeded errors
  }
};

// Loads the application state and step from local storage
export const loadApplicationProgress = (applicationId: string): SavedProgress | null => {
  try {
    const key = `${APP_PROGRESS_PREFIX}${applicationId}`;
    const savedData = localStorage.getItem(key);
    if (savedData) {
      // console.log(`[LocalStorage] Loaded progress for ${key}`);
      return JSON.parse(savedData);
    } else {
      // console.log(`[LocalStorage] No saved progress found for ${key}`);
      return null;
    }
  } catch (error) {
    console.error("[LocalStorage] Error loading application progress:", error);
    return null;
  }
};

// Clears the saved application state from local storage
export const clearApplicationProgress = (applicationId: string) => {
  try {
    const key = `${APP_PROGRESS_PREFIX}${applicationId}`;
    localStorage.removeItem(key);
    console.log(`[LocalStorage] Cleared progress for ${key}`);
  } catch (error) {
    console.error("[LocalStorage] Error clearing application progress:", error);
  }
};
