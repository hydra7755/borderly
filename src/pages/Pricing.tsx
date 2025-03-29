import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PricingProps {
  isLoggedIn: boolean;
  onGetStarted: () => void;
  onSubscribe: (plan: string, cycle: 'monthly' | 'annual' | 'lifetime') => void;
}

const Pricing: React.FC<PricingProps> = ({ isLoggedIn, onGetStarted, onSubscribe }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');

  // Handle Get Started click
  const handleGetStarted = () => {
    onGetStarted();
  };

  // Handle Subscribe click
  const handleSubscribe = (planName: string) => {
    onSubscribe(planName.toLowerCase(), billingCycle);
  };

  // Pricing tiers with features
  const plans = [
    {
      name: 'Basic',
      description: 'Essential features for occasional travelers',
      price: {
        monthly: 0,
        annual: 0,
        lifetime: 0
      },
      features: [
        { name: 'Visa Requirement Checker', included: true },
        { name: 'eVisa Application Assistance', included: true },
        { name: 'eVisa Fee Discount', included: false },
        { name: 'Travel Score Calculation', included: true },
        { name: 'Interactive World Map', included: true },
        { name: 'Travel History Management (Basic)', included: true },
        { name: 'Travel Alerts', included: false },
        { name: 'Priority Support', included: false },
        { name: 'AI Travel Assistant', included: false }
      ],
      popular: false,
      accentColor: 'text-blue-500 dark:text-blue-400',
      bgAccent: 'bg-blue-500',
      borderAccent: 'border-blue-500',
      hoverAccent: 'hover:border-blue-500 hover:shadow-blue-500/10'
    },
    {
      name: 'Premium',
      description: 'Comprehensive features for frequent travelers',
      price: {
        monthly: 9.99,
        annual: 99.99,
        lifetime: 299
      },
      features: [
        { name: 'Visa Requirement Checker', included: true },
        { name: 'eVisa Application Assistance', included: true },
        { name: 'eVisa Fee Discount', included: true, value: billingCycle === 'monthly' ? '10%' : billingCycle === 'annual' ? '15%' : '20%' },
        { name: 'Travel Score Calculation', included: true },
        { name: 'Interactive World Map', included: true },
        { name: 'Travel History Management (Advanced)', included: true },
        { name: 'Travel Alerts', included: true },
        { name: 'Priority Support', included: true },
        { name: 'AI Travel Assistant (5 queries/day)', included: true }
      ],
      popular: true,
      accentColor: 'text-primary-600 dark:text-primary-500',
      bgAccent: 'bg-primary-600',
      borderAccent: 'border-primary-600',
      hoverAccent: 'hover:border-primary-600 hover:shadow-primary-500/10'
    },
    {
      name: 'Enterprise',
      description: 'Ultimate features for global business travelers',
      price: {
        monthly: 19.99,
        annual: 199.99,
        lifetime: 499
      },
      features: [
        { name: 'Visa Requirement Checker', included: true },
        { name: 'eVisa Application Assistance', included: true },
        { name: 'eVisa Fee Discount', included: true, value: billingCycle === 'monthly' ? '20%' : billingCycle === 'annual' ? '15%' : '20%' },
        { name: 'Travel Score Calculation', included: true },
        { name: 'Interactive World Map', included: true },
        { name: 'Travel History Management (Enterprise)', included: true },
        { name: 'Travel Alerts', included: true },
        { name: 'Dedicated Support', included: true },
        { name: 'AI Travel Assistant (Unlimited)', included: true }
      ],
      popular: false,
      accentColor: 'text-purple-600 dark:text-purple-500',
      bgAccent: 'bg-purple-600',
      borderAccent: 'border-purple-600',
      hoverAccent: 'hover:border-purple-600 hover:shadow-purple-500/10'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const planVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl"
          >
            Simple, Transparent <span className="text-primary-600 dark:text-primary-500">Pricing</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xl mt-5 mx-auto text-xl text-gray-600 dark:text-gray-400"
          >
            Choose the plan that works best for your travel needs, with no hidden fees.
          </motion.p>
        </div>

        {/* Billing cycle switcher */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md inline-flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-primary-600 dark:text-primary-400 font-normal">Save 16%</span>
            </button>
            <button
              onClick={() => setBillingCycle('lifetime')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'lifetime'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Lifetime
              <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-normal">Best value</span>
            </button>
          </div>
        </div>

        {/* Pricing tiers */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 lg:grid-cols-3 lg:gap-6"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={planVariants}
              className={`relative rounded-2xl bg-white dark:bg-gray-800 shadow-xl border-2 
                ${plan.popular ? plan.borderAccent : 'border-transparent'} 
                ${plan.hoverAccent} transition-all duration-300 h-full flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 transform -translate-y-1/2 inset-x-0 flex justify-center">
                  <span className={`${plan.bgAccent} text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg`}>
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-6 md:p-8 flex-grow">
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold ${plan.accentColor}`}>{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{plan.description}</p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price[billingCycle] === 0 ? 'Free' : `£${plan.price[billingCycle]}`}
                    </span>
                    {billingCycle === 'monthly' && plan.price[billingCycle] !== 0 && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>
                    )}
                    {billingCycle === 'annual' && plan.price[billingCycle] !== 0 && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">/year</span>
                    )}
                    {billingCycle === 'lifetime' && plan.price[billingCycle] !== 0 && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">one-time</span>
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        {feature.included ? (
                          <svg className={`h-5 w-5 ${plan.accentColor} mt-0.5 mr-3 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature.name} 
                          {feature.value && <span className={`ml-1 font-medium ${plan.accentColor}`}>({feature.value})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 md:px-8 md:pb-8 mt-auto">
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                    ${plan.popular 
                      ? `${plan.bgAccent} text-white hover:bg-opacity-90`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  onClick={() => plan.price[billingCycle] === 0 ? handleGetStarted() : handleSubscribe(plan.name)}
                >
                  {plan.price[billingCycle] === 0 ? 'Get Started' : 'Subscribe Now'}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional information */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">What are the eVisa fee discounts?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Premium and Enterprise plans include a 10% discount on service fees for eVisa applications. This discount applies to our processing and assistance fees.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Can I cancel my subscription?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your monthly or annual subscription at any time. Your benefits will continue until the end of your billing period.
                Lifetime subscriptions are non-refundable but provide permanent access to all included features.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Do prices include government visa fees?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No, government visa fees are separate and vary by country. Our service fee discounts apply to our processing and assistance fees,
                not to the official government charges which we pass through directly to you without markup.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, PayPal, and bank transfers for subscription payments. For eVisa applications,
                payment methods may vary depending on the destination country's requirements.
              </p>
            </div>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Still have questions?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Contact our team for more information about our pricing plans and how we can help with your travel needs.
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 