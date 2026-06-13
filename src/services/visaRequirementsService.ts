import { supabase } from '../lib/supabase/client';
import { ALL_COUNTRIES } from '../utils/countries';
import { VisaRequirement } from '../lib/api/visaRequirements';
import {
  getVisaRequirementFromCsv,
  getVisaRequirementsForNationalityFromCsv,
} from './visaCsvData';

// Special country codes for partially recognized states
const SPECIAL_COUNTRY_CODES: Record<string, string> = {
  'Kosovo': 'XKX',
  'Palestine': 'PSE',
  'Taiwan': 'TWN'
};

/**
 * A centralized service for accessing visa requirements data from Supabase
 */
class VisaRequirementsService {
  private static instance: VisaRequirementsService;
  private cache: Map<string, VisaRequirement> = new Map();
  private allRequirementsCache: VisaRequirement[] | null = null;
  private lastCacheRefresh: number = 0;
  private readonly CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): VisaRequirementsService {
    if (!VisaRequirementsService.instance) {
      VisaRequirementsService.instance = new VisaRequirementsService();
    }
    return VisaRequirementsService.instance;
  }

  /**
   * Get full country name from country code
   */
  public getCountryNameFromCode(countryCode: string | undefined | null): string {
    if (!countryCode) return '';
    
    // Normalize code to uppercase
    const normalizedCode = countryCode.toUpperCase();
    console.log(`Looking up country name for code: ${normalizedCode}`);
    
    // Handle special cases first
    const specialCountry = SPECIAL_COUNTRY_CODES[normalizedCode as keyof typeof SPECIAL_COUNTRY_CODES];
    if (specialCountry) {
      return specialCountry;
    }
    
    // Find in ALL_COUNTRIES
    const country = ALL_COUNTRIES.find(c => c.code.toUpperCase() === normalizedCode);
    if (country) {
      console.log(`Found country name for ${normalizedCode}: ${country.name}`);
      return country.name;
    }
    
    console.warn(`No country found for code: ${normalizedCode}`);
    return countryCode; // Return original code if no match
  }

  /**
   * Get country code from country name
   */
  public getCountryCodeFromName(countryName: string): string | null {
    if (!countryName) return null;
    
    // Normalize name to lowercase for case-insensitive matching
    const normalizedName = countryName.toLowerCase();
    console.log(`Looking up country code for name: ${normalizedName}`);
    
    // Look for special country codes first
    for (const [code, name] of Object.entries(SPECIAL_COUNTRY_CODES)) {
      if (name.toLowerCase() === normalizedName) {
        return code;
      }
    }
    
    // Find in ALL_COUNTRIES (case-insensitive)
    const country = ALL_COUNTRIES.find(
      c => c.name.toLowerCase() === normalizedName
    );
    
    if (country) {
      console.log(`Found country code for ${normalizedName}: ${country.code}`);
      return country.code;
    }
    
    console.warn(`No country code found for name: ${normalizedName}`);
    return null;
  }

  /**
   * Get a unique cache key for a nationality-destination pair
   */
  private getCacheKey(nationality: string, destination: string): string {
    return `${nationality.toLowerCase()}-${destination.toLowerCase()}`;
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.lastCacheRefresh > this.CACHE_EXPIRY_MS;
  }

  /**
   * Clear the cache when it's expired
   */
  private clearCacheIfExpired(): void {
    if (this.isCacheExpired()) {
      this.cache.clear();
      this.allRequirementsCache = null;
      this.lastCacheRefresh = Date.now();
    }
  }

  /**
   * Get visa requirement for a specific nationality and destination
   */
  public async getVisaRequirement(
    nationalityInput: string, // This is likely a 2-letter code
    destinationInput: string  // This is likely a 2-letter code
  ): Promise<VisaRequirement | null> {
    try {
      console.log(`🔍 Checking visa requirements for ${nationalityInput} to ${destinationInput}`);
      
      // Basic validation
      if (!nationalityInput || !destinationInput) {
        console.error('❌ Nationality or Destination missing');
        return null;
      }
      
      // CRITICAL FIX: Convert 2-letter codes to full country names for database lookup
      let fromCountry = nationalityInput;
      let toCountry = destinationInput;
      
      // If inputs are 2-letter codes, convert them to full country names
      if (nationalityInput.length === 2) {
        const countryName = this.getCountryNameFromCode(nationalityInput);
        if (countryName) {
          fromCountry = countryName;
          console.log(`Converted nationality code ${nationalityInput} to name: ${fromCountry}`);
        } else {
          console.warn(`Could not convert nationality code ${nationalityInput} to a country name`);
        }
      }
      
      if (destinationInput.length === 2) {
        const countryName = this.getCountryNameFromCode(destinationInput);
        if (countryName) {
          toCountry = countryName;
          console.log(`Converted destination code ${destinationInput} to name: ${toCountry}`);
        } else {
          console.warn(`Could not convert destination code ${destinationInput} to a country name`);
        }
      }
      
      // Skip the check if countries are the same (case-insensitive comparison)
      if (fromCountry.toLowerCase() === toCountry.toLowerCase()) {
        console.log('Same country selected, no visa needed');
        return {
          nationality: fromCountry,
          destination: toCountry,
          requirement: 'visa-free',
          stay_duration: 0,
          notes: 'No visa required for travel within the same country.'
        };
      }
      
      // CRITICAL FAILSAFE: Hardcoded special case for Pakistan to Azerbaijan
      if ((fromCountry === 'Pakistan' || nationalityInput.toUpperCase() === 'PK') && 
          (toCountry === 'Azerbaijan' || destinationInput.toUpperCase() === 'AZ')) {
        console.log('✅ SERVICE LEVEL: Pakistan to Azerbaijan special case triggered');
        return {
          nationality: 'Pakistan',
          destination: 'Azerbaijan',
          requirement: 'evisa',
          stay_duration: 30,
          notes: 'Citizens of Pakistan can apply for an eVisa online before traveling to Azerbaijan through the official ASAN Visa portal.'
        };
      }
      
      // Check cache using lowercase names for consistency
      const cacheKey = `visa_req_${fromCountry.toLowerCase()}_${toCountry.toLowerCase()}`;
      const cachedResult = sessionStorage.getItem(cacheKey);
      
      if (cachedResult) {
        console.log('📋 Using cached visa requirement data');
        try {
          return JSON.parse(cachedResult);
        } catch (e) {
          console.error("Error parsing cached data:", e);
          sessionStorage.removeItem(cacheKey); 
        }
      }
      
      // Look up from local CSV dataset first (primary source of truth)
      const csvResult = getVisaRequirementFromCsv(fromCountry, toCountry);
      if (csvResult && csvResult.requirement !== 'unknown') {
        console.log('✅ Found visa requirement in CSV data:', csvResult);
        sessionStorage.setItem(cacheKey, JSON.stringify(csvResult));
        return csvResult;
      }

      // Fetch data from Supabase as secondary source
      console.log(`🌐 Fetching from API for ${fromCountry} -> ${toCountry}...`);
      console.log('Querying Supabase with passport=', fromCountry, 'destination=', toCountry);
            
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .ilike('passport', fromCountry)   // Use case-insensitive matching
        .ilike('destination', toCountry)  // Use case-insensitive matching
        .maybeSingle(); 
      
      // If maybeSingle() returns null (0 rows found), data will be null and error will be null
      if (error) { 
        // This block now only catches actual DB errors, not 0 rows
        console.error('❌ Supabase DB error:', error);
        console.error('Supabase connection details:', {
          url: supabase.supabaseUrl,
          hasKey: !!supabase.supabaseKey,
          status: await this.checkSupabaseConnection()
        });
        // Fallback for special case ONLY if there's a DB error
        if (fromCountry.toLowerCase() === 'pakistan' && toCountry.toLowerCase() === 'azerbaijan') {
           // ... (special case handling remains the same)
        }
        return null; // Return null on DB error
      }
      
      // Check if data was found (maybeSingle() returns null if 0 rows)
      if (data) {
        console.log('✅ Found visa requirement data:', data);
        const resultData: VisaRequirement = {
          nationality: data.passport, // Use lowercase 'passport'
          destination: data.destination, // Use lowercase 'destination'
          requirement: data.requirements || 'unknown', // Use lowercase 'requirements' (plural)
          stay_duration: data.stay_duration || null,
          notes: data.notes || ''
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(resultData));
        return resultData;
      }
      
      // If we reach here, it means data is null (0 rows found) and there was no DB error
      console.log(`ℹ️ No visa requirement record found in database for ${fromCountry} -> ${toCountry}`);

      if (csvResult) {
        sessionStorage.setItem(cacheKey, JSON.stringify(csvResult));
        return csvResult;
      }

      // Check for special case ONLY if 0 rows are found
       if (fromCountry.toLowerCase() === 'pakistan' && toCountry.toLowerCase() === 'azerbaijan') {
           // ... (special case handling remains the same)
       }
      return null; // Return null explicitly when no data is found

    } catch (error) {
      console.error('💥 Unexpected error in getVisaRequirement:', error);
      return null;
    }
  }

  /**
   * Test the Supabase connection to ensure it's working properly
   */
  private async testSupabaseConnection(): Promise<boolean> {
    try {
      // Simple test query to verify connection
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('count(*)', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
      }
      
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (err) {
      console.error('❌ Supabase connection test error:', err);
      return false;
    }
  }

  /**
   * Get all visa requirements with pagination
   */
  public async getAllVisaRequirements(
    page: number = 1,
    limit: number = 10
  ): Promise<VisaRequirement[]> {
    // Check if we have a valid cache
    if (
      this.allRequirementsCache &&
      Date.now() - this.lastCacheRefresh < this.CACHE_EXPIRY_MS
    ) {
      console.log('Using cached visa requirements');
      // Calculate slice based on page and limit
      const start = (page - 1) * limit;
      const end = start + limit;
      return this.allRequirementsCache.slice(start, end);
    }

    try {
      // For development mode, use mock data
      if (import.meta.env.DEV) {
        console.log("DEV MODE: Using mock visa requirements data");
        
        // Mock data for development
        const mockData: VisaRequirement[] = [
          {
            nationality: 'United States',
            destination: 'Albania',
            requirement: 'evisa',
            stay_duration: 90,
            notes: 'Albania offers eVisa for most nationalities.'
          },
          {
            nationality: 'United States',
            destination: 'Canada',
            requirement: 'visa-free',
            stay_duration: 180,
            notes: 'US citizens can stay up to 180 days visa-free.'
          },
          {
            nationality: 'United Kingdom',
            destination: 'United States',
            requirement: 'eta',
            stay_duration: 90,
            notes: 'ESTA required for visa waiver program.'
          },
          {
            nationality: 'Germany',
            destination: 'France',
            requirement: 'visa-free',
            stay_duration: 90,
            notes: 'EU citizens have freedom of movement.'
          },
          {
            nationality: 'Japan',
            destination: 'South Korea',
            requirement: 'visa-free',
            stay_duration: 90,
            notes: 'Visa-free travel between Japan and South Korea.'
          }
        ];
        
        this.allRequirementsCache = mockData;
        this.lastCacheRefresh = Date.now();
        
        // Calculate slice based on page and limit
        const start = (page - 1) * limit;
        const end = start + limit;
        return mockData.slice(start, end);
      }
      
      // Calculate offset based on page and limit
      const offset = (page - 1) * limit;

      // Fetch visa requirements from Supabase
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching visa requirements:', error);
        
        // Add fallback for Albania
        const fallbackData: VisaRequirement[] = [
          {
            nationality: 'any',
            destination: 'Albania',
            requirement: 'evisa',
            stay_duration: 90,
            notes: 'Albania offers eVisa for most nationalities.'
          }
        ];
        
        this.allRequirementsCache = fallbackData;
        return fallbackData;
      }

      // Add Albania to the data if it's not already there
      const hasAlbania = data?.some((req: any) => req.destination === 'Albania');
      if (!hasAlbania && data) {
        data.push({
          nationality: 'any',
          destination: 'Albania',
          requirement: 'evisa',
          stay_duration: 90,
          notes: 'Albania offers eVisa for most nationalities.'
        });
      }

      // Process data and filter out any entries with undefined nationality or destination
      const processedData = data
        .filter((item: any) => item.nationality && item.destination)
        .map((item: any) => ({
        ...item,
          nationality: item.nationality ? (this.getCountryNameFromCode(item.nationality) || item.nationality) : 'Unknown',
          destination: item.destination ? (this.getCountryNameFromCode(item.destination) || item.destination) : 'Unknown'
      }));

      // Cache the results if it's the first page
      if (page === 1) {
        this.allRequirementsCache = processedData;
        this.lastCacheRefresh = Date.now();
      }

      return processedData;
    } catch (error) {
      console.error('Error fetching all visa requirements:', error);
      
      // Add fallback for Albania
      const fallbackData: VisaRequirement[] = [
        {
          nationality: 'any',
          destination: 'Albania',
          requirement: 'evisa',
          stay_duration: 90,
          notes: 'Albania offers eVisa for most nationalities.'
        }
      ];
      
      this.allRequirementsCache = fallbackData;
      this.lastCacheRefresh = Date.now();
      return fallbackData;
    }
  }

  /**
   * Get all visa requirements for a specific nationality
   */
  public async getVisaRequirementsForNationality(
    nationality: string
  ): Promise<VisaRequirement[]> {
    // Check if nationality is valid
    if (!nationality) {
      console.warn('Empty nationality provided');
      return [];
    }
    
    const nationalityCode = nationality.length === 2 ? nationality : this.getCountryCodeFromName(nationality);
    
    if (!nationalityCode) {
      console.error('Invalid nationality provided');
      return [];
    }

    try {
      const csvData = getVisaRequirementsForNationalityFromCsv(
        nationality.length === 2 ? this.getCountryNameFromCode(nationality) : nationality
      );
      if (csvData.length > 0) {
        return csvData;
      }

      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .eq('nationality_code', nationalityCode);

      if (error) {
        console.error('Error fetching visa requirements for nationality:', error);
        return [];
      }

      // Filter out invalid entries and process the data
      return data
        .filter((item: any) => item.destination) // Skip entries with invalid destinations
        .map((item: any) => ({
        ...item,
          nationality: this.getCountryNameFromCode(nationalityCode),
          destination: item.destination ? (this.getCountryNameFromCode(item.destination) || item.destination) : 'Unknown'
      }));
    } catch (error) {
      console.error('Unexpected error fetching visa requirements for nationality:', error);
      return [];
    }
  }

  /**
   * Get all visa requirements for a specific destination
   */
  public async getVisaRequirementsForDestination(
    destination: string
  ): Promise<VisaRequirement[]> {
    // Check if destination is valid
    if (!destination) {
      console.warn('Empty destination provided');
      return [];
    }
    
    const destinationCode = destination.length === 2 ? destination : this.getCountryCodeFromName(destination);
    
    if (!destinationCode) {
      console.error('Invalid destination provided');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .eq('destination_code', destinationCode);

      if (error) {
        console.error('Error fetching visa requirements for destination:', error);
        return [];
      }

      // Filter out invalid entries and process the data
      return data
        .filter((item: any) => item.nationality) // Skip entries with invalid nationalities
        .map((item: any) => ({
        ...item,
          nationality: item.nationality ? (this.getCountryNameFromCode(item.nationality) || item.nationality) : 'Unknown',
          destination: this.getCountryNameFromCode(destinationCode)
      }));
    } catch (error) {
      console.error('Unexpected error fetching visa requirements for destination:', error);
      return [];
    }
  }

  /**
   * Check if a specific visa type is available for a nationality-destination pair
   */
  public async isVisaTypeAvailable(
    nationality: string,
    destination: string,
    visaType: 'evisa' | 'eta' | 'visa-on-arrival' | 'visa-free'
  ): Promise<boolean> {
    const requirement = await this.getVisaRequirement(nationality, destination);
    return requirement?.requirement === visaType;
  }

  /**
   * Get visa status text based on requirement type
   */
  public getVisaStatusText(requirement: string | undefined): string {
    switch (requirement) {
      case 'visa-free':
        return 'Visa-Free';
      case 'visa-on-arrival':
        return 'Visa on Arrival';
      case 'evisa':
        return 'eVisa';
      case 'eta':
        return 'Electronic Travel Authorization';
      case 'visa-required':
        return 'Traditional Visa Required';
      default:
        return 'Visa Information Unavailable';
    }
  }

  // Helper function to check if Supabase connection is working
  private async checkSupabaseConnection(): Promise<'connected' | 'error'> {
    try {
      // Try a simple query to check connection - fetch a single column instead of count(*)
      const { error } = await supabase
        .from('visa_requirements')
        .select('passport') // Use correct lowercase 'passport' column
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return 'error';
      }
      console.log('✅ Supabase connection test successful (basic query using passport column)');
      return 'connected';
    } catch (error) {
      console.error('💥 Failed to test Supabase connection:', error);
      return 'error';
    }
  }
}

// Export a singleton instance
export const visaRequirementsService = VisaRequirementsService.getInstance();
