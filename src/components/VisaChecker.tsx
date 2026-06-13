import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CountrySelect from './CountrySelect';
import { ALL_COUNTRIES, getFlagUrl } from '../utils/countries';
import { visaRequirementsService } from '../services/visaRequirementsService';

interface VisaCheckerProps {
  onApplyEVisa?: (nationality: string, destination: string) => void;
}

const VisaChecker: React.FC<VisaCheckerProps> = ({ onApplyEVisa }) => {
  const navigate = useNavigate();
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState<{
    checked: boolean;
    requirement: string;
    message: string;
    canApplyForEVisa: boolean;
    isLoading?: boolean;
    stayDuration?: number;
  } | null>(null);

  const checkVisaRequirement = async () => {
    if (!nationality || !destination) return;

    setResult({
      checked: true,
      requirement: 'loading',
      message: 'Checking visa requirements...',
      canApplyForEVisa: false,
      isLoading: true,
    });

    try {
      const visaReq = await visaRequirementsService.getVisaRequirement(nationality, destination);

      const passportCountry =
        visaReq?.nationality || ALL_COUNTRIES.find((c) => c.code === nationality)?.name || nationality;
      const destinationCountry =
        visaReq?.destination || ALL_COUNTRIES.find((c) => c.code === destination)?.name || destination;

      if (!visaReq || visaReq.requirement === 'unknown') {
        setResult({
          checked: true,
          requirement: 'unknown',
          message: `We could not determine the visa requirements for ${passportCountry} citizens traveling to ${destinationCountry}. Please check with the embassy or consulate for accurate information.`,
          canApplyForEVisa: false,
          isLoading: false,
        });
        return;
      }

      const message = visaRequirementsService.buildRequirementMessage(
        visaReq.requirement,
        passportCountry,
        destinationCountry,
        visaReq.stay_duration,
        visaReq.notes
      );

      setResult({
        checked: true,
        requirement: visaReq.requirement,
        message,
        canApplyForEVisa: ['evisa', 'eta'].includes(visaReq.requirement),
        stayDuration: visaReq.stay_duration ?? undefined,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking visa requirement:', error);
      setResult({
        checked: true,
        requirement: 'error',
        message: 'An error occurred while checking visa requirements. Please try again later.',
        canApplyForEVisa: false,
        isLoading: false,
      });
    }
  };

  const handleApplyClick = () => {
    if (onApplyEVisa) {
      onApplyEVisa(nationality, destination);
      return;
    }
    navigate(`/visa/apply/${nationality}/${destination}`);
  };

  const nationalityCountry = ALL_COUNTRIES.find((c) => c.code === nationality);
  const destinationCountry = ALL_COUNTRIES.find((c) => c.code === destination);

  const getResultTitle = () => {
    switch (result?.requirement) {
      case 'visa-free':
        return 'Visa-Free Travel Available';
      case 'visa-on-arrival':
        return 'Visa On Arrival Available';
      case 'evisa':
        return 'Electronic Visa Required';
      case 'eta':
        return 'Electronic Travel Authorization Required';
      case 'visa-required':
        return 'Traditional Visa Required';
      case 'error':
        return 'Error';
      default:
        return 'Visa Information Unavailable';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 dark:border-teal-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-700 dark:text-teal-400">Visa Eligibility Checker</h2>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
        Enter your passport country and destination to check if you need a visa for your trip.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CountrySelect
          id="nationality"
          label="Your Nationality"
          value={nationality}
          onChange={setNationality}
          placeholder="Select your country of citizenship"
        />

        <CountrySelect
          id="destination"
          label="Destination Country"
          value={destination}
          onChange={setDestination}
          placeholder="Select where you want to travel"
        />
      </div>

      <div className="mt-8 space-y-4">
        <motion.button
          onClick={checkVisaRequirement}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-md font-medium transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!nationality || !destination}
        >
          Check Visa Requirement
        </motion.button>
      </div>

      {result && result.checked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 p-6 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-800"
        >
          {result.isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center justify-center mb-6 space-x-12">
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex-shrink-0 mb-2">
                    <img
                      src={nationalityCountry ? getFlagUrl(nationalityCountry.code, 160) : ''}
                      alt={nationalityCountry ? nationalityCountry.name : 'Country flag'}
                      className="w-full h-full object-cover rounded-full border-2 border-gray-200 dark:border-gray-700"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                    {nationalityCountry?.name}
                  </p>
                  <p className="text-xs text-gray-500">Nationality</p>
                </div>

                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex-shrink-0 mb-2">
                    <img
                      src={destinationCountry ? getFlagUrl(destinationCountry.code, 160) : ''}
                      alt={destinationCountry ? destinationCountry.name : 'Country flag'}
                      className="w-full h-full object-cover rounded-full border-2 border-gray-200 dark:border-gray-700"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                    {destinationCountry?.name}
                  </p>
                  <p className="text-xs text-gray-500">Destination</p>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {getResultTitle()}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{result.message}</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-2">
                {result.canApplyForEVisa && (
                  <motion.button
                    onClick={handleApplyClick}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-3 px-6 rounded-md font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Apply for eVisa
                  </motion.button>
                )}

                {result.requirement === 'visa-required' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center px-4 py-3 bg-white/60 dark:bg-gray-800/60 rounded-md">
                    A traditional embassy visa is required. Contact the {destinationCountry?.name} embassy or consulate in your country to apply.
                  </p>
                )}

                {['visa-free', 'visa-on-arrival', 'evisa', 'eta'].includes(result.requirement) && destination && (
                  <motion.button
                    onClick={() => navigate(`/visa/${destination}?nationality=${nationality}`)}
                    className="bg-white dark:bg-gray-700 border border-teal-600 text-teal-700 dark:text-teal-300 py-3 px-6 rounded-md font-medium hover:bg-teal-50 dark:hover:bg-gray-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {result.requirement === 'evisa' || result.requirement === 'eta'
                      ? 'View Application Details'
                      : 'See More Details'}
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default VisaChecker;
