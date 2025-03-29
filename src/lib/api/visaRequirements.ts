import { supabase } from '../supabase/client';

/**
 * Interface for visa requirement data
 */
export interface VisaRequirement {
  id?: number;
  nationality: string;
  destination: string;
  requirement: 'visa-free' | 'visa-on-arrival' | 'evisa' | 'eta' | 'visa-required' | 'not-applicable';
  stay_duration?: number; // Maximum stay in days
  notes?: string;
  created_at?: string;
}

/**
 * Fetch visa requirement for a specific nationality and destination
 */
export const getVisaRequirement = async (
  nationality: string,
  destination: string
): Promise<VisaRequirement | null> => {
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('nationality', nationality)
      .eq('destination', destination)
      .single();

    if (error) {
      console.error('Error fetching visa requirement:', error);
      return null;
    }

    return data as VisaRequirement;
  } catch (error) {
    console.error('Unexpected error fetching visa requirement:', error);
    return null;
  }
};

/**
 * Fetch all visa requirements (paginated)
 */
export const getAllVisaRequirements = async (
  page: number = 1,
  limit: number = 100
): Promise<VisaRequirement[]> => {
  const startIndex = (page - 1) * limit;
  
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .range(startIndex, startIndex + limit - 1);

    if (error) {
      console.error('Error fetching all visa requirements:', error);
      return [];
    }

    return data as VisaRequirement[];
  } catch (error) {
    console.error('Unexpected error fetching all visa requirements:', error);
    return [];
  }
};

/**
 * Get all visa requirements for a specific nationality (where the nationality is the passport holder)
 */
export const getVisaRequirementsForNationality = async (
  nationality: string
): Promise<VisaRequirement[]> => {
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('nationality', nationality);

    if (error) {
      console.error(`Error fetching visa requirements for nationality ${nationality}:`, error);
      return [];
    }

    return data as VisaRequirement[];
  } catch (error) {
    console.error(`Unexpected error fetching visa requirements for nationality ${nationality}:`, error);
    return [];
  }
};

/**
 * Get all visa requirements for a specific destination (where the destination is the country being visited)
 */
export const getVisaRequirementsForDestination = async (
  destination: string
): Promise<VisaRequirement[]> => {
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('destination', destination);

    if (error) {
      console.error(`Error fetching visa requirements for destination ${destination}:`, error);
      return [];
    }

    return data as VisaRequirement[];
  } catch (error) {
    console.error(`Unexpected error fetching visa requirements for destination ${destination}:`, error);
    return [];
  }
};

/**
 * Fallback function to provide a default requirement when data is not found in the database
 */
export const getDefaultVisaRequirement = (
  nationality: string,
  destination: string
): VisaRequirement => {
  // Don't require a visa for travel within the same country
  if (nationality === destination) {
    return {
      nationality,
      destination,
      requirement: 'not-applicable',
      notes: 'You do not need a visa to travel within your own country.'
    };
  }
  
  // Default to visa-required as the most restrictive option
  return {
    nationality,
    destination,
    requirement: 'visa-required',
    notes: 'By default, a visa is required when no specific rule is defined.'
  };
}; 