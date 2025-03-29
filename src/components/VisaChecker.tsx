import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountrySelect from './CountrySelect';
import { ALL_COUNTRIES, getFlagUrl } from '../utils/countries';

// Debug flag for controlling console output
const DEBUG = false;

// Define types for visa requirements
interface VisaRequirement {
  Passport: string;
  Destination: string;
  Requirement: string;
}

// Empty array that will be populated from JSON file
let VISA_REQUIREMENTS: VisaRequirement[] = [];

// Map to convert country names to country codes
const countryNameToCodeMap = new Map(
  ALL_COUNTRIES.map(country => [country.name.toLowerCase(), country.code])
);

// Special country codes for partially recognized states
const SPECIAL_COUNTRY_CODES: Record<string, string> = {
  'Kosovo': 'XKX',
  'Palestine': 'PSE',
  'Taiwan': 'TWN'
} as const;

// Function to normalize country names
const normalizeCountryName = (name: string): string => {
  const normalizations: { [key: string]: string } = {
    'Kosovo': 'Kosovo',
    'Tonga': 'Tonga',
    'Trinidad and Tobago': 'Trinidad and Tobago',
    'Tunisia': 'Tunisia',
    'Turkmenistan': 'Turkmenistan',
    'Ukraine': 'Ukraine',
    'United Kingdom': 'United Kingdom',
    'United States': 'United States',
    'Uruguay': 'Uruguay',
    'Uzbekistan': 'Uzbekistan',
    'Vanuatu': 'Vanuatu',
    'Venezuela': 'Venezuela',
    'Yemen': 'Yemen',
    'Afghanistan': 'Afghanistan',
    'Macao': 'Macau',
    'South Korea': 'Korea (South)',
    'North Korea': 'Korea (North)',
    'Vatican': 'Vatican City',
    'DR Congo': 'Congo (Democratic Republic)',
    'Cape Verde': 'Cabo Verde',
    'Swaziland': 'Eswatini',
    'Ivory Coast': "Côte d'Ivoire",
    'East Timor': 'Timor-Leste',
    'UAE': 'United Arab Emirates',
    'UK': 'United Kingdom',
    'USA': 'United States',
    'Burma': 'Myanmar'
  };

  return normalizations[name] || name;
};

// Function to get country code from name
const getCountryCodeFromName = (name: string): string | undefined => {
  // Check for special country codes first
  const normalizedName = normalizeCountryName(name);
  if (SPECIAL_COUNTRY_CODES[normalizedName]) {
    return SPECIAL_COUNTRY_CODES[normalizedName];
  }

  // Try to find in standard country list
  const countryCode = countryNameToCodeMap.get(normalizedName.toLowerCase());
  if (countryCode) {
    return countryCode;
  }

  // If not found and DEBUG is true, log the missing country
  if (DEBUG) {
    console.warn(`No country code found for: ${name} (normalized: ${normalizedName})`);
  }
  
  return undefined;
};

// Function to normalize visa requirement types
const normalizeRequirementType = (requirement: string): 'visa-free' | 'visa-on-arrival' | 'evisa' | 'eta' | 'esta' | 'visa-required' | 'not-applicable' => {
  const req = requirement.toLowerCase();
  
  if (req === 'visa free' || req === 'visa-free' || req === 'free') {
    return 'visa-free';
  } else if (req === 'visa on arrival' || req === 'visa-on-arrival' || req === 'on arrival') {
    return 'visa-on-arrival';
  } else if (req === 'e-visa' || req === 'evisa' || req === 'electronic visa') {
    return 'evisa';
  } else if (req === 'eta' || req === 'electronic travel authorization') {
    return 'eta';
  } else if (req === 'esta') {
    return 'esta';
  } else if (req === 'not applicable' || req === 'not-applicable') {
    return 'not-applicable';
  } else {
    return 'visa-required';
  }
};

interface VisaCheckerProps {
  onApplyEVisa?: (nationality: string, destination: string) => void;
}

const VisaChecker: React.FC<VisaCheckerProps> = ({ onApplyEVisa }) => {
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState<{
    checked: boolean;
    requirement: string;
    message: string;
    canApplyForEVisa: boolean;
    isLoading?: boolean;
    stayDuration?: number;
  } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processedRequirements, setProcessedRequirements] = useState<{
    passport: string;
    destination: string;
    requirement: string;
  }[]>([]);

  // Load visa requirements from JSON file
  useEffect(() => {
    const loadVisaRequirements = async () => {
      try {
        if (DEBUG) console.group('Loading Visa Requirements');
        
        // Load all three visa requirement files
        const response1 = await fetch('/visarequirements1.json');
        if (!response1.ok) {
          throw new Error(`Failed to load visa requirements (A-H): ${response1.status} ${response1.statusText}`);
        }
        
        const response2 = await fetch('/visarequirements2.json');
        if (!response2.ok) {
          throw new Error(`Failed to load visa requirements (I-Q): ${response2.status} ${response2.statusText}`);
        }
        
        const response3 = await fetch('/visarequirements3.json');
        if (!response3.ok) {
          throw new Error(`Failed to load visa requirements (R-Z): ${response3.status} ${response3.statusText}`);
        }
        
        const data1 = await response1.json();
        const data2 = await response2.json();
        const data3 = await response3.json();
        
        // Combine all data
        const data = [...data1, ...data2, ...data3];
        
        if (DEBUG) console.log('Raw visa requirements data:', data);
        
        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error('Visa requirements data must be an array');
        }
        
        VISA_REQUIREMENTS = data;
        
        // Process the requirements to convert country names to codes
        const processed = VISA_REQUIREMENTS.map(req => {
          if (DEBUG) console.log('Processing requirement:', req);
          
          const passportCode = getCountryCodeFromName(req.Passport.trim());
          const destinationCode = getCountryCodeFromName(req.Destination.trim());
          
          if (!passportCode || !destinationCode) {
            // Only log warnings for countries that aren't in our special cases
            const isSpecialCase = SPECIAL_COUNTRY_CODES[req.Passport] || SPECIAL_COUNTRY_CODES[req.Destination];
            if (!isSpecialCase && DEBUG) {
              console.warn(`Could not find country code for ${req.Passport} or ${req.Destination}`);
            }
            return null;
          }
          
          return {
            passport: passportCode,
            destination: destinationCode,
            requirement: normalizeRequirementType(req.Requirement.trim())
          };
        }).filter(req => req !== null) as {
          passport: string;
          destination: string;
          requirement: string;
        }[];
        
        if (processed.length === 0) {
          throw new Error('No valid visa requirements could be processed');
        }
        
        if (DEBUG) {
          console.log('Processed requirements:', processed);
          console.log(`Processed ${processed.length} visa requirements`);
          console.groupEnd();
        }
        
        setProcessedRequirements(processed);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading visa requirements:', error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error loading visa requirements');
        if (DEBUG) console.groupEnd();
      }
    };

    loadVisaRequirements();
  }, []);

  const checkVisaRequirement = () => {
    if (!nationality || !destination) {
      if (DEBUG) console.log('Missing nationality or destination');
      return;
    }

    if (!isLoaded) {
      if (DEBUG) console.log('Visa requirements not loaded yet');
      setResult({
        checked: true,
        requirement: 'error',
        message: 'Visa requirement data is still loading. Please try again in a moment.',
        canApplyForEVisa: false,
        isLoading: false
      });
      return;
    }

    if (loadError) {
      if (DEBUG) console.log('Error loading visa requirements:', loadError);
      setResult({
        checked: true,
        requirement: 'error',
        message: `Error loading visa requirements data: ${loadError}`,
        canApplyForEVisa: false,
        isLoading: false
      });
      return;
    }

    // Show loading state
    setResult({
      checked: true,
      requirement: '',
      message: 'Checking visa requirements...',
      canApplyForEVisa: false,
      isLoading: true
    });

    // Short timeout to simulate API call
    setTimeout(() => {
      try {
        if (DEBUG) {
          console.group('Checking Visa Requirements');
          console.log('Checking requirements for:', { nationality, destination });
          console.log('Available processed requirements:', processedRequirements);
        }
        
        // Don't allow checking requirements for the same country
        if (nationality === destination) {
          setResult({
            checked: true,
            requirement: 'not-applicable',
            message: 'You do not need a visa to travel within your own country.',
            canApplyForEVisa: false,
            isLoading: false
          });
          return;
        }
        
        // Find the requirement in our processed database
        const requirementData = processedRequirements.find(
          req => req.passport.toLowerCase() === nationality.toLowerCase() && 
                req.destination.toLowerCase() === destination.toLowerCase()
        );
        
        console.log('Found requirement data:', requirementData);
        
        if (!requirementData) {
          console.log('No requirement found, defaulting to visa-required');
          // Default to visa-required if no specific rule is found
          setResult({
            checked: true,
            requirement: 'visa-required',
            message: 'A traditional visa is required to travel to this destination. Please contact the embassy or consulate for more information.',
            canApplyForEVisa: false,
            isLoading: false
          });
          return;
        }

        // Process found visa requirement
        let message = '';
        let canApplyForEVisa = requirementData.requirement === 'evisa' || requirementData.requirement === 'eta';
        
        // If no specific notes, generate a generic message based on requirement type
        if (requirementData.requirement === 'visa-free') {
          message = `Citizens of ${nationality} can travel visa-free to ${destination}.`;
        } else if (requirementData.requirement === 'visa-on-arrival') {
          message = `Citizens of ${nationality} can obtain a visa on arrival when traveling to ${destination}.`;
        } else if (requirementData.requirement === 'evisa') {
          message = `An electronic visa (eVisa) is required for citizens of ${nationality} traveling to ${destination}.`;
        } else if (requirementData.requirement === 'eta') {
          message = `An Electronic Travel Authorization (ETA) is required for citizens of ${nationality} traveling to ${destination}.`;
        } else if (requirementData.requirement === 'esta') {
          message = `An Electronic System for Travel Authorization (ESTA) is required for citizens of ${nationality} traveling to ${destination}.`;
        } else {
          message = `A traditional visa is required for citizens of ${nationality} traveling to ${destination}. Please contact the embassy or consulate for more information.`;
        }

        setResult({
          checked: true,
          requirement: requirementData.requirement,
          message,
          canApplyForEVisa,
          isLoading: false
        });
        
      } catch (error) {
        console.error('Error checking visa requirement:', error);
        setResult({
          checked: true,
          requirement: 'error',
          message: 'An unexpected error occurred. Please try again later.',
          canApplyForEVisa: false,
          isLoading: false
        });
      }
    }, 800); // Simulate network delay
  };

  // Get country names for display
  const nationalityCountry = ALL_COUNTRIES.find(c => c.code === nationality);
  const destinationCountry = ALL_COUNTRIES.find(c => c.code === destination);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Visa Eligbility Checker</h2>
        
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
        Enter your passport country and destination to check if you need a visa for your trip.
      </p>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {loadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CountrySelect 
          id="nationality"
          label="Your Nationality"
          value={nationality}
          onChange={setNationality}
          placeholder="Select your country of citizenship"
        />

        <CountrySelect 
          id="destination"
          label="Destination Country"
          value={destination}
          onChange={setDestination}
          placeholder="Select where you want to travel"
        />
      </div>

      <div className="mt-8">
        <motion.button
          onClick={checkVisaRequirement}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-md font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!nationality || !destination || !isLoaded}
        >
          Check Visa Requirement
        </motion.button>
        {!isLoaded && !loadError && (
          <p className="text-sm text-gray-500 mt-2 text-center">Loading visa requirements data...</p>
        )}
      </div>

      {result && result.checked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {result.isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Countries information */}
              <div className="flex items-center justify-center mb-6 space-x-12">
                {/* Nationality */}
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex-shrink-0 mb-2">
                    <img 
                      src={nationalityCountry ? getFlagUrl(nationalityCountry.code, 160) : ''} 
                      alt={nationalityCountry ? nationalityCountry.name : 'Country flag'}
                      className="w-full h-full object-cover rounded-full border-2 border-gray-200 dark:border-gray-700"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                    {nationalityCountry ? nationalityCountry.name : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Nationality</p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>

                {/* Destination */}
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex-shrink-0 mb-2">
                    <img 
                      src={destinationCountry ? getFlagUrl(destinationCountry.code, 160) : ''} 
                      alt={destinationCountry ? destinationCountry.name : 'Country flag'}
                      className="w-full h-full object-cover rounded-full border-2 border-gray-200 dark:border-gray-700"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                    {destinationCountry ? destinationCountry.name : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Destination</p>
                </div>
              </div>

              {/* Result */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {result.requirement === 'visa-free' && 'Visa-Free Travel Available'}
                  {result.requirement === 'visa-on-arrival' && 'Visa On Arrival Available'}
                  {result.requirement === 'evisa' && 'Electronic Visa Required'}
                  {result.requirement === 'eta' && 'Electronic Travel Authorization Required'}
                  {result.requirement === 'esta' && 'ESTA Required'}
                  {result.requirement === 'visa-required' && 'Traditional Visa Required'}
                  {result.requirement === 'not-applicable' && 'Not Applicable'}
                  {result.requirement === 'error' && 'Error'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {result.message}
                </p>
              </div>

              {/* CTA */}
              {result.canApplyForEVisa && onApplyEVisa && (
                <motion.button
                  onClick={() => onApplyEVisa(nationality, destination)}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 px-6 rounded-md font-medium mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Apply for eVisa
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      )}

      
    </div>
  );
};

export default VisaChecker; 

