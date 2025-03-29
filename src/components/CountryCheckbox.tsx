import React, { useState } from 'react';
import { getFlagUrl, getAlternativeFlagUrl, getFlagEmoji } from '../utils/countries';

interface CountryCheckboxProps {
  countryCode: string;
  countryName: string;
  checked: boolean;
  onChange: () => void;
}

const CountryCheckbox: React.FC<CountryCheckboxProps> = ({
  countryCode,
  countryName,
  checked,
  onChange
}) => {
  const [primaryImgError, setPrimaryImgError] = useState(false);
  const [secondaryImgError, setSecondaryImgError] = useState(false);

  // Handle primary image loading error
  const handlePrimaryImgError = () => {
    setPrimaryImgError(true);
  };

  // Handle secondary image loading error
  const handleSecondaryImgError = () => {
    setSecondaryImgError(true);
  };

  return (
    <div 
      onClick={onChange}
      className={`p-3 border rounded-md cursor-pointer transition-colors ${
        checked
          ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/30 dark:border-primary-500'
          : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600'
      }`}
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <div className="ml-3 flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm bg-gray-100 border border-gray-200 flex items-center justify-center relative">
            {!primaryImgError ? (
              // Try primary flag source first
              <img
                src={getFlagUrl(countryCode, 32)}
                alt={`Flag of ${countryName}`}
                className="w-9 h-9 object-cover transform scale-110"
                onError={handlePrimaryImgError}
                style={{ 
                  borderRadius: '50%'
                }}
              />
            ) : !secondaryImgError ? (
              // Try alternative flag source if primary fails
              <img
                src={getAlternativeFlagUrl(countryCode)}
                alt={`Flag of ${countryName}`}
                className="w-9 h-9 object-cover transform scale-110"
                onError={handleSecondaryImgError}
                style={{ 
                  borderRadius: '50%'
                }}
              />
            ) : (
              // Fall back to emoji or code as last resort
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm font-medium">
                {getFlagEmoji(countryCode) || countryCode.toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">
            {countryName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountryCheckbox; 