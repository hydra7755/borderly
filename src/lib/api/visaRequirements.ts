import { supabase } from '../supabase/client';
import { ALL_COUNTRIES } from '../../utils/countries';

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
 * Get full country name from country code
 */
export const getCountryNameFromCode = (countryCode: string): string => {
  const country = ALL_COUNTRIES.find(c => c.code.toLowerCase() === countryCode.toLowerCase());
  return country ? country.name : countryCode;
};

/**
 * Get country code from full country name
 */
export const getCountryCodeFromName = (countryName: string): string | null => {
  const country = ALL_COUNTRIES.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  return country ? country.code : null;
};

/**
 * Fetch visa requirement for a specific nationality and destination
 * @param nationality Country code or name of the traveler's nationality
 * @param destination Country code or name of the destination
 */
export const getVisaRequirement = async (
  nationality: string,
  destination: string
): Promise<VisaRequirement | null> => {
  try {
    // Convert country names to codes if needed for database lookup
    const nationalityCode = nationality.length === 2 ? nationality : getCountryCodeFromName(nationality);
    const destinationCode = destination.length === 2 ? destination : getCountryCodeFromName(destination);
    
    if (!nationalityCode || !destinationCode) {
      console.error('Invalid country name provided');
      return getDefaultVisaRequirement(nationality, destination);
    }

    try {
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .eq('nationality', nationalityCode.toLowerCase())
        .eq('destination', destinationCode.toLowerCase())
        .maybeSingle();
        
      if (!error && data) {
        return {
          ...data,
          nationality: getCountryNameFromCode(data.nationality),
          destination: getCountryNameFromCode(data.destination)
        } as VisaRequirement;
      }
    } catch (dbError) {
      console.error('Database error fetching visa requirement:', dbError);
      // Continue to fallback
    }

    // If we get here, either there was an error or no data was found
    // Use the fallback

    return getDefaultVisaRequirement(nationality, destination);
  } catch (error) {
    console.error('Unexpected error fetching visa requirement:', error);
    // If any error occurs, use the fallback
    return getDefaultVisaRequirement(nationality, destination);
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

    // Convert country codes to full names in the response
    return data.map((d: { id?: number; nationality: string; destination: string; requirement: string; stay_duration?: number; notes?: string; created_at?: string }) => ({
      ...d,
      nationality: getCountryNameFromCode(d.nationality),
      destination: getCountryNameFromCode(d.destination)
    })) as VisaRequirement[];
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
    const nationalityCode = nationality.length === 2 ? nationality : getCountryCodeFromName(nationality);
    if (!nationalityCode) {
      console.error('Invalid country name provided');
      return [];
    }

    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('nationality', nationalityCode);

    if (error) {
      console.error(`Error fetching visa requirements for nationality ${nationality}:`, error);
      return [];
    }

    // Convert country codes to full names in the response
    return data.map((d: { id?: number; nationality: string; destination: string; requirement: string; stay_duration?: number; notes?: string; created_at?: string }) => ({
      ...d,
      nationality: getCountryNameFromCode(d.nationality),
      destination: getCountryNameFromCode(d.destination)
    })) as VisaRequirement[];
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
    const destinationCode = destination.length === 2 ? destination : getCountryCodeFromName(destination);
    if (!destinationCode) {
      console.error('Invalid country name provided');
      return [];
    }

    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('destination', destinationCode);

    if (error) {
      console.error(`Error fetching visa requirements for destination ${destination}:`, error);
      return [];
    }

    // Convert country codes to full names in the response
    return data.map((d: { id?: number; nationality: string; destination: string; requirement: string; stay_duration?: number; notes?: string; created_at?: string }) => ({
      ...d,
      nationality: getCountryNameFromCode(d.nationality),
      destination: getCountryNameFromCode(d.destination)
    })) as VisaRequirement[];
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
  // Convert to country codes for internal processing if full names were provided
  const nationalityCode = nationality.length === 2 ? nationality : getCountryCodeFromName(nationality) || nationality;
  const destinationCode = destination.length === 2 ? destination : getCountryCodeFromName(destination) || destination;
  
  // Get full country names for the response
  const nationalityName = getCountryNameFromCode(nationalityCode);
  const destinationName = getCountryNameFromCode(destinationCode);

  // Don't require visa for your own country
  if (nationalityCode === destinationCode) {
    return {
      nationality: nationalityName,
      destination: destinationName,
      requirement: 'not-applicable',
      stay_duration: 365,
      notes: 'No visa required for citizens visiting their own country'
    };
  }

  // Default visa requirements based on common patterns
  // This is a simplified example - in a real app, you would have more sophisticated rules
  const visaFreeCountries = ['us', 'ca', 'gb', 'au', 'nz', 'jp', 'sg', 'kr'];
  const eVisaCountries = ['in', 'tr', 'eg', 'vn', 'kh', 'mm'];
  const visaOnArrivalCountries = ['th', 'np', 'id', 'la'];
  const etaCountries = ['au', 'nz', 'ca', 'us'];

  if (visaFreeCountries.includes(destinationCode)) {
    return {
      nationality: nationalityName,
      destination: destinationName,
      requirement: 'visa-free',
      stay_duration: 90,
      notes: 'Visa-free access for tourism and business'
    };
  } else if (eVisaCountries.includes(destinationCode)) {
    return {
      nationality: nationalityName,
      destination: destinationName,
      requirement: 'evisa',
      stay_duration: 30,
      notes: 'eVisa required, apply online before travel'
    };
  } else if (visaOnArrivalCountries.includes(destinationCode)) {
    return {
      nationality: nationalityName,
      destination: destinationName,
      requirement: 'visa-on-arrival',
      stay_duration: 30,
      notes: 'Visa can be obtained upon arrival'
    };
  } else if (etaCountries.includes(destinationCode)) {
    return {
      nationality: nationalityName,
      destination: destinationName,
      requirement: 'eta',
      stay_duration: 90,
      notes: 'Electronic Travel Authorization required'
    };
  } else {
    return {
      nationality: nationalityName,
      destination: destinationName,
      requirement: 'visa-required',
      stay_duration: 30,
      notes: 'Traditional visa required, apply at embassy/consulate'
    };
  }
};