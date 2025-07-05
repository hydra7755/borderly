import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Simple payment form component using Stripe Elements
const SimplePaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // In a real application, you would create a payment intent on your server
      // For testing, we're just showing the card element works
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      // Simulate successful payment
      setSuccess(true);
      
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred processing your payment');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
                      />
                    </div>
                    
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      {success ? (
        <div className="text-green-600 text-sm">Payment successful!</div>
      ) : (
                      <button
                        type="submit"
          disabled={!stripe || processing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {processing ? 'Processing...' : 'Pay Now'}
                      </button>
      )}
                  </form>
  );
};

// Main Payment Page component
const PaymentPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  
  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Payment Page</h1>
      <p className="text-gray-600 mb-6">
        Application ID: {applicationId || 'Unknown'}
      </p>
      
      <Elements stripe={stripePromise}>
        <SimplePaymentForm />
      </Elements>
      </div>
  );
};

export default PaymentPage;
