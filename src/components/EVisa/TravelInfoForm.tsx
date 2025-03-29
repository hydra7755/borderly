import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ALL_COUNTRIES } from '../../utils/countries';

// Define a type for the application data
type ApplicationData = {
  purpose: string;
  entryDate: string;
  exitDate: string;
  accommodation: string;
  destination: string;
  [key: string]: any;
};

interface TravelInfoFormProps {
  data: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TravelInfoForm: React.FC<TravelInfoFormProps> = ({
  data,
  onUpdate,
  onNext,
  onBack
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ApplicationData, string>> = {};
    
    // Required fields
    if (!data.purpose) newErrors.purpose = 'Purpose of travel is required';
    if (!data.entryDate) newErrors.entryDate = 'Entry date is required';
    if (!data.exitDate) newErrors.exitDate = 'Exit date is required';
    if (!data.accommodation) newErrors.accommodation = 'Accommodation details are required';
    
    // Date validation
    if (data.entryDate && data.exitDate) {
      const entryDate = new Date(data.entryDate);
      const exitDate = new Date(data.exitDate);
      
      if (entryDate < new Date()) {
        newErrors.entryDate = 'Entry date must be in the future';
      }
      
      if (exitDate <= entryDate) {
        newErrors.exitDate = 'Exit date must be after entry date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  // Get destination country name
  const destinationCountry = ALL_COUNTRIES.find(c => c.code === data.destination);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Travel Information
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination Info */}
        <div className="mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Destination Country</h3>
            <p className="text-gray-700 dark:text-gray-300">
              {destinationCountry ? destinationCountry.name : data.destination}
            </p>
          </div>
        </div>
        
        {/* Purpose of Travel */}
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Purpose of Travel*
          </label>
          <select
            id="purpose"
            name="purpose"
            value={data.purpose}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.purpose ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select purpose</option>
            <option value="tourism">Tourism/Leisure</option>
            <option value="business">Business</option>
            <option value="study">Study/Education</option>
            <option value="medical">Medical</option>
            <option value="visiting">Visiting Family/Friends</option>
            <option value="other">Other</option>
          </select>
          {errors.purpose && (
            <p className="mt-1 text-sm text-red-500">{errors.purpose}</p>
          )}
        </div>
        
        {/* Travel Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entry Date */}
          <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Planned Entry Date*
            </label>
            <input
              type="date"
              id="entryDate"
              name="entryDate"
              value={data.entryDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.entryDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.entryDate && (
              <p className="mt-1 text-sm text-red-500">{errors.entryDate}</p>
            )}
          </div>
          
          {/* Exit Date */}
          <div>
            <label htmlFor="exitDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Planned Exit Date*
            </label>
            <input
              type="date"
              id="exitDate"
              name="exitDate"
              value={data.exitDate}
              onChange={handleChange}
              min={data.entryDate || new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.exitDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.exitDate && (
              <p className="mt-1 text-sm text-red-500">{errors.exitDate}</p>
            )}
          </div>
        </div>
        
        {/* Accommodation */}
        <div>
          <label htmlFor="accommodation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Accommodation Details*
          </label>
          <textarea
            id="accommodation"
            name="accommodation"
            value={data.accommodation}
            onChange={handleChange}
            rows={3}
            placeholder="Hotel name, address, or other accommodation details"
            className={`w-full px-4 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.accommodation ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.accommodation && (
            <p className="mt-1 text-sm text-red-500">{errors.accommodation}</p>
          )}
        </div>
        
        {/* Alert about visa processing times */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Please ensure your planned entry date allows sufficient time for visa processing.
                Standard processing times are 5-10 business days.
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <motion.button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Previous
          </motion.button>
          
          <motion.button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Next Step
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default TravelInfoForm; 