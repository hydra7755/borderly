import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateAllVisaProducts } from '../utils/visaProductGenerator';
import { VisaProduct } from '../types/visaProduct';
import { ALL_COUNTRIES } from '../utils/countries';

const VisaProductBrowser: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visaProducts, setVisaProducts] = useState<VisaProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VisaProduct[]>([]);
  const [visaTypeFilter, setVisaTypeFilter] = useState<string>('all');

  useEffect(() => {
    // Generate all visa products
    const cloudName = 'travelscore'; // Replace with your actual Cloudinary cloud name
    const products = generateAllVisaProducts(cloudName);
    setVisaProducts(products);
    setFilteredProducts(products);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Filter products based on search term and visa type
    let filtered = visaProducts;
    
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.countryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (visaTypeFilter !== 'all') {
      filtered = filtered.filter(product => product.visaType === visaTypeFilter);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, visaTypeFilter, visaProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleVisaTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVisaTypeFilter(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Visa Products</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Country
            </label>
            <input
              type="text"
              id="search"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search for a country..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="w-full md:w-64">
            <label htmlFor="visaType" className="block text-sm font-medium text-gray-700 mb-1">
              Visa Type
            </label>
            <select
              id="visaType"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={visaTypeFilter}
              onChange={handleVisaTypeFilter}
            >
              <option value="all">All Visa Types</option>
              <option value="visa-free">Visa Free</option>
              <option value="evisa">eVisa</option>
              <option value="visa-on-arrival">Visa on Arrival</option>
              <option value="eta">ETA</option>
              <option value="visa-required">Visa Required</option>
            </select>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          Showing {filteredProducts.length} of {visaProducts.length} visa products
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Link 
            key={product.countryCode} 
            to={`/visa/${product.countryCode}`}
            className="block"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-200 relative">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.countryName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-white font-bold text-lg">{product.countryName}</h3>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.visaType === 'visa-free' ? 'bg-green-100 text-green-800' :
                    product.visaType === 'evisa' ? 'bg-blue-100 text-blue-800' :
                    product.visaType === 'visa-on-arrival' ? 'bg-yellow-100 text-yellow-800' :
                    product.visaType === 'eta' ? 'bg-purple-100 text-purple-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.visaType === 'visa-free' ? 'Visa Free' :
                     product.visaType === 'evisa' ? 'eVisa' :
                     product.visaType === 'visa-on-arrival' ? 'Visa on Arrival' :
                     product.visaType === 'eta' ? 'ETA' :
                     'Visa Required'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Stay: {product.lengthOfStay}</p>
                  <p>Processing: {typeof product.processingTime === 'object' ? product.processingTime.normal : product.processingTime}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">No visa products found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default VisaProductBrowser;
