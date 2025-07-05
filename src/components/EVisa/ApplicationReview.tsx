import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, DocumentTextIcon, IdentificationIcon, CalendarIcon, PhoneIcon, MapPinIcon, BriefcaseIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { VisaApplicationData } from './VisaApplicationForm';

interface ApplicationReviewProps {
  applicationData: VisaApplicationData;
  onClose: () => void;
  onViewApplications: () => void;
}

const ApplicationReview: React.FC<ApplicationReviewProps> = ({ 
  applicationData, 
  onClose,
  onViewApplications
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Filter out any sensitive data from the application data
  const safeApplicationData = React.useMemo(() => {
    const { passportData, ...rest } = applicationData;
    
    // Create a safe copy of passport data without any sensitive fields
    const safePassportData = { ...passportData };
    
    // Remove any potential sensitive fields
    delete safePassportData.mrz1;
    delete safePassportData.mrz2;
    
    return {
      ...rest,
      passportData: safePassportData,
    };
  }, [applicationData]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-3xl mx-auto"
    >
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Submitted Successfully</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your visa application has been received and is being processed.
        </p>
        <div className="mt-3 inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
          <p className="text-blue-700 dark:text-blue-300 font-medium">
            Application ID: {safeApplicationData.applicationId}
          </p>
        </div>
      </div>
      
      {/* Application Details */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-primary-600" />
          Application Details
        </h3>
        
        <div className="space-y-6">
          {/* Applicant Information */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <IdentificationIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Applicant Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {safeApplicationData.passportData.fullName || `${safeApplicationData.passportData.firstName} ${safeApplicationData.passportData.lastName}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Passport Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.passportData.passportNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nationality</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.passportData.nationality}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(safeApplicationData.passportData.dateOfBirth || '')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.passportData.gender || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Passport Expiry</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(safeApplicationData.passportData.expiryDate || '')}</p>
              </div>
            </div>
          </div>
          
          {/* Travel Information */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Travel Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Purpose of Travel</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.travelPurpose}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Previous Visit</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.previousVisit ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Arrival Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(safeApplicationData.arrivalDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Departure Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(safeApplicationData.departureDate)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Accommodation</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.accommodation}</p>
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Contact & Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Occupation</p>
                <p className="font-medium text-gray-900 dark:text-white">{safeApplicationData.occupation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Application Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(safeApplicationData.applicationDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Information */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6 border border-yellow-100 dark:border-yellow-800">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">What happens next?</h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-200">
          Your application is now under review. You will receive an email notification at {safeApplicationData.email} once your visa application has been processed. 
          This typically takes 3-5 business days.
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onViewApplications}
          className="px-6 py-3 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          View My Applications
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </motion.div>
  );
};

export default ApplicationReview;
