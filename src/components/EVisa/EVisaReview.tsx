import React from 'react';
import { motion } from 'framer-motion';
import { getFlagUrl } from '../../utils/countries';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Define application data type
type ApplicationData = {
  // Personal Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  
  // Travel Info
  destination: string;
  purpose: string;
  entryDate: string;
  exitDate: string;
  accommodation: string;
  
  // Documents
  passportScan: File | null;
  photoId: File | null;
  additionalDocuments: File[];
  
  // Payment
  paymentMethod: string;
  cardholderName?: string;
  cardNumber?: string;
  
  // Application Info
  applicationId: string;
  [key: string]: any;
};

// Define props interface
interface EVisaReviewProps {
  data: ApplicationData;
  onSubmit: () => void;
  onBack: () => void;
}

const EVisaReview: React.FC<EVisaReviewProps> = ({ data, onSubmit, onBack }) => {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get days between two dates
  const getDaysBetween = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };
  
  // Document status
  const getDocumentStatus = (file: File | null) => {
    if (!file) return false;
    return true;
  };
  
  // Get masked card number
  const getMaskedCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return 'Not provided';
    const cleaned = cardNumber.replace(/\D/g, '');
    return `**** **** **** ${cleaned.slice(-4)}`;
  };
  
  // Estimated processing time based on destination and purpose
  const getEstimatedProcessingTime = () => {
    if (data.purpose === 'tourism') {
      return '3-5 business days';
    } else if (data.purpose === 'business') {
      return '5-7 business days';
    } else {
      return '7-10 business days';
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto"
    >
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        Review Your Application
      </h2>
      
      {/* Application ID & Warning */}
      <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Please review your information carefully
            </h3>
            <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              <p>
                Once submitted, you will not be able to edit this application. Make sure all information is correct before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Trip Details */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-2">
              <span className="text-primary-700 dark:text-primary-300 text-sm font-bold">1</span>
            </span>
            Trip Details
          </h3>
          
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
              <img 
                src={getFlagUrl(data.nationality, 64)} 
                alt={data.nationality} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="mx-2">→</div>
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
              <img 
                src={getFlagUrl(data.destination, 64)} 
                alt={data.destination} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="ml-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getDaysBetween(data.entryDate, data.exitDate)} day stay
              </span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Purpose:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.purpose.charAt(0).toUpperCase() + data.purpose.slice(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Entry Date:</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatDate(data.entryDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Exit Date:</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatDate(data.exitDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Accommodation:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.accommodation || 'Not provided'}</span>
            </div>
          </div>
        </div>
        
        {/* Personal Information */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-2">
              <span className="text-primary-700 dark:text-primary-300 text-sm font-bold">2</span>
            </span>
            Personal Information
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Full Name:</span>
              <span className="text-gray-900 dark:text-white font-medium">{`${data.firstName} ${data.lastName}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Date of Birth:</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatDate(data.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Gender:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Phone:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Passport Number:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.passportNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Passport Expiry:</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatDate(data.passportExpiryDate)}</span>
            </div>
          </div>
        </div>
        
        {/* Document Verification */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-2">
              <span className="text-primary-700 dark:text-primary-300 text-sm font-bold">3</span>
            </span>
            Document Verification
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center">
              <CheckCircleIcon className={`h-5 w-5 ${getDocumentStatus(data.passportScan) ? 'text-green-500' : 'text-red-500'}`} />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Passport Scan</span>
              {data.passportScan && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{data.passportScan.name}</span>
              )}
            </div>
            
            <div className="flex items-center">
              <CheckCircleIcon className={`h-5 w-5 ${getDocumentStatus(data.photoId) ? 'text-green-500' : 'text-red-500'}`} />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Photo ID</span>
              {data.photoId && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{data.photoId.name}</span>
              )}
            </div>
            
            <div className="flex items-center">
              <CheckCircleIcon className={`h-5 w-5 ${data.additionalDocuments.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Supporting Documents</span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {data.additionalDocuments.length > 0 
                  ? `${data.additionalDocuments.length} file(s)` 
                  : 'None (Optional)'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Payment Information */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-2">
              <span className="text-primary-700 dark:text-primary-300 text-sm font-bold">4</span>
            </span>
            Payment Information
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Payment Method:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {data.paymentMethod === 'card' ? 'Credit Card' : 
                 data.paymentMethod === 'paypal' ? 'PayPal' : 'Bank Transfer'}
              </span>
            </div>
            
            {data.paymentMethod === 'card' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cardholder:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{data.cardholderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Card Number:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{getMaskedCardNumber(data.cardNumber)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Application Fee:</span>
              <span className="text-gray-900 dark:text-white font-medium">£79.99</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Processing Fee:</span>
              <span className="text-gray-900 dark:text-white font-medium">£4.99</span>
            </div>
            
            {/* Subscription discount - this would need to be checked from user's actual subscription */}
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>Premium/Enterprise Discount (10%):</span>
              <span className="font-medium">-£8.50</span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Total Paid:</span>
              <span className="text-primary-600 font-medium">£76.48</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Next Steps & Processing Time */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Next Steps</h3>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p>
            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full mr-2 text-xs">1</span>
            Submit your application for processing
          </p>
          <p>
            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full mr-2 text-xs">2</span>
            Application review by our visa specialists (Estimated time: {getEstimatedProcessingTime()})
          </p>
          <p>
            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full mr-2 text-xs">3</span>
            Receive your e-visa via email once approved
          </p>
          <p>
            <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full mr-2 text-xs">4</span>
            Print your e-visa and present it upon arrival
          </p>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Your application ID: <span className="font-medium text-gray-700 dark:text-gray-300">{data.applicationId}</span>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Back
        </button>
        
        <button
          onClick={onSubmit}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Submit Application
        </button>
      </div>
    </motion.div>
  );
};

export default EVisaReview; 