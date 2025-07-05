import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule
} from 'react-simple-maps';
import { getCountryName, countryCodeMap } from '../../data/countryCodes';
import { VisaRequirement, VisaRequirementType, RequirementColors, requirementToText } from '../../types/visa';
import { supabase } from '../../lib/supabaseClient'; // Correct import path for Supabase client
import './LoadingPlane.css';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Add initial map position constants
const INITIAL_MAP_CENTER: [number, number] = [20, 10]; // Center more towards Europe/Africa
const INITIAL_MAP_ZOOM = 1.5;

// Get code from country name - Helper function since it's not exported from countryCodeMap
const getCodeFromName = (name: string): string | undefined => {
  const normalizedName = name.trim().toLowerCase();
  for (const [code, countryName] of Object.entries(countryCodeMap)) {
    if ((countryName as string).toLowerCase() === normalizedName) {
      return code;
    }
  }
  return undefined;
};

// Normalize various visa requirement strings into standard types
const normalizeRequirementType = (requirement: string): VisaRequirementType => {
  // Convert to lowercase and trim
  const req = requirement.toLowerCase().trim();
  
  // Debug the incoming requirement string 
  console.log(`[Normalize] Processing requirement: "${req}"`);
  
  // Handle visa-free variations
  if (req === 'visa free' || req === 'visa-free' || req === 'visa_free' || req === 'visafree') {
    return 'visa-free';
  }
  
  // Handle e-visa variations (this is the most problematic one)
  if (req === 'e-visa' || req === 'evisa' || req === 'e visa' || req === 'e_visa' || req === 'electronic visa') {
    console.log('[Normalize] Converted to standard evisa format');
    return 'evisa';
  }
  
  // Handle visa-on-arrival variations
  if (req === 'visa on arrival' || req === 'visa-on-arrival' || req === 'visa_on_arrival' || req === 'visaonarrival') {
    return 'visa-on-arrival';
  }
  
  // Handle visa-required variations
  if (req === 'visa required' || req === 'visa-required' || req === 'visa_required' || req.includes('visa required')) {
    return 'visa-required';
  }
  
  // Handle no-admission variations
  if (req === 'no admission' || req === 'no-admission' || req === 'not admitted' || req === 'no_admission' || req === 'noadmission') {
    return 'no-admission';
  }
  
  // If nothing matched, log a warning and return 'unknown'
  console.warn(`[Normalize] Could not normalize visa requirement: "${requirement}"`);
  return 'unknown';
};

// Type assertion function to ensure country code is string
const ensureString = (code: string | undefined): string => {
  if (code === undefined) {
    console.warn("[Warning] Undefined country code converted to empty string");
    return "";
  }
  return code;
};

interface VisaRequirementsMapProps {
  userNationality: string;
  onCountrySelect: (countryCode: string, visaDetails: VisaRequirement) => void;
}

interface RawVisaRequirement {
  Passport: string;
  Destination: string;
  Requirement: string;
}

interface CountryDataItem {
  name: string;
  code: string;
  rank?: number;
  [key: string]: string | number | undefined; // Allow for dynamic properties
}

interface TooltipData {
  x: number;
  y: number;
  content: {
    name: string;
    visa: string;
    rank?: number | string;
  }
}

interface CountryDataRecord {
  name: string;
  rank?: number | string;
  code?: string;
}

// Loading animation component
const LoadingPlane: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-plane">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-600 dark:text-blue-400"
        >
          <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L10 12l-2 3H3l-1 1 3 2 2 3 1-1v-5l3-2 3.5 6.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
        </svg>
      </div>
      <div className="loading-text">
        Loading your travel dashboard...
      </div>
    </div>
  );
};

const VisaRequirementsMap: React.FC<VisaRequirementsMapProps> = ({ userNationality, onCountrySelect }) => {
  console.log(`[Render] SimpleWorldMap for ${userNationality}`);
  const [zoom, setZoom] = useState<number>(1.2); // Initial zoom state
  const [visaRequirements, setVisaRequirements] = useState<Record<string, VisaRequirement>>({});
  const [countryRanks, setCountryRanks] = useState<Record<string, number | string>>({});
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; content: { name: string; visa: string; rank: string | number } } | null>(null);
  const [selectedRequirements, setSelectedRequirements] = useState<Set<VisaRequirementType>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceRender, setForceRender] = useState(0);
  const [position, setPosition] = useState({ 
    coordinates: INITIAL_MAP_CENTER,
    zoom: INITIAL_MAP_ZOOM 
  });
  
  // Get the full country name from the country code
  const getCountryNameFromCode = useCallback((code: string): string => {
    // Special case for Afghanistan - hardcode it to ensure correct lookup
    if (code.toUpperCase() === 'AF') {
      return 'Afghanistan';
    }
    
    const country = Object.entries(countryCodeMap).find(([_, countryCode]) => countryCode === code);
    return country ? country[0] : code;
  }, []);
  
  // Get the country code from the full country name
  const getCodeFromFullName = useCallback((fullName: string): string | undefined => {
    // First check if it's already a country code (2 letters)
    if (fullName.length === 2 && fullName === fullName.toUpperCase()) {
      return fullName;
    }
    
    // Special cases for commonly problematic countries
    const specialCases: { [key: string]: string } = {
      'afghanistan': 'AF',
      'china': 'CN',
      'syria': 'SY',
      'turkey': 'TR'
    };
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedName = fullName.trim().toLowerCase();
    
    // Check special cases first
    if (specialCases[normalizedName]) {
      return specialCases[normalizedName];
    }
    
    // Check in countryCodeMap
    for (const [code, name] of Object.entries(countryCodeMap)) {
      if (name.toLowerCase() === normalizedName) {
        return code;
      }
    }
    
    // Check in aliases
    const visaNameAliases: { [key: string]: string } = {
      'dr congo': 'CD',
      'hong kong': 'HK',
      'sao tome and principe': 'ST',
      'micronesia': 'FM',
      'macao': 'MO',
      'congo': 'CG',
      'swaziland': 'SZ',
      'kosovo': 'XK',
      'netherlands': 'NL',
      'palestine': 'PS',
      'vatican': 'VA',
      'india': 'IN',
      'united states of america': 'US',
      'united states': 'US',
      'greenland': 'GL',
      'south korea': 'KR',
      'north korea': 'KP',
      'cape verde': 'CV',
      'east timor': 'TL',
      'timor-leste': 'TL',
      'saint kitts and nevis': 'KN',
      'saint vincent and the grenadines': 'VC',
      'saint lucia': 'LC',
      'united arab emirates': 'AE',
      'papua new guinea': 'PG',
      'south sudan': 'SS',
      'angola': 'AO',
      'kenya': 'KE',
      'pakistan': 'PK',
      'albania': 'AL',
      'antigua and barbuda': 'AG',
      'somalia': 'SO',
      'ivory coast': 'CI',
      'côte d\'ivoire': 'CI',
      'malaysia': 'MY',
      'iran': 'IR',
      'tajikistan': 'TJ',
      'libya': 'LY',
      'egypt': 'EG',
      'kazakhstan': 'KZ',
    };
    
    return visaNameAliases[normalizedName];
  }, []);
  
  // Load visa requirements data
  useEffect(() => {
    const loadData = async () => {
      console.log('[Effect] Loading visa requirements data...');
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the user's passport country name
        const userPassportName = getCountryName(userNationality) || userNationality;
        console.log(`[Effect] Loading data for passport: ${userPassportName}`);
        
        // Direct query to get visa requirements from Supabase
        const { data: visaData, error: visaError } = await supabase
            .from('visa_requirements')
            .select('*')
          .eq('Passport', userPassportName)
            .order('Destination');
          
        if (visaError) {
          throw new Error(`Failed to fetch visa requirements: ${visaError.message}`);
        }
            
        // Get country data with ranks
        const { data: countryData, error: countryError } = await supabase
            .from('country_data')
            .select('*');
            
        if (countryError) {
          throw new Error(`Failed to fetch country data: ${countryError.message}`);
        }

        // Process visa requirements
        const processedVisaReqs: Record<string, VisaRequirement> = {};
        const processedRanks: Record<string, number | string> = {};

        // First, create a map of country names to their ranks, codes, and other data
        const countryInfoMap = new Map();
        countryData.forEach((country: CountryDataRecord) => {
          // Store by name
          countryInfoMap.set(country.name, {
            rank: country.rank || 'N/A',
            code: country.code || ''
          });
          
          // If country has a code, also store by code
          if (country.code) {
            countryInfoMap.set(country.code, {
              rank: country.rank || 'N/A',
              name: country.name
            });
          }
        });
        
        // Process visa requirements using direct country names and store by both name and code
        visaData.forEach((item: RawVisaRequirement) => {
          if (item.Destination) {
            const requirement = normalizeRequirementType(item.Requirement || 'unknown');
            
            // Get country info if available
            const countryInfo = countryInfoMap.get(item.Destination);
            
            // Create the visa requirement
            const visaReq = {
              passport: userPassportName,
              destination: item.Destination,
              requirement: requirement
            };
            
            // Store by destination name
            processedVisaReqs[item.Destination] = visaReq;
            processedRanks[item.Destination] = countryInfo?.rank?.toString() || 'N/A';
            
            // If we have a code for this country, also store by code
            if (countryInfo?.code) {
              processedVisaReqs[countryInfo.code] = visaReq;
              processedRanks[countryInfo.code] = countryInfo.rank?.toString() || 'N/A';
                    }
                  }
                });
                
        console.log(`[Effect] Processed ${Object.keys(processedVisaReqs).length} visa requirements`);
        console.log(`[Effect] Processed ${Object.keys(processedRanks).length} country ranks`);

        setVisaRequirements(processedVisaReqs);
        setCountryRanks(processedRanks);
        setIsLoading(false);
        
      } catch (err) {
        console.error("[Effect] Error loading map data:", err);
        setError(err instanceof Error ? err.message : "Failed to load map data");
        setIsLoading(false);
      }
    };

    if (userNationality) {
      loadData();
    } else {
      setError("User nationality not provided");
        setIsLoading(false);
    }
  }, [userNationality]);

  useEffect(() => {
    console.log("[Effect] Selected requirements changed:", Array.from(selectedRequirements));
    // Use a setTimeout to ensure this runs after React has processed state updates
    setTimeout(() => {
      console.log("[Effect] Forcing re-render for requirements change");
      setForceRender(prev => prev + 1);
    }, 10); // Reduced timeout for faster response
  }, [selectedRequirements]);
  
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({
      ...pos,
      zoom: pos.zoom * 1.5
    }));
  }, [position.zoom]);
  
  const handleZoomOut = useCallback(() => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({
      ...pos,
      zoom: pos.zoom / 1.5
    }));
  }, [position.zoom]);
  
  // Handle map movement
  const handleMoveEnd = useCallback((position: any) => {
    setPosition(position);
  }, []);
  
  // This function is called when rendering the map to determine the fill color for each country
  const getCountryFill = useCallback((geo: any): string => {
    const countryName = geo.properties.NAME;
    const countryCode = geo.properties.ISO_A2;
    
    if (!countryName && !countryCode) {
      console.warn('[Fill] Country without name or code:', geo.properties);
      return RequirementColors.default;
    }

    // Check if this is the user's own country
    if (countryCode && countryCode === userNationality) {
      return RequirementColors.own;
    }
    
    // Try to find visa info by country name first, then by code
    let visaInfo = countryName ? visaRequirements[countryName] : undefined;
    if (!visaInfo && countryCode) {
      visaInfo = visaRequirements[countryCode];
    }
    
    if (!visaInfo || !visaInfo.requirement) {
      return RequirementColors.default;
    }
    
    const requirementType = visaInfo.requirement;
    
    if (!RequirementColors[requirementType]) {
      console.error(`Unknown requirement type: ${requirementType} for country ${countryName || countryCode}`);
      return RequirementColors.default;
    }
    
    if (selectedRequirements.size === 0) {
      return RequirementColors[requirementType];
    }
    
    if (selectedRequirements.has(requirementType)) {
      return RequirementColors[requirementType];
    }
    
    return '#EEEEEE';
  }, [userNationality, visaRequirements, selectedRequirements]);
  
  const handleMouseEnter = useCallback((geo: any, event: React.MouseEvent) => {
    const countryName = geo.properties.NAME;
    const countryCode = geo.properties.ISO_A2;
    
    if (!countryName && !countryCode) {
      setTooltipData({
        x: event.clientX + 10,
        y: event.clientY + 10,
        content: { name: 'Unknown', visa: 'Info unavailable', rank: 'N/A' }
      });
      return;
    }
    
    // Try to find visa info by country name first, then by code
    let visaInfo = countryName ? visaRequirements[countryName] : undefined;
    if (!visaInfo && countryCode) {
      visaInfo = visaRequirements[countryCode];
    }
    
    let rankInfo = countryName ? countryRanks[countryName] : undefined;
    if (rankInfo === undefined && countryCode) {
      rankInfo = countryRanks[countryCode];
    }
    
    const visaText = visaInfo ? requirementToText(visaInfo.requirement) : 'Info unavailable';
    const rankText = rankInfo !== undefined && rankInfo !== null ? rankInfo : 'N/A';
    
    setTooltipData({
      x: event.clientX + 10,
      y: event.clientY + 10,
      content: {
        name: countryName || countryCode || 'Unknown Country',
        visa: visaText,
        rank: rankText
      }
    });
  }, [visaRequirements, countryRanks]);
  
  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);
  
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // No need to update state here, fixed positioning handles cursor following
    // We keep the function for potential future use or complex logic
  }, []);

  const handleCountryClick = (geo: any) => {
    const countryName = geo.properties.NAME;
    const countryCode = geo.properties.ISO_A2;
    
    if (!countryCode) {
      console.warn('[Click] Country without code clicked:', countryName);
      return;
    }
    
    // Try to find visa info by country name first, then by code
    let visaInfo = countryName ? visaRequirements[countryName] : undefined;
    if (!visaInfo && countryCode) {
      visaInfo = visaRequirements[countryCode];
    }
    
    console.log(`[Click] Clicked on ${countryName} (${countryCode}), VisaInfo: ${visaInfo ? 'Exists' : 'None'}`);
    
    if (visaInfo && countryCode && countryCode !== userNationality) {
      onCountrySelect(countryCode, visaInfo);
    }
  };
  
  // Handler for checkbox changes - improved to ensure consistent state updates
  const handleRequirementToggle = useCallback((requirement: VisaRequirementType) => {
    console.log(`[Checkbox] Toggling ${requirement}`);
    
    setSelectedRequirements(prevSelected => {
      // Create a new Set from the previous selection to avoid mutation
      const newSelected = new Set(prevSelected);
      
      // Toggle the requirement
      if (newSelected.has(requirement)) {
        console.log(`[Checkbox] Removing ${requirement}`);
        newSelected.delete(requirement);
      } else {
        console.log(`[Checkbox] Adding ${requirement}`);
        newSelected.add(requirement);
      }
      
      console.log("[Checkbox] New selected requirements:", Array.from(newSelected));
      
      // Debug: Count countries with this requirement 
      const countriesWithRequirement = Object.entries(visaRequirements)
        .filter(([_, info]) => info.requirement === requirement)
        .map(([code, _]) => code);
      
      console.log(`[Debug] Countries with ${requirement} requirement (${countriesWithRequirement.length}):`, 
        countriesWithRequirement.length > 0 ? 
          countriesWithRequirement.slice(0, 10).map(code => `${code}: ${getCountryName(code) || code}`).join(', ') + 
          (countriesWithRequirement.length > 10 ? ` and ${countriesWithRequirement.length - 10} more...` : '')
        : 'None found');
      
      // Force immediate re-render to apply changes right away
      setTimeout(() => {
        console.log("[Checkbox] Forcing immediate re-render after change");
        setForceRender(prev => prev + 1);
      }, 0);
      
      return newSelected;
    });
  }, [visaRequirements]);

  if (isLoading) {
    return (
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden" style={{ minHeight: '500px' }}>
        <LoadingPlane />
      </div>
    );
  }
  
  if (error) {
      return <div className="p-6 text-center text-red-600">Error loading map: {error}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative" style={{ minHeight: '500px' }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {tooltipData && (
        <div 
          style={{ 
            position: 'fixed',
            left: `${tooltipData.x}px`, // Offset slightly from cursor
            top: `${tooltipData.y}px`, // Offset slightly from cursor
            background: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000, // Ensure tooltip is on top
            pointerEvents: 'none' // Prevent tooltip from blocking mouse events
          }}
        >
          <div><strong>{tooltipData.content.name}</strong></div>
          <div>Visa: {tooltipData.content.visa}</div>
          <div>Passport Rank: {tooltipData.content.rank}</div>
        </div>
      )}
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Visa Requirements Map</h3>
        <p className="text-gray-600 dark:text-gray-400 my-2">
          Explore visa requirements for your {getCountryName(userNationality)} passport. (Hover for details)
        </p>
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs mt-2 items-center">
          <div className="mr-2 font-medium">Filter by visa type:</div>
          
          {/* Visa Free checkbox */}
          <label className="flex items-center cursor-pointer mr-3">
            <input
              type="checkbox"
              checked={selectedRequirements.has('visa-free')}
              onChange={() => handleRequirementToggle('visa-free')}
              className="mr-1.5 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span 
              className="w-3 h-3 rounded-sm mr-1.5 inline-block"
              style={{ backgroundColor: RequirementColors['visa-free'] }}
            ></span>
            Visa Free
          </label>
          
          {/* E-Visa checkbox */}
          <label className="flex items-center cursor-pointer mr-3">
            <input
              type="checkbox"
              checked={selectedRequirements.has('evisa')}
              onChange={() => handleRequirementToggle('evisa')}
              className="mr-1.5 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span 
              className="w-3 h-3 rounded-sm mr-1.5 inline-block"
              style={{ backgroundColor: RequirementColors['evisa'] }}
            ></span>
            E-Visa
          </label>
          
          {/* Visa on Arrival checkbox */}
          <label className="flex items-center cursor-pointer mr-3">
            <input
              type="checkbox"
              checked={selectedRequirements.has('visa-on-arrival')}
              onChange={() => handleRequirementToggle('visa-on-arrival')}
              className="mr-1.5 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span 
              className="w-3 h-3 rounded-sm mr-1.5 inline-block"
              style={{ backgroundColor: RequirementColors['visa-on-arrival'] }}
            ></span>
            Visa on Arrival
          </label>
          
          {/* Visa Required checkbox */}
          <label className="flex items-center cursor-pointer mr-3">
            <input
              type="checkbox"
              checked={selectedRequirements.has('visa-required')}
              onChange={() => handleRequirementToggle('visa-required')}
              className="mr-1.5 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span 
              className="w-3 h-3 rounded-sm mr-1.5 inline-block"
              style={{ backgroundColor: RequirementColors['visa-required'] }}
            ></span>
            Visa Required
          </label>
          
          {/* No Admission checkbox */}
          <label className="flex items-center cursor-pointer mr-3">
            <input
              type="checkbox"
              checked={selectedRequirements.has('no-admission')}
              onChange={() => handleRequirementToggle('no-admission')}
              className="mr-1.5 h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span 
              className="w-3 h-3 rounded-sm mr-1.5 inline-block"
              style={{ backgroundColor: RequirementColors['no-admission'] }}
            ></span>
            No Admission
          </label>
          
          {selectedRequirements.size > 0 && (
            <button
              onClick={() => {
                console.log("[Clear] Clearing all filters");
                setSelectedRequirements(new Set());
                setTimeout(() => {
                  console.log("[Clear] Forcing re-render after clear");
                  setForceRender(prev => prev + 1);
                }, 0);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-2"
            >
              Clear filters
            </button>
          )}
        </div>
        
        {/* Debug information - show counts of countries by visa type */}
        <div className="mt-2 text-xs text-gray-500">
          {Object.entries(RequirementColors)
            .filter(([key]) => !['default', 'own'].includes(key))
            .map(([reqType, color]) => {
              const count = Object.values(visaRequirements).filter(
                req => req.requirement === reqType
              ).length;
              
              if (count > 0) {
                return (
                  <span key={reqType} className="mr-3">
                    {reqType}: {count} countries
                  </span>
                );
              }
              return null;
            })}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1">
        <button 
          onClick={handleZoomIn}
          className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-150 ease-in-out text-base"
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          onClick={handleZoomOut}
          className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-150 ease-in-out text-base"
          aria-label="Zoom out"
        >
          -
        </button>
      </div>
      
      <div className="relative flex justify-center">
        <div key={`map-container-${forceRender}`} className="w-full h-[450px] overflow-hidden flex justify-center">
          <ComposableMap
            projectionConfig={{
              scale: 147,
              center: INITIAL_MAP_CENTER // Use constant for consistency
            }}
            width={800}
            height={450}
            style={{
              width: "100%",
              height: "auto"
            }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={handleMoveEnd}
              maxZoom={4}
            >
              <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
            <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
              {/* Re-render Geographies when forceRender changes */}
              <Geographies key={`geographies-${forceRender}`} geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) => 
                  geographies.map((geo: any) => {
                  const countryCode = geo.properties.ISO_A2;
                  const countryName = geo.properties.NAME;
                  
                  // Try to find visa info by country name first, then by code
                  let visaInfo = countryName ? visaRequirements[countryName] : undefined;
                  if (!visaInfo && countryCode) {
                    visaInfo = visaRequirements[countryCode];
                  }
                  
                  const isClickable = (countryCode || countryName) && visaInfo;
                    const fill = getCountryFill(geo);

                  return (
                    <Geography
                        key={`${geo.rsmKey}-${forceRender}`}
                      geography={geo}
                        fill={fill}
                        stroke="#FFFFFF"
                        strokeWidth={0.5}
                      style={{
                        default: { 
                          outline: "none",
                            transition: "all 0.3s ease-in-out"
                        },
                        hover: { 
                          outline: "none",
                            fill: "#006400", // Change to dark green for hover effect
                          cursor: isClickable ? "pointer" : "default",
                            transform: "translate(-0.5px, -0.5px) scale(1.01)", // Reduced from -2px, -2px and 1.03
                          stroke: "#6B7280",
                            strokeWidth: 0.8,
                            filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.2))" // Reduced shadow as well
                        },
                        pressed: { 
                          outline: "none",
                            transform: "translate(0, 0) scale(1)"
                          }
                        }}
                        onMouseEnter={(event: React.MouseEvent) => handleMouseEnter(geo, event)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleCountryClick(geo)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate mock visa data for development
const getMockVisaData = (): RawVisaRequirement[] => {
  return [
    // Add some test data for various passport
    { Passport: "Angola", Destination: "United States", Requirement: "visa-required" },
    { Passport: "Angola", Destination: "United Kingdom", Requirement: "visa-required" },
    { Passport: "Angola", Destination: "France", Requirement: "visa-required" },
    { Passport: "Angola", Destination: "Germany", Requirement: "visa-required" },
    { Passport: "Angola", Destination: "Brazil", Requirement: "visa-free" },
    { Passport: "Angola", Destination: "South Africa", Requirement: "visa-free" },
    { Passport: "Angola", Destination: "China", Requirement: "visa-required" },
    { Passport: "Angola", Destination: "Russia", Requirement: "visa-required" },
    { Passport: "Angola", Destination: "India", Requirement: "evisa" }, // Use consistent 'evisa' type
    { Passport: "Angola", Destination: "Turkey", Requirement: "evisa" }, // Use consistent 'evisa' type
    { Passport: "Angola", Destination: "Thailand", Requirement: "visa-on-arrival" },
    { Passport: "Angola", Destination: "Vietnam", Requirement: "visa-on-arrival" },
    { Passport: "Angola", Destination: "North Korea", Requirement: "no-admission" },
  ];
};

// Helper function to generate mock country data for development
const getMockCountryData = (): any[] => {
  return [
    { name: 'Angola', code: 'AO' },
    { name: 'Turkey', code: 'TR' },
    { name: 'India', code: 'IN' },
    { name: 'Thailand', code: 'TH' },
    { name: 'France', code: 'FR' },
    { name: 'Russia', code: 'RU' },
    { name: 'North Korea', code: 'KP' },
    { name: 'United States of America', code: 'US' },
    { name: 'Greenland', code: 'GL' },
    // Add more mock data as needed
  ];
};

export default VisaRequirementsMap; 