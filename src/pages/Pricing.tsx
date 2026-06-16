import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface PricingProps {
  isLoggedIn: boolean;
  onGetStarted: () => void;
  onSubscribe: (plan: string, cycle: 'monthly' | 'annual' | 'lifetime') => void;
}

const Pricing: React.FC<PricingProps> = ({ isLoggedIn, onGetStarted, onSubscribe }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What are the eVisa fee discounts?',
      answer:
        'Premium and Enterprise plans include discounts on our eVisa service fees — 10% on Premium and up to 20% on Enterprise depending on billing cycle. Government visa fees are always separate.',
    },
    {
      question: 'Can I cancel my subscription?',
      answer:
        'Yes. Monthly and annual subscriptions can be cancelled at any time. Benefits continue until the end of your billing period. Lifetime plans are non-refundable but include permanent access.',
    },
    {
      question: 'Do prices include government visa fees?',
      answer:
        'No. Government visa fees vary by country and are charged separately. Our discounts apply only to Borderly processing and assistance fees.',
    },
    {
      question: 'How do I pay for my subscription?',
      answer:
        'Payments are processed securely through Stripe. We accept all major credit and debit cards with encrypted checkout.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Handle Get Started click
  const handleGetStarted = () => {
    onGetStarted();
  };

  // Handle Subscribe click
  const handleSubscribe = (planName: string) => {
    onSubscribe(planName.toLowerCase(), billingCycle);
  };

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
    },
    {
      name: 'Premium',
      description: 'Comprehensive features for frequent travelers',
      price: {
        monthly: 9.98,
        annual: 99.98,
        lifetime: 198
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
        { name: 'AI Travel Assistant', included: true }
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Ultimate features for global business travelers',
      price: {
        monthly: 19.98,
        annual: 199.98,
        lifetime: 398
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
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
          className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-2 sm:px-4 lg:grid-cols-3 lg:items-stretch lg:gap-6 xl:gap-8"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={planVariants}
              className={`relative flex h-full flex-col`}
            >
              <div className="mb-3 flex h-8 items-center justify-center">
                {plan.popular ? (
                  <span className="rounded-full bg-primary-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                    Most Popular
                  </span>
                ) : (
                  <span className="invisible rounded-full px-4 py-1.5 text-xs font-bold uppercase">
                    Most Popular
                  </span>
                )}
              </div>

              <div
                className={`flex h-full flex-col rounded-2xl border-2 bg-white shadow-lg transition-shadow duration-300 dark:bg-gray-800
                  ${plan.popular
                    ? 'border-primary-500 shadow-primary-500/10 dark:border-primary-500'
                    : 'border-gray-200 hover:shadow-md dark:border-gray-700'
                  }`}
              >
              
              <div className="flex-grow p-6 md:p-8">
                <div className="mb-8 text-center">
                  <h3 className="text-2xl font-bold text-primary-700 dark:text-primary-400">{plan.name}</h3>
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
                          <svg className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature.name} 
                          {feature.value && <span className="ml-1 font-medium text-primary-600 dark:text-primary-400">({feature.value})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-auto border-t border-gray-100 p-6 dark:border-gray-700 md:px-8 md:pb-8">
                <button
                  className={`w-full rounded-xl py-3.5 px-4 font-semibold transition-colors
                    ${plan.popular
                      ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                      : plan.name === 'Enterprise'
                        ? 'bg-primary-500 text-white shadow-sm hover:bg-primary-600'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/50'
                    }`}
                  onClick={() => plan.price[billingCycle] === 0 ? handleGetStarted() : handleSubscribe(plan.name)}
                >
                  {plan.price[billingCycle] === 0 ? 'Get Started' : 'Subscribe Now'}
                </button>
              </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ accordion */}
        <div className="mt-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.question} className="bg-white dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 sm:px-6"
                    aria-expanded={isOpen}
                  >
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                      {faq.question}
                    </h3>
                    <span className="shrink-0 text-gray-400">
                      {isOpen ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:px-6 sm:text-base">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
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