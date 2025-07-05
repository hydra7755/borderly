import React from 'react';
import { VisaRequirement } from '../../types/visa';
import { motion, AnimatePresence } from 'framer-motion';

interface CountryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryName: string;
  countryCode: string;
  visaDetails: VisaRequirement;
  onSaveToList?: () => void;
}

const CountryDetailsModal: React.FC<CountryDetailsModalProps> = ({
  isOpen,
  onClose,
  countryName,
  countryCode,
  visaDetails,
  onSaveToList
}) => {
  if (!isOpen) return null;

  // Helper function to get the formatted requirement type
  const getVisaTypeDisplay = (requirement: string): string => {
    return requirement.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  // Helper function to get duration from requirement type
  const getDuration = (requirementType: string): string => {
    switch (requirementType) {
      case 'visa-free':
        return '90 days';
      case 'visa-on-arrival':
        return '30 days';
      case 'evisa':
        return 'Variable';
      case 'visa-required':
        return 'As per visa';
      default:
        return 'Check with embassy';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md w-full bg-white rounded-t-lg md:rounded-lg shadow-lg z-50"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{countryName}</h3>
                  <p className="text-gray-500">{countryCode}</p>
                </div>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={onClose}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-lg mb-2">Visa Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{getVisaTypeDisplay(visaDetails.requirement)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maximum Stay:</span>
                      <span className="font-medium">{getDuration(visaDetails.requirement)}</span>
                    </div>
                  </div>
                </div>
                
                {visaDetails.requirement === 'visa-required' && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-lg mb-2 text-yellow-800">Visa Requirements</h4>
                    <p className="text-sm text-yellow-700">
                      A traditional visa is required for this destination. You may need to submit an application at the embassy or consulate, which typically requires documentation like passport, photos, and proof of travel purpose.
                    </p>
                  </div>
                )}
                
                {visaDetails.requirement === 'evisa' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-lg mb-2 text-blue-800">eVisa Information</h4>
                    <p className="text-sm text-blue-700">
                      This destination offers an electronic visa which can be applied for online. The process is typically faster than traditional visas but may still require documentation uploads.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex-1"
                    onClick={onSaveToList}
                  >
                    Save to My List
                  </button>
                  <button
                    className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex-1"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CountryDetailsModal; 