import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { CountryInfo } from "../../types/map";
import { getFlagUrl } from "../../utils/countries";

// Sample country data
const sampleCountryData: { [key: string]: Partial<CountryInfo> } = {
  "USA": {
    visaRequirements: "Visa-free for tourism up to 90 days for many countries.",
    advisoryLevel: "Low",
    languages: ["English"],
    currency: "United States Dollar (USD)",
    bestTimeToVisit: "May to October, depending on the region.",
    travelScore: 89
  },
  "FRA": {
    visaRequirements: "Schengen visa requirements apply.",
    advisoryLevel: "Low",
    languages: ["French"],
    currency: "Euro (EUR)",
    bestTimeToVisit: "April to June and September to October.",
    travelScore: 92
  },
  "IND": {
    visaRequirements: "e-Visa available for tourists from most countries.",
    advisoryLevel: "Medium",
    languages: ["Hindi", "English", "Bengali", "Telugu", "Marathi", "Tamil"],
    currency: "Indian Rupee (INR)",
    bestTimeToVisit: "October to March",
    travelScore: 79
  },
  "JPN": {
    visaRequirements: "Visa-free for short tourist visits from many countries.",
    advisoryLevel: "Low",
    languages: ["Japanese"],
    currency: "Japanese Yen (JPY)",
    bestTimeToVisit: "March to May and October to November",
    travelScore: 88
  },
  "AUS": {
    visaRequirements: "Electronic Travel Authority (ETA) required for many visitors.",
    advisoryLevel: "Low",
    languages: ["English"],
    currency: "Australian Dollar (AUD)",
    bestTimeToVisit: "September to November and March to May",
    travelScore: 90
  }
};

interface InteractiveWorldMapProps {
  onCountrySelect: (country: CountryInfo | null) => void;
}

const InteractiveWorldMap: React.FC<InteractiveWorldMapProps> = ({ onCountrySelect }) => {
  const [countries, setCountries] = useState<{[key: string]: CountryInfo}>({});
  
  useEffect(() => {
    // Transform the sample data
    const transformedData: {[key: string]: CountryInfo} = {};
    
    Object.entries(sampleCountryData).forEach(([code, data]) => {
      const countryName = getCountryNameByCode(code);
      if (countryName) {
        transformedData[code] = {
          code,
          name: countryName,
          flagUrl: getFlagUrl(code.toLowerCase()),
          visaRequirements: data.visaRequirements || "Information not available",
          advisoryLevel: data.advisoryLevel || "Medium",
          advisoryText: data.advisoryLevel === 'Low' 
            ? 'Safe to travel with normal precautions.'
            : data.advisoryLevel === 'Medium'
            ? 'Exercise increased caution while traveling.'
            : 'Reconsider travel plans due to safety concerns.',
          travelScore: data.travelScore,
          languages: data.languages,
          currency: data.currency,
          bestTimeToVisit: data.bestTimeToVisit
        };
      }
    });
    
    setCountries(transformedData);
  }, []);

  // Helper function to get country name from ISO code
  function getCountryNameByCode(code: string): string | null {
    const countries: Record<string, string> = {
      "USA": "United States",
      "FRA": "France",
      "IND": "India",
      "JPN": "Japan",
      "AUS": "Australia",
      // Add more countries as needed
    };
    return countries[code] || null;
  }

  return (
    <div className="relative w-full h-full">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Interactive World Map
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The interactive map is currently being loaded. In the meantime, you can explore these countries:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(countries).map(([code, country]) => (
            <motion.div
              key={code}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              whileHover={{ scale: 1.02 }}
              onClick={() => onCountrySelect(country)}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={country.flagUrl} 
                  alt={`${country.name} flag`} 
                  className="w-10 h-6 object-cover rounded shadow-sm" 
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{country.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Score: {country.travelScore}/100
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Note</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  We're working on implementing a fully interactive world map. We've installed the required packages and will have it ready soon. Click on any country above to see detailed information in the side panel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveWorldMap; 