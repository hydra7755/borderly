import React from 'react';
import { VisaTypeColors } from '../../types/visaRequirements';
import { motion } from 'framer-motion';

interface SavedCountriesProps {
  countries: Array<{
    code: string;
    name: string;
    visaType: string;
  }>;
  onRemoveCountry: (code: string) => void;
}

const SavedCountries: React.FC<SavedCountriesProps> = ({ countries, onRemoveCountry }) => {
  if (countries.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>No countries saved yet. Explore the map and save countries to your list.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {countries.map((country, index) => (
        <motion.div 
          key={country.code}
          className="bg-gray-50 p-3 rounded-lg flex items-center justify-between group hover:bg-gray-100 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center">
            <div 
              className="w-4 h-4 mr-3 rounded-sm" 
              style={{ 
                backgroundColor: VisaTypeColors[country.visaType as keyof typeof VisaTypeColors] || '#E5E7EB' 
              }} 
            />
            <div>
              <p className="font-medium">{country.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {country.visaType === 'unknown' ? 'Visa status unknown' : country.visaType.replace('-', ' ')}
              </p>
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            onClick={() => onRemoveCountry(country.code)}
            aria-label={`Remove ${country.name}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default SavedCountries; 