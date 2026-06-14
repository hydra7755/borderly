import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';

interface TravelScoreProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

const TravelScore: React.FC<TravelScoreProps> = ({ isLoggedIn, onLoginRequired }) => {
  const [activeTab, setActiveTab] = useState('travel-score');

  // Mock data for user's travel score breakdown
  const scoreBreakdown = {
    total: 235,
    passportStrength: 95, // out of 300
    countriesVisited: 35, // out of 300
    regionsDiversity: 65, // out of 200
    tripFrequency: 40, // out of 200
  };

  // Factors that influence the travel score
  const scoreFactors = [
    {
      title: 'Passport Strength',
      description: 'The visa-free access power of your passport',
      impact: 'High',
      value: scoreBreakdown.passportStrength,
      maxValue: 300,
      percentage: Math.round((scoreBreakdown.passportStrength / 300) * 100),
      tips: 'Your passport strength is determined by your citizenship and can\'t be directly improved. However, you can apply for second citizenship or residence programs in some countries to gain better travel access.'
    },
    {
      title: 'Countries Visited',
      description: 'The number of unique countries you\'ve visited',
      impact: 'High',
      value: scoreBreakdown.countriesVisited,
      maxValue: 300,
      percentage: Math.round((scoreBreakdown.countriesVisited / 300) * 100),
      tips: 'Visit new countries that you haven\'t been to before to increase this score significantly. Focus on countries from different regions to maximize your score improvement.'
    },
    {
      title: 'Regional Diversity',
      description: 'How many different world regions you\'ve explored',
      impact: 'Medium',
      value: scoreBreakdown.regionsDiversity,
      maxValue: 200,
      percentage: Math.round((scoreBreakdown.regionsDiversity / 200) * 100),
      tips: 'Try to visit countries across different continents and regions. Even visiting just one country in each major region of the world can significantly boost this score.'
    },
    {
      title: 'Travel Frequency',
      description: 'How often you travel internationally',
      impact: 'Medium',
      value: scoreBreakdown.tripFrequency,
      maxValue: 200,
      percentage: Math.round((scoreBreakdown.tripFrequency / 200) * 100),
      tips: 'Regular international travel, even to nearby countries, helps maintain and improve this score. Weekend trips to neighboring countries count!'
    }
  ];

  // Benefits of a high travel score
  const travelScoreBenefits = [
    {
      title: 'Visa Processing Priority',
      description: 'Higher scores may lead to faster visa processing for certain countries',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: 'Travel Insurance Discounts',
      description: 'Partner insurance companies may offer special rates based on your score',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Personalized Travel Recommendations',
      description: 'Get AI-powered suggestions for destinations based on your travel history',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: 'Travel Record Keeping',
      description: 'Your complete travel history is organized and available for visa applications',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }
  ];

  // Navigation handler
  const handleTabChange = (page: string) => {
    setActiveTab(page);
    
    // Handle navigation to different pages
    if (page !== 'travel-score') {
      // Use window.location.href for proper page navigation
      window.location.href = `/${page}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-teal-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">Borderly Pro</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/dashboard" className="flex items-center gap-2 text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Dashboard
            </a>
            <a href="/travel-score" className="flex items-center gap-2 px-2 py-1 bg-white text-teal-700 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Travel Score
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col md:flex-row w-full">
        {/* Left Sidebar */}
        <div className="hidden md:block w-64 h-screen">
          <Sidebar 
            onNavigate={handleTabChange} 
            currentTab={activeTab} 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Understanding Your Travel Score</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Learn how your score is calculated and how to improve it
            </p>
          </div>

          {/* Travel Score Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Current Score Card */}
            <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Your Travel Score</h2>
              
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <svg className="w-48 h-48" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="rgba(20, 184, 166, 0.2)" 
                      strokeWidth="8" 
                    />
                    
                    {/* Progress circle */}
                    <motion.circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#14b8a6" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset="188.4" // 251.2 * (1 - 0.25)
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: 251.2 * (1 - scoreBreakdown.total / 1000) }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </svg>
                  
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{scoreBreakdown.total}</span>
                    <span className="text-sm text-teal-600 dark:text-teal-400">out of 1000</span>
                  </motion.div>
                </div>
                
                <div className="text-center">
                  <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Intermediate Traveler
                  </span>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    You're on your way to becoming a world explorer!
                  </p>
                </div>
              </div>
            </div>
            
            {/* Score Breakdown */}
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Score Breakdown</h2>
              
              <div className="space-y-5">
                {scoreFactors.map((factor, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{factor.title}</span>
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300">
                          {factor.impact} Impact
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {factor.value} / {factor.maxValue}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <motion.div 
                        className="h-2.5 rounded-full bg-teal-600" 
                        style={{ width: '0%' }}
                        animate={{ width: `${factor.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How to Improve Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">How to Improve Your Score</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scoreFactors.map((factor, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                >
                  <h3 className="text-lg font-medium text-teal-700 dark:text-teal-400 mb-2">{factor.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{factor.tips}</p>
                  <div className="flex items-center text-sm text-teal-600 dark:text-teal-400">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Potential impact: +{factor.maxValue - factor.value} points</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Benefits of a High Travel Score</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {travelScoreBenefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center text-teal-700 dark:text-teal-300 mr-4">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelScore; 