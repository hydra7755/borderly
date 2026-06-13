import { supabase } from '../supabase/client';
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import authService from './auth';
import { User } from '../../types/user';

const LOCAL_STORAGE_PROFILE_KEY = 'travelscore_user_profile';

async function syncProfileWithAuthUser(profile: UserProfile, user: User): Promise<UserProfile> {
  const metaNationality = user.nationality || user.user_metadata?.nationality || '';
  const metaResidency = user.residency || user.user_metadata?.residency || '';
  const metaName = user.full_name || user.user_metadata?.full_name || '';

  const updates: Partial<UserProfile> = {};

  if (!profile.nationality && metaNationality) {
    updates.nationality = metaNationality;
  }
  if (!profile.residency && metaResidency) {
    updates.residency = metaResidency;
  }
  if ((!profile.full_name || profile.full_name === 'New User') && metaName) {
    updates.full_name = metaName;
  }

  if (Object.keys(updates).length === 0) {
    return profile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)
    .select()
    .single();

  if (!error && data) {
    return { ...profile, ...data } as UserProfile;
  }

  return { ...profile, ...updates };
}

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
  visa_free_countries?: number;
  travel_history_count?: number;
  app_metadata?: any;
  user_metadata?: any;
  aud?: string;
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

const getStoredProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStoredProfile = (profile: UserProfile) => {
  localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
};

const syncStoredUser = (profile: Partial<UserProfile>) => {
  try {
    const raw = localStorage.getItem('travelscore_user');
    if (!raw) return;
    const user = JSON.parse(raw);
    localStorage.setItem('travelscore_user', JSON.stringify({
      ...user,
      full_name: profile.full_name ?? user.full_name,
      nationality: profile.nationality ?? user.nationality,
      residency: profile.residency ?? user.residency,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: profile.full_name ?? user.user_metadata?.full_name,
        nationality: profile.nationality ?? user.user_metadata?.nationality,
        residency: profile.residency ?? user.user_metadata?.residency,
      },
    }));
  } catch {
    // ignore storage errors
  }
};

const pickText = (...values: (string | undefined | null)[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const mergeProfileData = (
  user: User,
  supabaseProfile: Partial<UserProfile> | null,
  storedProfile: UserProfile | null
): UserProfile => ({
  id: user.id,
  email: pickText(supabaseProfile?.email, storedProfile?.email, user.email),
  full_name: pickText(
    supabaseProfile?.full_name,
    storedProfile?.full_name,
    user.full_name,
    user.user_metadata?.full_name,
    'User'
  ),
  nationality: pickText(
    supabaseProfile?.nationality,
    storedProfile?.nationality,
    user.nationality,
    user.user_metadata?.nationality
  ),
  residency: pickText(
    supabaseProfile?.residency,
    storedProfile?.residency,
    user.residency,
    user.user_metadata?.residency
  ),
  travel_score: supabaseProfile?.travel_score ?? storedProfile?.travel_score ?? 0,
  subscription_tier: (supabaseProfile?.subscription_tier ??
    storedProfile?.subscription_tier ??
    user.subscription_tier ??
    'free') as UserProfile['subscription_tier'],
  questionnaire_completed:
    supabaseProfile?.questionnaire_completed ??
    storedProfile?.questionnaire_completed ??
    false,
  phone_number: pickText(supabaseProfile?.phone_number, storedProfile?.phone_number),
  passport_number: pickText(supabaseProfile?.passport_number, storedProfile?.passport_number),
  passport_expiry: pickText(supabaseProfile?.passport_expiry, storedProfile?.passport_expiry),
  travel_history: storedProfile?.travel_history ?? [],
  saved_countries: storedProfile?.saved_countries ?? [],
  saved_documents: storedProfile?.saved_documents ?? [],
  created_at: supabaseProfile?.created_at ?? storedProfile?.created_at ?? user.created_at,
  updated_at: supabaseProfile?.updated_at ?? storedProfile?.updated_at ?? new Date().toISOString(),
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
      const storedProfile = getStoredProfile();
      const { user, error: authError } = await authService.getCurrentUser();

      if (!user) {
        if (storedProfile) {
          return { profile: storedProfile, error: null };
        }
        return { profile: null, error: authError || new Error('No authenticated user') };
      }

      let supabaseProfile: Partial<UserProfile> | null = null;

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('Error fetching profile from Supabase:', profileError);
        } else if (profile) {
          supabaseProfile = profile as UserProfile;
        } else {
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.full_name || user.user_metadata?.full_name || 'User',
              nationality: user.nationality || user.user_metadata?.nationality || null,
              residency: user.residency || user.user_metadata?.residency || null,
            }, { onConflict: 'id' })
            .select()
            .single();

          if (!createError && createdProfile) {
            supabaseProfile = createdProfile as UserProfile;
          }
        }
      } catch (fetchError) {
        console.warn('Supabase profile fetch failed, using stored profile:', fetchError);
      }

      const mergedProfile = mergeProfileData(user, supabaseProfile, storedProfile);
      const syncedProfile = await syncProfileWithAuthUser(mergedProfile, user);

      let travelHistory: string[] = syncedProfile.travel_history ?? [];
      let savedCountries: string[] = syncedProfile.saved_countries ?? [];
      let savedDocuments = syncedProfile.saved_documents ?? [];

      try {
        const { data: travelHistoryRows } = await supabase
          .from('travel_history')
          .select('country_code')
          .eq('user_id', user.id);

        const { data: savedCountryRows } = await supabase
          .from('saved_countries')
          .select('country_code')
          .eq('user_id', user.id);

        const { data: documents } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id);

        if (travelHistoryRows?.length) {
          travelHistory = travelHistoryRows.map((row: { country_code: string }) => row.country_code);
        }
        if (savedCountryRows?.length) {
          savedCountries = savedCountryRows.map((row: { country_code: string }) => row.country_code);
        }
        if (documents?.length) {
          savedDocuments = documents;
        }
      } catch (relatedError) {
        console.warn('Could not load related profile data:', relatedError);
      }

      const fullProfile: UserProfile = {
        ...syncedProfile,
        nationality: syncedProfile.nationality ?? '',
        residency: syncedProfile.residency ?? '',
        travel_history: travelHistory,
        saved_countries: savedCountries,
        saved_documents: savedDocuments,
      };

      saveStoredProfile(fullProfile);
      syncStoredUser(fullProfile);

      return { profile: fullProfile, error: null };
    } catch (error) {
      const storedProfile = getStoredProfile();
      if (storedProfile) {
        return { profile: storedProfile, error: null };
      }
      return { profile: null, error: error as Error };
    }
  },
  
  /**
   * Update the current user's profile data
   * @param profileData - Profile data to update
   * @returns Promise with the updated profile or null if error
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const storedProfile = getStoredProfile();
      const { user } = await authService.getCurrentUser();
      const userId = user?.id || storedProfile?.id;

      if (!userId) {
        const updatedProfile = {
          ...createDefaultProfile(),
          ...profileData,
          updated_at: new Date().toISOString(),
        };
        saveStoredProfile(updatedProfile);
        return { profile: updatedProfile, error: null };
      }

      const currentProfile = storedProfile ?? (user
        ? mergeProfileData(user, null, null)
        : createDefaultProfile());

      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...profileData,
        id: userId,
        email: user?.email || currentProfile.email,
        updated_at: new Date().toISOString(),
      };

      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: updatedProfile.email,
            full_name: updatedProfile.full_name,
            nationality: updatedProfile.nationality || null,
            residency: updatedProfile.residency || null,
            phone_number: updatedProfile.phone_number || null,
            passport_number: updatedProfile.passport_number || null,
            passport_expiry: updatedProfile.passport_expiry || null,
            updated_at: updatedProfile.updated_at,
          }, { onConflict: 'id' })
          .select()
          .single();

        if (!error && data) {
          updatedProfile.nationality = data.nationality ?? updatedProfile.nationality ?? '';
          updatedProfile.residency = data.residency ?? updatedProfile.residency ?? '';
          updatedProfile.full_name = data.full_name ?? updatedProfile.full_name;
        } else if (error) {
          console.warn('Supabase profile upsert failed, saving locally:', error);
        }
      } catch (supabaseError) {
        console.warn('Supabase profile upsert threw, saving locally:', supabaseError);
      }

      if (user) {
        const authMetadata: Record<string, string> = {};
        if (profileData.full_name) authMetadata.full_name = profileData.full_name;
        if (profileData.nationality !== undefined) authMetadata.nationality = profileData.nationality || '';
        if (profileData.residency !== undefined) authMetadata.residency = profileData.residency || '';

        if (Object.keys(authMetadata).length > 0) {
          try {
            await supabase.auth.updateUser({ data: authMetadata });
          } catch (authUpdateError) {
            console.warn('Could not sync auth metadata:', authUpdateError);
          }
        }
      }

      saveStoredProfile(updatedProfile);
      syncStoredUser(updatedProfile);

      return { profile: updatedProfile, error: null };
    } catch (error) {
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