import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CheckoutProps {
  subscriptionType: 'premium' | 'enterprise';
  billingCycle: 'monthly' | 'annual' | 'lifetime';
  onBack: () => void;
  onComplete: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ 
  subscriptionType, 
  billingCycle,
  onBack,
  onComplete
}) => {
  // State for payment form
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    billingAddress: '',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Calculate subscription price based on type and billing cycle
  const getPrice = () => {
    if (subscriptionType === 'premium') {
      return billingCycle === 'monthly' ? 19.99 : 
             billingCycle === 'annual' ? 199.99 : 399;
    } else { // enterprise
      return billingCycle === 'monthly' ? 39.99 : 
             billingCycle === 'annual' ? 399.99 : 799;
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | boolean = value;
    
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'cardNumber') {
      // Format card number with spaces
      processedValue = value.replace(/\D/g, '')
        .replace(/(\d{4})(?=\d)/g, '$1 ')
        .trim();
    } else if (name === 'cardExpiry') {
      // Format expiry date with slash
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 3) {
        processedValue = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
      } else {
        processedValue = cleaned;
      }
    } else if (name === 'cardCvc') {
      // Only allow numbers and limit length
      processedValue = value.replace(/\D/g, '').substring(0, 3);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cardholderName) {
      newErrors.cardholderName = 'Cardholder name is required';
    }
    
    if (!formData.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (formData.cardNumber.replace(/\D/g, '').length < 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }
    
    if (!formData.cardExpiry) {
      newErrors.cardExpiry = 'Expiry date is required';
    } else {
      const cleaned = formData.cardExpiry.replace(/\D/g, '');
      if (cleaned.length < 4) {
        newErrors.cardExpiry = 'Please enter a valid expiry date';
      } else {
        const month = parseInt(cleaned.substring(0, 2));
        const year = parseInt('20' + cleaned.substring(2, 4));
        const now = new Date();
        
        if (month < 1 || month > 12) {
          newErrors.cardExpiry = 'Invalid month';
        } else if (
          year < now.getFullYear() || 
          (year === now.getFullYear() && month < now.getMonth() + 1)
        ) {
          newErrors.cardExpiry = 'Card has expired';
        }
      }
    }
    
    if (!formData.cardCvc) {
      newErrors.cardCvc = 'Security code is required';
    } else if (formData.cardCvc.length < 3) {
      newErrors.cardCvc = 'Security code must be 3 digits';
    }
    
    if (!formData.billingAddress) {
      newErrors.billingAddress = 'Billing address is required';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      onComplete();
    } catch (error) {
      setErrors({ 
        general: 'An error occurred while processing your payment. Please try again.' 
      });
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Get subscription details text
  const getSubscriptionDetails = () => {
    const plan = subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
    
    if (billingCycle === 'monthly') {
      return `${plan} Plan - Monthly`;
    } else if (billingCycle === 'annual') {
      return `${plan} Plan - Annual (16% discount)`;
    } else {
      return `${plan} Plan - Lifetime`;
    }
  };
  
  const price = getPrice();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete Your Subscription
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            You're just one step away from unlocking premium travel features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>
              
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">{getSubscriptionDetails()}</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    £{price.toFixed(2)}
                  </span>
                </div>
                
                {billingCycle === 'monthly' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Billed monthly. Cancel anytime.
                  </p>
                )}
                
                {billingCycle === 'annual' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Billed annually. Save compared to monthly billing.
                  </p>
                )}
                
                {billingCycle === 'lifetime' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    One-time payment for lifetime access.
                  </p>
                )}
              </div>
              
              <div className="flex justify-between font-medium text-lg mb-6">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-primary-600 dark:text-primary-500">£{price.toFixed(2)}</span>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Subscription Benefits:</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Visa Requirement Checker</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>eVisa Fee Discount (10%)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      {subscriptionType === 'premium' 
                        ? 'AI Travel Assistant (5 queries/day)' 
                        : 'AI Travel Assistant (Unlimited)'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Payment Information
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    id="cardholderName"
                    name="cardholderName"
                    value={formData.cardholderName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-md border ${
                      errors.cardholderName 
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="Name on card"
                  />
                  {errors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.cardholderName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-md border ${
                      errors.cardNumber 
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.cardNumber}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      id="cardExpiry"
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-md border ${
                        errors.cardExpiry 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.cardExpiry && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.cardExpiry}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Security Code
                    </label>
                    <input
                      type="text"
                      id="cardCvc"
                      name="cardCvc"
                      value={formData.cardCvc}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-md border ${
                        errors.cardCvc 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                      } dark:bg-gray-700 dark:text-white`}
                      placeholder="123"
                      maxLength={3}
                    />
                    {errors.cardCvc && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.cardCvc}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Address
                  </label>
                  <textarea
                    id="billingAddress"
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-md border ${
                      errors.billingAddress 
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="Enter your billing address"
                  />
                  {errors.billingAddress && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.billingAddress}</p>
                  )}
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms as boolean}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeToTerms" className="font-medium text-gray-700 dark:text-gray-300">
                      I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
                    </label>
                    {errors.agreeToTerms && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.agreeToTerms}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="px-8 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {processingPayment ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      `Pay £${price.toFixed(2)}`
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Your payment is secure and encrypted. We never store your full card details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 