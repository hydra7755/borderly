import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VisaProductPage from '../components/VisaProducts/VisaProductPage';
import { generateVisaProductForCountry } from '../utils/visaProductGenerator';
import { ALL_COUNTRIES } from '../utils/countries';
import { getCountryNameFromCode } from '../lib/api/visaRequirements';
import type { VisaProduct } from '../types/visaProduct';

// Cloudinary config from index.js
const CLOUDINARY_CONFIG = {
  cloudName: 'drdpxs3je',
  apiKey: '479125649733174',
  apiSecret: 'i1JrD6qfTl_87WEx1OvJQ_DL3zg'
};

const VisaProduct: React.FC = () => {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<VisaProduct | null>(null);
  const [countryName, setCountryName] = useState<string>('');

  // Use useCallback to prevent this function from being recreated on every render
  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(`/visa/${e.target.value}`);
  }, [navigate]);

  // Load visa product data for the selected country
  const loadProductData = useCallback(async (code: string, mounted: boolean) => {
    try {
      // Get full country name
      const fullCountryName = getCountryNameFromCode(code);
      
      if (!fullCountryName) {
        if (mounted) {
          setError(`Invalid country code: ${code}`);
          setLoading(false);
        }
        return;
      }
      
      if (mounted) setCountryName(fullCountryName);
      
      // Use the cloudName from our configuration
      const product = generateVisaProductForCountry(code, CLOUDINARY_CONFIG.cloudName);
      
      if (!product) {
        if (mounted) {
          setError(`No visa information found for ${fullCountryName}`);
          setLoading(false);
        }
        return;
      }
      
      // Batch state updates together
      if (mounted) {
        setProductData(product);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error generating visa product data:', err);
      if (mounted) {
        setError('Failed to load visa information. Please try again later.');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setError('Country code is required');
      setLoading(false);
      return;
    }

    let isMounted = true; // Flag to prevent state updates after unmount

    // Only fetch when mounted and reset states on countryCode change
    setLoading(true);
    setError(null);
    setProductData(null);
    
    loadProductData(countryCode, isMounted);

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [countryCode, loadProductData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Error</h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => navigate('/visa')}
            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            Go to Visa Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Country Selector */}
      <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2 sm:mb-0">
              Visa Requirements for {countryName}
            </h2>
            
            <div className="flex items-center">
              <label htmlFor="country-select" className="mr-2 text-gray-700 dark:text-gray-300">
                Select Country:
              </label>
              <select
                id="country-select"
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                value={countryCode}
                onChange={handleCountryChange}
              >
                {ALL_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {productData && <VisaProductPage product={productData} />}
    </div>
  );
};

export default VisaProduct;
