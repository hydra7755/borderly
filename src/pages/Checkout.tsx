import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { stripeService } from '../lib/api/stripeService';
import {
  getSubscriptionPrice,
  formatGbp,
  SubscriptionType,
  BillingCycle,
} from '../config/stripePricing';

interface CheckoutProps {
  subscriptionType: SubscriptionType;
  billingCycle: BillingCycle;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({
  subscriptionType,
  billingCycle,
  onBack,
}) => {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const price = getSubscriptionPrice(subscriptionType, billingCycle);

  const getSubscriptionDetails = () => {
    const plan = subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);

    if (billingCycle === 'monthly') return `${plan} Plan — Monthly`;
    if (billingCycle === 'annual') return `${plan} Plan — Annual`;
    return `${plan} Plan — Lifetime`;
  };

  const handleStripeCheckout = async () => {
    if (!stripeService.isConfigured()) {
      setError(
        'Stripe is not configured yet. Add VITE_STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY to your environment.'
      );
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const { url } = await stripeService.createCheckoutSession(
        subscriptionType,
        billingCycle
      );
      await stripeService.redirectToCheckout(url);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to start checkout. Please try again.'
      );
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete Your Subscription
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Secure checkout powered by Stripe
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Order Summary
          </h2>

          <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{getSubscriptionDetails()}</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatGbp(price)}
              </span>
            </div>
            {billingCycle === 'monthly' && (
              <p className="text-sm text-gray-500">Billed monthly. Cancel anytime.</p>
            )}
            {billingCycle === 'annual' && (
              <p className="text-sm text-gray-500">Billed annually.</p>
            )}
            {billingCycle === 'lifetime' && (
              <p className="text-sm text-gray-500">One-time payment for lifetime access.</p>
            )}
          </div>

          <div className="flex justify-between font-medium text-lg mb-8">
            <span className="text-gray-900 dark:text-white">Total due today</span>
            <span className="text-primary-600 dark:text-primary-500">{formatGbp(price)}</span>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={processing}
              className="px-8 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? 'Redirecting to Stripe…' : `Pay ${formatGbp(price)} with Stripe`}
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            You will be redirected to Stripe&apos;s secure checkout. We never store your card
            details. By continuing you agree to our{' '}
            <Link to="/terms" className="text-primary-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
