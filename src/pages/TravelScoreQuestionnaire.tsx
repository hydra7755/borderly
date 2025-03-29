import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_COUNTRIES, PASSPORT_SCORES } from '../utils/countries';
import CountrySelect from '../components/CountrySelect';
import CountryCheckbox from '../components/CountryCheckbox';
import { useNavigate } from 'react-router-dom';
import { userProfileService } from '../lib/api/userProfile';
import { calculateTravelScore as calculateTravelScoreUtil } from '../utils/travelScore';

// Sample visited countries with visa requirements
const COUNTRY_VISA_REQS: Record<string, string> = {
  'us': 'visa_free',
  'gb': 'visa_free',
  'ca': 'visa_free',
  'au': 'evisa',
  'nz': 'evisa',
  'jp': 'visa_required',
  'sg': 'visa_free',
  'de': 'visa_free',
  'fr': 'visa_free',
  'ch': 'visa_free',
  'it': 'visa_free',
  'es': 'visa_free',
  'kr': 'evisa',
  'sa': 'visa_required',
  'ae': 'visa_on_arrival',
  'in': 'visa_required',
  'cn': 'visa_required',
  'br': 'evisa',
  'mx': 'visa_free',
  'za': 'visa_free',
};

interface UserData {
  nationality: string;
  residence: string;
  visited: string[];
  visaFree: number;
  visaOnArrival: number;
  eVisa: number;
  visaRequired: number;
  travelScore: number;
}

interface TravelScoreQuestionnaireProps {
  onSignUp: () => void;
  isLoggedIn?: boolean;
}

const TravelScoreQuestionnaire: React.FC<TravelScoreQuestionnaireProps> = ({ onSignUp, isLoggedIn = false }) => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    nationality: '',
    residence: '',
    visited: [],
    visaFree: 0,
    visaOnArrival: 0,
    eVisa: 0,
    visaRequired: 0,
    travelScore: 0
  });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  // Handle nationality selection
  const handleNationalityChange = (countryCode: string) => {
    setUserData({
      ...userData,
      nationality: countryCode
    });
  };

  // Handle residence selection
  const handleResidenceChange = (countryCode: string) => {
    setUserData({
      ...userData,
      residence: countryCode
    });
  };

  // Toggle visited country
  const toggleVisitedCountry = (code: string) => {
    if (userData.visited.includes(code)) {
      setUserData({
        ...userData,
        visited: userData.visited.filter(c => c !== code)
      });
    } else {
      setUserData({
        ...userData,
        visited: [...userData.visited, code]
      });
    }
  };

  // Calculate travel score
  const calculateTravelScore = async () => {
    try {
      const scoreData = {
        nationality: userData.nationality,
        residency: userData.residence || userData.nationality, // Default to nationality if residency is not specified
        travel_history: userData.visited.map(country => ({
          country_id: country,
          visit_date: new Date().toISOString(),
          duration_days: 1, // Default value
          purpose: 'tourism' // Default value
        }))
      };

      // Calculate score using utility function - passport strength based on nationality
      const passportStrength = PASSPORT_SCORES[userData.nationality] * 10 || 500; // Convert 0-100 scale to 0-1000
      const calculatedScore = calculateTravelScoreUtil(scoreData, passportStrength);
      console.log('Calculated travel score:', calculatedScore);
      
      // Save to localStorage as fallback
      const PROFILE_STORAGE_KEY = 'travelscore_user_profile';
      const profileData = {
        nationality: userData.nationality,
        residency: userData.residence || userData.nationality,
        travel_history: userData.visited,
        travel_score: calculatedScore,
        questionnaire_completed: true,
        full_name: 'Demo User', // Default values
        email: 'user@example.com',
        last_updated: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
      
      // Also flag in sessionStorage that we have local data
      sessionStorage.setItem('hasLocalData', 'true');
      sessionStorage.setItem('fromQuestionnaire', 'true');
      
      // Try to save to backend if user is logged in
      try {
        if (isLoggedIn) {
          // Update with new data
          const result = await userProfileService.updateTravelScore(calculatedScore);
          // Also update nationality, residency and travel history
          await userProfileService.updateProfile({
            nationality: userData.nationality,
            residency: userData.residence || userData.nationality,
            travel_history: userData.visited,
            questionnaire_completed: true
          });
          console.log('Successfully saved travel score to backend:', result);
        } else {
          console.log('User not logged in, score only saved to localStorage');
        }
      } catch (apiError) {
        console.error('Failed to save to backend, but saved to localStorage:', apiError);
      }
      
      // Calculate visa breakdown numbers (these would normally come from real data)
      const visaFree = 120; // Default value
      const visaOnArrival = 40; // Default value
      const eVisa = 25; // Default value
      const visaRequired = 15; // Default value
      
      // Always show score results and navigate after a delay
      setUserData({
        ...userData,
        visaFree,
        visaOnArrival,
        eVisa,
        visaRequired,
        travelScore: calculatedScore
      });
      
      setShowResults(true);
      
      // Navigate to dashboard after 3 seconds to show the results
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error calculating travel score:', error);
      setLoading(false);
    }
  };

  // Next step
  const goToNextStep = () => {
    if (step === 3) {
      calculateTravelScore();
    } else {
      setStep(step + 1);
    }
  };

  // Previous step
  const goToPreviousStep = () => {
    setStep(step - 1);
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!userData.nationality;
      case 2:
        return !!userData.residence;
      case 3:
        return true; // Always valid, user can have 0 visited countries
      default:
        return false;
    }
  };

  // Get score range description
  const getScoreDescription = (score: number): string => {
    if (score >= 850) return 'Exceptional Global Mobility';
    if (score >= 700) return 'High Global Mobility';
    if (score >= 550) return 'Good Global Mobility';
    if (score >= 400) return 'Moderate Global Mobility';
    if (score >= 250) return 'Limited Global Mobility';
    return 'Restricted Global Mobility';
  };

  // Filter countries based on search term
  const filteredCountries = ALL_COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6 sm:p-10">
            {!showResults ? (
              <div>
                <header className="mb-8 text-center">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Calculate Your Travel Score
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Answer a few questions to discover your global mobility potential
                  </p>
                </header>

                {/* Progress Steps */}
                <div className="mb-10">
                  <div className="flex justify-between items-center">
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step >= i 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <div className="relative mt-2">
                    <div className="absolute top-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full"></div>
                    <div 
                      className="absolute top-0 left-0 h-1 bg-primary-600 transition-all duration-300"
                      style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step === 1 && (
                      <div className="question-container">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                          What is your nationality?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Select the country of your primary passport. This is the most important factor in determining your travel freedom.
                        </p>

                        <div className="w-full">
                          <CountrySelect
                            id="nationality"
                            value={userData.nationality}
                            onChange={handleNationalityChange}
                            label="Your Passport Country"
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="question-container">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                          Where do you currently reside?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Your country of residence can provide additional travel benefits beyond your passport.
                        </p>

                        <div className="w-full">
                          <CountrySelect
                            id="residence"
                            value={userData.residence}
                            onChange={handleResidenceChange}
                            label="Your Country of Residence"
                          />
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="question-container">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                          Which countries have you visited?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Select all the countries you have visited. Your travel history contributes to your overall score.
                        </p>

                        {/* Search bar */}
                        <div className="mb-4">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search countries..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                          {filteredCountries.map(country => (
                            <CountryCheckbox
                              key={country.code}
                              countryCode={country.code}
                              countryName={country.name}
                              checked={userData.visited.includes(country.code)}
                              onChange={() => toggleVisitedCountry(country.code)}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                          {userData.visited.length} countries selected
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-10 flex justify-between">
                  {step > 1 && (
                    <button
                      onClick={goToPreviousStep}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 btn-hover"
                    >
                      Back
                    </button>
                  )}
                  {step === 1 && <div></div>}
                  <button
                    onClick={goToNextStep}
                    disabled={!isStepValid() || loading}
                    className={`px-6 py-2 bg-primary-600 text-white rounded-md font-medium transition-colors ${
                      isStepValid() && !loading ? 'hover:bg-primary-700' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </span>
                    ) : step === 3 ? 'Calculate Score' : 'Next'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Your Travel Score Results
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Based on your nationality, residence, and travel history
                    </p>
                  </header>

                  <div className="flex flex-col md:flex-row items-center justify-between mb-10">
                    <div className="w-full md:w-1/2 mb-8 md:mb-0">
                      <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48 mb-4">
                          <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-5xl font-bold text-primary-600">{userData.travelScore}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">out of 1000</div>
                            </div>
                          </div>
                          <svg className="absolute inset-0" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#e6e6e6"
                              strokeWidth="5"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#14b8a6"
                              strokeWidth="5"
                              strokeDasharray="282.7"
                              strokeDashoffset={282.7 - (userData.travelScore / 1000) * 282.7}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                        </div>
                        <div className="text-xl font-semibold text-gray-800 dark:text-white">
                          {getScoreDescription(userData.travelScore)}
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Your Visa-Free Access
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Visa-Free Countries</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{userData.visaFree}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(userData.visaFree / 200) * 100}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Visa on Arrival</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{userData.visaOnArrival}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(userData.visaOnArrival / 200) * 100}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">eVisa Available</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{userData.eVisa}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(userData.eVisa / 200) * 100}%` }}></div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Visa Required</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{userData.visaRequired}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(userData.visaRequired / 200) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Score Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Passport Strength</span>
                        <span className="font-medium text-gray-900 dark:text-white">{Math.round(PASSPORT_SCORES[userData.nationality] * 10) || 500} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Residence Bonus</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {userData.residence !== userData.nationality && userData.residence ? 
                            Math.round((PASSPORT_SCORES[userData.residence] || 50) * 2) : '0'} pts
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Travel History</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Math.min(userData.visited.length * 10, 300)} pts
                        </span>
                      </div>
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3">
                        <div className="flex justify-between font-semibold">
                          <span className="text-gray-800 dark:text-white">Total Score</span>
                          <span className="text-primary-600">{userData.travelScore} pts</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-primary-500 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 mb-8">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          Want to see where you can travel visa-free?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          Sign up for a TravelScore account to view detailed visa requirements for every country based on your passport.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={() => {
                        setShowResults(false);
                        setStep(1);
                        setUserData({
                          ...userData,
                          nationality: '',
                          residence: '',
                          visited: []
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 btn-hover"
                    >
                      Start Over
                    </button>
                    {isLoggedIn ? (
                      <button
                        onClick={calculateTravelScore}
                        className="px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors text-center"
                      >
                        Recalculate
                      </button>
                    ) : (
                    <button
                      onClick={onSignUp}
                      className="px-6 py-2 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 transition-colors text-center"
                    >
                      Create Account to Save Results
                    </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelScoreQuestionnaire; 