import React from 'react';
import { motion } from 'framer-motion';
import { ALL_COUNTRIES } from '../../utils/countries';

interface EVisaHeaderProps {
  nationalityCode: string;
  destinationCode: string;
  applicationId?: string;
}

const EVisaHeader: React.FC<EVisaHeaderProps> = ({ 
  nationalityCode, 
  destinationCode,
  applicationId = 'EV-122534' // Default value if not provided
}) => {
  // Convert country codes to lowercase for file paths
  const nationalityPath = nationalityCode.toLowerCase();
  const destinationPath = destinationCode.toLowerCase();

  // Get country names from the ALL_COUNTRIES list
  const nationalityCountry = ALL_COUNTRIES.find(c => c.code.toLowerCase() === nationalityPath);
  const destinationCountry = ALL_COUNTRIES.find(c => c.code.toLowerCase() === destinationPath);

  return (
    <div className="w-full py-4">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          eVisa Application
        </h1>
        
        <div className="flex items-center justify-center space-x-4 mb-3">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden">
              <img 
                src={`/images/country-flags-main/svg/${nationalityPath}.svg`} 
                alt={nationalityCountry?.name || nationalityCode} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback in case SVG doesn't load
                  (e.target as HTMLImageElement).src = `https://flagcdn.com/w160/${nationalityPath}.png`;
                }}
              />
            </div>
            <span className="text-sm text-gray-600 mt-1">{nationalityCountry?.name || nationalityCode}</span>
          </div>
          
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden">
              <img 
                src={`/images/country-flags-main/svg/${destinationPath}.svg`} 
                alt={destinationCountry?.name || destinationCode} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback in case SVG doesn't load
                  (e.target as HTMLImageElement).src = `https://flagcdn.com/w160/${destinationPath}.png`;
                }}
              />
            </div>
            <span className="text-sm text-gray-600 mt-1">{destinationCountry?.name || destinationCode}</span>
          </div>
        </div>
        
        {applicationId && (
          <div className="text-sm text-gray-500">
            Application ID: {applicationId}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EVisaHeader; 