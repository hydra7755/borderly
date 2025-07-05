import { supabase } from '../supabase/client';
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import authService from './auth';

/**
 * Interface for user profile data
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  nationality?: string;
  residency?: string;
  travel_score?: number;
  questionnaire_completed?: boolean;
  subscription_tier?: 'free' | 'premium' | 'enterprise';
  created_at?: string;
  updated_at?: string;
  profile_image_url?: string;
  passport_number?: string;
  passport_expiry?: string;
  phone_number?: string;
  saved_documents?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded?: string;
    size?: number;
    category?: string;
  }>;
  travel_history?: string[];
  saved_countries?: string[];
}

interface TravelHistory {
  id: string;
  user_id: string;
  country_code: string;
  visit_date: string;
}

interface SavedCountry {
  id: string;
  user_id: string;
  country_code: string;
}

interface Document {
  id: string;
  user_id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  uploaded_at: string;
}

// Add a fallback mechanism using localStorage when Supabase fails
const LOCAL_STORAGE_PROFILE_KEY = 'travelscore_user_profile';

const createDefaultProfile = (): UserProfile => ({
  id: 'local-user',
  email: 'user@example.com',
  full_name: 'Demo User',
  nationality: '',
  residency: '',
  travel_score: 0,
  subscription_tier: 'free',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  questionnaire_completed: false
});

/**
 * User profile service for managing user profile data
 */
export const userProfileService = {
  /**
   * Get the current user's profile data
   * @returns Promise with the user profile data or null if not found/error
   */
  async getCurrentUserProfile(): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      
      if (authError || !user) {
        console.log("Auth error or no user, falling back to localStorage (if available)");
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (storedProfile) {
          console.log("Returning profile from localStorage as fallback.");
          return { profile: JSON.parse(storedProfile), error: null };
        }
        // If no user and no local storage, return null without setting local storage
        console.warn("No authenticated user and no profile in localStorage.");
        return { profile: null, error: authError || new Error('No authenticated user') };
      }
      
      // User is authenticated, proceed to fetch from Supabase
      try {
        console.log(`Fetching profile for user ID: ${user.id}`);
        // Get base profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle to handle 0 or 1 rows gracefully
        
        if (profileError) {
          console.error('Error fetching profile data from Supabase:', profileError);
          // Attempt local storage fallback on Supabase error
          const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          if (storedProfile) {
            console.warn("Supabase fetch failed, returning profile from localStorage.");
            return { profile: JSON.parse(storedProfile), error: null }; // Return local data, but keep the original error context?
          }
          // If Supabase fails and no local data, return error
          return { profile: null, error: profileError };
        }

        // Profile not found in Supabase for the authenticated user
        if (!profile) {
          console.warn(`Profile not found in Supabase for user ${user.id}. This might indicate a new user or missing profile record.`);
          // Fallback to local storage if it exists
          const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          if (storedProfile) {
            console.warn("Profile not found in Supabase, returning profile from localStorage.");
            return { profile: JSON.parse(storedProfile), error: null };
          }
          // If no profile in DB and no local storage, return null. Dashboard should handle this.
          return { profile: null, error: new Error(`Profile not found for user ${user.id}`) }; // Return specific error
        }

        // Profile found, fetch related data
        console.log("Profile found, fetching related data...");
        // Get travel history
        const { data: travelHistory } = await supabase
          .from('travel_history')
          .select('country_code')
          .eq('user_id', user.id);

        // Get saved countries
        const { data: savedCountries } = await supabase
          .from('saved_countries')
          .select('country_code')
          .eq('user_id', user.id);

        // Get documents
        const { data: documents } = await supabase
          .from('documents') // Assuming a 'documents' table exists for user docs
          .select('*')
          .eq('user_id', user.id);

        const fullProfile = {
          ...profile,
          // Safely map related data, defaulting to empty arrays if null/undefined
          travel_history: travelHistory?.map((th: { country_code: string }) => th.country_code) ?? [],
          saved_countries: savedCountries?.map((sc: { country_code: string }) => sc.country_code) ?? [],
          saved_documents: documents ?? []
        };

        // Update localStorage as backup with the latest fetched data
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(fullProfile));
        console.log("Profile and related data loaded successfully from Supabase.");
        return { profile: fullProfile as UserProfile, error: null };

      } catch (fetchError) {
        // Catch errors during the fetch process (after auth check)
        console.error('Error during Supabase profile fetch process:', fetchError);
        // Attempt local storage fallback on any fetch error
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (storedProfile) {
          console.warn("Supabase fetch process failed, returning profile from localStorage.");
          return { profile: JSON.parse(storedProfile), error: null };
        }
        return { profile: null, error: fetchError as Error };
      }
    } catch (initialAuthError) {
      // Catch errors during the initial authService.getCurrentUser call
      console.error('Initial authentication check failed:', initialAuthError);
      // Attempt local storage fallback
       const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (storedProfile) {
          console.warn("Initial auth failed, returning profile from localStorage.");
          return { profile: JSON.parse(storedProfile), error: null };
        }
      return { profile: null, error: initialAuthError as Error };
    }
  },
  
  /**
   * Update the current user's profile data
   * @param profileData - Profile data to update
   * @returns Promise with the updated profile or null if error
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      console.log("Attempting to update user profile with data:", profileData);
      
      const { user, error: authError } = await authService.getCurrentUser();
      
      if (authError || !user) {
        console.warn("No authenticated user found for profile update. Falling back to localStorage.");
        // Fallback to localStorage
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        // Use default profile if nothing in local storage
        const currentProfile = storedProfile ? JSON.parse(storedProfile) : createDefaultProfile(); 
        
        const updatedProfile = {
          ...currentProfile,
          ...profileData,
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
        console.log("Updated profile saved to localStorage (fallback):", updatedProfile);
        // Return the updated local profile, signal no Supabase error
        return { profile: updatedProfile, error: null }; 
      }
      
      // User authenticated, attempt Supabase update
      try {
        console.log(`Updating profile for user ID: ${user.id} in Supabase.`);
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString() // Ensure updated_at is set
          })
          .eq('id', user.id)
          .select() // Select the updated row
          .single(); // Expect a single row back
        
        if (error) {
            console.error('Supabase profile update error:', error);
            // Don't automatically fall back here, return the error to the caller
            return { profile: null, error };
        }
        
        console.log("Profile updated successfully in Supabase:", data);
        // Also update localStorage as backup with the successful update
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
        
        return { profile: data as UserProfile, error: null };

      } catch (supabaseError) {
        console.error('Unexpected error during Supabase profile update:', supabaseError);
        // Return the caught error
        return { profile: null, error: supabaseError as Error };
      }

    } catch (error) {
      // Catch errors from the initial auth check or other unexpected issues
      console.error('Unexpected error during profile update process:', error);
      return { profile: null, error: error as Error };
    }
  },
  
  /**
   * Update the travel score for the current user
   * @param score - The new travel score
   * @returns Promise with the updated profile
   */
  async updateTravelScore(score: number): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      
      if (authError || !user) {
        // Fallback to localStorage
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        const currentProfile = storedProfile ? JSON.parse(storedProfile) : createDefaultProfile();
        
        const updatedProfile = {
          ...currentProfile,
          travel_score: score,
          questionnaire_completed: true,
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
        return { success: true, error: null };
      }
      
      try {
        const response = await supabase
          .from('profiles')
          .update({
            travel_score: score,
            questionnaire_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select();
        
        // Cast the response to access error property
        const typedResponse = response as PostgrestSingleResponse<any>;
        
        if (typedResponse.error) {
          console.error("Error updating travel score:", typedResponse.error);
          throw typedResponse.error;
        }
        
        // Update localStorage
        const { profile } = await this.getCurrentUserProfile();
        if (profile) {
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
        }
        
        return { success: true, error: null };
      } catch (error) {
        console.error('Error updating travel score:', error);
        return { success: false, error: error as Error };
      }
    } catch (error) {
      console.error('Error updating travel score:', error);
      return { success: false, error: error as Error };
    }
  },
  
  /**
   * Save a country to the user's saved countries list
   * @param countryCode - The country code to save
   * @returns Promise with success status
   */
  async saveCountry(countryCode: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      
      if (authError || !user) {
        return { success: false, error: new Error('No authenticated user') };
      }
      
      try {
        const response = await supabase
          .from('saved_countries')
          .insert({ user_id: user.id, country_code: countryCode });
        
        // Cast the response to access error property
        const typedResponse = response as PostgrestSingleResponse<any>;
        
        if (typedResponse.error) {
          throw typedResponse.error;
        }
        
        return { success: true, error: null };
      } catch (error) {
        console.error('Error saving country:', error);
        return { success: false, error: error as Error };
      }
    } catch (error) {
      console.error('Error saving country:', error);
      return { success: false, error: error as Error };
    }
  },
  
  /**
   * Remove a country from the user's saved countries list
   * @param countryCode - The country code to remove
   * @returns Promise with success status
   */
  async removeCountry(countryCode: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { profile, error: profileError } = await this.getCurrentUserProfile();
      
      if (profileError || !profile) {
        return { success: false, error: profileError || new Error('Could not get user profile') };
      }
      
      // Check if country is in saved countries
      const savedCountries = profile.saved_countries || [];
      if (!savedCountries.includes(countryCode)) {
        return { success: true, error: null }; // Already not saved
      }
      
      // Remove country from saved countries
      const updatedCountries = savedCountries.filter((country: string) => country !== countryCode);
      
      try {
        const response = await supabase
          .from('profiles')
          .update({
            saved_countries: updatedCountries,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)
          .select();
        
        // Cast the response to access error property
        const typedResponse = response as PostgrestSingleResponse<any>;
        
        if (typedResponse.error) {
          console.error('Error removing country:', typedResponse.error);
          return { success: false, error: typedResponse.error };
        }
        
        return { success: true, error: null };
      } catch (error) {
        console.error('Error removing country:', error);
        return { success: false, error: error as Error };
      }
    } catch (error) {
      console.error('Unexpected error removing country:', error);
      return { success: false, error: error as Error };
    }
  },
  
  /**
   * Add a country to the user's travel history
   * @param countryCode - The country code to add
   * @returns Promise with success status
   */
  async addToTravelHistory(countryCode: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      
      if (authError || !user) {
        return { success: false, error: new Error('No authenticated user') };
      }
      
      try {
        const response = await supabase
          .from('travel_history')
          .insert({ 
            user_id: user.id, 
            country_code: countryCode,
            visit_date: new Date().toISOString()
          });
        
        // Cast the response to access error property
        const typedResponse = response as PostgrestSingleResponse<any>;
        
        if (typedResponse.error) {
          throw typedResponse.error;
        }
        
        return { success: true, error: null };
      } catch (error) {
        console.error('Error adding to travel history:', error);
        return { success: false, error: error as Error };
      }
    } catch (error) {
      console.error('Error adding to travel history:', error);
      return { success: false, error: error as Error };
    }
  }
};

export default userProfileService; 