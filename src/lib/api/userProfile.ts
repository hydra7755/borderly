import { supabase } from '../supabase/client';
import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import authService from './auth';
import { User } from '../../types/user';
import { stripeService } from './stripeService';

const LOCAL_STORAGE_PROFILE_KEY = 'travelscore_user_profile';
const PAID_SUBSCRIPTION_KEY = 'borderly_paid_subscription';

type SubscriptionTier = UserProfile['subscription_tier'];

export interface SubscriptionDetails {
  billingCycle?: 'monthly' | 'annual' | 'lifetime' | null;
  periodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
  isLifetime?: boolean;
  customerId?: string | null;
  subscriptionId?: string | null;
}

interface PaidSubscriptionRecord {
  tier: SubscriptionTier;
  verifiedAt?: string;
  sessionId?: string;
  billingCycle?: SubscriptionDetails['billingCycle'];
  periodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
  isLifetime?: boolean;
  customerId?: string | null;
  subscriptionId?: string | null;
}

const SUBSCRIPTION_TIER_RANK: Record<string, number> = {
  free: 0,
  premium: 1,
  monthly: 1,
  lifetime: 1,
  enterprise: 2,
  business: 2,
};

export function normalizeSubscriptionTier(tier?: string | null): SubscriptionTier {
  const value = (tier || 'free').toLowerCase();
  if (value === 'enterprise' || value === 'business') return 'enterprise';
  if (value === 'premium' || value === 'monthly' || value === 'lifetime') return 'premium';
  return 'free';
}

function pickBestSubscriptionTier(...tiers: (string | undefined | null)[]): SubscriptionTier {
  let best: SubscriptionTier = 'free';
  for (const tier of tiers) {
    const normalized = normalizeSubscriptionTier(tier);
    if ((SUBSCRIPTION_TIER_RANK[normalized] ?? 0) > (SUBSCRIPTION_TIER_RANK[best] ?? 0)) {
      best = normalized;
    }
  }
  return best;
}

const getPaidSubscriptionRecord = (): PaidSubscriptionRecord | null => {
  try {
    const raw = localStorage.getItem(PAID_SUBSCRIPTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PaidSubscriptionRecord & { tier?: string };
    if (!parsed.tier) return null;
    return {
      ...parsed,
      tier: normalizeSubscriptionTier(parsed.tier),
    };
  } catch {
    return null;
  }
};

export const getStoredSubscriptionDetails = (): SubscriptionDetails | null => {
  const record = getPaidSubscriptionRecord();
  if (!record) return null;
  return {
    billingCycle: record.billingCycle ?? null,
    periodEnd: record.periodEnd ?? null,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd ?? false,
    isLifetime: record.isLifetime ?? false,
    customerId: record.customerId ?? null,
    subscriptionId: record.subscriptionId ?? null,
  };
};

export const savePaidSubscriptionRecord = (
  tier: string,
  sessionId?: string,
  details?: SubscriptionDetails
) => {
  const normalized = normalizeSubscriptionTier(tier);
  const existing = getPaidSubscriptionRecord();
  localStorage.setItem(
    PAID_SUBSCRIPTION_KEY,
    JSON.stringify({
      ...existing,
      tier: normalized,
      sessionId: sessionId ?? existing?.sessionId,
      verifiedAt: new Date().toISOString(),
      billingCycle: details?.billingCycle ?? existing?.billingCycle,
      periodEnd: details?.periodEnd ?? existing?.periodEnd,
      cancelAtPeriodEnd: details?.cancelAtPeriodEnd ?? existing?.cancelAtPeriodEnd,
      isLifetime: details?.isLifetime ?? existing?.isLifetime,
      customerId: details?.customerId ?? existing?.customerId,
      subscriptionId: details?.subscriptionId ?? existing?.subscriptionId,
    } satisfies PaidSubscriptionRecord)
  );
};

const emitSubscriptionUpdated = (tier: SubscriptionTier) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('borderly:subscription-updated', { detail: { tier } })
    );
  }
};

async function persistSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
  email?: string,
  details?: SubscriptionDetails
): Promise<SubscriptionTier> {
  const normalized = normalizeSubscriptionTier(tier);
  savePaidSubscriptionRecord(normalized, undefined, details);

  const authMetadata: Record<string, string | boolean> = {
    subscription_tier: normalized,
  };
  if (details?.billingCycle) authMetadata.subscription_billing_cycle = details.billingCycle;
  if (details?.periodEnd) authMetadata.subscription_period_end = String(details.periodEnd);
  if (details?.cancelAtPeriodEnd !== undefined) {
    authMetadata.subscription_cancel_at_period_end = details.cancelAtPeriodEnd;
  }
  if (details?.isLifetime !== undefined) authMetadata.subscription_is_lifetime = details.isLifetime;
  if (details?.customerId) authMetadata.stripe_customer_id = details.customerId;
  if (details?.subscriptionId) authMetadata.stripe_subscription_id = details.subscriptionId;

  try {
    await supabase
      .from('profiles')
      .update({
        subscription_tier: normalized,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (error) {
    console.warn('Could not persist subscription tier to profiles:', error);
  }

  try {
    await supabase.auth.updateUser({ data: authMetadata });
  } catch (error) {
    console.warn('Could not persist subscription tier to auth metadata:', error);
  }

  const stored = getStoredProfile();
  const nextProfile: UserProfile = {
    ...(stored ?? createDefaultProfile()),
    id: userId,
    email: email || stored?.email || '',
    subscription_tier: normalized,
    updated_at: new Date().toISOString(),
  };
  saveStoredProfile(nextProfile);
  syncStoredUser(nextProfile);
  emitSubscriptionUpdated(normalized);
  return normalized;
}

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
  subscription_billing_cycle?: 'monthly' | 'annual' | 'lifetime' | null;
  subscription_period_end?: number | null;
  subscription_cancel_at_period_end?: boolean;
  subscription_is_lifetime?: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
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
      subscription_tier: profile.subscription_tier ?? user.subscription_tier,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: profile.full_name ?? user.user_metadata?.full_name,
        nationality: profile.nationality ?? user.user_metadata?.nationality,
        residency: profile.residency ?? user.user_metadata?.residency,
        subscription_tier: profile.subscription_tier ?? user.user_metadata?.subscription_tier,
      },
    }));
  } catch {
    // ignore storage errors
  }
};

const parseSubscriptionDetailsFromUser = (user: User): SubscriptionDetails => {
  const meta = user.user_metadata || {};
  const periodEndRaw = meta.subscription_period_end;
  const periodEnd =
    typeof periodEndRaw === 'number'
      ? periodEndRaw
      : typeof periodEndRaw === 'string' && periodEndRaw
        ? Number(periodEndRaw)
        : null;

  return {
    billingCycle: (meta.subscription_billing_cycle as SubscriptionDetails['billingCycle']) ?? null,
    periodEnd: Number.isFinite(periodEnd) ? periodEnd : null,
    cancelAtPeriodEnd: Boolean(meta.subscription_cancel_at_period_end),
    isLifetime: Boolean(meta.subscription_is_lifetime),
    customerId: (meta.stripe_customer_id as string) ?? null,
    subscriptionId: (meta.stripe_subscription_id as string) ?? null,
  };
};

const mergeSubscriptionDetails = (
  user: User,
  storedRecord: PaidSubscriptionRecord | null
): SubscriptionDetails => {
  const fromUser = parseSubscriptionDetailsFromUser(user);
  const fromRecord = storedRecord
    ? {
        billingCycle: storedRecord.billingCycle ?? null,
        periodEnd: storedRecord.periodEnd ?? null,
        cancelAtPeriodEnd: storedRecord.cancelAtPeriodEnd ?? false,
        isLifetime: storedRecord.isLifetime ?? false,
        customerId: storedRecord.customerId ?? null,
        subscriptionId: storedRecord.subscriptionId ?? null,
      }
    : null;

  return {
    billingCycle: fromRecord?.billingCycle ?? fromUser.billingCycle ?? null,
    periodEnd: fromRecord?.periodEnd ?? fromUser.periodEnd ?? null,
    cancelAtPeriodEnd: fromRecord?.cancelAtPeriodEnd ?? fromUser.cancelAtPeriodEnd ?? false,
    isLifetime: fromRecord?.isLifetime ?? fromUser.isLifetime ?? false,
    customerId: fromRecord?.customerId ?? fromUser.customerId ?? null,
    subscriptionId: fromRecord?.subscriptionId ?? fromUser.subscriptionId ?? null,
  };
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
  subscription_tier: pickBestSubscriptionTier(
    supabaseProfile?.subscription_tier,
    storedProfile?.subscription_tier,
    user.subscription_tier,
    user.user_metadata?.subscription_tier,
    getPaidSubscriptionRecord()?.tier
  ),
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
  ...(() => {
    const details = mergeSubscriptionDetails(user, getPaidSubscriptionRecord());
    return {
      subscription_billing_cycle: details.billingCycle,
      subscription_period_end: details.periodEnd,
      subscription_cancel_at_period_end: details.cancelAtPeriodEnd,
      subscription_is_lifetime: details.isLifetime,
      stripe_customer_id: details.customerId,
      stripe_subscription_id: details.subscriptionId,
    };
  })(),
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

      // Self-heal: persist paid tier to Supabase when DB still shows free
      if (
        user.id &&
        supabaseProfile &&
        normalizeSubscriptionTier(syncedProfile.subscription_tier) !== 'free' &&
        normalizeSubscriptionTier(supabaseProfile.subscription_tier) === 'free'
      ) {
        try {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: syncedProfile.subscription_tier,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        } catch (tierSyncError) {
          console.warn('Could not sync subscription tier to Supabase:', tierSyncError);
        }
      }

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

      if (user.email) {
        const syncedTier = await userProfileService.syncSubscriptionFromStripe(
          user.email,
          user.id
        );
        if (syncedTier) {
          fullProfile.subscription_tier = syncedTier;
          const details = mergeSubscriptionDetails(user, getPaidSubscriptionRecord());
          Object.assign(fullProfile, {
            subscription_billing_cycle: details.billingCycle,
            subscription_period_end: details.periodEnd,
            subscription_cancel_at_period_end: details.cancelAtPeriodEnd,
            subscription_is_lifetime: details.isLifetime,
            stripe_customer_id: details.customerId,
            stripe_subscription_id: details.subscriptionId,
          });
        }
      }

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
            subscription_tier: pickBestSubscriptionTier(
              profileData.subscription_tier,
              updatedProfile.subscription_tier,
              getPaidSubscriptionRecord()?.tier
            ),
            travel_score: updatedProfile.travel_score ?? null,
            questionnaire_completed: updatedProfile.questionnaire_completed ?? null,
            updated_at: updatedProfile.updated_at,
          }, { onConflict: 'id' })
          .select()
          .single();

        if (!error && data) {
          updatedProfile.nationality = data.nationality ?? updatedProfile.nationality ?? '';
          updatedProfile.residency = data.residency ?? updatedProfile.residency ?? '';
          updatedProfile.full_name = data.full_name ?? updatedProfile.full_name;
          updatedProfile.subscription_tier = normalizeSubscriptionTier(
            data.subscription_tier ?? updatedProfile.subscription_tier
          );
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
        if (profileData.subscription_tier) {
          authMetadata.subscription_tier = normalizeSubscriptionTier(profileData.subscription_tier);
        }

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

      if (profileData.subscription_tier) {
        savePaidSubscriptionRecord(profileData.subscription_tier);
      }

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
  },

  /**
   * Verify active Stripe subscription for an email and persist the tier locally + in Supabase.
   */
  async syncSubscriptionFromStripe(
    email: string,
    userId: string
  ): Promise<SubscriptionTier | null> {
    if (!email?.trim() || !userId) return null;

    try {
      const result = await stripeService.syncSubscriptionByEmail(email.trim());
      if (!result.active || !result.tier) return null;

      const tier = normalizeSubscriptionTier(result.tier);
      if (tier === 'free') return null;

      const details: SubscriptionDetails = {
        billingCycle: (result.billingCycle as SubscriptionDetails['billingCycle']) ?? null,
        periodEnd: result.periodEnd ?? null,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd ?? false,
        isLifetime: result.isLifetime ?? false,
        customerId: result.customerId ?? null,
        subscriptionId: result.subscriptionId ?? null,
      };

      return await persistSubscriptionTier(userId, tier, email.trim(), details);
    } catch (error) {
      console.warn('Stripe subscription sync failed:', error);
      return null;
    }
  },

  async refreshSubscriptionDetails(
    email: string,
    userId: string
  ): Promise<SubscriptionDetails | null> {
    await this.syncSubscriptionFromStripe(email, userId);
    const { user } = await authService.getCurrentUser();
    if (user) {
      return mergeSubscriptionDetails(user, getPaidSubscriptionRecord());
    }
    return getStoredSubscriptionDetails();
  },

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const { user, error: authError } = await authService.getCurrentUser();
    if (authError || !user?.email) {
      throw new Error('You must be logged in to cancel your subscription');
    }

    const result = await stripeService.cancelSubscription(user.email);
    const details: SubscriptionDetails = {
      ...mergeSubscriptionDetails(user, getPaidSubscriptionRecord()),
      cancelAtPeriodEnd: true,
      periodEnd: result.periodEnd ?? null,
    };
    savePaidSubscriptionRecord(
      normalizeSubscriptionTier(user.user_metadata?.subscription_tier || 'premium'),
      undefined,
      details
    );

    try {
      await supabase.auth.updateUser({
        data: {
          subscription_cancel_at_period_end: true,
          ...(result.periodEnd ? { subscription_period_end: String(result.periodEnd) } : {}),
        },
      });
    } catch (error) {
      console.warn('Could not update cancel status in auth metadata:', error);
    }

    return { success: true, message: result.message };
  },

  async openBillingPortal(returnUrl?: string): Promise<string> {
    const { user, error: authError } = await authService.getCurrentUser();
    if (authError || !user?.email) {
      throw new Error('You must be logged in to manage billing');
    }
    const result = await stripeService.createBillingPortalSession(
      user.email,
      returnUrl || `${window.location.origin}/dashboard`
    );
    return result.url;
  },

  /**
   * Re-activate premium/enterprise after a successful Stripe checkout (e.g. if tier was not saved).
   */
  async restoreSubscriptionFromSession(
    sessionId: string
  ): Promise<{ success: boolean; tier?: SubscriptionTier; error: Error | null }> {
    try {
      const trimmed = sessionId.trim();
      if (!trimmed) {
        return { success: false, error: new Error('Please enter your Stripe checkout session ID') };
      }

      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user?.email) {
        return { success: false, error: new Error('You must be logged in to restore a subscription') };
      }

      const result = await stripeService.verifyCheckoutSession(trimmed);
      if (!result.paid) {
        return { success: false, error: new Error('Payment not confirmed for this session') };
      }

      const tier = normalizeSubscriptionTier(result.subscriptionType || 'premium');
      if (
        result.customerEmail &&
        result.customerEmail.toLowerCase() !== user.email.toLowerCase()
      ) {
        return {
          success: false,
          error: new Error('This payment was made with a different email address'),
        };
      }

      savePaidSubscriptionRecord(tier, trimmed);
      const appliedTier = await persistSubscriptionTier(user.id, tier, user.email);
      return { success: true, tier: appliedTier, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },
};

export default userProfileService; 