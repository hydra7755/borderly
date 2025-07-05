import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ALL_COUNTRIES, getFlagUrl } from '../utils/countries';
import { generateVisaProductForCountry } from '../utils/visaProductGenerator';
import { VisaProduct } from '../types/visaProduct';

const VisaCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedVisaType, setSelectedVisaType] = useState<string>('all');
  const [visaProducts, setVisaProducts] = useState<VisaProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Define regions for filtering
  const regions: Record<string, string[]> = {
    'all': [],
    'europe': ['al', 'ad', 'at', 'by', 'be', 'ba', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'is', 'ie', 'it', 'lv', 'li', 'lt', 'lu', 'mt', 'md', 'mc', 'me', 'nl', 'mk', 'no', 'pl', 'pt', 'ro', 'ru', 'sm', 'rs', 'sk', 'si', 'es', 'se', 'ch', 'ua', 'gb', 'va'],
    'asia': ['af', 'am', 'az', 'bh', 'bd', 'bt', 'bn', 'kh', 'cn', 'cy', 'ge', 'in', 'id', 'ir', 'iq', 'il', 'jp', 'jo', 'kz', 'kw', 'kg', 'la', 'lb', 'my', 'mv', 'mn', 'mm', 'np', 'kp', 'om', 'pk', 'ps', 'ph', 'qa', 'sa', 'sg', 'kr', 'lk', 'sy', 'tw', 'tj', 'th', 'tl', 'tr', 'tm', 'ae', 'uz', 'vn', 'ye'],
    'africa': ['dz', 'ao', 'bj', 'bw', 'bf', 'bi', 'cv', 'cm', 'cf', 'td', 'km', 'cg', 'cd', 'ci', 'dj', 'eg', 'gq', 'er', 'sz', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'ls', 'lr', 'ly', 'mg', 'mw', 'ml', 'mr', 'mu', 'ma', 'mz', 'na', 'ne', 'ng', 'rw', 'st', 'sn', 'sc', 'sl', 'so', 'za', 'ss', 'sd', 'tz', 'tg', 'tn', 'ug', 'zm', 'zw'],
    'north-america': ['ag', 'bs', 'bb', 'bz', 'ca', 'cr', 'cu', 'dm', 'do', 'sv', 'gd', 'gt', 'ht', 'hn', 'jm', 'mx', 'ni', 'pa', 'kn', 'lc', 'vc', 'tt', 'us'],
    'south-america': ['ar', 'bo', 'br', 'cl', 'co', 'ec', 'gy', 'py', 'pe', 'sr', 'uy', 've'],
    'oceania': ['au', 'fj', 'ki', 'mh', 'fm', 'nr', 'nz', 'pw', 'pg', 'ws', 'sb', 'to', 'tv', 'vu']
  };

  // Load visa products on component mount
  useEffect(() => {
    const loadVisaProducts = async () => {
      setLoading(true);
      
      // For demo purposes, we'll load just a subset of countries to avoid performance issues
      // In a production environment, you might want to implement pagination
      const sampleCountries = [
        'us', 'ca', 'gb', 'fr', 'de', 'jp', 'au', 'cn', 'in', 'br', 
        'za', 'eg', 'ng', 'ru', 'sg', 'th', 'vn', 'tr', 'mx', 'ar'
      ];
      
      // Use your cloud name here
      const cloudName = 'travelscore'; // Replace with your actual Cloudinary cloud name
      
      // Generate visa products for sample countries
      const products = sampleCountries
        .map(code => generateVisaProductForCountry(code, cloudName))
        .filter((product): product is VisaProduct => product !== null);
      
      setVisaProducts(products);
      setLoading(false);
    };
    
    loadVisaProducts();
  }, []);

  // Filter countries based on search term, region, and visa type
  const filteredCountries = visaProducts.filter(product => {
    const matchesSearch = product.countryName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || regions[selectedRegion]?.includes(product.countryCode);
    const matchesVisaType = selectedVisaType === 'all' || product.visaType === selectedVisaType;
    
    return matchesSearch && matchesRegion && matchesVisaType;
  });

  // Get visa type label
  const getVisaTypeLabel = (type: VisaProduct['visaType']) => {
    switch (type) {
      case 'visa-free': return 'Visa-Free';
      case 'evisa': return 'eVisa';
      case 'visa-on-arrival': return 'Visa on Arrival';
      case 'eta': return 'ETA';
      case 'visa-required': return 'Visa Required';
      default: return 'Unknown';
    }
  };

  // Get visa type color class
  const getVisaTypeColorClass = (type: VisaProduct['visaType']) => {
    switch (type) {
      case 'visa-free': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'evisa': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'visa-on-arrival': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'eta': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'visa-required': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Visa Requirements Catalog
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Explore visa requirements for countries around the world
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:px-6 rounded-lg mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Country
              </label>
              <input
                type="text"
                id="search"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md"
                placeholder="Enter country name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Region Filter */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region
              </label>
              <select
                id="region"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">All Regions</option>
                <option value="europe">Europe</option>
                <option value="asia">Asia</option>
                <option value="africa">Africa</option>
                <option value="north-america">North America</option>
                <option value="south-america">South America</option>
                <option value="oceania">Oceania</option>
              </select>
            </div>

            {/* Visa Type Filter */}
            <div>
              <label htmlFor="visa-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visa Type
              </label>
              <select
                id="visa-type"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md"
                value={selectedVisaType}
                onChange={(e) => setSelectedVisaType(e.target.value)}
              >
                <option value="all">All Visa Types</option>
                <option value="visa-free">Visa-Free</option>
                <option value="evisa">eVisa</option>
                <option value="visa-on-arrival">Visa on Arrival</option>
                <option value="eta">ETA</option>
                <option value="visa-required">Visa Required</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 px-4 sm:px-0">
              <p className="text-sm text-gray-700 dark:text-gray-400">
                Showing <span className="font-medium">{filteredCountries.length}</span> countries
              </p>
            </div>

            {/* Country Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCountries.map((product) => (
                <Link
                  key={product.countryCode}
                  to={`/visa/${product.countryCode}`}
                  className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative h-40">
                    <img
                      src={product.images[0]}
                      alt={product.countryName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                      <div className="p-4 w-full">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-white">
                            {product.countryName}
                          </h3>
                          <img
                            src={getFlagUrl(product.countryCode, 32)}
                            alt={`${product.countryName} flag`}
                            className="w-8 h-8 rounded-full border-2 border-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVisaTypeColorClass(product.visaType)}`}>
                        {getVisaTypeLabel(product.visaType)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Stay: {product.lengthOfStay}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {product.entryType === 'multiple' ? 'Multiple Entry' : 'Single Entry'}
                      </span>
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* No Results */}
            {filteredCountries.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No countries found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VisaCatalog;
