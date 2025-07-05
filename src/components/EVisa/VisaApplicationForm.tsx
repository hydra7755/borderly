import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ExtractedPassportData } from './PassportScan';

interface VisaApplicationFormProps {
  passportData: Partial<ExtractedPassportData>;
  passportFile: File;
  onBack: () => void;
  onSubmit: (applicationData: VisaApplicationData) => void;
  userEmail?: string;
  nationalityCode: string;
  destinationCode: string;
  applicationId: string;
}

export interface VisaApplicationData {
  // Passport data
  passportData: Partial<ExtractedPassportData>;
  passportFile: File;
  
  // Additional application data
  travelPurpose: string;
  arrivalDate: string;
  departureDate: string;
  phoneNumber: string;
  accommodation: string;
  previousVisit: boolean;
  occupation: string;
  email: string;
  
  // Metadata
  applicationDate: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  applicationId: string;
}

const VisaApplicationForm: React.FC<VisaApplicationFormProps> = ({ 
  passportData, 
  passportFile, 
  onBack, 
  onSubmit,
  userEmail = '',
  nationalityCode,
  destinationCode,
  applicationId
}) => {
  const [formData, setFormData] = useState({
    travelPurpose: '',
    arrivalDate: '',
    departureDate: '',
    phoneNumber: '',
    accommodation: '',
    previousVisit: false,
    occupation: '',
    email: userEmail
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validate form when any field changes
  useEffect(() => {
    validateForm();
  }, [formData]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.travelPurpose) newErrors.travelPurpose = 'Please select a purpose for your travel';
    if (!formData.arrivalDate) newErrors.arrivalDate = 'Please select your arrival date';
    if (!formData.departureDate) newErrors.departureDate = 'Please select your departure date';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Please enter your phone number';
    if (!formData.accommodation) newErrors.accommodation = 'Please enter your accommodation details';
    if (!formData.occupation) newErrors.occupation = 'Please enter your current occupation';
    
    // Date validation
    if (formData.arrivalDate && formData.departureDate) {
      const arrival = new Date(formData.arrivalDate);
      const departure = new Date(formData.departureDate);
      const today = new Date();
      
      if (arrival < today) {
        newErrors.arrivalDate = 'Arrival date cannot be in the past';
      }
      
      if (departure <= arrival) {
        newErrors.departureDate = 'Departure date must be after arrival date';
      }
    }
    
    // Phone number validation
    if (formData.phoneNumber && !/^\+?[0-9\s\-()]{8,20}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Generate a unique application ID
      const applicationId = `VISA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      // Create the complete application data
      const applicationData: VisaApplicationData = {
        passportData,
        passportFile,
        ...formData,
        previousVisit: formData.previousVisit,
        email: formData.email || userEmail,
        applicationDate: new Date().toISOString(),
        applicationStatus: 'pending',
        applicationId
      };
      
      // Submit the application
      setTimeout(() => {
        onSubmit(applicationData);
        setIsSubmitting(false);
      }, 1000); // Simulate API call
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Visa Application Form</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Please provide the following information to complete your visa application.
      </p>
      
      {/* Passport Information Summary */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="text-md font-medium text-blue-800 dark:text-blue-200 mb-2">Passport Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">Name:</span> {passportData.fullName || `${passportData.firstName} ${passportData.lastName}`}</div>
          <div><span className="font-medium">Passport Number:</span> {passportData.passportNumber}</div>
          <div><span className="font-medium">Nationality:</span> {passportData.nationality}</div>
          <div><span className="font-medium">Date of Birth:</span> {passportData.dateOfBirth}</div>
          <div><span className="font-medium">Gender:</span> {passportData.gender || 'Not specified'}</div>
          <div><span className="font-medium">Expiry Date:</span> {passportData.expiryDate}</div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Travel Purpose */}
        <div className="mb-4">
          <label htmlFor="travelPurpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            What is the purpose of your travel?*
          </label>
          <select
            id="travelPurpose"
            name="travelPurpose"
            value={formData.travelPurpose}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.travelPurpose ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
            required
          >
            <option value="">Select purpose</option>
            <option value="Tourism">Tourism</option>
            <option value="Business">Business</option>
            <option value="Transit">Transit</option>
            <option value="Medical">Medical</option>
            <option value="Other">Other</option>
          </select>
          {errors.travelPurpose && <p className="mt-1 text-sm text-red-600">{errors.travelPurpose}</p>}
        </div>
        
        {/* Travel Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What is your planned date of arrival?*
            </label>
            <input
              type="date"
              id="arrivalDate"
              name="arrivalDate"
              value={formData.arrivalDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.arrivalDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
              required
            />
            {errors.arrivalDate && <p className="mt-1 text-sm text-red-600">{errors.arrivalDate}</p>}
          </div>
          
          <div>
            <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What is your planned date of departure?*
            </label>
            <input
              type="date"
              id="departureDate"
              name="departureDate"
              value={formData.departureDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.departureDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
              required
            />
            {errors.departureDate && <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>}
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            What is your contact phone number?*
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            className={`w-full px-3 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
            required
          />
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
        </div>
        
        {/* Accommodation */}
        <div className="mb-4">
          <label htmlFor="accommodation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Where will you be staying during your trip?*
          </label>
          <textarea
            id="accommodation"
            name="accommodation"
            value={formData.accommodation}
            onChange={handleChange}
            placeholder="Address of hotel, friend, or business"
            rows={3}
            className={`w-full px-3 py-2 border ${errors.accommodation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
            required
          />
          {errors.accommodation && <p className="mt-1 text-sm text-red-600">{errors.accommodation}</p>}
        </div>
        
        {/* Previous Visit */}
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="previousVisit"
              name="previousVisit"
              checked={formData.previousVisit}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="previousVisit" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Have you visited this country before?
            </label>
          </div>
        </div>
        
        {/* Occupation */}
        <div className="mb-6">
          <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            What is your current occupation?*
          </label>
          <input
            type="text"
            id="occupation"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            placeholder="Your current job title or occupation"
            className={`w-full px-3 py-2 border ${errors.occupation ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white`}
            required
          />
          {errors.occupation && <p className="mt-1 text-sm text-red-600">{errors.occupation}</p>}
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className={`flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors`}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
            className={`flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting || Object.keys(errors).length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5 mr-2" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default VisaApplicationForm;
