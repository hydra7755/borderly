import { supabase } from '../supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
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
   * @returns Promise with the user profile data
   */
  async getCurrentUserProfile(): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      
      if (authError || !user) {
        console.log("Auth error or no user, falling back to localStorage");
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (storedProfile) {
          return { profile: JSON.parse(storedProfile), error: null };
        }
        const defaultProfile = createDefaultProfile();
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(defaultProfile));
        return { profile: defaultProfile, error: null };
      }
      
      try {
        // Get base profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }

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
          .from('documents')
          .select('*')
          .eq('user_id', user.id);

        const fullProfile = {
          ...profile,
          travel_history: travelHistory?.map((th: { country_code: string }) => th.country_code) || [],
          saved_countries: savedCountries?.map((sc: { country_code: string }) => sc.country_code) || [],
          saved_documents: documents || []
        };

        // Update localStorage as backup
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(fullProfile));
        
        return { profile: fullProfile as UserProfile, error: null };
      } catch (error) {
        console.error('Error fetching profile:', error);
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        if (storedProfile) {
          return { profile: JSON.parse(storedProfile), error: null };
        }
        return { profile: null, error: error as Error };
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      return { profile: null, error: error as Error };
    }
  },
  
  /**
   * Update the current user's profile data
   * @param profileData - Profile data to update
   * @returns Promise with the updated profile
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      console.log("Updating user profile with data:", profileData);
      
      try {
        const { user, error: authError } = await authService.getCurrentUser();
        
        if (authError || !user) {
          console.log("No authenticated user, using localStorage fallback");
          // Fallback to localStorage
          const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          const currentProfile = storedProfile ? JSON.parse(storedProfile) : createDefaultProfile();
          
          const updatedProfile = {
            ...currentProfile,
            ...profileData,
            updated_at: new Date().toISOString()
          };
          
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
          console.log("Updated profile saved to localStorage:", updatedProfile);
          return { profile: updatedProfile, error: null };
        }
        
        // Try Supabase first
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update({
              ...profileData,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();
          
          if (error) {
            throw error;
          }
          
          // Also update localStorage as backup
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
          
          return { profile: data as UserProfile, error: null };
        } catch (supabaseError) {
          console.error('Supabase error, falling back to localStorage:', supabaseError);
          
          // Get current profile from localStorage
          const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
          const currentProfile = storedProfile ? JSON.parse(storedProfile) : createDefaultProfile();
          
          // Update with new data
          const updatedProfile = {
            ...currentProfile,
            ...profileData,
            updated_at: new Date().toISOString()
          };
          
          // Save to localStorage
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
          console.log("Profile saved to localStorage:", updatedProfile);
          
          return { profile: updatedProfile, error: null };
        }
      } catch (authError) {
        console.error('Auth error, using localStorage fallback:', authError);
        
        // Fallback to localStorage
        const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
        const currentProfile = storedProfile ? JSON.parse(storedProfile) : createDefaultProfile();
        
        const updatedProfile = {
          ...currentProfile,
          ...profileData,
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
        console.log("Profile saved to localStorage:", updatedProfile);
        
        return { profile: updatedProfile, error: null };
      }
    } catch (error) {
      console.error('Unexpected error updating user profile:', error);
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
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          travel_score: score,
          questionnaire_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error("Error updating travel score:", updateError);
        throw updateError;
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
      
      const { error: insertError } = await supabase
        .from('saved_countries')
        .insert({ user_id: user.id, country_code: countryCode })
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      return { success: true, error: null };
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
      
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          saved_countries: updatedCountries,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select();
      
      if (updateError) {
        console.error('Error removing country:', updateError);
        return { success: false, error: updateError };
      }
      
      return { success: true, error: null };
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
      
      const { error: insertError } = await supabase
        .from('travel_history')
        .insert({ 
          user_id: user.id, 
          country_code: countryCode,
          visit_date: new Date().toISOString()
        })
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error adding to travel history:', error);
      return { success: false, error: error as Error };
    }
  }
};

export default userProfileService; 