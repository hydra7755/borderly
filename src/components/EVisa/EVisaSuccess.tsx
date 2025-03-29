import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, EnvelopeIcon, PrinterIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

// Define application data type
type ApplicationData = {
  firstName: string;
  lastName: string;
  email: string;
  applicationId: string;
  status: string;
  [key: string]: any;
};

// Define props interface
interface EVisaSuccessProps {
  data: ApplicationData;
  onFinish: () => void;
}

const EVisaSuccess: React.FC<EVisaSuccessProps> = ({ data, onFinish }) => {
  // Estimated date of visa approval (7 days from now)
  const getEstimatedDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto text-center"
    >
      <div className="mb-6 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500 dark:text-green-400" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Application Submitted Successfully!
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
        Thank you, {data.firstName}. Your e-visa application has been submitted and is now being processed. We'll notify you via email once it's approved.
      </p>
      
      {/* Application Summary Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-8 mx-auto max-w-md">
        <div className="mb-4 text-left">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Application Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Application ID:</span>
              <span className="text-gray-900 dark:text-white font-medium">{data.applicationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Applicant Name:</span>
              <span className="text-gray-900 dark:text-white font-medium">{`${data.firstName} ${data.lastName}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Processing
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Estimated Approval:</span>
              <span className="text-gray-900 dark:text-white font-medium">{getEstimatedDate()}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 text-left">What's Next?</h4>
          
          <div className="space-y-3 text-left">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <EnvelopeIcon className="h-5 w-5 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  We've sent a confirmation email to <span className="font-medium">{data.email}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <DocumentTextIcon className="h-5 w-5 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  You'll receive your e-visa document via email when approved
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <PrinterIcon className="h-5 w-5 text-primary-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Print your e-visa and keep it with your passport
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tracking and Support Info */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-8 mx-auto max-w-md">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-left">Track Your Application</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 text-left">
          You can track the status of your application anytime by visiting our website and entering your application ID and email address.
        </p>
        
        <div className="flex space-x-2">
          <input
            type="text"
            readOnly
            value={data.applicationId}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(data.applicationId);
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Copy
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-left">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Need help? Contact our support team:
          </p>
          <a href="mailto:support@travelscore.com" className="text-sm text-primary-600 hover:text-primary-500">
            support@travelscore.com
          </a>
        </div>
      </div>
      
      <button
        onClick={onFinish}
        className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Back to Home
      </button>
    </motion.div>
  );
};

export default EVisaSuccess; 