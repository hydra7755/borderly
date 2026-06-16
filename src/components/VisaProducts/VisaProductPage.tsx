import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { VisaProduct } from '../../types/visaProduct';
import { visaRequirementsService } from '../../services/visaRequirementsService';
import { ALL_COUNTRIES } from '../../utils/countries';
import ImageSlider from '../ImageSlider';
import BlogSlider from '../Blog/BlogSlider';
import { getVisaFeeForCountryCode } from '../../data/visaFees';
import {
  BASE_SERVICE_FEE_GBP,
  getDiscountedServiceFeeGbp,
  getServiceFeeDiscountPercent,
} from '../../config/visaServiceFee';
import {
  canApplyOnlineForDestination,
  isSchengenCountry,
  isSchengenVisaApplication,
} from '../../utils/schengenCountries';
import { isUnitedStates, isUsVisaApplication } from '../../utils/unitedStatesVisa';
import { userProfileService } from '../../lib/api/userProfile';
import { useVisaRouting } from '../../hooks/useVisaRouting';
import VisaEligibilityInput from '../VisaEligibility/VisaEligibilityInput';
import VisaRoutingSummary from '../VisaEligibility/VisaRoutingSummary';
import { buildEligibilitySearchParams } from '../../engine/visaRoutingEngine';
import {
  calculateSchengenBorderlyTotalGbp,
  isUkResident,
  SCHENGEN_REQUIRED_DOCUMENTS,
  SCHENGEN_BORDERLY_SERVICE_FEE_GBP,
} from '../../config/schengenPricing';
import SchengenEmbassyFeeTable from './SchengenEmbassyFeeTable';
import SchengenTravelInsuranceAddon from '../VisaEligibility/SchengenTravelInsuranceAddon';
import EvisaExpressProcessingAddon from '../VisaEligibility/EvisaExpressProcessingAddon';
import MoroccoWaiverInfo from '../VisaEligibility/MoroccoWaiverInfo';
import TurkeyWaiverInfo from '../VisaEligibility/TurkeyWaiverInfo';
import { EVISA_EXPRESS_PROCESSING_FEE_GBP } from '../../config/evisaPricing';
import {
  isMoroccoDestination,
  isMoroccoWaiverUnlocked,
  shouldShowMoroccoWaiverInfo,
} from '../../config/moroccoWaiver';
import {
  isTurkeyDestination,
  isTurkeyWaiverUnlocked,
  shouldShowTurkeyWaiverInfo,
} from '../../config/turkeyWaiver';
import { 
  FaGlobe, 
  FaPassport, 
  FaCalendarAlt, 
  FaInfoCircle, 
  FaCreditCard, 
  FaFileAlt, 
  FaPlane, 
  FaQuestionCircle, 
  FaChevronDown, 
  FaChevronUp,
  FaChevronRight,
  FaMoneyBillWave,
  FaClock,
  FaCamera,
  FaHotel,
  FaShieldAlt,
  FaWpforms,
  FaClipboardCheck,
  FaFolderOpen,
  FaFile,
  FaRoute,
  FaUniversity,
  FaHourglass,
  FaNewspaper,
  FaArrowRight
} from 'react-icons/fa';

// Mock Auth context if the real one doesn't exist
const useAuth = () => {
  return {
    user: {
      id: 'mock-user-id',
      email: 'user@example.com',
      nationality: null,
      profileComplete: false
    },
    loading: false,
    error: null
  };
};

interface VisaProductPageProps {
  product: VisaProduct;
}

const VisaProductPage: React.FC<VisaProductPageProps> = ({ product }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth() || {};
  const isSchengenDestination = isSchengenCountry(product.countryCode);
  const isUsDestination = isUnitedStates(product.countryCode);
  const [userNationality, setUserNationality] = useState<string | null>(null);
  const [userNationalityName, setUserNationalityName] = useState<string | null>(null);
  const [profileResidency, setProfileResidency] = useState<string | null>(null);
  const [visaRequirementForUser, setVisaRequirementForUser] = useState<{
    requirement: string;
    canApply: boolean;
    stay_duration?: number;
    notes?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userCurrency, setUserCurrency] = useState<string>('GBP');
  const [currencySymbol, setCurrencySymbol] = useState<string>('£');
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({
    GBP: 1,
    USD: 1.31,
    EUR: 1.17,
    INR: 109.5,
    PKR: 365.8,
    JPY: 196.8,
    AUD: 1.95
  });
  const [selectedCurrency, setSelectedCurrency] = useState<string>('GBP');
  
  // Track which FAQ items are open
  const [openFaqItems, setOpenFaqItems] = useState<number[]>([]);
  
  // State for traveler count
  const [travelerCount, setTravelerCount] = useState(1);
  const [addTravelInsurance, setAddTravelInsurance] = useState(false);
  const [addExpressProcessing, setAddExpressProcessing] = useState(false);

  // User subscription status (mock - would come from user profile)
  const [userSubscription, setUserSubscription] = useState<{
    status: 'none' | 'free' | 'premium' | 'enterprise';
    discountPercentage: number;
  }>({ status: 'none', discountPercentage: 0 });

  // Memoize the data fetching function
  const fetchUserData = useCallback(async (isMounted: boolean) => {
    if (!isMounted) return;
    
    try {
      setLoading(true);
      
      // Get all necessary data in a single operation and batch state updates
      const queryParams = new URLSearchParams(location.search);
      const nationalityFromUrl = queryParams.get('nationality');
      
      // Use local variables to collect state updates
      let nationalityValue: string | null = null;
      let nationalityNameValue: string = '';
      let subscriptionValue = {
        status: 'none' as 'none' | 'free' | 'premium' | 'enterprise',
        discountPercentage: 0,
      };

      try {
        const { profile } = await userProfileService.getCurrentUserProfile();
        if (profile?.subscription_tier) {
          const tier = profile.subscription_tier as 'free' | 'premium' | 'enterprise';
          subscriptionValue.status = tier === 'free' ? 'free' : tier;
          subscriptionValue.discountPercentage = getServiceFeeDiscountPercent(tier);
        }
        if (profile?.nationality) {
          nationalityValue = profile.nationality;
        }
        if (profile?.residency) {
          if (isMounted) setProfileResidency(profile.residency);
        }
      } catch {
        // Keep default (no discount)
      }

      if (nationalityFromUrl) {
        nationalityValue = nationalityFromUrl;
      } else if (!nationalityValue && user?.nationality) {
        nationalityValue = user.nationality;
      }
      
      // Set the country name if nationality was found
      if (nationalityValue) {
        nationalityNameValue = visaRequirementsService.getCountryNameFromCode(nationalityValue);
      }
      
      // Batch update all state at once (only if component is still mounted)
      if (isMounted) {
        setUserNationality(nationalityValue);
        setUserNationalityName(nationalityNameValue);
        setUserCurrency('GBP');
        setSelectedCurrency('GBP');
        setCurrencySymbol('£');
        setUserSubscription(subscriptionValue);
        setLoading(false);
      }
      
      // Fetch visa requirement separately after primary updates
      if (nationalityValue && isMounted) {
        try {
          const visaReq = await visaRequirementsService.getVisaRequirement(
            nationalityValue, 
            product.countryCode
          );
          
          if (visaReq && isMounted) {
            const canApply = canApplyOnlineForDestination(visaReq.requirement, product.countryCode);
            setVisaRequirementForUser({
              requirement: visaReq.requirement,
              canApply,
              stay_duration: visaReq.stay_duration,
              notes: visaReq.notes
            });
          }
        } catch (error) {
          console.error('Error fetching visa requirement:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (isMounted) setLoading(false);
    }
  }, [location.search, product.countryCode, user]);

  // Use a ref to track component mount state
  const isMountedRef = React.useRef(true);
  const didInitializeRef = React.useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Only fetch data once on initial mount or when key dependencies change
    if (!didInitializeRef.current) {
      didInitializeRef.current = true;
      fetchUserData(isMountedRef.current);
    }
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchUserData]);

  const nationalityFromSearch = () => new URLSearchParams(location.search).get('nationality') ?? '';
  const effectiveNationality = userNationality || nationalityFromSearch();

  const {
    eligibility,
    routingResult,
    setResidenceCountry,
    togglePremiumVisa,
  } = useVisaRouting({
    passportNationality: effectiveNationality || 'xx',
    destinationCode: product.countryCode,
    initialSearch: location.search,
    profileResidency,
  });

  const isMorocco = isMoroccoDestination(product.countryCode);
  const isTurkey = isTurkeyDestination(product.countryCode);
  const moroccoWaiverRoute = shouldShowMoroccoWaiverInfo(
    product.countryCode,
    visaRequirementForUser?.requirement
  );
  const turkeyWaiverRoute = shouldShowTurkeyWaiverInfo(
    product.countryCode,
    visaRequirementForUser?.requirement
  );
  const moroccoWaiverUnlocked = isMoroccoWaiverUnlocked(routingResult);
  const turkeyWaiverUnlocked = isTurkeyWaiverUnlocked(routingResult);
  const destinationWaiverUnlocked = moroccoWaiverUnlocked || turkeyWaiverUnlocked;

  const isEvisaDestination =
    !isSchengenDestination &&
    !isUsDestination &&
    (visaRequirementForUser?.requirement === 'evisa' ||
      product.visaType === 'evisa' ||
      destinationWaiverUnlocked);

  const standardProcessingLabel = isSchengenDestination
    ? 'At least 15 working days'
    : isEvisaDestination
      ? '3-5 business days'
      : product.processingTime?.normal || '10-15 business days';

  const hasSubscriptionDiscount = userSubscription.discountPercentage > 0;

  const shouldShowPricing = () => {
    if (!visaRequirementForUser) return isSchengenDestination || isUsDestination;
    return (
      ['evisa', 'eta'].includes(visaRequirementForUser.requirement) ||
      destinationWaiverUnlocked ||
      isSchengenVisaApplication(visaRequirementForUser.requirement, product.countryCode) ||
      isUsVisaApplication(visaRequirementForUser.requirement, product.countryCode)
    );
  };

  const handleApplyClick = () => {
    if (!routingResult.canApplyOnline) {
      return;
    }
    if (
      !visaRequirementForUser?.canApply &&
      !(isSchengenDestination || isUsDestination || destinationWaiverUnlocked)
    ) {
      return;
    }

    const nationalityCode = effectiveNationality;
    if (!nationalityCode) {
      navigate('/login?redirect=' + encodeURIComponent(`/visa/${product.countryCode}?nationality=${nationalityFromSearch()}`));
      return;
    }

    const eligibilityParams = buildEligibilitySearchParams(eligibility);
    if (isSchengenDestination && addTravelInsurance && ukResidentForInsurance) {
      eligibilityParams.set('addTravelInsurance', '1');
    }
    if (isEvisaDestination && addExpressProcessing) {
      eligibilityParams.set('addExpressProcessing', '1');
    }
    const query = eligibilityParams.toString();
    navigate(
      `/visa/apply/${nationalityCode}/${product.countryCode}${query ? `?${query}` : ''}`
    );
  };

  // Toggle FAQ item open/closed state
  const toggleFaqItem = (index: number) => {
    setOpenFaqItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(item => item !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const getButtonText = () => {
    if (turkeyWaiverUnlocked) return 'Apply for Turkey eVisa';
    if (moroccoWaiverUnlocked) return 'Apply for Morocco eVisa';
    if (!visaRequirementForUser) {
      if (isUsDestination) return 'Start U.S. Visa Application';
      return isSchengenDestination ? 'Apply for Schengen Visa' : 'Check Visa Options';
    }

    switch (visaRequirementForUser.requirement) {
      case 'evisa':
        return 'Apply for eVisa';
      case 'eta':
        return 'Apply for ETA';
      case 'visa-on-arrival':
        return 'Get Visa on Arrival Info';
      case 'visa-free':
        return 'No Visa Required';
      case 'visa-required':
        return isSchengenVisaApplication(visaRequirementForUser.requirement, product.countryCode)
          ? 'Start Schengen Application'
          : isUsVisaApplication(visaRequirementForUser.requirement, product.countryCode)
            ? 'Start U.S. Visa Application'
            : 'Contact Embassy';
      default:
        return 'Check Visa Options';
    }
  };

  const getButtonDisabled = () => {
    if (destinationWaiverUnlocked) return false;
    if (!visaRequirementForUser) return !(isSchengenDestination || isUsDestination);
    if (visaRequirementForUser.canApply) return false;
    return ['visa-free', 'not-applicable', 'visa-required'].includes(
      visaRequirementForUser.requirement
    );
  };

  const convertCurrency = (amountInGBP: number): number => {
    if (!amountInGBP) return 0;
    const rate = exchangeRates[selectedCurrency] || 1;
    return parseFloat((amountInGBP * rate).toFixed(2));
  };

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case 'GBP': return '£';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'INR': return '₹';
      case 'PKR': return '₨';
      case 'JPY': return '¥';
      case 'AUD': return 'A$';
      default: return currency;
    }
  };

  const formatPrice = (amount: number): string => {
    return `${getCurrencySymbol(selectedCurrency)}${amount.toFixed(2)}`;
  };

  const getVisaApplicationFee = () =>
    isSchengenDestination ? 0 : getVisaFeeForCountryCode(product.countryCode);

  const getDiscountedServiceFee = () =>
    isSchengenDestination
      ? calculateSchengenBorderlyTotalGbp({
          travelerCount: 1,
          discountPercent: userSubscription.discountPercentage,
          addTravelInsurance: false,
          travelDays: 1,
          isUkResident: false,
        }).serviceFee
      : getDiscountedServiceFeeGbp(userSubscription.discountPercentage);

  const ukResidentForInsurance = isUkResident(
    eligibility.residenceCountry,
    eligibility.residenceMode,
    effectiveNationality || ''
  );
  
  // Get subscription name for display
  const getSubscriptionName = (): string => {
    switch (userSubscription.status) {
      case 'free':
        return 'Free';
      case 'basic':
        return 'Basic';
      case 'premium':
        return 'Premium';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'None';
    }
  };
  
  // Get total price (application fee + discounted service fee) * traveler count
  const getTotalPrice = () => {
    return (getVisaApplicationFee() + getDiscountedServiceFee()) * travelerCount;
  };
  
  // Handle traveler count changes
  const decreaseTravelerCount = () => {
    if (travelerCount > 1) {
      setTravelerCount(travelerCount - 1);
    }
  };
  
  const increaseTravelerCount = () => {
    if (travelerCount < 10) {
      setTravelerCount(travelerCount + 1);
    }
  };

  // Memoize price calculations (ensure dependencies are stable)
  const prices = React.useMemo(() => {
    if (isSchengenDestination) {
      const schengenPricing = calculateSchengenBorderlyTotalGbp({
        travelerCount,
        discountPercent: userSubscription.discountPercentage,
        addTravelInsurance: addTravelInsurance && ukResidentForInsurance,
        travelDays: 1,
        isUkResident: ukResidentForInsurance,
      });
      return {
        visaFee: 0,
        appointmentFee: schengenPricing.appointmentFee,
        serviceFee: schengenPricing.serviceFee,
        travelInsurance: schengenPricing.travelInsurance,
        expressProcessing: 0,
        total: schengenPricing.total,
      };
    }

    const visaFee = getVisaApplicationFee();
    const serviceFee = getDiscountedServiceFeeGbp(userSubscription.discountPercentage);
    const expressFee = addExpressProcessing && isEvisaDestination ? EVISA_EXPRESS_PROCESSING_FEE_GBP : 0;

    return {
      visaFee,
      appointmentFee: 0,
      serviceFee,
      travelInsurance: 0,
      expressProcessing: expressFee,
      total: (visaFee + serviceFee) * travelerCount + expressFee,
    };
  }, [
    travelerCount,
    userSubscription.discountPercentage,
    product.countryCode,
    isSchengenDestination,
    addTravelInsurance,
    ukResidentForInsurance,
    isEvisaDestination,
    addExpressProcessing,
  ]);

  const serviceFeeSavingsGbp = React.useMemo(() => {
    const undiscountedPerUnit = isSchengenDestination
      ? SCHENGEN_BORDERLY_SERVICE_FEE_GBP
      : BASE_SERVICE_FEE_GBP;
    const undiscountedTotal = isSchengenDestination
      ? undiscountedPerUnit
      : undiscountedPerUnit * travelerCount;
    const discountedTotal = isSchengenDestination
      ? prices.serviceFee
      : prices.serviceFee * travelerCount;
    return Math.max(0, Number((undiscountedTotal - discountedTotal).toFixed(2)));
  }, [isSchengenDestination, prices.serviceFee, travelerCount]);

  const undiscountedServiceFeePerTravelerGbp = isSchengenDestination
    ? SCHENGEN_BORDERLY_SERVICE_FEE_GBP
    : BASE_SERVICE_FEE_GBP;
  const serviceFeeLineTotalGbp = isSchengenDestination
    ? prices.serviceFee
    : prices.serviceFee * travelerCount;
  const undiscountedServiceFeeLineTotalGbp = isSchengenDestination
    ? undiscountedServiceFeePerTravelerGbp
    : undiscountedServiceFeePerTravelerGbp * travelerCount;

  const renderServiceFeeRow = (label: string) => (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-base text-gray-600 dark:text-gray-400">{label}</p>
        {hasSubscriptionDiscount && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400 line-through dark:text-gray-500">
              {currencySymbol}{undiscountedServiceFeeLineTotalGbp.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {currencySymbol}{serviceFeeLineTotalGbp.toFixed(2)}
            </span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-200">
              {userSubscription.discountPercentage}% {getSubscriptionName()} off
            </span>
          </div>
        )}
      </div>
      {!hasSubscriptionDiscount && (
        <p className="shrink-0 text-base font-medium text-gray-700 dark:text-gray-300">
          {currencySymbol}{serviceFeeLineTotalGbp.toFixed(2)}
        </p>
      )}
    </div>
  );

  const renderSubscriptionBanner = (compact = false) => {
    if (hasSubscriptionDiscount) {
      return (
        <div
          className={`rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800/40 dark:bg-green-900/20 ${compact ? '' : 'p-4'}`}
        >
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            {getSubscriptionName()} member — {userSubscription.discountPercentage}% service fee discount applied
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            You save {currencySymbol}{convertCurrency(serviceFeeSavingsGbp).toFixed(2)} on Borderly service fees
            for this application
          </p>
        </div>
      );
    }

    return (
      <div className={`rounded-lg bg-white/50 p-3 text-center backdrop-blur-sm dark:bg-gray-800/50 ${compact ? '' : ''}`}>
        <p className="mb-1 text-sm text-primary-600 dark:text-primary-400">
          Upgrade to a subscription and save up to 20% on service fees
        </p>
        <button
          type="button"
          onClick={() => navigate('/pricing')}
          className="mx-auto flex items-center justify-center text-sm font-medium text-primary-600 transition-colors duration-200 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          View Plans <FaChevronRight className="ml-1" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-xl rounded-xl overflow-hidden max-w-7xl mx-auto">
      {/* Hero Section with Country Image - Using ImageSlider Component */}
      <div className="relative h-96 bg-gray-200">
        {product.images && product.images.length > 0 ? (
          <ImageSlider 
            images={product.images} 
            altText={`${product.countryName} visa travel`}
            autoRotate={true}
            rotationInterval={7000}
            showAttribution={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">
            <FaGlobe className="text-white text-6xl opacity-30" />
            <span className="text-white text-xl ml-4 font-medium">Explore {product.countryName}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center space-x-3">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold text-white">
              {product.countryName} <span className="text-primary-400">Visa</span>
            </motion.h1>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center mt-3">
            <span className={`px-4 py-1.5 text-sm font-medium rounded-full shadow-sm backdrop-blur-sm ${
              product.visaType === 'visa-free' ? 'bg-green-500/90 text-white' :
              product.visaType === 'evisa' ? 'bg-blue-500/90 text-white' :
              product.visaType === 'visa-on-arrival' ? 'bg-yellow-500/90 text-white' :
              product.visaType === 'eta' ? 'bg-purple-500/90 text-white' :
              isSchengenDestination ? 'bg-indigo-500/90 text-white' :
              isUsDestination ? 'bg-blue-700/90 text-white' :
              'bg-red-500/90 text-white'
            }`}>
              {product.visaType === 'visa-free' ? 'Visa Free' :
               product.visaType === 'evisa' ? 'eVisa Available' :
               product.visaType === 'visa-on-arrival' ? 'Visa on Arrival' :
               product.visaType === 'eta' ? 'ETA Required' :
               isSchengenDestination ? 'Schengen Visa' :
               isUsDestination ? 'U.S. Visa (DS-160)' :
               'Visa Required'}
            </span>
          </motion.div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-8">
        {/* Currency Display */}
        <div className="mb-6 flex justify-end">
          <div className="relative">
            <div className="flex items-center space-x-2">
              <FaMoneyBillWave className="text-primary-500" />
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Showing prices in {selectedCurrency} {currencySymbol}
              </span>
            </div>
          </div>
        </div>

        {effectiveNationality && (
          <VisaEligibilityInput
            className="mb-8"
            residenceCountry={eligibility.residenceCountry}
            heldPremiumVisas={eligibility.heldPremiumVisas}
            onResidenceCountryChange={setResidenceCountry}
            onPremiumVisaToggle={togglePremiumVisa}
          />
        )}

        {/* Visa Details and Pricing Cards - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Visa Details - Left Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-4 h-full flex flex-col">
            {/* Visa Type Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 flex-1">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/10">
                <div className="flex items-center">
                  <FaPassport className="mr-2 text-primary-500" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Visa Type</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {effectiveNationality
                    ? routingResult.visaTypeLabel
                    : visaRequirementForUser?.requirement === 'evisa' ? 'eVisa Available' :
                   visaRequirementForUser?.requirement === 'visa-free' ? 'Visa Free Entry' :
                   visaRequirementForUser?.requirement === 'visa-on-arrival' ? 'Visa on Arrival' :
                   visaRequirementForUser?.requirement === 'eta' ? 'ETA Required' :
                   isSchengenVisaApplication(visaRequirementForUser?.requirement ?? '', product.countryCode)
                     ? 'Schengen Visa (Apply Online)'
                     : visaRequirementForUser?.requirement === 'visa-required' ? 'Traditional Visa Required' :
                   product.visaType === 'evisa' ? 'eVisa Available' :
                   product.visaType === 'visa-free' ? 'Visa Free Entry' :
                   product.visaType === 'visa-on-arrival' ? 'Visa on Arrival' :
                   product.visaType === 'eta' ? 'ETA Required' :
                   isSchengenDestination ? 'Schengen Visa (Apply Online)' :
                   'Traditional Visa Required'}
                </p>
              </div>
            </div>
            
            {/* Validity Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 flex-1">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/10">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-primary-500" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Validity</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {isSchengenDestination
                    ? "At visa officer's discretion (typically up to 1 year)"
                    : product.visaValidity || '90 days from issue'}
                </p>
              </div>
            </div>
            
            {/* Length of Stay Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 flex-1">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/10">
                <div className="flex items-center">
                  <FaClock className="mr-2 text-primary-500" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Length of Stay</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {isSchengenDestination
                    ? "Visa officer's decision — from 7 days (single entry) to 1 year (multiple entry)"
                    : routingResult.maxStayDays
                      ? `${routingResult.maxStayDays} days`
                      : visaRequirementForUser?.stay_duration
                        ? `${visaRequirementForUser.stay_duration} days`
                        : product.lengthOfStay || routingResult.maxStayPeriod || 'Varies'}
                </p>
              </div>
            </div>
            
            {/* Entry Type Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 flex-1">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/10">
                <div className="flex items-center">
                  <FaRoute className="mr-2 text-primary-500" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Entry Type</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {isSchengenDestination
                    ? 'Single or multiple (visa officer decides)'
                    : product.entryType === 'multiple'
                      ? 'Multiple'
                      : 'Single'}
                </p>
              </div>
            </div>
            
            {/* Processing Time Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 flex-1">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/10">
                <div className="flex items-center">
                  <FaHourglass className="mr-2 text-primary-500" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing Time</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {isSchengenDestination ? (
                    standardProcessingLabel
                  ) : (
                    <>
                      Standard: {standardProcessingLabel}
                      {isEvisaDestination && (
                        <>
                          <br />
                          <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                            Express (1 day) available as a £100 add-on at checkout
                          </span>
                        </>
                      )}
                      {!isEvisaDestination && product.processingTime?.express && (
                        <>
                          <br />
                          Express: {product.processingTime.express}
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
            </div>
          </motion.div>

          {/* Pricing or Visa Info Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full"
          >
            <div className="rounded-xl overflow-hidden shadow-lg h-full">
              {/* Header */}
              <div className="p-6 text-white bg-gradient-to-r from-primary-600 to-primary-700">
                <div className="flex items-center space-x-3">
                  {shouldShowPricing() ? (
                    <>
                      <FaCreditCard className="text-white text-xl" />
                      <h3 className="text-xl font-bold text-white">Visa Pricing</h3>
                    </>
                  ) : (
                    <>
                      <FaInfoCircle className="text-white text-xl" />
                      <h3 className="text-xl font-bold text-white">Visa Information</h3>
                    </>
                  )}
                </div>
                
                {shouldShowPricing() && (
                  <div className="mt-3 inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-white/20 backdrop-blur-sm">
                    Showing prices in {selectedCurrency} {currencySymbol}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex h-full flex-col gap-3 bg-gradient-to-b from-white to-gray-50 p-5 dark:from-gray-800 dark:to-gray-900">
                {shouldShowPricing() ? (
                  <>
                    {effectiveNationality && !isSchengenDestination && (
                      <VisaRoutingSummary
                        routing={routingResult}
                        showPricing={false}
                        compact
                      />
                    )}

                    {isSchengenDestination && <SchengenEmbassyFeeTable />}

                    {isSchengenDestination && ukResidentForInsurance && (
                      <SchengenTravelInsuranceAddon
                        checked={addTravelInsurance}
                        onChange={setAddTravelInsurance}
                        travelerCount={travelerCount}
                        currencySymbol={currencySymbol}
                      />
                    )}

                    {isEvisaDestination && (
                      <EvisaExpressProcessingAddon
                        checked={addExpressProcessing}
                        onChange={setAddExpressProcessing}
                        currencySymbol={currencySymbol}
                        compact
                      />
                    )}

                    {/* Price Breakdown */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
                      <p className="mb-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Price Breakdown
                      </p>
                      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                        {isSchengenDestination
                          ? 'Borderly fees only — embassy fees are paid separately at your appointment.'
                          : 'Government visa fee plus Borderly service fee.'}
                      </p>

                      <div className="space-y-2">
                        {isSchengenDestination ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-base text-gray-600 dark:text-gray-400">
                                Appointment booking fee ({travelerCount} traveler
                                {travelerCount === 1 ? '' : 's'})
                              </p>
                              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                {currencySymbol}{prices.appointmentFee.toFixed(2)}
                              </p>
                            </div>
                            {renderServiceFeeRow('Borderly visa service')}
                            {prices.travelInsurance > 0 && (
                              <div className="flex items-center justify-between">
                                <p className="text-base text-gray-600 dark:text-gray-400">
                                  Travel insurance add-on
                                </p>
                                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                  {currencySymbol}{prices.travelInsurance.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-base text-gray-600 dark:text-gray-400">Visa Application Fee</p>
                              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                {currencySymbol}{(prices.visaFee * travelerCount).toFixed(2)}
                              </p>
                            </div>
                            {renderServiceFeeRow('Visa Service Fee')}
                            {prices.expressProcessing > 0 && (
                              <div className="flex items-center justify-between">
                                <p className="text-base text-gray-600 dark:text-gray-400">
                                  Express processing add-on
                                </p>
                                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                                  {currencySymbol}{prices.expressProcessing.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">Total</p>
                        <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          {currencySymbol}{prices.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <div>
                      <button
                        onClick={handleApplyClick}
                        disabled={getButtonDisabled()}
                        className="w-full py-3.5 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 transition-all duration-200 text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {getButtonText()}
                      </button>
                    </div>

                    {renderSubscriptionBanner(true)}
                  </>
                ) : (
                  <>
                    {/* Visa Information for non-eVisa countries */}
                    <div className="space-y-6 h-full flex flex-col justify-between">
                      {/* Visa Type Information */}
                      <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg">
                        <div className="flex items-center mb-3">
                          <FaPassport className="mr-2 text-primary-500" />
                          <h4 className="font-semibold text-primary-700 dark:text-primary-300">Visa Status</h4>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {visaRequirementForUser?.requirement === 'visa-free' ? (
                            <>You do not need a visa to travel to {product.countryName}. You can stay for up to {visaRequirementForUser?.stay_duration || 90} days.</>
                          ) : visaRequirementForUser?.requirement === 'visa-on-arrival' ? (
                            <>You can obtain a visa on arrival when you reach {product.countryName}. This allows you to stay for up to {visaRequirementForUser?.stay_duration || 30} days.</>
                          ) : isUsVisaApplication(visaRequirementForUser?.requirement ?? '', product.countryCode) ? (
                            <>You need a U.S. visa to travel to the United States. Borderly supports the full DS-160 online application with guided document upload.</>
                          ) : isSchengenVisaApplication(visaRequirementForUser?.requirement ?? '', product.countryCode) ? (
                            <>You need a Schengen visa to travel to {product.countryName}. Borderly supports online Schengen applications with guided document upload and the full Schengen form.</>
                          ) : visaRequirementForUser?.requirement === 'visa-required' ? (
                            moroccoWaiverRoute || turkeyWaiverRoute ? (
                              <>
                                {destinationWaiverUnlocked
                                  ? `You qualify for the ${product.countryName} e-Visa supporting-document route. Apply online through Borderly with your physical supporting visa or residence permit.`
                                  : `Citizens of ${userNationalityName || 'your country'} normally need a traditional embassy visa. If you hold a qualifying supporting document, update your eligibility context above to unlock the e-Visa route.`}
                              </>
                            ) : (
                              <>You need to apply for a traditional visa at the {product.countryName} embassy or consulate before your travel.</>
                            )
                          ) : isUsDestination ? (
                            <>Apply for a U.S. visa through Borderly. Our guided DS-160 application covers passport, travel, family, employment, and security questionnaires.</>
                          ) : (
                            <>Please check with the {product.countryName} embassy or consulate for the most up-to-date visa requirements.</>
                          )}
                        </p>
                      </div>
                      
                      {/* Additional Information */}
                      <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg">
                        <div className="flex items-center mb-3">
                          <FaInfoCircle className="mr-2 text-primary-500" />
                          <h4 className="font-semibold text-primary-700 dark:text-primary-300">Important Information</h4>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                          {visaRequirementForUser?.requirement === 'visa-free' ? (
                            <>Make sure your passport is valid for at least 6 months beyond your planned departure date from {product.countryName}.</>
                          ) : visaRequirementForUser?.requirement === 'visa-on-arrival' ? (
                            <>Ensure you have the following when arriving:<br/>
                            - Valid passport with at least 6 months validity<br/>
                            - Return/onward ticket<br/>
                            - Sufficient funds for your stay<br/>
                            - Passport-sized photographs</>
                          ) : (
                            <>The visa application process typically takes {standardProcessingLabel}. We recommend applying well in advance of your travel date.</>
                          )}
                        </p>
                        {visaRequirementForUser?.notes && (
                          <p className="text-gray-700 dark:text-gray-300 mt-2">
                            <span className="font-medium">Note:</span> {visaRequirementForUser.notes}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <div className="mt-auto">
                        <button
                          onClick={handleApplyClick}
                          disabled={getButtonDisabled()}
                          className="w-full py-3 px-4 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {getButtonText()}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {isTurkey && turkeyWaiverRoute && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <TurkeyWaiverInfo
              passportCountryName={userNationalityName || undefined}
              defaultOpen={false}
              subtitle={
                turkeyWaiverUnlocked
                  ? 'You qualify — expand to review physical-document rules, validity requirements, and application steps.'
                  : userNationalityName
                    ? `See if ${userNationalityName} passport holders can apply with a USA, UK, Schengen, or Ireland visa/permit.`
                    : 'See supporting-document rules for nationalities that normally require an embassy visa.'
              }
            />
          </motion.div>
        )}

        {isMorocco && moroccoWaiverRoute && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <MoroccoWaiverInfo
              passportCountryName={userNationalityName || undefined}
              defaultOpen={false}
              subtitle={
                moroccoWaiverUnlocked
                  ? 'You qualify — expand to review eligibility rules, validity requirements, and application steps.'
                  : userNationalityName
                    ? `See if ${userNationalityName} passport holders can apply with a supporting visa or residence permit.`
                    : 'See eligibility rules for nationalities that normally require an embassy visa.'
              }
            />
          </motion.div>
        )}
        
        {/* Documents Required */}
        {((visaRequirementForUser?.requirement === 'visa-required' && (isSchengenDestination || isUsDestination)) ||
          visaRequirementForUser?.requirement === 'evisa' ||
          visaRequirementForUser?.requirement === 'eta' ||
          isSchengenDestination) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <FaFolderOpen className="text-primary-500 text-xl" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents Required</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const structuredDocs = isSchengenDestination
                  ? SCHENGEN_REQUIRED_DOCUMENTS
                  : product.documentsRequired;

                if (structuredDocs?.length) {
                  return structuredDocs.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="mt-0.5">
                        <FaFile className="text-primary-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{doc.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
                      </div>
                    </div>
                  ));
                }

                if (product.documents?.length) {
                  return product.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="mt-0.5">
                        <FaFile className="text-primary-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{doc}</h3>
                      </div>
                    </div>
                  ));
                }

                return (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No document requirements specified for this visa type.
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
        
        {/* FAQs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FaQuestionCircle className="text-primary-500 text-xl" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
            {product.faqs && product.faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <button
                  onClick={() => toggleFaqItem(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                  <div className="text-gray-500 transition-transform duration-200 transform">
                    {openFaqItems.includes(index) ? (
                      <FaChevronUp className="h-5 w-5" />
                    ) : (
                      <FaChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>
                
                {openFaqItems.includes(index) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Replace the blog posts section with BlogSlider */}
        <BlogSlider countryCode={product.countryCode} />
      </div>
    </div>
  );
};

export default VisaProductPage;

