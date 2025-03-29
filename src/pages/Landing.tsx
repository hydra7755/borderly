import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import InteractiveGlobe from '../components/globe/InteractiveGlobe';
import { useWindowSize } from '../hooks/useWindowSize';
import VisaChecker from '../components/VisaChecker';
import ChatBubble from '../components/AIAssistant/ChatBubble';

interface LandingProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
  onApplyEVisa: (nationalityCode: string, destinationCode: string) => void;
  onPricingSubscribe: (plan: string, cycle: 'monthly' | 'annual' | 'lifetime') => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const Landing: React.FC<LandingProps> = ({ 
  onGetStarted, 
  onExploreFeatures, 
  onApplyEVisa,
  onPricingSubscribe,
  isLoggedIn,
  onLoginRequired
}) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 to-blue-100/5 dark:from-blue-950/10 dark:to-indigo-900/5"></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                  Unlock Your Global <span className="text-primary-600 dark:text-primary-500">Mobility</span> Potential
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                  Calculate your passport strength, check visa requirements, and boost your travel freedom with TravelScore.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <motion.button
                    onClick={onGetStarted}
                    className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-8 rounded-md text-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Check Your Travel Score
                  </motion.button>
                  <motion.button
                    onClick={onExploreFeatures}
                    className="bg-white hover:bg-gray-100 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white py-3 px-8 rounded-md text-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore Features
                  </motion.button>
                </div>
              </motion.div>
            </div>
            
            {/* Globe Container */}
            <div className="md:w-1/2 md:flex md:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative z-10"
              >
                <div className="w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] relative">
                  <InteractiveGlobe 
                    globeWidth={isMobile ? 350 : 550} 
                    globeHeight={isMobile ? 350 : 550}
                    rotationSpeed={0.2}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Features Designed for Global Travelers
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to understand and improve your passport power and global mobility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden card-hover"
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Travel Score Calculation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get a comprehensive score based on passport strength, travel history, and residency benefits.
              </p>
              <button onClick={onGetStarted} className="text-primary-600 dark:text-primary-500 hover:underline font-medium text-hover">
                Calculate your score →
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden card-hover"
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Interactive World Map
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Explore visa requirements for every country with our beautiful 3D globe visualization.
              </p>
              <button onClick={onExploreFeatures} className="text-primary-600 dark:text-primary-500 hover:underline font-medium text-hover">
                Learn more →
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden card-hover"
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Visa Application Assistance
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Apply for visas directly through our platform with discounts for premium members.
              </p>
              <button onClick={onExploreFeatures} className="text-primary-600 dark:text-primary-500 hover:underline font-medium text-hover">
                Learn more →
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 dark:bg-primary-800">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to explore your global mobility?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers using TravelScore to unlock their passport potential.
          </p>
          <motion.button
            onClick={onGetStarted}
            className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 shadow-lg btn-hover"
            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            whileTap={{ scale: 0.95 }}
          >
            Check Your Score Today
          </motion.button>
        </div>
      </div>

      {/* Pricing Section - Added to homepage */}
      <div className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Affordable Plans for Every Traveler
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Choose the plan that fits your travel needs and budget.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Basic</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">Free</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Visa Requirement Checker</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">eVisa Application Assistance</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">eVisa Fee Discount</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Travel Score Calculation</span>
              </li>
            </ul>
            <button 
              onClick={onGetStarted}
              className="w-full block text-center py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-medium transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white btn-hover mt-auto"
            >
              Get Started
            </button>
          </motion.div>
          
          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border-2 border-primary-500 transform scale-105 z-10 flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 bg-primary-500 text-white text-sm font-medium py-1 px-3 text-center rounded-t-lg">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-4">Premium</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">£19.99</span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Visa Requirement Checker</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">eVisa Application Assistance</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">eVisa Fee Discount <span className="text-primary-600 dark:text-primary-400 font-medium">(10%)</span></span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Travel Score Calculation</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">AI Travel Assistant (5 queries/day)</span>
              </li>
            </ul>
            <button 
              onClick={() => onPricingSubscribe('premium', 'monthly')}
              className="w-full block text-center py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors btn-hover mt-auto"
            >
              Subscribe Now
            </button>
          </motion.div>
          
          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enterprise</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">£39.99</span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Visa Requirement Checker</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">eVisa Application Assistance</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">eVisa Fee Discount <span className="text-purple-600 dark:text-teal-400 font-medium">(20%)</span></span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Travel Score Calculation</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">AI Travel Assistant (Unlimited)</span>
              </li>
            </ul>
            <button 
              onClick={() => onPricingSubscribe('enterprise', 'monthly')}
              className="w-full block text-center py-3 px-4 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 btn-hover mt-auto"
            >
              Subscribe Now
            </button>
          </motion.div>
        </div>
        
        <div className="text-center mt-10">
          <button 
            onClick={() => window.location.href = '/pricing'}
            className="inline-flex items-center text-primary-600 dark:text-primary-500 hover:underline text-hover"
          >
            View full pricing details
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Visa Requirement Checker Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <VisaChecker 
                onApplyEVisa={(nationality, destination) => {
                  // Call the parent handler to handle eVisa application
                  onApplyEVisa(nationality, destination);
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Your Personal AI Travel Assistant
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
            >
              Get instant answers to all your travel and visa-related questions with our AI-powered assistant.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Requirements</h3>
                    <p className="text-gray-600 dark:text-gray-400">Ask about visa requirements for any country based on your nationality.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Requirements</h3>
                    <p className="text-gray-600 dark:text-gray-400">Get detailed information about required documents for visa applications.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Travel Planning</h3>
                    <p className="text-gray-600 dark:text-gray-400">Get personalized travel recommendations and itinerary suggestions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800 rounded-lg shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Try It Now</h3>
              <p className="mb-6">Ask our AI assistant anything about travel and visas. Here are some example questions:</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>"What visa do I need to visit Japan as a UK citizen?"</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>"What documents do I need for a Schengen visa?"</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>"What's the best time to visit Thailand?"</span>
                </li>
              </ul>
              <button
                onClick={() => !isLoggedIn && onLoginRequired()}
                className="w-full py-3 px-6 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                {isLoggedIn ? "Click the chat bubble to start" : "Sign in to use AI Assistant"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chat Bubble */}
      <ChatBubble isLoggedIn={isLoggedIn} onLoginRequired={onLoginRequired} />
    </div>
  );
};

export default Landing;
