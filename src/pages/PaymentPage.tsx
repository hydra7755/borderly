import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import visaApplicationsService from '../lib/api/visaApplications';
import authService from '../lib/api/auth';
import { userProfileService } from '../lib/api/userProfile';
import { sendVisaApplicationToCompany } from '../services/emailService';
import { stripeService, getStripePromise } from '../lib/api/stripeService';
import {
  getVisaApplicationAmountGbp,
  getVisaApplicationAmountPence,
} from '../utils/visaPaymentAmount';
import { formatGbp } from '../config/stripePricing';

interface PaymentFormProps {
  applicationId: string;
  amountGbp: number;
}

const PaymentForm = ({ applicationId, amountGbp }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/visa/confirmation/${applicationId}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status !== 'succeeded') {
        throw new Error('Payment was not completed. Please try again.');
      }

      const { success, error: saveError } = await visaApplicationsService.markPaymentPaid(
        applicationId,
        paymentIntent.id
      );

      if (!success || saveError) {
        throw saveError ?? new Error('Payment succeeded but failed to update application');
      }

      try {
        const [{ user }, { application }] = await Promise.all([
          authService.getCurrentUser(),
          visaApplicationsService.getApplicationById(applicationId),
        ]);

        if (application) {
          await sendVisaApplicationToCompany({
            applicationId: application.id,
            nationalityCode: application.nationality_code || 'unknown',
            destinationCode: application.destination_code || application.destination_id,
            userEmail: user?.email,
            userName: user?.full_name,
            entryDate: application.entry_date,
            exitDate: application.exit_date,
            paymentStatus: 'paid',
          });
        }
      } catch (emailError) {
        console.error('Failed to send payment notification email:', emailError);
      }

      navigate(`/visa/confirmation/${applicationId}`);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred processing your payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full px-4 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing…' : `Pay ${formatGbp(amountGbp)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Payments are processed securely by Stripe. See our{' '}
        <Link to="/refunds" className="text-primary-600 hover:underline">
          Refund Policy
        </Link>
        .
      </p>
    </form>
  );
};

const PaymentPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountGbp, setAmountGbp] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) {
      setLoadError('Missing application ID');
      setLoading(false);
      return;
    }

    if (!stripeService.isConfigured()) {
      setLoadError(
        'Stripe is not configured. Add VITE_STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY to your environment.'
      );
      setLoading(false);
      return;
    }

    const initPayment = async () => {
      try {
        const { application, error } =
          await visaApplicationsService.getApplicationById(applicationId);

        if (error || !application) {
          throw new Error('Application not found');
        }

        if (application.payment_status === 'paid') {
          window.location.href = `/visa/confirmation/${applicationId}`;
          return;
        }

        const applicationData = application.application_data;
        const destinationCode =
          application.destination_code || application.destination_id;

        const { profile } = await userProfileService.getCurrentUserProfile();
        const subscriptionTier = profile?.subscription_tier || 'free';

        const amountPence = getVisaApplicationAmountPence(
          destinationCode,
          applicationData,
          subscriptionTier
        );
        const amount = getVisaApplicationAmountGbp(
          destinationCode,
          applicationData,
          subscriptionTier
        );
        setAmountGbp(amount);

        const secret = await stripeService.createPaymentIntent(amountPence, applicationId);
        setClientSecret(secret);
      } catch (err) {
        console.error('Payment init error:', err);
        setLoadError(
          err instanceof Error ? err.message : 'Unable to load payment form'
        );
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>
        <p className="text-gray-600 mb-6">
          Visa application {applicationId ? `#${applicationId.slice(0, 8)}…` : ''}
        </p>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600" />
          </div>
        )}

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
            {loadError}
          </div>
        )}

        {!loading && !loadError && clientSecret && amountGbp !== null && applicationId && (
          <>
            <div className="mb-6 flex justify-between items-center p-4 bg-primary-50 rounded-lg">
              <span className="text-gray-700 font-medium">Total due</span>
              <span className="text-xl font-bold text-primary-700">{formatGbp(amountGbp)}</span>
            </div>

            <Elements
              stripe={getStripePromise()}
              options={{
                clientSecret,
                appearance: { theme: 'stripe' },
              }}
            >
              <PaymentForm applicationId={applicationId} amountGbp={amountGbp} />
            </Elements>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
