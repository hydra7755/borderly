import React, { useState, useRef, useEffect } from 'react';
import { ALL_COUNTRIES, getFlagUrl, getAlternativeFlagUrl, getFlagEmoji } from '../utils/countries';

interface CountrySelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}

// Component to render flag with fallbacks
const CountryFlag: React.FC<{ countryCode: string, countryName: string }> = ({ countryCode, countryName }) => {
  const [primaryImgError, setPrimaryImgError] = useState(false);
  const [secondaryImgError, setSecondaryImgError] = useState(false);

  return (
    <div className="relative w-6 h-6 mr-3 flex-shrink-0">
      {!primaryImgError ? (
        <img 
          src={getFlagUrl(countryCode, 64)} 
          alt={`${countryName} flag`}
          className="w-full h-full object-cover rounded-full border border-gray-200 dark:border-gray-700"
          loading="lazy"
          onError={() => setPrimaryImgError(true)}
        />
      ) : !secondaryImgError ? (
        <img 
          src={getAlternativeFlagUrl(countryCode)} 
          alt={`${countryName} flag`}
          className="w-full h-full object-cover rounded-full border border-gray-200 dark:border-gray-700"
          loading="lazy"
          onError={() => setSecondaryImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
          {getFlagEmoji(countryCode) || countryCode.toUpperCase()}
        </div>
      )}
    </div>
  );
};

const CountrySelect: React.FC<CountrySelectProps> = ({
  id,
  value,
  onChange,
  label,
  placeholder = 'Select a country',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLUListElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle selection
  const handleSelect = (countryCode: string) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Filter countries based on search term
  const filteredCountries = searchTerm.trim() === '' 
    ? ALL_COUNTRIES // Show all countries when no search term is entered
    : ALL_COUNTRIES.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Always show all filtered countries (no limit)
  const displayCountries = filteredCountries;

  // Get selected country details
  const selectedCountry = ALL_COUNTRIES.find(c => c.code === value);

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Custom select button */}
      <button
        type="button"
        id={id}
        className="w-full flex items-center justify-between bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm px-4 py-3 text-left focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          {selectedCountry ? (
            <>
              <CountryFlag countryCode={selectedCountry.code} countryName={selectedCountry.name} />
              <span className="text-gray-900 dark:text-white">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
        <span className="ml-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/50 z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden border border-gray-300">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">
                {displayCountries.length} countries found
              </div>
            </div>
            
            {/* Country list */}
            <div className="max-h-[60vh] overflow-y-auto">
              {displayCountries.length > 0 ? (
                <ul 
                  ref={dropdownListRef}
                  className="grid grid-cols-1 gap-1 p-2"
                  role="listbox"
                >
                  {displayCountries.map(country => (
                    <li
                      key={country.code}
                      className={`cursor-pointer select-none relative p-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md ${
                        value === country.code ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                      }`}
                      onClick={() => handleSelect(country.code)}
                      role="option"
                      aria-selected={value === country.code}
                    >
                      <div className="flex items-center w-full">
                        <CountryFlag countryCode={country.code} countryName={country.name} />
                        <span className={`block truncate ${
                          value === country.code ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {country.name}
                        </span>
                      </div>
                      
                      {/* Check mark for selected option */}
                      {value === country.code && (
                        <span className="absolute right-3 flex items-center text-primary-600 dark:text-primary-400">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 px-3 text-gray-500 dark:text-gray-400 text-center">
                  No countries found
                </p>
              )}
            </div>
            
            {/* Close button */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelect; 