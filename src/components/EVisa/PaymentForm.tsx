import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCardIcon, BanknotesIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

// Card type icons
import visaIcon from '../../assets/images/visa.svg';
import mastercardIcon from '../../assets/images/mastercard.svg';
import amexIcon from '../../assets/images/amex.svg';
import paypalIcon from '../../assets/images/paypal.svg';

// Define application data type
type ApplicationData = {
  paymentMethod: string;
  cardholderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  billingAddress: string;
  agreeToTerms: boolean;
  [key: string]: any;
};

// Define props interface
interface PaymentFormProps {
  data: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ data, onUpdate, onNext, onBack }) => {
  // State for form errors
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationData, string>>>({});
  const [processingPayment, setProcessingPayment] = useState(false);

  // Detect card type based on number
  const detectCardType = (number: string): string => {
    const cleaned = number.replace(/\D/g, '');
    
    // Visa
    if (/^4/.test(cleaned)) return 'visa';
    // Mastercard
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    // Amex
    if (/^3[47]/.test(cleaned)) return 'amex';
    
    return '';
  };

  const cardType = detectCardType(data.cardNumber);

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const isAmex = detectCardType(cleaned) === 'amex';
    
    // Format differently for Amex vs other cards
    if (isAmex) {
      const parts = [
        cleaned.substring(0, 4),
        cleaned.substring(4, 10),
        cleaned.substring(10, 15)
      ].filter(Boolean);
      return parts.join(' ');
    } else {
      const parts = [
        cleaned.substring(0, 4),
        cleaned.substring(4, 8),
        cleaned.substring(8, 12),
        cleaned.substring(12, 16)
      ].filter(Boolean);
      return parts.join(' ');
    }
  };

  // Format expiry date with slash
  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length >= 3) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    
    return cleaned;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | boolean = value;
    
    // Handle different input types
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'cardNumber') {
      processedValue = formatCardNumber(value);
    } else if (name === 'cardExpiry') {
      processedValue = formatExpiryDate(value);
    } else if (name === 'cardCvc') {
      processedValue = value.replace(/\D/g, '').substring(0, detectCardType(data.cardNumber) === 'amex' ? 4 : 3);
    }
    
    // Update data
    onUpdate({ [name]: processedValue } as any);
    
    // Clear error for this field
    if (errors[name as keyof ApplicationData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationData, string>> = {};
    
    // Required fields
    if (!data.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }
    
    if (data.paymentMethod === 'card') {
      if (!data.cardholderName) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
      
      if (!data.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else {
        const cleaned = data.cardNumber.replace(/\D/g, '');
        const minLength = detectCardType(cleaned) === 'amex' ? 15 : 16;
        
        if (cleaned.length < minLength) {
          newErrors.cardNumber = 'Please enter a valid card number';
        }
      }
      
      if (!data.cardExpiry) {
        newErrors.cardExpiry = 'Expiry date is required';
      } else {
        const cleaned = data.cardExpiry.replace(/\D/g, '');
        
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
      
      if (!data.cardCvc) {
        newErrors.cardCvc = 'Security code is required';
      } else {
        const cvcLength = detectCardType(data.cardNumber) === 'amex' ? 4 : 3;
        if (data.cardCvc.length < cvcLength) {
          newErrors.cardCvc = `Please enter a valid ${cvcLength}-digit security code`;
        }
      }
      
      if (!data.billingAddress) {
        newErrors.billingAddress = 'Billing address is required';
      }
    }
    
    if (!data.agreeToTerms) {
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
    
    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      onNext();
    } catch (error) {
      setErrors({
        paymentMethod: 'Payment processing failed. Please try again.'
      });
    } finally {
      setProcessingPayment(false);
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
        Payment Information
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Payment Method
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                data.paymentMethod === 'card'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                onUpdate({ paymentMethod: 'card' });
                if (errors.paymentMethod) {
                  setErrors(prev => ({ ...prev, paymentMethod: '' }));
                }
              }}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <CreditCardIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Credit Card</p>
                  <div className="flex space-x-1 mt-1">
                    <img src={visaIcon} alt="Visa" className="h-6" />
                    <img src={mastercardIcon} alt="Mastercard" className="h-6" />
                    <img src={amexIcon} alt="American Express" className="h-6" />
                  </div>
                </div>
              </div>
            </div>
            
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                data.paymentMethod === 'paypal'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                onUpdate({ paymentMethod: 'paypal' });
                if (errors.paymentMethod) {
                  setErrors(prev => ({ ...prev, paymentMethod: '' }));
                }
              }}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <img src={paypalIcon} alt="PayPal" className="h-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fast & secure</p>
                </div>
              </div>
            </div>
            
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                data.paymentMethod === 'bank'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                onUpdate({ paymentMethod: 'bank' });
                if (errors.paymentMethod) {
                  setErrors(prev => ({ ...prev, paymentMethod: '' }));
                }
              }}
            >
              <div className="flex items-center">
                <div className="mr-3">
                  <BuildingLibraryIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Bank Transfer</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Direct deposit</p>
                </div>
              </div>
            </div>
          </div>
          
          {errors.paymentMethod && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.paymentMethod}</p>
          )}
        </div>
        
        {/* Credit Card Details */}
        {data.paymentMethod === 'card' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  id="cardholderName"
                  name="cardholderName"
                  value={data.cardholderName || ''}
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
                <div className="relative">
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={data.cardNumber || ''}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-md border ${
                      errors.cardNumber 
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                    } dark:bg-gray-700 dark:text-white`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                  {cardType && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <img 
                        src={
                          cardType === 'visa' ? visaIcon :
                          cardType === 'mastercard' ? mastercardIcon :
                          cardType === 'amex' ? amexIcon : ''
                        } 
                        alt={cardType} 
                        className="h-6"
                      />
                    </div>
                  )}
                </div>
                {errors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.cardNumber}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  value={data.cardExpiry || ''}
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
                  CVC/CVV
                </label>
                <input
                  type="text"
                  id="cardCvc"
                  name="cardCvc"
                  value={data.cardCvc || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-md border ${
                    errors.cardCvc 
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder={cardType === 'amex' ? '4 digits' : '3 digits'}
                  maxLength={cardType === 'amex' ? 4 : 3}
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
                value={data.billingAddress || ''}
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
          </div>
        )}
        
        {/* PayPal Message */}
        {data.paymentMethod === 'paypal' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-blue-700 dark:text-blue-300">
              You will be redirected to PayPal to complete your payment securely after reviewing your application.
            </p>
          </div>
        )}
        
        {/* Bank Transfer Details */}
        {data.paymentMethod === 'bank' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Please use the following bank details to make your payment:
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">Bank Name:</span> International Travel Bank</p>
              <p><span className="font-medium">Account Name:</span> TravelScore Visa Services</p>
              <p><span className="font-medium">Account Number:</span> 1234567890</p>
              <p><span className="font-medium">Sort Code:</span> 12-34-56</p>
              <p><span className="font-medium">IBAN:</span> GB98 ABCD 1234 5678 9012 34</p>
              <p><span className="font-medium">Reference:</span> {data.cardholderName || 'Your Full Name'}</p>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Please note: Your application will be processed once payment is confirmed. This typically takes 1-3 business days.
            </p>
          </div>
        )}
        
        {/* Payment Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Payment Summary</h3>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Application Fee</span>
            <span className="text-gray-900 dark:text-white">£79.99</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
            <span className="text-gray-900 dark:text-white">£4.99</span>
          </div>
          
          {/* Subscription discount - this would need to be checked from user's actual subscription */}
          <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 text-green-600 dark:text-green-400">
            <span>Premium/Enterprise Discount (10%)</span>
            <span>-£8.50</span>
          </div>
          
          <div className="flex justify-between py-2 text-lg font-medium">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-primary-600">£76.48</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Premium and Enterprise subscribers receive a 10% discount on all eVisa application fees.
          </p>
        </div>
        
        {/* Terms and Conditions */}
        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={data.agreeToTerms || false}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className="text-gray-700 dark:text-gray-300">
                I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.agreeToTerms}</p>
              )}
            </div>
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
            type="submit"
            disabled={processingPayment}
            className={`px-6 py-2 bg-primary-600 text-white rounded-md ${
              processingPayment 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            }`}
          >
            {processingPayment ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : 'Continue to Review'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PaymentForm; 