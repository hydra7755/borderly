import React, { useState } from 'react';
import { motion } from 'framer-motion';
import InteractiveWorldMap from '../components/map/InteractiveWorldMap';
import { CountryInfo } from '../types/map';

interface WorldMapProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ isLoggedIn, onLoginRequired }) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);

  const handleCountrySelect = (country: CountryInfo | null) => {
    setSelectedCountry(country);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">World Travel Map</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore countries around the world, check visa requirements, and plan your next adventure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InteractiveWorldMap onCountrySelect={handleCountrySelect} />
        </div>
        
        <div className="lg:col-span-1">
          {selectedCountry ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center mb-4">
                <img 
                  src={selectedCountry.flagUrl} 
                  alt={`${selectedCountry.name} flag`} 
                  className="w-12 h-8 object-cover rounded shadow-sm mr-3" 
                />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCountry.name}</h2>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Travel Score</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCountry.travelScore || 'N/A'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${selectedCountry.travelScore || 0}%`, 
                      backgroundColor: (selectedCountry.travelScore || 0) >= 90 
                        ? '#22C55E' 
                        : (selectedCountry.travelScore || 0) >= 75 
                        ? '#10B981' 
                        : (selectedCountry.travelScore || 0) >= 50 
                        ? '#F59E0B' 
                        : '#EF4444' 
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">Visa Requirements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCountry.visaRequirements}</p>
                </div>
                
                <div>
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">Travel Advisory</h3>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedCountry.advisoryLevel === 'Low' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : selectedCountry.advisoryLevel === 'Medium' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {selectedCountry.advisoryLevel}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedCountry.advisoryText}</p>
                </div>
                
                {selectedCountry.languages && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">Languages</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedCountry.languages.map((language, index) => (
                        <span 
                          key={index} 
                          className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedCountry.currency && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">Currency</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCountry.currency}</p>
                  </div>
                )}
                
                {selectedCountry.bestTimeToVisit && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-1">Best Time to Visit</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCountry.bestTimeToVisit}</p>
                  </div>
                )}
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <a 
                    href="#" 
                    className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Apply for eVisa
                    <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center h-full min-h-[300px]">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">Select a Country</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
                Click on a country to view detailed travel information
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorldMap; 