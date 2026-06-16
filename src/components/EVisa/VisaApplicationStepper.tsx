import React, { useState, useEffect, useRef, FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCamera, FaCalendarAlt, FaUsers, FaCreditCard, FaInfoCircle, FaCheckCircle, FaPlane, FaCheck, FaUpload } from 'react-icons/fa';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import './VisaApplicationStepper.css';
import authService from '../../lib/api/auth';
import { userProfileService } from '../../lib/api/userProfile';
import { getVisaFeeForCountryCode } from '../../data/visaFees';
import {
  getDiscountedServiceFeeGbp,
  getServiceFeeDiscountPercent,
} from '../../config/visaServiceFee';
import {
  calculateSchengenBorderlyTotalGbp,
  countTravelDays,
  isUkResident,
} from '../../config/schengenPricing';
import SchengenTravelInsuranceAddon from '../VisaEligibility/SchengenTravelInsuranceAddon';
import EvisaExpressProcessingAddon from '../VisaEligibility/EvisaExpressProcessingAddon';
import {
  PassportScanSidebar,
  PassportScannerPanel,
  type PassportScanFields,
} from './PassportScanner';
import { EVISA_EXPRESS_PROCESSING_FEE_GBP } from '../../config/evisaPricing';
import { getVisaWizardStepConfig } from '../../utils/visaWizardSteps';
import {
  createEmptySchengenData,
  type SchengenApplicationData,
} from '../../types/schengenVisa';
import {
  validateSchengenCheckoutStep,
  validateSchengenPersonalStep,
  validateSchengenTravelersStep,
  validateSchengenTravelStep,
  type SchengenValidationErrors,
} from '../../validation/schengenVisaSchema';
import { SchengenPassportVerificationFields } from './schengen/SchengenPassportVerificationFields';
import { SchengenPersonalProfessionalStep } from './schengen/SchengenPersonalProfessionalStep';
import { SchengenTravelDetailsExtension } from './schengen/SchengenTravelDetailsExtension';
import { SchengenTravelersExemptions } from './schengen/SchengenTravelersExemptions';
import { SchengenCheckoutLegal } from './schengen/SchengenCheckoutLegal';
import { createEmptyUsData, type UsApplicationData } from '../../types/usVisa';
import { validateUsSubStep, type UsValidationErrors } from '../../validation/usVisaSchema';
import { UsPassportBioFields } from './us/UsPassportBioFields';
import { UsContactSocialPanel } from './us/UsContactSocialPanel';
import { UsTravelPanel } from './us/UsTravelPanel';
import { UsFamilyPanel } from './us/UsFamilyPanel';
import { UsWorkEducationPanel } from './us/UsWorkEducationPanel';
import { UsTravelersCompanionsPanel } from './us/UsTravelersCompanionsPanel';
import { UsCheckoutPanel } from './us/UsCheckoutPanel';
import {
  evaluateVisaRouting,
  isFieldWaived,
  parseEligibilityFromSearchParams,
} from '../../engine/visaRoutingEngine';
import type { VisaRoutingResult } from '../../types/visaRouting';

interface VisaApplicationStepperProps {
  onComplete?: (data: FormData) => void;
  destinationCode?: string;
  nationalityCode?: string;
  searchParams?: string;
  routingResult?: VisaRoutingResult | null;
}

interface PassportData {
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  placeOfBirth: string;
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  sex: string;
  issuingAuthority: string;
}

interface Traveler {
  id: number;
  step: number;
  complete: boolean;
  hasPhoto: boolean;
  hasPassportScan: boolean;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  passportData: PassportData | null;
}

interface FormData {
  photo: string | null;
  passportData: PassportData | null;
  passportImage?: string | null;
  travelDates: {
    arrival: string;
    departure: string;
  };
  accommodation: {
    name: string;
    address: string;
    phone: string;
    email: string;
    bookingConfirmation: string | null;
  };
  flightTickets: string | null;
  travelers: Traveler[];
  paymentDetails: null;
  schengen: SchengenApplicationData | null;
  us: UsApplicationData | null;
  schengenAddons?: {
    travelInsurance: boolean;
  };
  eligibility?: {
    residenceCountry: string | null;
    residenceMode: 'home' | 'abroad';
    passportNationality: string;
    heldPremiumVisas: string[];
  };
  evisaAddons?: {
    expressProcessing: boolean;
  };
}

const VisaApplicationStepper: React.FC<VisaApplicationStepperProps> = ({
  onComplete,
  destinationCode = 'tr',
  nationalityCode,
  searchParams,
  routingResult: routingResultProp,
}) => {
  const stepConfig = getVisaWizardStepConfig(destinationCode);

  const resolvedRouting = useMemo(() => {
    if (routingResultProp) return routingResultProp;
    if (!nationalityCode) return null;
    const eligibility = parseEligibilityFromSearchParams(
      nationalityCode,
      searchParams ?? (typeof window !== 'undefined' ? window.location.search : '')
    );
    return evaluateVisaRouting(destinationCode, eligibility);
  }, [routingResultProp, nationalityCode, searchParams, destinationCode]);

  const waivedFormFields = resolvedRouting?.waivedFormFields ?? [];
  const {
    isSchengen,
    isUnitedStates: isUs,
    steps,
    totalSteps,
    photoStep,
    passportStep,
    personalStep,
    travelStep,
    travelersStep,
    checkoutStep,
    usPassportSubSteps,
    usTravelSubSteps,
  } = stepConfig;

  const [currentStep, setCurrentStep] = useState(1);
  const [schengenErrors, setSchengenErrors] = useState<SchengenValidationErrors>({});
  const [usErrors, setUsErrors] = useState<UsValidationErrors>({});
  const [usPassportSubStep, setUsPassportSubStep] = useState(0);
  const [usTravelSubStep, setUsTravelSubStep] = useState(0);
  const [currentSamplePhoto, setCurrentSamplePhoto] = useState<'male' | 'female'>('female');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [passportImage, setPassportImage] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCheckingFace, setIsCheckingFace] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isEditingPassportData, setIsEditingPassportData] = useState(false);
  const [currentTravelerIndex, setCurrentTravelerIndex] = useState<number | null>(null);
  const [processingTraveler, setProcessingTraveler] = useState(false);
  const [travelerStep, setTravelerStep] = useState<number>(1);
  const MAX_TRAVELERS = 10;
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [profileResidency, setProfileResidency] = useState<string | null>(null);
  const [addTravelInsurance, setAddTravelInsurance] = useState(false);
  const [addExpressProcessing, setAddExpressProcessing] = useState(false);
  
  // Add effect to alternate photos every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSamplePhoto(prev => prev === 'male' ? 'female' : 'male');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update useEffect for camera element
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentStep === 1) {
      // We can't create elements directly with useRef
      // Just ensure DOM is ready
      timer = setTimeout(() => {
        setIsCameraReady(true);
      }, 500);
    } else {
      setIsCameraReady(false);
      // Cleanup camera when leaving the step
      stopCamera();
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [currentStep]);

  // Add effect to fetch user subscription tier
  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        const { profile } = await userProfileService.getCurrentUserProfile();
        if (profile) {
          setSubscriptionTier(profile.subscription_tier || 'free');
          setProfileResidency(profile.residency ?? null);
        }
      } catch (error) {
        console.error('Error fetching user subscription:', error);
      }
    };
    
    fetchUserSubscription();
  }, []);

  useEffect(() => {
    if (!isSchengen) return;
    const params = new URLSearchParams(
      searchParams ?? (typeof window !== 'undefined' ? window.location.search : '')
    );
    setAddTravelInsurance(params.get('addTravelInsurance') === '1');
  }, [isSchengen, searchParams]);

  useEffect(() => {
    if (isSchengen || isUs) return;
    const params = new URLSearchParams(
      searchParams ?? (typeof window !== 'undefined' ? window.location.search : '')
    );
    setAddExpressProcessing(params.get('addExpressProcessing') === '1');
  }, [isSchengen, isUs, searchParams]);

  const [formData, setFormData] = useState<FormData>({
    photo: null,
    passportData: null,
    travelDates: {
      arrival: '',
      departure: ''
    },
    accommodation: {
      name: '',
      address: '',
      phone: '',
      email: '',
      bookingConfirmation: null
    },
    flightTickets: null,
    travelers: [],
    paymentDetails: null,
    schengen: isSchengen ? createEmptySchengenData() : null,
    us: isUs ? createEmptyUsData() : null,
  });

  const eligibilityContext = useMemo(() => {
    if (!nationalityCode) return null;
    return parseEligibilityFromSearchParams(
      nationalityCode,
      searchParams ?? (typeof window !== 'undefined' ? window.location.search : '')
    );
  }, [nationalityCode, searchParams]);

  const ukResidentForInsurance = isUkResident(
    eligibilityContext?.residenceCountry ?? profileResidency,
    eligibilityContext?.residenceMode ?? 'home',
    nationalityCode || ''
  );

  const travelDays = countTravelDays(
    formData.travelDates.arrival,
    formData.travelDates.departure
  );

  const getSchengenPricing = () =>
    calculateSchengenBorderlyTotalGbp({
      travelerCount: formData.travelers.length + 1,
      discountPercent: getServiceFeeDiscountPercent(subscriptionTier),
      addTravelInsurance: addTravelInsurance && ukResidentForInsurance,
      travelDays: travelDays || 1,
      isUkResident: ukResidentForInsurance,
    });

  const visaFeePerTraveler = isSchengen ? 0 : getVisaFeeForCountryCode(destinationCode);

  const getServiceFee = (): number => {
    if (isSchengen) return getSchengenPricing().serviceFee;
    return getDiscountedServiceFeeGbp(getServiceFeeDiscountPercent(subscriptionTier));
  };

  const isEvisaApplication = !isSchengen && !isUs;

  const getTotalFee = (): number => {
    if (isSchengen) return getSchengenPricing().total;
    const travelerCount = formData.travelers.length + 1;
    let total = visaFeePerTraveler * travelerCount + getServiceFee();
    if (addExpressProcessing && isEvisaApplication) {
      total += EVISA_EXPRESS_PROCESSING_FEE_GBP;
    }
    return Number(total.toFixed(2));
  };

  const updateUs = (updater: (prev: UsApplicationData) => UsApplicationData) => {
    setFormData((prev) => ({
      ...prev,
      us: updater(prev.us ?? createEmptyUsData()),
    }));
  };

  const validateCurrentUsFlow = (): boolean => {
    if (!isUs || !formData.us) return true;
    let subStep: Parameters<typeof validateUsSubStep>[0];
    if (currentStep === passportStep) {
      subStep = usPassportSubStep === 0 ? 'passport' : 'contact';
    } else if (currentStep === travelStep) {
      subStep = usTravelSubStep === 0 ? 'travel' : usTravelSubStep === 1 ? 'family' : 'work';
    } else if (currentStep === travelersStep) {
      subStep = 'travelers';
    } else if (currentStep === checkoutStep) {
      subStep = 'checkout';
    } else {
      return true;
    }
    const errors = validateUsSubStep(subStep, formData.us);
    setUsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateSchengen = (
    updater: (prev: SchengenApplicationData) => SchengenApplicationData
  ) => {
    setFormData((prev) => ({
      ...prev,
      schengen: updater(prev.schengen ?? createEmptySchengenData()),
    }));
  };

  const validateCurrentSchengenStep = (step: number): boolean => {
    if (!isSchengen || !formData.schengen) return true;
    let errors: SchengenValidationErrors = {};

    if (personalStep !== null && step === personalStep) {
      errors = validateSchengenPersonalStep(formData.schengen);
    } else if (step === travelStep) {
      errors = validateSchengenTravelStep(
        formData.schengen,
        formData.accommodation.name,
        formData.accommodation.address,
        formData.travelDates.arrival,
        formData.travelDates.departure,
        waivedFormFields
      );
    } else if (step === travelersStep) {
      errors = validateSchengenTravelersStep(
        formData.schengen,
        formData.passportData?.dateOfBirth,
        waivedFormFields
      );
    } else if (step === checkoutStep) {
      errors = validateSchengenCheckoutStep(formData.schengen);
    }

    setSchengenErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    // If we're processing a specific traveler
    if (processingTraveler && currentTravelerIndex !== null) {
      if (travelerStep === 1) {
        // Photo completed, move to passport
        setTravelerStep(2);
        setIsEditingPassportData(false);
        
        // Reset passport data to avoid showing previous traveler's data
        setPassportImage(null);
        setFormData(prev => ({
          ...prev,
          passportData: null,
          passportImage: null
        }));
        return;
      } else if (travelerStep === 2) {
        // Passport completed, return to travelers screen
        setProcessingTraveler(false);
        setCurrentTravelerIndex(null);
        setTravelerStep(1);
        
        // Clear current form data but keep traveler data in array
        setCapturedImage(null);
        setPassportImage(null);
        setFormData(prev => ({
          ...prev,
          photo: null,
          passportData: null,
          passportImage: null
        }));
        
        // Switch to travelers step, skip travel details for additional travelers
        setCurrentStep(travelersStep);
        return;
      }
    }

    if (isSchengen && !validateCurrentSchengenStep(currentStep)) {
      return;
    }

    if (isUs && formData.us) {
      if (!validateCurrentUsFlow()) return;
      if (currentStep === passportStep && usPassportSubStep < usPassportSubSteps - 1) {
        setUsPassportSubStep(usPassportSubStep + 1);
        return;
      }
      if (currentStep === travelStep && usTravelSubStep < usTravelSubSteps - 1) {
        setUsTravelSubStep(usTravelSubStep + 1);
        return;
      }
    }
    
    // Normal flow for main applicant
    if (currentStep < totalSteps) {
      if (isUs && currentStep === passportStep) setUsPassportSubStep(0);
      if (isUs && currentStep === travelStep) setUsTravelSubStep(0);
      handleStepTransition(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (processingTraveler) {
      if (travelerStep > 1) {
        // Go back to previous traveler step
        setTravelerStep(travelerStep - 1);
        return;
      } else {
        // Cancel adding this traveler and return to travelers screen
        setProcessingTraveler(false);
        setCurrentTravelerIndex(null);
        setTravelerStep(1);
        setIsEditingPassportData(false);
        setCapturedImage(null);
        setFormData(prev => ({
          ...prev,
          photo: null,
          passportData: null,
          passportImage: null
        }));
        return;
      }
    }
    
    // US sub-wizard back navigation within main steps
    if (isUs && currentStep === passportStep && usPassportSubStep > 0) {
      setUsPassportSubStep(usPassportSubStep - 1);
      return;
    }
    if (isUs && currentStep === travelStep && usTravelSubStep > 0) {
      setUsTravelSubStep(usTravelSubStep - 1);
      return;
    }

    // Normal back flow
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      if (isUs && prevStep === passportStep) setUsPassportSubStep(usPassportSubSteps - 1);
      if (isUs && prevStep === travelStep) setUsTravelSubStep(usTravelSubSteps - 1);
      handleStepTransition(prevStep);
    }
  };

  // Camera functionality
  const validateFace = async (imageData: string): Promise<boolean> => {
    console.log("Face validation running");
    try {
      // Get the base64 image data without the prefix
      const base64Image = imageData.includes('base64,') 
        ? imageData.split('base64,')[1] 
        : imageData;
      
      // For testing purposes, always return true
      // You can enable the API call when it's properly configured
      console.log("Using simplified face validation - always returning true");
      return true;
      
      /*
      // Use the endpoint from environment variables or fallback to localhost
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765'}/api/face-detection`;
      
      console.log("Calling face detection API at:", apiUrl);
      
      try {
        // Call the face detection API with a timeout of 10 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64Image }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error("Face validation API returned error:", response.status);
          console.log("Using fallback validation due to API error");
          return true; // Fallback to true if API fails
        }
        
        const result = await response.json();
        console.log("Face validation result:", result);
        
        return result.hasFace === true;
      } catch (apiError) {
        console.error("API call failed:", apiError);
        console.log("Using client-side fallback validation");
        
        // Client-side validation fallback - create an image element and verify its dimensions
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            // If the image loaded successfully and has reasonable dimensions, assume it's valid
            const isValid = img.width > 50 && img.height > 50;
            console.log("Client-side validation result:", isValid);
            resolve(isValid);
          };
          img.onerror = () => {
            console.error("Failed to load image for client-side validation");
            resolve(false);
          };
          img.src = imageData;
        });
      }
      */
    } catch (error: unknown) {
      console.error("Face validation error:", error);
      return true; // Always allow for development/testing
    }
  };

  const startCamera = async () => {
    setIsInitializingCamera(true);
    setPhotoError(null);
    
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access");
      }
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      console.log("Starting camera...");
      
      // Get camera stream with basic constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      
      console.log("Camera stream obtained:", stream);
      
      // Check if we have a valid stream and video element
      if (!stream) {
        throw new Error("Failed to get camera stream");
      }
      
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Apply stream to video element
      videoRef.current.srcObject = stream;
      
      // Ensure video plays - important to see the live feed
      try {
        await videoRef.current.play();
        console.log("Video playback started successfully");
      } catch (playError: unknown) {
        console.error("Error playing video:", playError);
        setPhotoError("Camera couldn't start automatically. Please try again.");
      }
      
      // Show the camera view
      setShowCamera(true);
      
    } catch (error: unknown) {
      console.error("Camera initialization error:", error);
      let errorMsg = "Unable to access camera. ";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          errorMsg += "Camera access was denied. Please allow camera access and try again.";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          errorMsg += "No camera found on your device.";
        } else {
          errorMsg += error.message || "Please try again or use the upload option.";
        }
      }
      
      setPhotoError(errorMsg);
    } finally {
      setIsInitializingCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      console.error("Video element or stream not available");
      setPhotoError("Camera not available");
      return;
    }
    
    try {
      setIsCheckingFace(true);
      
      // Create a canvas to capture the video frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Find the center of the video
      const centerX = videoRef.current.videoWidth / 2;
      const centerY = videoRef.current.videoHeight / 2;
      
      // Calculate a square crop that fits within the video
      const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
      
      // Draw the video frame to the canvas with cropping
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Crop to a square centered on the video
      ctx.drawImage(
        videoRef.current,
        centerX - size/2, // Start X
        centerY - size/2, // Start Y
        size, // Width
        size, // Height
        0, 0, canvas.width, canvas.height
      );
      
      // Get the image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Validate the face
      const isValid = await validateFace(imageData);
      
      if (isValid) {
        // Set the photo
        setCapturedImage(imageData);
        
        if (processingTraveler && currentTravelerIndex !== null) {
          // For additional travelers, store photo in travelers array
          const updatedTraveler = {
            ...formData.travelers[currentTravelerIndex],
            photoUrl: imageData,
            hasPhoto: true
          };
          setFormData(prev => {
            const updatedTravelers = [...prev.travelers];
            updatedTravelers[currentTravelerIndex] = updatedTraveler;
            return {
              ...prev,
              travelers: updatedTravelers,
              photo: imageData  // Also update current form for display
            };
          });
        } else {
          // For main applicant, store in main form
          setFormData(prev => ({
            ...prev,
            photo: imageData
          }));
        }
        
        setPhotoError(null);
      } else {
        setPhotoError("No valid face detected in the image");
        // We'll still allow it for now
        setCapturedImage(imageData);
        
        if (processingTraveler && currentTravelerIndex !== null) {
          // For additional travelers, store photo in travelers array
          const updatedTraveler = {
            ...formData.travelers[currentTravelerIndex],
            photoUrl: imageData,
            hasPhoto: true
          };
          setFormData(prev => {
            const updatedTravelers = [...prev.travelers];
            updatedTravelers[currentTravelerIndex] = updatedTraveler;
            return {
              ...prev,
              travelers: updatedTravelers,
              photo: imageData  // Also update current form for display
            };
          });
        } else {
          // For main applicant, store in main form
          setFormData(prev => ({
            ...prev,
            photo: imageData
          }));
        }
      }
      
      setIsCheckingFace(false);
      stopCamera();
    } catch (error: unknown) {
      console.error("Error capturing photo:", error);
      setPhotoError("Failed to process photo");
      setIsCheckingFace(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setPhotoError("Please upload an image file");
      return;
    }

    try {
      setIsCheckingFace(true);

      // Read the file
      const reader = new FileReader();
      
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const imageData = event.target?.result as string;
        if (!imageData) {
          setPhotoError("Failed to read the uploaded file");
          setIsCheckingFace(false);
          return;
        }
        
        // Validate the face
        const isValid = await validateFace(imageData);
        
        if (isValid) {
          // Set the photo
          setCapturedImage(imageData);
          
          if (processingTraveler && currentTravelerIndex !== null) {
            // For additional travelers, store photo in travelers array
            const updatedTraveler = {
              ...formData.travelers[currentTravelerIndex],
              photoUrl: imageData,
              hasPhoto: true
            };
            setFormData(prev => {
              const updatedTravelers = [...prev.travelers];
              updatedTravelers[currentTravelerIndex] = updatedTraveler;
              return {
                ...prev,
                travelers: updatedTravelers,
                photo: imageData  // Also update current form for display
              };
            });
          } else {
            // For main applicant, store in main form
            setFormData(prev => ({
              ...prev,
              photo: imageData
            }));
          }
          
          setPhotoError(null);
        } else {
          setPhotoError("No valid face detected in the image");
          // We'll still allow it for now
          setCapturedImage(imageData);
          
          if (processingTraveler && currentTravelerIndex !== null) {
            // For additional travelers, store photo in travelers array
            const updatedTraveler = {
              ...formData.travelers[currentTravelerIndex],
              photoUrl: imageData,
              hasPhoto: true
            };
            setFormData(prev => {
              const updatedTravelers = [...prev.travelers];
              updatedTravelers[currentTravelerIndex] = updatedTraveler;
              return {
                ...prev,
                travelers: updatedTravelers,
                photo: imageData  // Also update current form for display
              };
            });
          } else {
            // For main applicant, store in main form
            setFormData(prev => ({
              ...prev,
              photo: imageData
            }));
          }
        }
        setIsCheckingFace(false);
      };
      
      reader.onerror = () => {
        setPhotoError("Failed to read the uploaded file");
        setIsCheckingFace(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      console.error("Error uploading photo:", error);
      setPhotoError("Failed to process the uploaded photo");
      setIsCheckingFace(false);
    }
  };

  const handlePassportImageChange = (image: string | null) => {
    setPassportImage(image);
    setFormData((prev) => ({ ...prev, passportImage: image }));
  };

  const handlePassportDataChange = (data: PassportScanFields | null) => {
    setFormData((prev) => {
      const next: FormData = {
        ...prev,
        passportData: data,
      };

      if (processingTraveler && currentTravelerIndex !== null) {
        const updatedTravelers = [...prev.travelers];
        if (updatedTravelers[currentTravelerIndex]) {
          updatedTravelers[currentTravelerIndex] = {
            ...updatedTravelers[currentTravelerIndex],
            passportData: data,
            hasPassportScan: Boolean(data?.passportNumber),
          };
        }
        next.travelers = updatedTravelers;
      }

      return next;
    });
  };

  // Add handlers for travel details form
  const handleDateChange = (field: 'arrival' | 'departure', value: string) => {
    setFormData(prev => ({
      ...prev,
      travelDates: {
        ...prev.travelDates,
        [field]: value
      }
    }));
  };

  const handleAccommodationChange = (field: keyof FormData['accommodation'], value: string) => {
    setFormData(prev => ({
      ...prev,
      accommodation: {
        ...prev.accommodation,
        [field]: value
      }
    }));
  };

  const handleBookingUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const bookingData = reader.result as string;
        setFormData(prev => ({
          ...prev,
          accommodation: {
            ...prev.accommodation,
            bookingConfirmation: bookingData
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFlightTicketUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const ticketData = reader.result as string;
        setFormData(prev => ({
          ...prev,
          flightTickets: ticketData
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Function to confirm step transition
  const confirmStepTransition = () => {
    if (pendingStep !== null) {
      setIsTransitioning(true);
      setCurrentStep(pendingStep);
      setTimeout(() => setIsTransitioning(false), 1000);
      setShowConfirmModal(false);
      setPendingStep(null);
    }
  };

  // Function to cancel step transition
  const cancelStepTransition = () => {
    setShowConfirmModal(false);
    setPendingStep(null);
  };

  // Add travelers functionality
  const addTraveler = () => {
    if (formData.travelers.length >= MAX_TRAVELERS - 1) {
      // Show a message that maximum travelers reached
      alert(`Maximum of ${MAX_TRAVELERS} travelers (including main applicant) allowed per application.`);
      return;
    }
    
    // Add a new traveler with the correct type
    const newTraveler: Traveler = {
      id: formData.travelers.length + 2,
      step: 1,
      complete: false,
      hasPhoto: false,
      hasPassportScan: false,
      firstName: '',
      lastName: '',
      photoUrl: undefined,
      passportData: null
    };
    
    setFormData(prev => ({
      ...prev,
      travelers: [...prev.travelers, newTraveler]
    }));
    
    // Set current index to the new traveler (length before adding)
    const newTravelerIndex = formData.travelers.length;
    setCurrentTravelerIndex(newTravelerIndex);
    setProcessingTraveler(true);
    setTravelerStep(1);
    setIsEditingPassportData(false);
    
    // Completely clear current data since we're starting fresh
    setCapturedImage(null);
    setPassportImage(null);
    setFormData(prev => ({
      ...prev,
      photo: null,
      passportData: null,
      passportImage: null
    }));
  };

  const removeTraveler = (index: number) => {
    setFormData(prev => ({
      ...prev,
      travelers: prev.travelers.filter((_, i) => i !== index)
    }));
  };

  const updateTravelerInfo = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedTravelers = [...prev.travelers];
      updatedTravelers[index] = {
        ...updatedTravelers[index],
        [field]: value
      };
      return {
        ...prev,
        travelers: updatedTravelers
      };
    });
  };

  // Add handleStepTransition function
  const handleStepTransition = (nextStep: number) => {
    if (nextStep === passportStep && currentStep === photoStep && formData.photo) {
      // For first step, ask for confirmation before proceeding
      setPendingStep(nextStep);
      setShowConfirmModal(true);
    } else {
      // For other steps, transition directly
      setIsTransitioning(true);
      setCurrentStep(nextStep);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  // Fix function to refresh OCR data completely when reprocessing a traveler
  const updateTravelerProcess = (index: number, startAtStep: number) => {
    setCurrentTravelerIndex(index);
    setProcessingTraveler(true);
    setTravelerStep(startAtStep);
    setIsEditingPassportData(false);
    
    // Always completely clear current form data to avoid showing previous data
    setCapturedImage(null);
    setPassportImage(null);
    setFormData(prev => ({
      ...prev,
      photo: startAtStep === 1 ? null : (prev.travelers[index].photoUrl || null),
      passportData: null,
      passportImage: null
    }));
  };

  // Fix onComplete function call if needed
  const handleComplete = () => {
    if (isSchengen && formData.schengen && !validateCurrentSchengenStep(checkoutStep)) {
      return;
    }
    if (isUs && formData.us) {
      setCurrentStep(checkoutStep);
      setUsTravelSubStep(0);
      setUsPassportSubStep(0);
      const errors = validateUsSubStep('checkout', formData.us);
      setUsErrors(errors);
      if (Object.keys(errors).length > 0) return;
    }
    if (onComplete) {
      onComplete({
        ...formData,
        schengenAddons: {
          travelInsurance: addTravelInsurance && ukResidentForInsurance,
        },
        evisaAddons: {
          expressProcessing: addExpressProcessing && isEvisaApplication,
        },
        eligibility: eligibilityContext
          ? {
              residenceCountry: eligibilityContext.residenceCountry,
              residenceMode: eligibilityContext.residenceMode,
              passportNationality: eligibilityContext.passportNationality,
              heldPremiumVisas: eligibilityContext.heldPremiumVisas,
            }
          : undefined,
      });
    }
  };

  // This function seems intended to handle the result *after* OCR/upload is done for the *current* step/traveler
  // It should update the central formData state for the *current* operation
  const handlePassportScanComplete = (extractedData: Partial<PassportData>, passportFile: File | null) => {
    console.log("Passport scan completed with data:", extractedData, "File:", passportFile);

    // Create full passport data object, initializing all fields with empty strings
    // This ensures all required fields are present even if OCR doesn't extract them
    const completePassportData: PassportData = {
      firstName: extractedData.firstName || '',
      lastName: extractedData.lastName || '',
      nationality: extractedData.nationality || '',
      dateOfBirth: extractedData.dateOfBirth || '',
      placeOfBirth: extractedData.placeOfBirth || '',
      passportNumber: extractedData.passportNumber || '',
      issueDate: extractedData.issueDate || '',
      expiryDate: extractedData.expiryDate || '',
      sex: extractedData.sex || '',
      issuingAuthority: extractedData.issuingAuthority || ''
    };

    // Display edit form automatically if OCR didn't extract all required fields
    if (!Object.values(completePassportData).every(value => value.trim() !== '')) {
      setIsEditingPassportData(true);
    }

    // Update the main formData with the extracted data for the current step
    setFormData(prev => ({
      ...prev,
      passportData: completePassportData,
      // Keep existing passportImage if already set, otherwise maybe set from file if needed?
      // passportImage: prev.passportImage || (passportFile ? URL.createObjectURL(passportFile) : null), 
    }));

    // If processing an additional traveler, update their specific entry in the travelers array
    if (processingTraveler && currentTravelerIndex !== null) {
      setFormData((prev: FormData) => {
        const updatedTravelers = [...prev.travelers];
        if (updatedTravelers[currentTravelerIndex]) {
          updatedTravelers[currentTravelerIndex].passportData = completePassportData;
          updatedTravelers[currentTravelerIndex].hasPassportScan = true;
          // Store the actual File object if needed, or just a flag/URL
          // updatedTravelers[currentTravelerIndex].passportFile = passportFile; // Add 'passportFile: File | null' to Traveler interface if storing the file object
        }
        return { ...prev, travelers: updatedTravelers };
      });
    } else {
      // If not processing an additional traveler, assume it's the main applicant (index 0 conceptually)
      // We've already updated the main formData.passportData above.
      // If the main applicant details are also stored in travelers[0], update that too.
      // This depends on how the main applicant's data is structured.
      // Assuming the main applicant's details are primarily in the top-level formData:
       console.log("Updated main applicant passport data in formData.");
       // If you also store main applicant in travelers[0]:
       /*
       setFormData((prev: FormData) => {
         const updatedTravelers = [...prev.travelers];
         if (updatedTravelers[0]) { // Assuming main applicant is at index 0
           updatedTravelers[0].passportData = completePassportData;
           updatedTravelers[0].hasPassportScan = true;
         }
         return { ...prev, travelers: updatedTravelers };
       });
       */
    }

    // Storing the file might be complex (state, memory). Consider if just the data is needed.
    // If the file *must* be stored with the traveler, add 'passportFile: File | null' to Traveler interface
    // And update the setFormData logic above accordingly.

    // Removed setActiveStep(1) - this function shouldn't control step flow directly.
    // Removed incorrect updateTravelerInfo call.
    // Removed incorrect setTravelers call.
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Flow Steps Indicator */}
      <div className="mb-8 lg:mb-12 relative overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex justify-between items-center min-w-[36rem] max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <motion.div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center relative
                    ${currentStep >= step.id 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-500'}`}
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                    transition: { duration: 0.3 }
                  }}
                >
                  <step.icon className="w-6 h-6" />
                  {currentStep === step.id && (
                    <motion.div
                      className="absolute -inset-1 rounded-full border-2 border-primary-500"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <span className="text-xs sm:text-sm font-medium mt-2 text-gray-600 text-center">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 relative mx-4">
                  {currentStep > step.id && (
                    <motion.div
                      className="absolute inset-0 bg-primary-600"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                  {isTransitioning && currentStep === step.id + 1 && (
                    <motion.div
                      className="absolute -top-3"
                      initial={{ left: "0%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    >
                      <FaPlane className="text-primary-600 w-6 h-6 transform -rotate-90" />
                    </motion.div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main grid layout - responsive: stack on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Left Column - requirements & samples */}
        <div className="flex flex-col space-y-4 lg:space-y-6 order-2 lg:order-1">
          {(currentStep === 1 || (processingTraveler && travelerStep === 1)) && (
            <>
              {/* Photo Requirements Card */}
              <div className="bg-white rounded-xl shadow-lg p-5 flex-1">
                <h3 className="text-lg font-semibold mb-4">Photo Requirements</h3>
                <div className="bg-primary-50 p-4 rounded-lg">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheckCircle className="text-primary-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Well-lit environment</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-primary-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Plain background</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-primary-600 mt-1 mr-2 flex-shrink-0" />
                      <span>No glasses</span>
                    </li>
                    <li className="flex items-start">
                      <FaCheckCircle className="text-primary-600 mt-1 mr-2 flex-shrink-0" />
                      <span>Face directly towards camera</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Sample Photos Card */}
              <div className="bg-white rounded-xl shadow-lg p-5">
                <h3 className="text-lg font-semibold mb-3 text-center">Sample Photo</h3>
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mx-auto" style={{ maxHeight: '180px', width: '135px' }}>
                  <motion.div
                    key={currentSamplePhoto}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full"
                  >
                    <img 
                      src={`/images/passportphoto${currentSamplePhoto}.png`}
                      alt="Sample passport photo"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
              </div>
            </>
          )}

          {(currentStep === passportStep || (processingTraveler && travelerStep === 2)) && (
            <PassportScanSidebar />
          )}
          
          {/* No helper cards for other steps */}
        </div>

        {/* Middle Column - main form */}
        <div className="flex flex-col col-span-1 lg:col-span-2 order-1 lg:order-2">
          <div className="bg-white rounded-xl shadow-lg p-5 h-full">
            <AnimatePresence mode="wait">
              {/* If processing a traveler, show special title */}
              {processingTraveler && currentTravelerIndex !== null && (
                <div className="mb-4 bg-primary-50 p-3 rounded-lg">
                  <h2 className="text-lg font-semibold text-primary-700">
                    Processing Traveler #{currentTravelerIndex + 2} - Step {travelerStep === 1 ? 'Photo' : 'Passport'}
                  </h2>
                </div>
              )}
              
              {/* Photo step - main applicant or additional traveler - preserve original dimensions */}
              {(currentStep === 1 || (processingTraveler && travelerStep === 1)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col"
                >
                  <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                    {processingTraveler 
                      ? `Take or Upload Photo for Traveler #${currentTravelerIndex !== null ? currentTravelerIndex + 2 : ''}` 
                      : 'Take or Upload Your Photo'}
                  </h2>
                  
                  {/* Camera Interface - preserve original dimensions */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gray-900 overflow-hidden relative mx-auto" id="camera-container">
                      {/* Always render the video element, but only show when active */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 w-full h-full object-cover z-10 ${showCamera ? 'opacity-100' : 'opacity-0'}`}
                      />
                      
                      {showCamera && (
                        <div className="absolute inset-0 border-4 border-white border-opacity-20 rounded-full z-20">
                          <div className="absolute inset-4 border-2 border-white border-dashed rounded-full"></div>
                        </div>
                      )}
                      
                      {capturedImage && (
                        <div className="absolute inset-0 w-full h-full z-20">
                          <img
                            src={capturedImage}
                            alt="Captured photo"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <button
                            onClick={() => {
                              setCapturedImage(null);
                              setFormData(prev => ({ ...prev, photo: null }));
                              setPhotoError(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-30"
                            title="Remove photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      {!showCamera && !capturedImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {isInitializingCamera ? (
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-2"></div>
                              <p className="text-sm">Initializing camera...</p>
                            </div>
                          ) : (
                            <div className="text-white text-center">
                              <FaCamera className="w-16 h-16 mx-auto mb-4" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {isCheckingFace && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-2"></div>
                            <p className="text-sm">Checking photo...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {photoError && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm max-w-md mx-auto">
                        {photoError}
                      </div>
                    )}
                  </div>

                  {/* Camera interaction buttons */}
                  <div className="mt-8 flex justify-center space-x-4 w-full">
                    {showCamera ? (
                      <>
                        <button 
                          onClick={capturePhoto}
                          disabled={isCheckingFace}
                          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingFace ? 'Checking...' : 'Capture'}
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center min-w-[120px]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={startCamera}
                          disabled={isInitializingCamera || isCheckingFace}
                          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isInitializingCamera ? 'Initializing...' : 'Take Photo'}
                        </button>
                        <label className={`px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center min-w-[120px] cursor-pointer ${(isInitializingCamera || isCheckingFace) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isInitializingCamera || isCheckingFace}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 1 || isCheckingFace}
                      className={`px-6 py-2.5 rounded-lg ${
                        currentStep === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!formData.photo || isCheckingFace}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {(currentStep === passportStep || (processingTraveler && travelerStep === 2)) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex h-full flex-col"
                >
                  {isUs && formData.us && usPassportSubStep === 1 && !processingTraveler ? (
                    <>
                      <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
                        Contact & Social Media
                      </h2>
                      <p className="mb-4 text-center text-sm text-primary-600">
                        Section {usPassportSubStep + 1} of {usPassportSubSteps}
                      </p>
                      <UsContactSocialPanel
                        data={formData.us.contactSocial}
                        errors={usErrors}
                        onChange={(contactSocial) => updateUs((prev) => ({ ...prev, contactSocial }))}
                      />
                      <div className="mt-6 flex justify-between">
                        <button onClick={handleBack} className="rounded-lg bg-gray-100 px-6 py-2.5 text-gray-700 hover:bg-gray-200">Back</button>
                        <button onClick={handleNext} className="rounded-lg bg-primary-600 px-6 py-2.5 text-white hover:bg-primary-700">Continue</button>
                      </div>
                    </>
                  ) : (
                    <PassportScannerPanel
                      title={
                        processingTraveler
                          ? `Scan Passport for Traveler #${currentTravelerIndex !== null ? currentTravelerIndex + 2 : ''}`
                          : isUs
                            ? 'Passport & Bio-Data (DS-160)'
                            : 'Scan Your Passport'
                      }
                      passportImage={passportImage}
                      passportData={formData.passportData}
                      isEditingPassportData={isEditingPassportData}
                      onPassportImageChange={handlePassportImageChange}
                      onPassportDataChange={handlePassportDataChange}
                      onIsEditingChange={setIsEditingPassportData}
                      onBack={handleBack}
                      onContinue={handleNext}
                    >
                      {isUs && !processingTraveler && (
                        <p className="mb-4 text-center text-sm text-primary-600">
                          Section {usPassportSubStep + 1} of {usPassportSubSteps}
                        </p>
                      )}
                      {isSchengen && formData.schengen && formData.passportData && (
                        <SchengenPassportVerificationFields
                          data={formData.schengen.passportVerification}
                          currentNationality={formData.passportData.nationality}
                          onChange={(passportVerification) =>
                            updateSchengen((prev) => ({ ...prev, passportVerification }))
                          }
                        />
                      )}
                      {isUs && formData.us && formData.passportData && usPassportSubStep === 0 && (
                        <UsPassportBioFields
                          data={formData.us.passportBio}
                          errors={usErrors}
                          onChange={(passportBio) => updateUs((prev) => ({ ...prev, passportBio }))}
                        />
                      )}
                    </PassportScannerPanel>
                  )}
                </motion.div>
              )}

              {isSchengen && personalStep !== null && currentStep === personalStep && formData.schengen && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SchengenPersonalProfessionalStep
                    data={formData.schengen.personalProfessional}
                    errors={schengenErrors}
                    onChange={(personalProfessional) =>
                      updateSchengen((prev) => ({ ...prev, personalProfessional }))
                    }
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                </motion.div>
              )}

              {currentStep === travelStep && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">Travel Details</h2>
                  {isUs && (
                    <p className="text-sm text-primary-600">
                      DS-160 Section {usTravelSubStep + 1} of {usTravelSubSteps}:{' '}
                      {usTravelSubStep === 0 ? 'Travel & U.S. History' : usTravelSubStep === 1 ? 'Family Background' : 'Work & Education'}
                    </p>
                  )}

                  {isUs && formData.us ? (
                    <>
                      {usTravelSubStep === 0 && (
                        <UsTravelPanel
                          data={formData.us.travelDetails}
                          errors={usErrors}
                          onChange={(travelDetails) => {
                            updateUs((prev) => ({ ...prev, travelDetails }));
                            if (travelDetails.arrivalDate) handleDateChange('arrival', travelDetails.arrivalDate);
                            if (travelDetails.departureDate) handleDateChange('departure', travelDetails.departureDate);
                            if (travelDetails.contactPersonName || travelDetails.organizationName) {
                              handleAccommodationChange('name', travelDetails.organizationName || travelDetails.contactPersonName);
                              handleAccommodationChange('address', travelDetails.contactUsAddress.street);
                            }
                          }}
                        />
                      )}
                      {usTravelSubStep === 1 && (
                        <UsFamilyPanel
                          data={formData.us.familyBackground}
                          errors={usErrors}
                          onChange={(familyBackground) => updateUs((prev) => ({ ...prev, familyBackground }))}
                        />
                      )}
                      {usTravelSubStep === 2 && (
                        <UsWorkEducationPanel
                          data={formData.us.workEducation}
                          errors={usErrors}
                          onChange={(workEducation) => updateUs((prev) => ({ ...prev, workEducation }))}
                        />
                      )}
                    </>
                  ) : (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Arrival Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.travelDates.arrival}
                        onChange={(e) => handleDateChange('arrival', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Departure Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        min={formData.travelDates.arrival || new Date().toISOString().split('T')[0]}
                        value={formData.travelDates.departure}
                        onChange={(e) => handleDateChange('departure', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {isSchengen && formData.schengen ? (
                      <SchengenTravelDetailsExtension
                        data={formData.schengen.travelExtension}
                        errors={schengenErrors}
                        accommodationName={formData.accommodation.name}
                        accommodationAddress={formData.accommodation.address}
                        accommodationPhone={formData.accommodation.phone}
                        waivedFields={waivedFormFields}
                        onTravelChange={(travelExtension) =>
                          updateSchengen((prev) => ({ ...prev, travelExtension }))
                        }
                        onAccommodationChange={(field, value) =>
                          handleAccommodationChange(field, value)
                        }
                      />
                    ) : (
                      <>
                    <h3 className="text-lg font-semibold">Additional Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purpose of Visit
                      </label>
                      <select 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select purpose</option>
                        <option value="tourism">Tourism</option>
                        <option value="business">Business</option>
                        <option value="education">Education</option>
                        <option value="medical">Medical</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Accommodation Details</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hotel/Accommodation Name
                        </label>
                        <input
                          type="text"
                          placeholder="Hotel or accommodation name"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.accommodation.name}
                          onChange={(e) => handleAccommodationChange('name', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <textarea
                          placeholder="Full address of your accommodation"
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={formData.accommodation.address}
                          onChange={(e) => handleAccommodationChange('address', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isFieldWaived(waivedFormFields, 'travel.accommodation.phone') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number (Optional)
                          </label>
                          <input
                            type="tel"
                            placeholder="+1 234 567 8900"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={formData.accommodation.phone}
                            onChange={(e) => handleAccommodationChange('phone', e.target.value)}
                          />
                        </div>
                        )}
                        
                        {!isFieldWaived(waivedFormFields, 'travel.accommodation.email') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            placeholder="hotel@example.com"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            value={formData.accommodation.email}
                            onChange={(e) => handleAccommodationChange('email', e.target.value)}
                          />
                        </div>
                        )}
                      </div>
                    </div>
                      </>
                    )}
                    
                    {!isFieldWaived(waivedFormFields, 'travel.bookingConfirmation') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Supporting Documents (Optional)</h3>
                      
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors">
                        <label className="flex flex-col items-center cursor-pointer">
                          <FaInfoCircle className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 mb-2">Upload Accommodation Booking Confirmation</span>
                          <span className="text-xs text-gray-500">(PDF, JPG, PNG)</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleBookingUpload}
                            className="hidden"
                          />
                          {formData.accommodation.bookingConfirmation && (
                            <div className="mt-2 flex items-center text-sm text-green-600">
                              <FaCheckCircle className="mr-1" /> Document uploaded
                            </div>
                          )}
                        </label>
                      </div>
                      
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 transition-colors">
                        <label className="flex flex-col items-center cursor-pointer">
                          <FaInfoCircle className="w-6 h-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 mb-2">Upload Flight Tickets</span>
                          <span className="text-xs text-gray-500">(PDF, JPG, PNG)</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFlightTicketUpload}
                            className="hidden"
                          />
                          {formData.flightTickets && (
                            <div className="mt-2 flex items-center text-sm text-green-600">
                              <FaCheckCircle className="mr-1" /> Document uploaded
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                    )}
                  </div>
                  </>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!isUs && (!formData.travelDates.arrival || !formData.travelDates.departure || !formData.accommodation.name || !formData.accommodation.address)}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === travelersStep && !processingTraveler && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">Travelers</h2>
                  
                  {/* Only show travelers list with completed travelers */}
                  {formData.travelers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-700">Added Travelers</h3>
                      {formData.travelers.map((traveler, index) => (
                        <div key={traveler.id || index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">Traveler #{index + 2}</h3>
                            <button 
                              className="text-red-500 hover:text-red-600"
                              onClick={() => removeTraveler(index)}
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row justify-between mt-2">
                            <div className="flex items-center mb-2 sm:mb-0">
                              <div className={`w-4 h-4 rounded-full mr-2 ${traveler.hasPhoto ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">{traveler.hasPhoto ? 'Photo Completed' : 'Photo Required'}</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-2 ${traveler.hasPassportScan ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-sm">{traveler.hasPassportScan ? 'Passport Scanned' : 'Passport Scan Required'}</span>
                            </div>
                          </div>
                          
                          {/* Show name from passport if available */}
                          {traveler.passportData && (
                            <div className="mt-2 text-sm bg-green-50 p-2 rounded">
                              <span className="font-medium">Name: </span> 
                              {traveler.passportData.firstName} {traveler.passportData.lastName}
                            </div>
                          )}
                          
                          {(!traveler.hasPhoto || !traveler.hasPassportScan) && (
                            <button
                              onClick={() => {
                                updateTravelerProcess(
                                  index,
                                  traveler.hasPhoto ? 2 : 1 // Start at photo if needed, otherwise passport
                                );
                              }}
                              className="mt-3 w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 text-sm"
                            >
                              {traveler.hasPhoto && !traveler.hasPassportScan 
                                ? 'Complete Passport Scan' 
                                : (!traveler.hasPhoto && traveler.hasPassportScan) 
                                  ? 'Complete Photo' 
                                  : 'Complete Registration'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add traveler button */}
                  {!isFieldWaived(waivedFormFields, 'travelers.additionalTravelersPrompt') && (
                  <button 
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    onClick={addTraveler}
                  >
                    <div className="flex flex-col items-center">
                      <FaUsers className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-gray-600">Add Another Traveler</span>
                    </div>
                  </button>
                  )}

                  {isSchengen && formData.schengen && (
                    <SchengenTravelersExemptions
                      dateOfBirth={formData.passportData?.dateOfBirth}
                      guardianDetails={formData.schengen.guardianDetails}
                      euFamilyExemption={formData.schengen.euFamilyExemption}
                      errors={schengenErrors}
                      waivedFields={waivedFormFields}
                      onGuardianChange={(guardianDetails) =>
                        updateSchengen((prev) => ({ ...prev, guardianDetails }))
                      }
                      onEuFamilyChange={(euFamilyExemption) =>
                        updateSchengen((prev) => ({ ...prev, euFamilyExemption }))
                      }
                    />
                  )}

                  {isUs && formData.us && (
                    <UsTravelersCompanionsPanel
                      data={formData.us.travelersCompanions}
                      errors={usErrors}
                      onChange={(travelersCompanions) => updateUs((prev) => ({ ...prev, travelersCompanions }))}
                    />
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === checkoutStep && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Payment</h2>

                  <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-bold mb-4 text-primary-800">Application Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-primary-100 pb-3">
                        <span className="text-gray-700 font-medium">Visa Type</span>
                        <span className="text-lg font-semibold text-primary-700">
                          {resolvedRouting?.visaTypeLabel ??
                            (isSchengen ? 'Schengen Visa' : isUs ? 'U.S. Visa (DS-160)' : 'Tourist eVisa')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-primary-100 pb-3">
                        <span className="text-gray-700 font-medium">Number of Travelers</span>
                        <span className="text-lg font-semibold text-primary-700">{formData.travelers.length + 1}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Processing Time</span>
                        <span className="text-lg font-semibold text-primary-700">
                          {isSchengen
                            ? 'At least 15 working days'
                            : addExpressProcessing && isEvisaApplication
                              ? 'Express (1 business day)'
                              : 'Standard (3-5 business days)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSchengen && formData.schengen && (
                    <SchengenCheckoutLegal
                      meansOfSupport={formData.schengen.meansOfSupport}
                      declarations={formData.schengen.declarations}
                      hostName={formData.accommodation.name}
                      hostAddress={formData.accommodation.address}
                      errors={schengenErrors}
                      onMeansChange={(meansOfSupport) =>
                        updateSchengen((prev) => ({ ...prev, meansOfSupport }))
                      }
                      onDeclarationsChange={(declarations) =>
                        updateSchengen((prev) => ({ ...prev, declarations }))
                      }
                    />
                  )}

                  {isUs && formData.us && (
                    <UsCheckoutPanel
                      data={formData.us.checkoutCompliance}
                      errors={usErrors}
                      onChange={(checkoutCompliance) => updateUs((prev) => ({ ...prev, checkoutCompliance }))}
                    />
                  )}

                  {isSchengen && ukResidentForInsurance && (
                    <SchengenTravelInsuranceAddon
                      checked={addTravelInsurance}
                      onChange={setAddTravelInsurance}
                      travelDays={travelDays}
                      travelerCount={formData.travelers.length + 1}
                    />
                  )}

                  {isEvisaApplication && (
                    <EvisaExpressProcessingAddon
                      checked={addExpressProcessing}
                      onChange={setAddExpressProcessing}
                    />
                  )}

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Payment Details</h3>
                    <p className="mb-4 text-sm text-gray-500">
                      {isSchengen
                        ? 'Borderly fees only. Embassy and VFS fees are paid separately at your appointment centre.'
                        : 'Government visa fee plus Borderly service fee.'}
                    </p>
                    <div className="space-y-4">
                      {isSchengen ? (
                        <>
                          <div className="flex justify-between items-center pb-3">
                            <span className="text-gray-700 text-lg">
                              Appointment booking ({formData.travelers.length + 1} travelers)
                            </span>
                            <span className="text-lg font-semibold">
                              £{getSchengenPricing().appointmentFee.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3">
                            <div>
                              <span className="text-gray-700 text-lg">Borderly visa service</span>
                              {subscriptionTier !== 'free' && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                  {getServiceFeeDiscountPercent(subscriptionTier)}% off
                                </span>
                              )}
                            </div>
                            <span className="text-lg font-semibold">£{getSchengenPricing().serviceFee.toFixed(2)}</span>
                          </div>
                          {getSchengenPricing().travelInsurance > 0 && (
                            <div className="flex justify-between items-center pb-3">
                              <span className="text-gray-700 text-lg">Travel insurance add-on</span>
                              <span className="text-lg font-semibold">
                                £{getSchengenPricing().travelInsurance.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center pb-3">
                            <span className="text-gray-700 text-lg">Visa Fee ({formData.travelers.length + 1} travelers)</span>
                            <span className="text-lg font-semibold">£{(visaFeePerTraveler * (formData.travelers.length + 1)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pb-3">
                            <div>
                              <span className="text-gray-700 text-lg">Service Fee</span>
                              {subscriptionTier !== 'free' && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                  {getServiceFeeDiscountPercent(subscriptionTier)}% off
                                </span>
                              )}
                            </div>
                            <span className="text-lg font-semibold">£{getServiceFee().toFixed(2)}</span>
                          </div>
                          {addExpressProcessing && isEvisaApplication && (
                            <div className="flex justify-between items-center pb-3">
                              <span className="text-gray-700 text-lg">Express processing add-on</span>
                              <span className="text-lg font-semibold">
                                £{EVISA_EXPRESS_PROCESSING_FEE_GBP.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-primary-600">£{getTotalFee().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900">Card Information</h3>
                        <div className="flex space-x-2">
                          <FaCcVisa className="text-blue-600 text-2xl" />
                          <FaCcMastercard className="text-orange-600 text-2xl" />
                          <FaCcAmex className="text-blue-500 text-2xl" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-2">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            className="w-full p-4 border border-gray-300 rounded-lg text-lg pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <FaCreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-base font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="123"
                              className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <FaInfoCircle className="text-gray-400 cursor-help" title="3-digit security code on the back of your card" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="h-5 w-5 text-primary-600 rounded" />
                          <span className="ml-2 text-gray-700">Save this card for future payments</span>
                        </label>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <FaCheckCircle className="text-green-600" />
                      </div>
                      <span className="text-sm text-gray-600">Your payment information is encrypted and secure</span>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-lg"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleComplete}
                      className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-semibold flex items-center"
                    >
                      <span>Complete Payment</span>
                      <FaCheckCircle className="ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column - step list (desktop only; mobile uses top progress bar) */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg p-5 h-fit order-3">
          <div className="space-y-3">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`flex items-center p-3 rounded-lg transition-colors
                  ${currentStep === step.id 
                    ? 'bg-primary-50 border-l-4 border-primary-600' 
                    : currentStep > step.id
                      ? 'bg-gray-50 border-l-4 border-green-500'
                      : 'bg-white border-l-4 border-transparent'
                  }`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${currentStep >= step.id 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-500'}`}
                >
                  <step.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`font-medium ${
                    currentStep === step.id 
                      ? 'text-primary-600' 
                      : currentStep > step.id
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Step Completion</h3>
            <p className="mb-6">Are you sure you want to proceed to the next step? You can always come back to edit this information later.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelStepTransition}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmStepTransition}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Always render video element for photo step fallback */}
      <div style={{ display: 'none' }}>
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
      </div>
      
      {/* Canvas element */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VisaApplicationStepper; 

