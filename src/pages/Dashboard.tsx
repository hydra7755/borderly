import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import Header from '../components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTravelScore, getTravelScoreLevel, getScoreBreakdown } from '../utils/travelScore';
import VisaRequirementsMap from '../components/Dashboard/SimpleWorldMap'; // Use the renamed map component
import CountryDetailsModal from '../components/Dashboard/CountryDetailsModal';
import { VisaRequirement } from '../types/visa'; // Import from visa.ts
import { getCountryName } from '../data/countryCodes';
import SavedCountries from '../components/Dashboard/SavedCountries';
import useMapLoader from '../hooks/useMapLoader';
import userProfileService, { UserProfile } from '../lib/api/userProfile';
import documentService from '../lib/api/documentService';
import authService from '../lib/api/auth';
import visaApplicationsService from '../lib/api/visaApplications';
import VisaApplications from '../components/Dashboard/VisaApplications';
import { VisaApplication } from '../types/visa';

interface DashboardProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  initialTab?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  subscription_tier: string;
  nationality: string;
  residency: string;
  travel_history: string[];
  saved_countries: string[];
  travel_score: number;
  recent_checks: {
    country: string;
    date: string;
    result: string;
  }[];
  saved_documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded: string;
    size?: number;
    category?: string;
  }[];
  upcoming_trips: {
    id: string;
    destination: string;
    departure_date: string;
    return_date: string;
    dates?: string;
    status?: string;
    documents?: {
      id: string;
      name: string;
      type: string;
      uploaded: string;
    }[];
  }[];
}

// Update the UserProfile interface to match the data we're using
interface ExtendedUserProfile extends UserProfile {
  travel_history?: string[];
  saved_countries?: string[];
  saved_documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded: string;
    size?: number;
    category?: string;
  }[];
}

// Mock passport strength data (0-500 scale, will be normalized to 0-600 for display)
const mockPassportStrengthData: Record<string, { strength: number }> = {
  'GB': { strength: 380 }, // United Kingdom
  'US': { strength: 375 }, // United States
  'DE': { strength: 385 }, // Germany
  'JP': { strength: 370 }, // Japan
  'CA': { strength: 375 }, // Canada
  'AU': { strength: 370 }, // Australia
  'FR': { strength: 385 }, // France
  'IT': { strength: 380 }, // Italy
  'ES': { strength: 375 }, // Spain
  'NL': { strength: 380 }, // Netherlands
  'SE': { strength: 380 }, // Sweden
  'SG': { strength: 370 }, // Singapore
  'CH': { strength: 385 }, // Switzerland
  'AT': { strength: 380 }, // Austria
  'NO': { strength: 380 }, // Norway
  'NZ': { strength: 370 }, // New Zealand
  'PT': { strength: 375 }, // Portugal
  'DK': { strength: 380 }, // Denmark
  'FI': { strength: 380 }, // Finland
  'LU': { strength: 380 }, // Luxembourg
  'BE': { strength: 380 }, // Belgium
  'IE': { strength: 375 }, // Ireland
  'IS': { strength: 375 }, // Iceland
  'KR': { strength: 365 }, // South Korea
  'MY': { strength: 350 }, // Malaysia
  'AE': { strength: 345 }, // United Arab Emirates
  'HK': { strength: 360 }, // Hong Kong
  'CL': { strength: 340 }, // Chile
  'AR': { strength: 335 }, // Argentina
  'BR': { strength: 330 }, // Brazil
  'MX': { strength: 325 }, // Mexico
  'ZA': { strength: 320 }, // South Africa
  'TH': { strength: 315 }, // Thailand
  'CN': { strength: 310 }, // China
  'IN': { strength: 300 }, // India
  'RU': { strength: 315 }, // Russia
  'TR': { strength: 310 }, // Turkey
  'EG': { strength: 290 }, // Egypt
  'NG': { strength: 280 }, // Nigeria
  'ID': { strength: 295 }, // Indonesia
  // Default value will be 350 for countries not in this list
};

// Define the structure of visa requirements data
interface VisaRequirementData {
  Passport: string;
  Destination: string;
  Requirement: string;
}

const Dashboard: React.FC<DashboardProps> = ({ isLoggedIn = true, onLoginRequired, initialTab = 'overview' }) => {
  // State for the map loader
  const mapLoaderState = useMapLoader();
  const { isLoaded: isMapLibraryLoaded, hasError: mapLibraryHasError } = mapLoaderState;

  // State for controlling the active tab
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // State for user data and loading/error status
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for user nationality to pass to the map
  const [nationality, setNationality] = useState<string>('');

  // Add state for travel score and its breakdown
  const [travelScore, setTravelScore] = useState<number>(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<{
    passportComponent: number;
    historyComponent: number;
    residencyComponent: number;
  }>({ passportComponent: 0, historyComponent: 0, residencyComponent: 0 });

  // State for controlling the upgrade banner visibility
  const [showUpgradeBanner, setShowUpgradeBanner] = useState<boolean>(true);

  // State for new trip form
  const [newTripDestination, setNewTripDestination] = useState<string>('');
  const [newTripDates, setNewTripDates] = useState<string>('');
  const [newTripStartDate, setNewTripStartDate] = useState<string>('');
  const [newTripEndDate, setNewTripEndDate] = useState<string>('');
  const [newDocumentName, setNewDocumentName] = useState<string>('');
  const [newDocumentType, setNewDocumentType] = useState<string>('PDF');
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    name: string;
    visaDetails: VisaRequirement;
  } | null>(null);
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);
  const [savedCountries, setSavedCountries] = useState<Array<{
    code: string;
    name: string;
    visaType: string;
  }>>([]);
  const navigate = useNavigate();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripDocumentName, setTripDocumentName] = useState<string>('');
  const [tripDocumentType, setTripDocumentType] = useState<string>('PDF');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentCategory, setDocumentCategory] = useState('General');
  const [recommendationDestinations, setRecommendationDestinations] = useState<Array<{
    name: string;
    code: string;
    description: string;
    visa_status?: string;
    tags: string[]
  }>>([]);
  const [visaRequirements, setVisaRequirements] = useState<VisaRequirementData[]>([]);

  // State for editable settings
  const [editableName, setEditableName] = useState<string>('');
  const [editableFullName, setEditableFullName] = useState<string>('');
  const [editableNationality, setEditableNationality] = useState<string>('');
  const [editableResidency, setEditableResidency] = useState<string>('');
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>('');
  const [editablePassportNumber, setEditablePassportNumber] = useState<string>('');
  const [editablePassportExpiry, setEditablePassportExpiry] = useState<string>('');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  
  // Correctly typed extended profile state
  const [currentProfile, setCurrentProfile] = useState<ExtendedUserProfile | null>(null);

  // State for visa applications
  const [visaApplications, setVisaApplications] = useState<VisaApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState<boolean>(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  // Effect to update editable fields when currentProfile changes
  useEffect(() => {
    if (currentProfile) {
        setEditableName(currentProfile.full_name || '');
        setEditableFullName(currentProfile.full_name || ''); // Also set FullName
        setEditableNationality(currentProfile.nationality || ''); // Also set Nationality
        setEditableResidency(currentProfile.residency || ''); // Also set Residency
        setEditablePhoneNumber(currentProfile.phone_number || '');
        setEditablePassportNumber(currentProfile.passport_number || '');
        setEditablePassportExpiry(currentProfile.passport_expiry || '');
    }
  }, [currentProfile]);

  // Update the loadUserData function
  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { profile, error: profileError } = await userProfileService.getCurrentUserProfile();

      console.log('Loaded User Profile in Dashboard:', profile); // Added log

      if (profileError) {
        // Check if it's just 'Profile not found' which might be okay for new users
        if (profileError.message.includes('Profile not found')) {
          console.warn("User profile not found in Supabase. User might need to complete profile setup.");
          // Handle appropriately, maybe set default values or guide user
          setUserData(null); // Or set a default structure
          setNationality(''); // Ensure nationality is empty/default
        } else {
          throw profileError; // Rethrow other errors
        }
      } else if (profile) {
        // Cast profile to ExtendedUserProfile to satisfy type checking
        const extendedProfile = profile as ExtendedUserProfile;

        setUserData({
          id: extendedProfile.id,
          name: extendedProfile.full_name || 'User',
          email: extendedProfile.email || '',
          subscription_tier: extendedProfile.subscription_tier || 'free',
          nationality: extendedProfile.nationality || '', // Keep original nationality here for user data
          residency: extendedProfile.residency || '',
          travel_history: extendedProfile.travel_history || [],
          saved_countries: extendedProfile.saved_countries || [],
          travel_score: extendedProfile.travel_score || 0,
          recent_checks: [], // Replace with actual data if available
          saved_documents: extendedProfile.saved_documents || [],
          upcoming_trips: [], // Replace with actual data if available
        });

        // Set nationality state specifically for the map, with a fallback
        const profileNationality = extendedProfile.nationality;
        if (profileNationality) {
          // Accept both uppercase and lowercase country codes
          const normalizedNationality = profileNationality.length === 2 ? 
            profileNationality.toUpperCase() : profileNationality;
            
          setNationality(normalizedNationality);
          console.log('Nationality set in Dashboard state:', normalizedNationality);
        } else {
          console.warn(`Profile nationality '${profileNationality}' is missing. Defaulting map nationality to 'GB'.`);
          setNationality('GB'); // Default to GB if missing
        }

        // Also update editable fields if needed
        setEditableFullName(extendedProfile.full_name || '');
        setEditableNationality(extendedProfile.nationality || '');
        setEditableResidency(extendedProfile.residency || '');

      } else {
        // Handle case where profile is null but no error (shouldn't happen with maybeSingle but good practice)
        console.warn("User profile data is null without specific error.");
        setUserData(null);
        setNationality('');
      }

      // Fetch visa requirements after profile load
      await fetchVisaRequirements();

    } catch (err) {
      console.error("Error loading user data:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setUserData(null); // Clear data on error
      // setNationality(''); // Clear nationality on error - No! Set default instead.
      console.warn("Error loading user data, defaulting map nationality to 'GB'.");
      setNationality('GB'); // Default nationality on error
    } finally {
      setIsLoading(false);
    }
  };

  // Use this effect to load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [reloadKey]); // Include reloadKey to trigger reload when needed

  // Use basic map if there's an error loading the map or if user toggles it
  useEffect(() => {
    if (mapLibraryHasError) {
      // Handle error state
    }
  }, [mapLibraryHasError]);

  // Update the features type to be more specific
  const features: Record<'free' | 'premium' | 'enterprise', string[]> = {
    free: ['Basic Travel Score', 'Limited Visa Checks (5/day)', 'Basic Dashboard Access'],
    premium: ['Advanced Travel Score', 'Unlimited Visa Checks', 'AI Travel Assistant', 'Document Storage', 'Trip Planning'],
    enterprise: ['All Premium Features', 'Priority Visa Processing', 'Personalized Travel Recommendations', 'Lifetime Updates']
  };

  // Header action handlers
  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleLogoutClick = () => navigate('/');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleHomeClick = () => navigate('/');
  const handleFeaturesClick = () => navigate('/features');
  const handlePricingClick = () => navigate('/pricing');
  const handleContactClick = () => navigate('/contact');

  // Update the handleAddTrip function to match the UserData type
  const handleAddTrip = () => {
    if (!newTripDestination || !newTripStartDate || !newTripEndDate) return;
    
    // Format dates from calendar input
    const formattedDates = formatDateRange(newTripStartDate, newTripEndDate);
    
    const newTrip: UserData['upcoming_trips'][0] = {
      id: Date.now().toString(),
      destination: newTripDestination,
      departure_date: newTripStartDate,
      return_date: newTripEndDate,
      dates: formattedDates,
      status: 'Planned',
      documents: []
    };
    
    setUserData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        upcoming_trips: [...prevData.upcoming_trips, newTrip]
      };
    });
    
    // Reset form
    setNewTripDestination('');
    setNewTripDates('');
    setNewTripStartDate('');
    setNewTripEndDate('');
  };
  
  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    
    if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
  };
  
  const handleRemoveTrip = (tripId: string) => {
    setUserData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        upcoming_trips: prevData.upcoming_trips.filter(trip => trip.id !== tripId)
      };
    });
  };
  
  // Document management functions
  const handleAddDocument = () => {
    if (!newDocumentName) return;
    
    const newDocument = {
      id: Date.now().toString(),
      name: newDocumentName,
      type: newDocumentType,
      url: '',
      uploaded: new Date().toISOString().split('T')[0],
      size: 0
    };
    
    setUserData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        saved_documents: [...prevData.saved_documents, newDocument]
      };
    });
    
    // Reset form
    setNewDocumentName('');
    setNewDocumentType('PDF');
  };
  
  // Handle document removal
  const handleRemoveDocument = async (documentId: string) => {
    if (!documentId) {
      console.error('Invalid document ID');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to remove this document?')) {
      return;
    }

    try {
      setIsUploading(true); // Repurpose isUploading state to indicate activity
      
      const { success, error } = await documentService.deleteUserDocument(documentId);
      
      if (error) {
        console.error('Error removing document:', error);
        alert(`Failed to remove document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      if (success) {
        // Reload user data to update UI
        await loadUserData();
        alert('Document removed successfully');
      }
    } catch (error) {
      console.error('Document removal error:', error);
      alert('Failed to remove document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Country management functions
  const handleCountryClick = (countryCode: string, visaDetails: VisaRequirement) => {
    const countryName = getCountryName(countryCode) || countryCode;
    setSelectedCountry({
      code: countryCode,
      name: countryName,
      visaDetails
    });
    setShowCountryModal(true);
  };

  const handleSaveCountry = async (countryCode: string) => {
    if (!countryCode) return;
    
    try {
      const { success, error } = await userProfileService.saveCountry(countryCode);
      
      if (error) {
        console.error('Error saving country:', error);
        setError('Failed to save country. Please try again.');
        return;
      }
      
      if (success) {
        // Update local state
        const countryName = getCountryName(countryCode) || countryCode;
        
        // Get visa type from selected country if available
        let visaType = 'unknown';
        if (selectedCountry && selectedCountry.code === countryCode && selectedCountry.visaDetails) {
          visaType = selectedCountry.visaDetails.requirement;
        }
        
        setSavedCountries(prev => {
          // Check if already in the list
          if (prev.some(country => country.code === countryCode)) {
            return prev;
          }
          
          return [...prev, {
            code: countryCode,
            name: countryName,
            visaType: visaType
          }];
        });
        
        // Update user data state
        setUserData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            saved_countries: [...(prevData.saved_countries || []), countryCode]
          };
        });
      }
    } catch (err) {
      console.error('Unexpected error saving country:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleRemoveCountry = async (countryCode: string) => {
    if (!countryCode) return;
    
    try {
      const { success, error } = await userProfileService.removeCountry(countryCode);
      
      if (error) {
        console.error('Error removing country:', error);
        setError('Failed to remove country. Please try again.');
        return;
      }
      
      if (success) {
        // Update local state
        setSavedCountries(prev => prev.filter(country => country.code !== countryCode));
        
        // Update user data state
        setUserData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            saved_countries: (prevData.saved_countries || []).filter(code => code !== countryCode)
          };
        });
      }
    } catch (err) {
      console.error('Unexpected error removing country:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  // Function to save country from modal
  const handleSaveFromModal = () => {
    if (!selectedCountry) return;
    handleSaveCountry(selectedCountry.code);
    setShowCountryModal(false);
  };

  // Function to generate a gradient color stop for the travel score circle
  const getTravelScoreGradient = (score: number): string => {
    if (score >= 800) return 'url(#gradient-excellent)';
    if (score >= 600) return 'url(#gradient-good)';
    if (score >= 400) return 'url(#gradient-average)';
    return 'url(#gradient-basic)';
  };

  // Add this helper function for travel score color
  const getTravelScoreColor = (score: number): string => {
    if (score >= 900) return '#059669'; // Emerald-600 (excellent)
    if (score >= 750) return '#0D9488'; // Teal-600 (very good)
    if (score >= 600) return '#0F766E'; // Teal-700 (good)
    if (score >= 400) return '#0E7490'; // Cyan-700 (average)
    if (score >= 200) return '#0369A1'; // Sky-700 (below average)
    return '#0284C7'; // Sky-600 (poor)
  };

  // Add document to a specific trip
  const handleAddTripDocument = (tripId: string) => {
    if ((!tripDocumentName && !fileUpload) || !tripId) return;
    
    const documentName = tripDocumentName || (fileUpload ? fileUpload.name : 'Untitled Document');
    const documentType = fileUpload 
      ? fileUpload.name.split('.').pop()?.toUpperCase() || tripDocumentType 
      : tripDocumentType;
    
    const newDocument = {
      id: Date.now().toString(),
      name: documentName,
      type: documentType,
      url: '',
      uploaded: new Date().toISOString().split('T')[0],
      size: 0
    };
    
    setUserData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        upcoming_trips: prevData.upcoming_trips.map(trip => {
          if (trip.id === tripId) {
            return {
              ...trip,
              documents: [...(trip.documents || []), newDocument]
            };
          }
          return trip;
        })
      };
    });
    
    // Reset form
    setTripDocumentName('');
    setTripDocumentType('PDF');
    setFileUpload(null);
  };
  
  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUpload(e.target.files[0]);
      
      // Auto-fill document name from filename if empty
      if (!tripDocumentName) {
        const fileName = e.target.files[0].name;
        // Remove file extension from name
        const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
        setTripDocumentName(nameWithoutExtension || fileName);
      }
      
      // Set document type based on file extension
      const fileExtension = e.target.files[0].name.split('.').pop()?.toUpperCase();
      if (fileExtension) {
        setTripDocumentType(fileExtension);
      }
    }
  };
  
  const handleRemoveTripDocument = (tripId: string, documentId: string) => {
    setUserData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        upcoming_trips: prevData.upcoming_trips.map(trip => {
          if (trip.id === tripId && trip.documents) {
            return {
              ...trip,
              documents: trip.documents.filter(doc => doc.id !== documentId)
            };
          }
          return trip;
        })
      };
    });
  };

  // Function to refresh data after questionnaire completion
  const refreshAfterQuestionnaire = () => {
    setReloadKey(prev => prev + 1);
  };

  useEffect(() => {
    // Check if navigating back from questionnaire
    const fromQuestionnaire = sessionStorage.getItem('fromQuestionnaire');
    if (fromQuestionnaire === 'true') {
      // Clear the flag
      sessionStorage.removeItem('fromQuestionnaire');
      // Reload profile data
      refreshAfterQuestionnaire();
    }
  }, []);

  // New useEffect to calculate score breakdown when userData changes
  useEffect(() => {
    if (userData) {
      // Get the current total travel score from userData
      const currentTotalScore = userData.travel_score || 0;
      
      // Directly allocate the total score based on predefined percentages
      // Using the standard weighting: 60% passport, 30% history, 10% residency
      const passportComponent = Math.round(currentTotalScore * 0.6); // 60% to passport strength
      const historyComponent = Math.round(currentTotalScore * 0.3);  // 30% to travel history
      
      // Calculate residency component as the remainder to ensure they sum exactly to total
      // This avoids any rounding errors that could make the components not add up
      const residencyComponent = currentTotalScore - passportComponent - historyComponent;
      
      // Set the breakdown with these calculated values
      setScoreBreakdown({
        passportComponent,
        historyComponent,
        residencyComponent
      });
      
      // Ensure the travel score state matches the one from userData
      setTravelScore(currentTotalScore);
    }
  }, [userData?.travel_score]); // Only recalculate when travel_score changes

  // Function to render the user's current country profile info
  const renderUserCountryInfo = () => {
    if (!userData) return null;
    
    return (
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nationality</h3>
          <div className="flex items-center">
            <div className="w-8 h-6 mr-2 overflow-hidden rounded shadow">
              <img 
                src={`/images/country-flags-main/svg/${userData.nationality.toLowerCase()}.svg`} 
                alt={`${getCountryName(userData.nationality)} flag`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-gray-900 dark:text-white font-medium">{getCountryName(userData.nationality)}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Country of Residence</h3>
          <div className="flex items-center">
            <div className="w-8 h-6 mr-2 overflow-hidden rounded shadow">
              <img 
                src={`/images/country-flags-main/svg/${userData.residency.toLowerCase()}.svg`} 
                alt={`${getCountryName(userData.residency)} flag`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-gray-900 dark:text-white font-medium">{getCountryName(userData.residency)}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Travel Statistics</h3>
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Countries Visited:</span>
              <span className="font-bold text-gray-900 dark:text-white">{userData.travel_history?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-600 dark:text-gray-400">Continents Explored:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {getExploredContinentsCount(userData?.travel_history || [])}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Define fetchVisaRequirements outside useEffect
  const fetchVisaRequirements = async () => {
    try {
      // Load all three visa requirement files
      const response1 = await fetch('/visarequirements1.json');
      const response2 = await fetch('/visarequirements2.json');
      const response3 = await fetch('/visarequirements3.json');
      
      if (!response1.ok || !response2.ok || !response3.ok) {
        throw new Error('Failed to load visa requirements data');
      }
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      const data3 = await response3.json();
      
      // Combine all data
      const data = [...data1, ...data2, ...data3];
      
      setVisaRequirements(data);
    } catch (error) {
      console.error('Error fetching visa requirements:', error);
    }
  };

  // Moved from renderRecommendedDestinations
  useEffect(() => {
    // Only fetch if userData is available (specifically nationality)
    if (userData) {
      fetchVisaRequirements();
    }
  }, [userData?.nationality]); // Re-fetch when nationality changes

  // Process recommended destinations when visa requirements are loaded
  useEffect(() => {
    if (visaRequirements.length > 0 && userData) {
      // Popular destinations with descriptions and tags
      const allDestinations = [
        { name: 'Japan', code: 'JP', description: 'Explore ancient temples and modern cities', tags: ['Culture', 'Food'] },
        { name: 'New Zealand', code: 'NZ', description: 'Adventure in breathtaking landscapes', tags: ['Nature', 'Adventure'] },
        { name: 'Thailand', code: 'TH', description: 'Relax on pristine beaches', tags: ['Beaches', 'Budget'] },
        { name: 'Portugal', code: 'PT', description: 'Discover rich history and coastal beauty', tags: ['Culture', 'Wine'] },
        { name: 'Costa Rica', code: 'CR', description: 'Experience breathtaking biodiversity', tags: ['Nature', 'Wildlife'] },
        { name: 'South Africa', code: 'ZA', description: 'Wildlife safari and stunning landscapes', tags: ['Safari', 'Adventure'] },
      ];

      // Get user nationality, default to GB if not available
      const nationality = userData?.nationality || 'GB';
      
      // Map destinations with visa requirements
      const destinationsWithVisaStatus = allDestinations.map(destination => {
        // Find the visa requirement for user's nationality to this destination
        const requirement = visaRequirements.find((req: VisaRequirementData) => 
          req.Passport === getCountryName(nationality) && 
          req.Destination === getCountryName(destination.code)
        );
        
        let visa_status = 'visa-required';
        
        if (requirement) {
          const reqType = requirement.Requirement.toLowerCase();
          if (reqType === 'visa free' || reqType === 'free') {
            visa_status = 'visa-free';
          } else if (reqType === 'visa on arrival' || reqType === 'on arrival') {
            visa_status = 'visa-on-arrival';
          } else if (reqType === 'e-visa' || reqType === 'evisa' || reqType === 'eta' || reqType === 'esta') {
            visa_status = 'e-visa';
          }
        }
        
        return {
          ...destination,
          visa_status
        };
      });
      
      setRecommendationDestinations(destinationsWithVisaStatus);
    }
  }, [visaRequirements, userData]);

  // Styling for recommended destination cards
  const renderRecommendedDestinations = () => {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Recommended Destinations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recommendationDestinations.map((destination, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <img
                    src={`https://flagcdn.com/${destination.code.toLowerCase()}.svg`}
                    alt={`${destination.name} flag`}
                    className="w-8 h-6 mr-2 object-cover rounded"
                  />
                  <h4 className="font-semibold text-lg">{destination.name}</h4>
                </div>
                
                <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${
                  destination.visa_status === 'visa-free' 
                    ? 'bg-green-100 text-green-800' 
                    : destination.visa_status === 'visa-on-arrival' || destination.visa_status === 'e-visa'
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-amber-100 text-amber-800'
                }`}>
                  {destination.visa_status === 'visa-free' 
                    ? 'Visa Free' 
                    : destination.visa_status === 'visa-on-arrival' 
                      ? 'Visa on Arrival'
                      : destination.visa_status === 'e-visa'
                        ? 'E-Visa'
                        : 'Visa Required'}
                </span>
                
                <p className="text-gray-600 text-sm mb-3">{destination.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {destination.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex} 
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <Link 
                  to={`/blogs/${destination.code.toLowerCase()}`}
                  className="mt-2 text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center"
                >
                  Explore Country
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Update the renderOverview function to include the new recommended destinations
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Travel Score Overview Card */}
      <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Travel Score</h2>
              <p className="text-gray-600 dark:text-gray-400">Based on your questionnaire results</p>
            </div>
            <Link to="/travel-score" className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-2 md:mt-0">
              View Full Details →
            </Link>
          </div>

          {/* Render user nationality and residence information */}
          {renderUserCountryInfo()}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-center h-32 md:h-40">
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    {/* Define gradients */}
                    <defs>
                      <linearGradient id="gradient-excellent" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" /> {/* Emerald-500 */}
                        <stop offset="100%" stopColor="#047857" /> {/* Emerald-700 */}
                      </linearGradient>
                      <linearGradient id="gradient-good" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14B8A6" /> {/* Teal-500 */}
                        <stop offset="100%" stopColor="#0F766E" /> {/* Teal-700 */}
                      </linearGradient>
                      <linearGradient id="gradient-average" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06B6D4" /> {/* Cyan-500 */}
                        <stop offset="100%" stopColor="#0E7490" /> {/* Cyan-700 */}
                      </linearGradient>
                      <linearGradient id="gradient-basic" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0EA5E9" /> {/* Sky-500 */}
                        <stop offset="100%" stopColor="#0284C7" /> {/* Sky-600 */}
                      </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e6e6e6" strokeWidth="12" />
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="54" 
                      fill="none" 
                      stroke={getTravelScoreGradient(userData?.travel_score || travelScore)} 
                      strokeWidth="12" 
                      strokeDasharray="339.292"
                      strokeDashoffset={339.292 - (339.292 * (userData?.travel_score || travelScore) / 1000)} 
                      transform="rotate(-90 60 60)"
                    />
                    <text x="60" y="55" dominantBaseline="middle" textAnchor="middle" className="text-3xl font-bold fill-current text-gray-800 dark:text-white">
                      {userData?.travel_score || travelScore}
                    </text>
                    <text x="60" y="75" dominantBaseline="middle" textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400">
                      / 1000
                    </text>
                  </svg>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-white" 
                  style={{ 
                    background: `linear-gradient(to right, ${getTravelScoreColor(userData?.travel_score || travelScore)}, ${getTravelScoreColor(userData?.travel_score || travelScore)}CC)` 
                  }}>
                  {getTravelScoreLevel(userData?.travel_score || travelScore)}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Passport Strength</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {scoreBreakdown.passportComponent} pts
                    </span>
                  </div>
                  {/* Passport strength can contribute up to 60% of total score (60% of 1000 = 600) */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (scoreBreakdown.passportComponent / 600) * 100)}%`,
                        background: 'linear-gradient(to right, #14B8A6, #0F766E)'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Travel History</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {scoreBreakdown.historyComponent} pts
                    </span>
                  </div>
                  {/* Travel history can contribute up to 30% of total score (30% of 1000 = 300) */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (scoreBreakdown.historyComponent / 300) * 100)}%`,
                        background: 'linear-gradient(to right, #10B981, #047857)'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Residence Bonus</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {scoreBreakdown.residencyComponent} pts
                    </span>
                  </div>
                  {/* Residence bonus can contribute up to 10% of total score (10% of 1000 = 100) */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (scoreBreakdown.residencyComponent / 100) * 100)}%`,
                        background: 'linear-gradient(to right, #06B6D4, #0E7490)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link 
                  to="/questionnaire" 
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  onClick={() => {
                    // Set a flag to indicate we're going to the questionnaire
                    sessionStorage.setItem('fromQuestionnaire', 'true');
                  }}
                >
                  Retake Questionnaire
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Travel Profile Card */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Travel Profile</h2>
          <Link to="/world-map" className="text-xs text-teal-600 hover:text-teal-700">View on Map →</Link>
        </div>
        
        {/* Travel History Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white">Travel History</h3>
            <button className="text-xs text-teal-600 hover:text-teal-700">View All →</button>
          </div>
          
          {userData?.travel_history && userData.travel_history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {userData.travel_history.slice(0, 10).map((countryCode) => (
                <div key={countryCode} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-4 overflow-hidden rounded shadow">
                    <img 
                      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`} 
                      alt={`${getCountryName(countryCode)} flag`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm">{getCountryName(countryCode)}</span>
                </div>
              ))}
              {userData.travel_history.length > 10 && (
                <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-500 dark:text-gray-400">+{userData.travel_history.length - 10} more countries</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No travel history recorded</p>
              <Link to="/questionnaire" className="text-sm text-teal-600 hover:text-teal-700 mt-1 inline-block">
                Update your travel history
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Recommended Destinations */}
      {renderRecommendedDestinations()}
      
      {/* Recent visa checks and upcoming trips section */}
      <motion.div 
        className="dashboard-card"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h3 className="text-xl font-semibold mb-4">Recent Visa Checks</h3>
        <div className="space-y-4">
          {userData?.recent_checks.map((check, index) => (
            <motion.div 
              key={index} 
              className="dashboard-stat"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ backgroundColor: "#f9fafb" }}
            >
              <div>
                <p className="font-medium">{check.country}</p>
                <p className="text-sm text-gray-500">{check.date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                check.result === 'Visa Free' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {check.result}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        className="dashboard-card"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h3 className="text-xl font-semibold mb-4">Upcoming Trips</h3>
        <div className="space-y-4">
          {userData?.upcoming_trips.map((trip, index) => (
            <motion.div 
              key={index} 
              className="dashboard-stat"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ backgroundColor: "#f9fafb" }}
            >
              <div>
                <p className="font-medium">{trip.destination}</p>
                <p className="text-sm text-gray-500">{trip.dates}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                trip.status === 'Planned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {trip.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // Helper function to count explored continents
  const getExploredContinentsCount = (countryCodes: string[]): number => {
    // This is a simplified version - in a real app you'd map countries to continents
    // For now, just return a reasonable number based on how many countries they've visited
    if (countryCodes.length >= 50) return 6; // All continents
    if (countryCodes.length >= 30) return 5;
    if (countryCodes.length >= 20) return 4;
    if (countryCodes.length >= 10) return 3;
    if (countryCodes.length >= 5) return 2;
    if (countryCodes.length >= 1) return 1;
    return 0;
  };

  // Create a manual file upload function that works with direct click
  const handleManualFileUpload = () => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = `.${newDocumentType.toLowerCase()}`;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Add event listener for file selection
    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        // Set the selected file in state
        setSelectedFile(file);
        
        // Auto-fill document name if not set
        if (!newDocumentName) {
          const fileName = file.name.split('.').slice(0, -1).join('.');
          setNewDocumentName(fileName);
        }
        
        // Start upload process
        handleUploadDocument(file);
      }
      
      // Clean up - remove the input from the DOM
      document.body.removeChild(fileInput);
    });
    
    // Trigger click on the file input
    fileInput.click();
  };

  // Upload a document
  const handleUploadDocument = async (file: File) => {
    if (!file) {
      setUploadError('No file selected');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        setUploadError('You must be logged in to upload documents');
        return;
      }
      
      const { document, error } = await documentService.uploadUserDocument(
        user.id,
        file,
        newDocumentName || file.name,
        documentCategory
      );
      
      if (error) {
        console.error('Error uploading document:', error);
        setUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      // Reset form
      setNewDocumentName('');
      setSelectedFile(null);
      
      // Clear the file input
      const fileInput = window.document.getElementById('document-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Reload user data to show the new document
      await loadUserData();
      
      // Show success message
      alert('Document uploaded successfully');
    } catch (error) {
      console.error('Document upload error:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Render documents section
  const renderDocuments = () => (
    <div className="card p-6">
      <h3 className="text-xl font-semibold mb-4">Saved Documents</h3>
      
      {/* Add document form */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Add New Document</h4>
        <div className="flex flex-col space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Document name"
            className="input flex-1"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
          />
          <select
            className="input w-full md:w-32"
            value={newDocumentType}
            onChange={(e) => setNewDocumentType(e.target.value)}
          >
            <option value="PDF">PDF</option>
            <option value="JPG">JPG</option>
            <option value="PNG">PNG</option>
            <option value="DOC">DOC</option>
          </select>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <select
              className="input flex-1"
              value={documentCategory}
              onChange={(e) => setDocumentCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Passport">Passport</option>
              <option value="Visa">Visa</option>
              <option value="Insurance">Insurance</option>
              <option value="Tickets">Tickets</option>
              <option value="Booking">Booking Confirmation</option>
              <option value="Other">Other</option>
            </select>
            
          <button
              className={`btn-primary w-full md:w-auto ${isUploading ? 'opacity-50' : ''}`}
              onClick={handleManualFileUpload}
              disabled={isUploading}
          >
              {isUploading ? 'Uploading...' : 'Add Document'}
          </button>
        </div>
        </div>
        
        {selectedFile && (
          <div className="mt-3 text-sm text-gray-600">
            Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </div>
        )}
        {uploadError && (
          <div className="mt-2 text-sm text-red-600">
            {uploadError}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {userData?.saved_documents && userData.saved_documents.length > 0 ? (
          userData.saved_documents.map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{doc.name}</p>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500">
                      {new Date(doc.uploaded).toLocaleDateString()} • {doc.type}
                      {doc.size ? ` • ${Math.round(doc.size / 1024)} KB` : ''}
                    </p>
                    {doc.category && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                        {doc.category}
                      </span>
                    )}
                  </div>
              </div>
            </div>
            <div className="flex space-x-2">
                {doc.url && (
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 px-2 py-1"
                  >
                Download
                  </a>
                )}
              <button 
                className="text-red-600 hover:text-red-700 px-2 py-1"
                onClick={() => handleRemoveDocument(doc.id)}
              >
                Remove
              </button>
            </div>
          </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No documents saved yet. Add your first document above.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUpgradeSection = () => {
    if (userData?.subscription_tier === 'enterprise' || !showUpgradeBanner) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg text-white relative"
      >
        <button 
          className="absolute top-3 right-3 text-white/90 hover:text-white"
          onClick={() => setShowUpgradeBanner(false)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold mb-2">Upgrade Your Experience</h3>
        <p className="mb-4">Get access to all premium features and enhance your travel planning.</p>
        <Link 
          to="/pricing"
          className="inline-block bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          View Plans
        </Link>
      </motion.div>
    );
  };

  const renderTravelScore = () => (
    <div className="card p-6">
      <h3 className="text-xl font-semibold mb-4">Travel Score Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Current Score</p>
            <p className="text-2xl font-bold text-primary-600">{travelScore}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Subscription Level</p>
            <p className="text-lg font-medium">
              {(userData?.subscription_tier || 'free').charAt(0).toUpperCase() + 
               (userData?.subscription_tier || 'free').slice(1)}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Available Features</h4>
          <ul className="space-y-2">
            {features[userData?.subscription_tier as keyof typeof features || 'free'].map((feature: string, index: number) => (
              <li key={index} className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  // Handle saving changes in settings
  const handleSaveChanges = async () => {
    if (!currentProfile) {
        setError("User profile not loaded. Cannot save changes.");
        return;
    }
    
    setIsSavingSettings(true);
    setError(null);
    
    const updatedProfileData: Partial<UserProfile> = {
      full_name: editableName,
      phone_number: editablePhoneNumber,
      passport_number: editablePassportNumber,
      passport_expiry: editablePassportExpiry, 
    };
    
    try {
      // Pass the current user's ID to updateProfile
      const { error } = await userProfileService.updateProfile(updatedProfileData);
      
      if (error) {
        console.error("Error updating profile:", error);
        setError("Failed to save settings. Please try again.");
      } else {
        console.log("Profile updated successfully!");
        alert('Settings saved successfully!');
        await loadUserData(); // Reload data after successful save
      }
    } catch (err) {
      console.error("Unexpected error saving settings:", err);
      setError("An unexpected error occurred while saving settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Define renderSettings function correctly
  const renderSettings = () => {
    // Initialize editable fields with currentProfile data if available
    // This effect runs when the component mounts or currentProfile changes
    // useEffect(() => { <-- REMOVED FROM HERE
    //     if (currentProfile) {
    //         setEditableName(currentProfile.full_name || '');
    //         setEditablePhoneNumber(currentProfile.phone_number || '');
    //         setEditablePassportNumber(currentProfile.passport_number || '');
    //         setEditablePassportExpiry(currentProfile.passport_expiry || '');
    //     }
    // }, [currentProfile]); <-- REMOVED FROM HERE
      
    return (
        <div className="card p-6">
            <h3 className="text-xl font-semibold mb-6">Account Settings</h3>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
            )}
            
            <div className="space-y-6">
                {/* Profile Information Section */}
                <div>
                    <h4 className="font-medium mb-3 text-lg">Profile Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input 
                                type="text" 
                                value={editableName} 
                                onChange={(e) => setEditableName(e.target.value)}
                                className="mt-1 input w-full"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={currentProfile?.email || ''} readOnly className="mt-1 input w-full bg-gray-100 cursor-not-allowed" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                                type="tel" 
                                value={editablePhoneNumber} 
                                onChange={(e) => setEditablePhoneNumber(e.target.value)}
                                className="mt-1 input w-full"
                                placeholder="Enter phone number (optional)"
                            />
                        </div>
                    </div>
                </div>

                {/* Passport Information Section */}
                <div>
                    <h4 className="font-medium mb-3 text-lg">Passport Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                            <input 
                                type="text" 
                                value={editablePassportNumber} 
                                onChange={(e) => setEditablePassportNumber(e.target.value)}
                                className="mt-1 input w-full"
                                placeholder="Enter passport number (optional)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                            <input 
                                type="date" 
                                value={editablePassportExpiry} 
                                onChange={(e) => setEditablePassportExpiry(e.target.value)}
                                className="mt-1 input w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Subscription Section (Read-only) */}
                <div>
                    <h4 className="font-medium mb-3 text-lg">Subscription</h4>
                    <p className="text-gray-600">
                        Current Plan: <span className="font-semibold">{(currentProfile?.subscription_tier || 'free').charAt(0).toUpperCase() + 
                                     (currentProfile?.subscription_tier || 'free').slice(1)}</span>
                    </p>
                    {currentProfile?.subscription_tier === 'free' && (
                         <Link to="/pricing" className="text-sm text-primary-600 hover:underline mt-1 inline-block">Upgrade Plan</Link>
                    )}
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200 flex justify-end">
                    <button 
                        className={`btn-primary px-6 py-2 ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleSaveChanges}
                        disabled={isSavingSettings}
                    >
                        {isSavingSettings ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // Updated function to render the world map - Removed switch logic
  const renderWorldMap = () => {
    return (
      <motion.div 
        className="card overflow-hidden mb-8" // Add margin-bottom for spacing
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isMapLibraryLoaded ? (
          <VisaRequirementsMap // Use the enhanced component directly
            userNationality={userData?.nationality || 'GB'} 
            onCountrySelect={handleCountryClick} // Pass the correct handler
          />
        ) : mapLibraryHasError ? (
           <div className="p-8 text-center text-red-600">
             <p>Error loading map component. Please try refreshing the page.</p>
           </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading map data...</p>
          </div>
        )}
        
        {/* Saved Countries Section - kept as is */}
        {savedCountries.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Saved Countries</h3>
            <SavedCountries 
              countries={savedCountries}
              onRemoveCountry={handleRemoveCountry}
            />
          </div>
        )}
      </motion.div>
    );
  };

  // Function to render the visa check section
  const renderVisaCheck = () => (
                <motion.div 
                  className="card p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-xl font-semibold mb-4">Visa Check</h3>
                  <p className="text-gray-600 mb-4">Check visa requirements for any country based on your nationality.</p>
      
      <div className="mt-6 text-center">
        <Link 
          to="/visa-checker" 
          className="btn-primary inline-block px-6 py-3"
        >
          Go to Visa Eligibility Checker
        </Link>
      </div>
                </motion.div>
  );

  // Enhanced trip planning section
  const renderTrips = () => (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h3 className="text-xl font-semibold mb-4">Trip Planning</h3>
      
      {/* Add trip form */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Add New Trip</h4>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Destination"
            className="input w-full"
            value={newTripDestination}
            onChange={(e) => setNewTripDestination(e.target.value)}
          />
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="input w-full"
                value={newTripStartDate}
                onChange={(e) => setNewTripStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="input w-full"
                value={newTripEndDate}
                onChange={(e) => setNewTripEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <button
            className="btn-primary w-full md:w-auto self-end"
            onClick={handleAddTrip}
          >
            Add Trip
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {userData?.upcoming_trips.map((trip, index) => (
          <motion.div 
            key={index} 
            className="border rounded-lg overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex justify-between items-start p-4 bg-gray-50">
              <div>
                <h4 className="font-medium text-lg">{trip.destination}</h4>
                <p className="text-gray-500">{trip.dates}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  trip.status === 'Planned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {trip.status}
                </span>
                <button 
                  className="text-red-600 hover:text-red-700 ml-2"
                  onClick={() => handleRemoveTrip(trip.id)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Trip Documents Section */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium">Trip Documents</h5>
                <button 
                  className="text-sm text-primary-600 hover:text-primary-700"
                  onClick={() => setActiveTripId(activeTripId === trip.id ? null : trip.id)}
                >
                  {activeTripId === trip.id ? 'Close' : 'Add Documents'}
                </button>
              </div>
              
              {/* Add document form */}
              {activeTripId === trip.id && (
                <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Document name"
                        className="input flex-1"
                        value={tripDocumentName}
                        onChange={(e) => setTripDocumentName(e.target.value)}
                      />
                      <select
                        className="input w-full md:w-32"
                        value={tripDocumentType}
                        onChange={(e) => setTripDocumentType(e.target.value)}
                      >
                        <option value="PDF">PDF</option>
                        <option value="JPG">JPG</option>
                        <option value="PNG">PNG</option>
                        <option value="DOC">DOC</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Upload document</label>
                        <input
                          type="file"
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary-50 file:text-primary-700
                                    hover:file:bg-primary-100"
                          onChange={handleFileChange}
                        />
                      </div>
                      
                      <button
                        className="btn-primary w-full md:w-auto mt-4 md:mt-0"
                        onClick={() => handleAddTripDocument(trip.id)}
                      >
                        Add Document
                      </button>
                    </div>
                    
                    {fileUpload && (
                      <div className="text-sm text-gray-500 mt-1">
                        Selected file: {fileUpload.name} ({Math.round(fileUpload.size / 1024)} KB)
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Document list */}
              <div className="space-y-2">
                {trip.documents && trip.documents.length > 0 ? (
                  trip.documents.map((doc, docIndex) => (
                    <div key={docIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-1 bg-primary-100 rounded-lg mr-2">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type} • {doc.uploaded}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-700 text-sm">
                          View
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-700 text-sm"
                          onClick={() => handleRemoveTripDocument(trip.id, doc.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">No documents added for this trip</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {userData?.upcoming_trips.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No trips planned yet. Add your first trip above.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Fetch visa applications
  useEffect(() => {
    const fetchVisaApplications = async () => {
      if (!userData?.id) return;
      
      setIsLoadingApplications(true);
      setApplicationsError(null);
      
      try {
        const { applications, error } = await visaApplicationsService.getUserApplications(userData.id);
        
        if (error) {
          console.error('Error fetching visa applications:', error);
          setApplicationsError('Failed to load visa applications. Please try again.');
        } else if (applications) {
          setVisaApplications(applications);
        }
      } catch (err) {
        console.error('Unexpected error fetching visa applications:', err);
        setApplicationsError('An unexpected error occurred while loading visa applications.');
      } finally {
        setIsLoadingApplications(false);
      }
    };
    
    if (activeTab === 'visa-applications') {
      fetchVisaApplications();
    }
  }, [userData?.id, activeTab, reloadKey]); // Line 1869 based on previous logs

  // Handle refreshing visa applications
  const handleRefreshApplications = () => {
    setReloadKey(prev => prev + 1);
  };

  // Function to render the visa applications section
  const renderVisaApplications = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">Visa Applications</h3>
            <p className="text-gray-600">Manage and track your visa applications</p>
          </div>
          <button
            onClick={handleRefreshApplications}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label="Refresh applications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {isLoadingApplications ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : applicationsError ? (
          <div className="py-6 text-center text-red-600">
            <p>{applicationsError}</p>
            <button
              onClick={handleRefreshApplications}
              className="mt-2 text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : (
          <VisaApplications
            applications={visaApplications}
            isAdmin={userData?.subscription_tier === 'admin'}
            onRefresh={handleRefreshApplications}
          />
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-semibold">Need a new visa?</h4>
              <p className="text-gray-600">
                Check your eligibility and apply for eVisas through our platform
              </p>
            </div>
            <Link
              to="/visa-checker"
              className="btn-primary px-6 py-2"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Correctly define renderActiveTabContent
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'travel-score':
        return renderTravelScore();
      case 'visa-check':
        return renderVisaCheck();
      case 'world-map':
        return renderWorldMap();
      case 'trips':
        return renderTrips();
      case 'documents':
        return renderDocuments();
      case 'settings':
        return renderSettings();
      case 'visa-applications':
        return renderVisaApplications();
      default:
        return renderOverview();
    }
  };

  // Check for loading and error states *after* all hooks have been defined
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">Error loading dashboard: {error}</div>
      </div>
    );
  }

  // Main return statement for the dashboard UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header 
        isLoggedIn={true}
        onLoginClick={handleLoginClick}
        onSignUpClick={handleSignUpClick}
        onLogoutClick={handleLogoutClick}
        onDashboardClick={handleDashboardClick}
        onHomeClick={handleHomeClick}
        onFeaturesClick={handleFeaturesClick}
        onPricingClick={handlePricingClick}
        onContactClick={handleContactClick}
      />
      <div className="flex flex-1 pt-16"> {/* Adjust pt-16 for header height */}
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 shadow-md z-10 hidden md:block">
          <Sidebar onNavigate={setActiveTab} currentTab={activeTab} />
        </div>
        
        {/* Main content area with padding */}
        <main className="flex-1 md:pl-64 overflow-y-auto"> {/* Adjust pl-64 for sidebar width */}
          <div className="container mx-auto py-8 px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab} // Key change triggers animation
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* Render content using the helper function */}
                {renderActiveTabContent()} 
              </motion.div>
            </AnimatePresence>

            {/* Country Details Modal */}
            {showCountryModal && selectedCountry && (
              <CountryDetailsModal
                isOpen={showCountryModal} 
                countryName={selectedCountry.name}
                countryCode={selectedCountry.code}
                visaDetails={selectedCountry.visaDetails}
                onClose={() => setShowCountryModal(false)}
                onSaveToList={handleSaveFromModal} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}; // End of Dashboard component definition

export default Dashboard; 