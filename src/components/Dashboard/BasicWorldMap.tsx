import React, { useState } from 'react';
import { VisaRequirement, VisaTypeColors } from '../../types/visaRequirements';
import { getCountryName } from '../../data/countryCodes';
import { getVisaRequirementsForCountry } from '../../data/visaRequirements';

interface BasicWorldMapProps {
  userNationality: string;
  onCountrySelect: (countryCode: string, visaDetails: VisaRequirement) => void;
}

// Common country codes for popular destinations
const popularCountries = [
  'US', 'CA', 'GB', 'FR', 'DE', 'ES', 'IT', 'JP', 'CN', 'AU', 
  'NZ', 'BR', 'MX', 'IN', 'RU', 'ZA', 'AE', 'TH', 'EG', 'SG'
];

const BasicWorldMap: React.FC<BasicWorldMapProps> = ({ userNationality, onCountrySelect }) => {
  const visaRequirements = getVisaRequirementsForCountry(userNationality);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // Group countries by region
  const regions = {
    'Europe': ['GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'CH', 'SE', 'NO', 'FI', 'DK', 'AT', 'PT', 'GR', 'IE'],
    'North America': ['US', 'CA', 'MX'],
    'South America': ['BR', 'AR', 'CO', 'PE', 'CL', 'VE'],
    'Asia': ['CN', 'JP', 'IN', 'KR', 'SG', 'TH', 'VN', 'MY', 'ID', 'PH'],
    'Middle East': ['AE', 'SA', 'QA', 'IL', 'TR', 'EG', 'JO'],
    'Africa': ['ZA', 'NG', 'KE', 'MA', 'EG', 'GH', 'TZ'],
    'Oceania': ['AU', 'NZ', 'FJ', 'PG']
  };

  const handleCountryClick = (countryCode: string) => {
    const visaInfo = visaRequirements[countryCode];
    if (visaInfo) {
      onCountrySelect(countryCode, visaInfo);
    }
  };

  // Get class based on visa type
  const getVisaClass = (countryCode: string) => {
    if (countryCode === userNationality) return 'bg-gray-600 text-white';
    
    const visaInfo = visaRequirements[countryCode];
    if (!visaInfo) return 'bg-gray-100 text-gray-800';
    
    switch(visaInfo.visaType) {
      case 'visa-free': return 'bg-teal-600 text-white hover:bg-teal-700';
      case 'e-visa': return 'bg-teal-400 text-white hover:bg-teal-500';
      case 'visa-on-arrival': return 'bg-teal-300 text-teal-900 hover:bg-teal-400';
      case 'visa-required': return 'bg-teal-900 text-white hover:bg-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Visa Requirements Map</h3>
        <p className="text-gray-600 my-2">
          Explore visa requirements for your {getCountryName(userNationality)} passport.
        </p>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['visa-free'] }}></div>
            <span>Visa-Free</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['e-visa'] }}></div>
            <span>eVisa</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['visa-on-arrival'] }}></div>
            <span>Visa on Arrival</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['visa-required'] }}></div>
            <span>Visa Required</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1 bg-gray-600"></div>
            <span>Your Country</span>
          </div>
        </div>
        
        {/* Region tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(regions).map((region) => (
            <button
              key={region}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedRegion === region 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedRegion(region === selectedRegion ? null : region)}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {selectedRegion ? (
          <>
            <h4 className="font-medium mb-3">{selectedRegion}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {regions[selectedRegion as keyof typeof regions].map(countryCode => (
                <button
                  key={countryCode}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center text-center shadow-sm transition-colors ${getVisaClass(countryCode)}`}
                  onClick={() => handleCountryClick(countryCode)}
                >
                  <span className="font-medium">{getCountryName(countryCode)}</span>
                  {visaRequirements[countryCode] && (
                    <span className="text-xs mt-1 capitalize">{visaRequirements[countryCode].visaType.replace('-', ' ')}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h4 className="font-medium mb-3">Popular Destinations</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {popularCountries.map(countryCode => (
                <button
                  key={countryCode}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center text-center shadow-sm transition-colors ${getVisaClass(countryCode)}`}
                  onClick={() => handleCountryClick(countryCode)}
                >
                  <span className="font-medium">{getCountryName(countryCode)}</span>
                  {visaRequirements[countryCode] && (
                    <span className="text-xs mt-1 capitalize">{visaRequirements[countryCode].visaType.replace('-', ' ')}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200">
        Select a country to see detailed visa requirements
      </div>
    </div>
  );
};

export default BasicWorldMap; 