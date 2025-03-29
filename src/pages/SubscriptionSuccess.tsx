import React from 'react';
import { motion } from 'framer-motion';

interface SubscriptionSuccessProps {
  subscriptionType: 'premium' | 'enterprise';
  billingCycle: 'monthly' | 'annual' | 'lifetime';
  onContinue: () => void;
}

const SubscriptionSuccess: React.FC<SubscriptionSuccessProps> = ({ 
  subscriptionType, 
  billingCycle,
  onContinue
}) => {
  // Format subscription details for display
  const getSubscriptionDetails = () => {
    const plan = subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
    
    if (billingCycle === 'monthly') {
      return `${plan} Monthly Plan`;
    } else if (billingCycle === 'annual') {
      return `${plan} Annual Plan`;
    } else {
      return `${plan} Lifetime Plan`;
    }
  };
  
  // Generate a fake order ID
  const orderId = `TS-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  
  // Current date in a readable format
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-4">
              <svg className="h-12 w-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription Confirmed!</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Thank you for subscribing to our {getSubscriptionDetails()}
            </p>
          </div>
          
          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-6">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                <span className="text-gray-900 dark:text-white font-medium">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-gray-900 dark:text-white font-medium">{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                <span className="text-gray-900 dark:text-white font-medium">{getSubscriptionDetails()}</span>
              </div>
              {billingCycle !== 'lifetime' && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Next billing date:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(
                      new Date().setMonth(
                        new Date().getMonth() + (billingCycle === 'monthly' ? 1 : 12)
                      )
                    ).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">You now have access to:</h3>
            <ul className="space-y-2 text-blue-700 dark:text-blue-400 text-sm">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited visa requirement checks</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>10% discount on all eVisa application fees</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  {subscriptionType === 'premium' 
                    ? 'AI Travel Assistant (5 queries/day)' 
                    : 'Unlimited AI Travel Assistant'}
                </span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority support</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent a confirmation email with all the details of your subscription.
              You can manage your subscription at any time from your account settings.
            </p>
            
            <button
              onClick={onContinue}
              className="px-8 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            If you have any questions, please contact our support team at <br />
            <a href="mailto:support@travelwithydra.com" className="text-primary-600 hover:underline">
              support@travelwithydra.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess; 