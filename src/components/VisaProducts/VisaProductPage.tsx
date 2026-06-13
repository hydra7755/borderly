import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { VisaProduct } from '../../types/visaProduct';
import { visaRequirementsService } from '../../services/visaRequirementsService';
import { ALL_COUNTRIES } from '../../utils/countries';
import ImageSlider from '../ImageSlider';
import BlogSlider from '../Blog/BlogSlider';
import { 
  FaGlobe, 
  FaPassport, 
  FaCalendarAlt, 
  FaInfoCircle, 
  FaCreditCard, 
  FaFileAlt, 
  FaPlane, 
  FaCheckCircle, 
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
  const [userNationality, setUserNationality] = useState<string | null>(null);
  const [userNationalityName, setUserNationalityName] = useState<string | null>(null);
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
  
  const shouldShowPricing = () => {
    return ['evisa', 'eta'].includes(visaRequirementForUser?.requirement ?? '');
  };

  // User subscription status (mock - would come from user profile)
  const [userSubscription, setUserSubscription] = useState<{
    status: 'none' | 'basic' | 'premium' | 'business';
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
        status: 'none' as 'none' | 'basic' | 'premium' | 'business', 
        discountPercentage: 0 
      };
      
      // Determine nationality
      if (nationalityFromUrl) {
        nationalityValue = nationalityFromUrl;
      } else if (user) {
        try {
          const userProfile = await fetch(`/api/user/profile/${user.id}`).then(res => res.json());
          nationalityValue = userProfile.nationality || null;
          
          // Handle subscription info
          if (userProfile.subscription) {
            subscriptionValue.status = userProfile.subscription.status || 'none';
            
            // Calculate discount based on subscription tier
            switch (subscriptionValue.status) {
              case 'basic': subscriptionValue.discountPercentage = 10; break;
              case 'premium': subscriptionValue.discountPercentage = 20; break;
              case 'business': subscriptionValue.discountPercentage = 30; break;
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          nationalityValue = user.nationality || null;
        }
      } else {
        // Demo random subscription (only for non-logged in users)
        const demoSubscriptions = ['none', 'basic', 'premium', 'business'];
        subscriptionValue.status = demoSubscriptions[Math.floor(Math.random() * demoSubscriptions.length)] as any;
        
        switch (subscriptionValue.status) {
          case 'basic': subscriptionValue.discountPercentage = 10; break;
          case 'premium': subscriptionValue.discountPercentage = 20; break;
          case 'business': subscriptionValue.discountPercentage = 30; break;
        }
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
            const canApply = ['evisa', 'eta'].includes(visaReq.requirement);
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

  const handleApplyClick = () => {
    if (!visaRequirementForUser || !['evisa', 'eta'].includes(visaRequirementForUser.requirement)) {
      return;
    }

    const nationalityCode = userNationality || nationalityFromSearch();
    if (!nationalityCode) {
      navigate('/login?redirect=' + encodeURIComponent(`/visa/${product.countryCode}?nationality=${nationalityFromSearch()}`));
      return;
    }

    navigate(`/visa/apply/${nationalityCode}/${product.countryCode}`);
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
    if (!visaRequirementForUser) return 'Check Visa Options';

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
        return 'Contact Embassy';
      default:
        return 'Check Visa Options';
    }
  };

  const getButtonDisabled = () => {
    if (!visaRequirementForUser) return false;
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

  // Calculate eVisa application fee based on the country
  const getVisaApplicationFee = () => {
    // Fixed fee for each country to avoid fluctuations
    const fixedFees: {[key: string]: number} = {
      'USA': 61.57,
      'CAN': 61.57,
      'GBR': 61.57,
      'AUS': 61.57,
      'NZL': 61.57,
      'DEU': 61.57,
      'FRA': 61.57,
      'ITA': 61.57,
      'ESP': 61.57,
      'JPN': 61.57,
      'CHN': 61.57,
      'IND': 61.57,
      'BRA': 61.57,
      'ZAF': 61.57,
      'RUS': 61.57,
      'TUR': 61.57,
    };
    
    return fixedFees[product.countryCode] || 61.57; // Fixed fee for all countries
  };
  
  // Calculate service fee with subscription discount
  const getDiscountedServiceFee = () => {
    if (userSubscription.discountPercentage === 0) {
      return 58.95;
    }
    
    const discountAmount = 58.95 * (userSubscription.discountPercentage / 100);
    return 58.95 - discountAmount;
  };
  
  // Get subscription name for display
  const getSubscriptionName = (): string => {
    switch (userSubscription.status) {
      case 'basic':
        return 'Basic';
      case 'premium':
        return 'Premium';
      case 'business':
        return 'Business';
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
    // Ensure these functions don't rely on state that changes frequently within the effect
    const visaFee = getVisaApplicationFee(); 
    const serviceFee = getDiscountedServiceFee();
    
    return {
      visaFee,
      serviceFee,
      total: (visaFee + serviceFee) * travelerCount
    };
  // Add getVisaApplicationFee and getDiscountedServiceFee if they depend on props/state
  // For now, assuming they are stable or depend only on product/userSubscription which are handled.
  }, [travelerCount, userSubscription.discountPercentage, product.countryCode]); 

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
              'bg-red-500/90 text-white'
            }`}>
              {product.visaType === 'visa-free' ? 'Visa Free' :
               product.visaType === 'evisa' ? 'eVisa Available' :
               product.visaType === 'visa-on-arrival' ? 'Visa on Arrival' :
               product.visaType === 'eta' ? 'ETA Required' :
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
                  {visaRequirementForUser?.requirement === 'evisa' ? 'eVisa Available' :
                   visaRequirementForUser?.requirement === 'visa-free' ? 'Visa Free Entry' :
                   visaRequirementForUser?.requirement === 'visa-on-arrival' ? 'Visa on Arrival' :
                   visaRequirementForUser?.requirement === 'eta' ? 'ETA Required' :
                   visaRequirementForUser?.requirement === 'visa-required' ? 'Traditional Visa Required' :
                   product.visaType === 'evisa' ? 'eVisa Available' :
                   product.visaType === 'visa-free' ? 'Visa Free Entry' :
                   product.visaType === 'visa-on-arrival' ? 'Visa on Arrival' :
                   product.visaType === 'eta' ? 'ETA Required' : 'Traditional Visa Required'}
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
                <p className="font-medium text-gray-900 dark:text-white">90 days from issue</p>
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
                  {visaRequirementForUser?.stay_duration ? `${visaRequirementForUser.stay_duration} days` : 'Varies'}
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
                <p className="font-medium text-gray-900 dark:text-white">Single</p>
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
                  Normal: {product.processingTime?.normal || '10-15 business days'}<br/>
                  Express: {product.processingTime?.express || '1-2 business days'}
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
              <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-full flex flex-col justify-between bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                {shouldShowPricing() ? (
                  <>
                    {/* Visa Processing Section */}
                    <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg shadow-sm border border-primary-100 dark:border-primary-800/30">
                      <div className="flex items-center mb-2">
                        <FaCheckCircle className="mr-2 text-primary-500 text-lg" />
                        <h4 className="font-semibold text-primary-700 dark:text-primary-300 text-lg">Visa Processing</h4>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 flex items-center text-base">
                        <FaCheckCircle className="mr-2 text-primary-500" /> Guaranteed Fast Processing
                      </p>
                    </div>
                    
                    {/* Price Breakdown - Enhanced with glass-like effect */}
                    <div className="mb-5 p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-gray-800 dark:text-gray-200 font-semibold mb-3 text-lg">Price Breakdown</p>
                      
                      <div className="flex justify-between mb-3 items-center">
                        <p className="text-gray-600 dark:text-gray-400 text-base">Total Price</p>
                        <p className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                          {currencySymbol}{prices.total.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                      
                      <div className="flex justify-between mb-2 items-center">
                        <p className="text-gray-600 dark:text-gray-400 text-base">Visa Application Fee</p>
                        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
                          {currencySymbol}{prices.visaFee.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex justify-between mb-2 items-center">
                        <p className="text-gray-600 dark:text-gray-400 text-base">Visa Service Fee</p>
                        <p className="text-gray-700 dark:text-gray-300 text-base font-medium">
                          {currencySymbol}{prices.serviceFee.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Apply Button - Enhanced with gradient and shadow */}
                    <div className="mt-2">
                      <button
                        onClick={handleApplyClick}
                        className="w-full py-3.5 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 transition-all duration-200 text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        Start Application
                      </button>
                    </div>
                    
                    {/* Total Amount - Enhanced with more prominent styling */}
                    <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border border-primary-200 dark:border-primary-700/30 shadow-sm">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">Total Amount</p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {currencySymbol}{prices.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Subscription Prompt - Enhanced with subtle styling */}
                    <div className="mt-3 text-center p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <p className="text-sm text-primary-600 dark:text-primary-400 mb-1">
                        Upgrade to a subscription and save up to 20% on service fees
                      </p>
                      <button className="text-sm text-primary-600 dark:text-primary-400 font-medium flex items-center justify-center mx-auto hover:text-primary-700 transition-colors duration-200">
                        View Plans <FaChevronRight className="ml-1" />
                      </button>
                    </div>
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
                          ) : visaRequirementForUser?.requirement === 'visa-required' ? (
                            <>You need to apply for a traditional visa at the {product.countryName} embassy or consulate before your travel.</>
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
                            <>The visa application process typically takes {product.processingTime?.normal || '10-15'} business days. We recommend applying well in advance of your travel date.</>
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
                          className="w-full py-3 px-4 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700"
                        >
                          {visaRequirementForUser?.requirement === 'visa-free' ? 'No Visa Required' :
                           visaRequirementForUser?.requirement === 'visa-on-arrival' ? 'Get Visa on Arrival Info' :
                           'Check Embassy Details'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Upgrade Prompt */}
              {shouldShowPricing() && userSubscription.status === 'none' && (
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 border-t border-primary-100 dark:border-primary-800">
                  <p className="text-sm text-center text-primary-700 dark:text-primary-300">
                    <span className="font-medium">Upgrade to a subscription</span> and save up to 30% on service fees
                  </p>
                  <div className="mt-2 text-center">
                    <button 
                      onClick={() => navigate('/pricing')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      View Plans
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Documents Required - Only show for visa-required countries */}
        {(visaRequirementForUser?.requirement === 'visa_required' || 
          visaRequirementForUser?.requirement === 'evisa' || 
          visaRequirementForUser?.requirement === 'eta') && (
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
              {/* Fallback to product.documents if documentsRequired doesn't exist */}
              {product.documentsRequired ? (
                product.documentsRequired.map((doc: { name: string; description: string }, index: number) => (
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
                ))
              ) : product.documents ? (
                product.documents.map((doc: string, index: number) => (
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
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-gray-500">
                  No document requirements specified for this visa type.
                </div>
              )}
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

