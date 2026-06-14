import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getCompanyEmail } from '../config/companyContact';
import { stripeService } from '../lib/api/stripeService';
import userProfileService from '../lib/api/userProfile';
import { SubscriptionType, BillingCycle } from '../config/stripePricing';

interface SubscriptionSuccessProps {
  onContinue: () => void;
}

const SubscriptionSuccess: React.FC<SubscriptionSuccessProps> = ({ onContinue }) => {
  const companyEmail = getCompanyEmail();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('premium');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const getSubscriptionDetails = () => {
    const plan = subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);

    if (billingCycle === 'monthly') return `${plan} Monthly Plan`;
    if (billingCycle === 'annual') return `${plan} Annual Plan`;
    return `${plan} Lifetime Plan`;
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerifyError('No payment session found. If you completed payment, contact support.');
        return;
      }

      try {
        const result = await stripeService.verifyCheckoutSession(sessionId);

        if (!result.paid) {
          setVerifyError('Payment has not been confirmed yet. Please wait or contact support.');
          return;
        }

        const tier = (result.subscriptionType as SubscriptionType) || 'premium';
        const cycle = (result.billingCycle as BillingCycle) || 'monthly';
        setSubscriptionType(tier);
        setBillingCycle(cycle);
        setOrderId(sessionId.slice(-12).toUpperCase());
        setVerified(true);

        await userProfileService.updateProfile({
          subscription_tier: tier,
        });
      } catch (err) {
        console.error('Subscription verification error:', err);
        setVerifyError(
          err instanceof Error
            ? err.message
            : 'Could not verify your payment. Please contact support.'
        );
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {verifyError ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verification Issue
            </h1>
            <p className="text-red-600 mb-4">{verifyError}</p>
            <a
              href={`mailto:${companyEmail}`}
              className="text-primary-600 hover:underline"
            >
              {companyEmail}
            </a>
          </div>
        ) : !verified ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Confirming your payment with Stripe…</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8"
          >
            <div className="flex flex-col items-center mb-6">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-4">
                <svg
                  className="h-12 w-12 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Subscription Confirmed!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Thank you for subscribing to {getSubscriptionDetails()}
              </p>
            </div>

            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-6">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{currentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {getSubscriptionDetails()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onContinue}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
