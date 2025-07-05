import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_COUNTRIES, getFlagUrl } from '../../utils/countries';
import PersonalInfoForm from './PersonalInfoForm';
import TravelInfoForm from './TravelInfoForm';
import DocumentUploadForm from './DocumentUploadForm';
import PaymentForm from './PaymentForm';
import EVisaReview from './EVisaReview';
import EVisaSuccess from './EVisaSuccess';
import EVisaHeader from './EVisaHeader';
import PhotoCapture from './PhotoCapture';
import PassportScan from './PassportScan';
import { saveApplicationProgress, loadApplicationProgress, clearApplicationProgress } from '../../utils/localStorageHelper';

interface ExtractedPassportData {
  passportNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  expiryDate?: string;
  issueDate?: string;
}

interface ApplicationState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  nationality: string; 
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  photoSrc: string | null;
  extractedPassportData: Partial<ExtractedPassportData> | null;
  passportFile: File | null;
  destination: string; 
  purpose: string;
  entryDate: string;
  exitDate: string;
  accommodation: string;
  passportScan: File | null; 
  photoId: File | null;     
  additionalDocuments: File[];
  paymentMethod: string;
  cardholderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  billingAddress: string;
  agreeToTerms: boolean;
  status: 'draft' | 'submitted' | 'error'; 
  applicationId: string; 
  [key: string]: any; 
}

type Step = 'personal-info' | 'photo-capture' | 'passport-scan' | 'travel-info' | 'documents' | 'payment' | 'review' | 'success';

interface EVisaProps {
  nationalityCode: string;
  destinationCode: string;
  onCancel: () => void;
}

const generateApplicationId = (nat: string, dest: string) => {
  return `app-${nat}-${dest}-${Date.now().toString().slice(-6)}`;
};

const EVisa: React.FC<EVisaProps> = ({ nationalityCode, destinationCode, onCancel }) => {
  const [applicationId] = useState(generateApplicationId(nationalityCode, destinationCode));
  const [currentStep, setCurrentStep] = useState<Step>('personal-info');
  const [application, setApplication] = useState<ApplicationState>(() => {
    const savedProgress = loadApplicationProgress(applicationId);
    if (savedProgress) {
      console.log("Resuming application:", applicationId);
      setCurrentStep(savedProgress.currentStep as Step || 'personal-info');
      return {
        ...savedProgress.applicationData,
        nationality: nationalityCode,
        destination: destinationCode,
        passportScan: null,
        photoId: null,
        additionalDocuments: [],
        photoSrc: savedProgress.applicationData.photoSrc || null,
        extractedPassportData: savedProgress.applicationData.extractedPassportData || null,
        passportFile: null
      };
    }
    console.log("Starting new application:", applicationId);
    return {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      phone: '',
      nationality: nationalityCode,
      passportNumber: '',
      passportIssueDate: '',
      passportExpiryDate: '',
      photoSrc: null,
      extractedPassportData: null,
      passportFile: null,
      destination: destinationCode,
      purpose: '',
      entryDate: '',
      exitDate: '',
      accommodation: '',
      passportScan: null,
      photoId: null,
      additionalDocuments: [],
      paymentMethod: '',
      cardholderName: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
      billingAddress: '',
      agreeToTerms: false,
      status: 'draft',
      applicationId: `EV-${Math.floor(Math.random() * 1000000)}`
    };
  });

  useEffect(() => {
    if (currentStep !== 'success') {
      saveApplicationProgress(applicationId, { currentStep, applicationData: application });
      console.log(`Progress saved for step: ${currentStep}`);
    }
  }, [application, currentStep, applicationId]);

  const nationalityCountry = ALL_COUNTRIES.find(c => c.code === nationalityCode);
  const destinationCountry = ALL_COUNTRIES.find(c => c.code === destinationCode);

  if (!nationalityCountry || !destinationCountry) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Country Selection</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Please go back and select valid countries for your visa application.
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-primary-600 text-white rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  const updateApplication = (data: Partial<ApplicationState>) => {
    setApplication((prev: ApplicationState) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    switch (currentStep) {
      case 'personal-info':
        setCurrentStep('photo-capture');
        break;
      case 'photo-capture':
        setCurrentStep('passport-scan');
        break;
      case 'passport-scan':
        setCurrentStep('travel-info');
        break;
      case 'travel-info':
        setCurrentStep('documents');
        break;
      case 'documents':
        setCurrentStep('payment');
        break;
      case 'payment':
        setCurrentStep('review');
        break;
      case 'review':
        submitApplication();
        break;
    }
  };

  const goToPrevStep = () => {
    switch (currentStep) {
      case 'review':
        setCurrentStep('payment');
        break;
      case 'payment':
        setCurrentStep('documents');
        break;
      case 'documents':
        setCurrentStep('travel-info');
        break;
      case 'travel-info':
        setCurrentStep('passport-scan');
        break;
      case 'passport-scan':
        setCurrentStep('photo-capture');
        break;
      case 'photo-capture':
        setCurrentStep('personal-info');
        break;
      case 'personal-info':
      case 'success':
      default:
        break;
    }
  };

  const handlePhotoCapture = (imageSrc: string) => {
    updateApplication({ photoSrc: imageSrc });
    goToNextStep();
  };

  const handlePassportScan = (extractedData: Partial<ExtractedPassportData>, file: File) => {
    const updates: Partial<ApplicationState> = {
      extractedPassportData: extractedData,
      passportFile: file,
    };

    if (!application.passportNumber && extractedData.passportNumber) updates.passportNumber = extractedData.passportNumber;
    if (!application.firstName && extractedData.firstName) updates.firstName = extractedData.firstName;
    if (!application.lastName && extractedData.lastName) updates.lastName = extractedData.lastName;
    if (!application.dateOfBirth && extractedData.dateOfBirth) updates.dateOfBirth = extractedData.dateOfBirth;
    if (!application.passportExpiryDate && extractedData.expiryDate) updates.passportExpiryDate = extractedData.expiryDate;
    if (!application.passportIssueDate && extractedData.issueDate) updates.passportIssueDate = extractedData.issueDate;

    updateApplication(updates);
    goToNextStep();
  };

  const submitApplication = () => {
    console.log("Submitting application:", application);
    clearApplicationProgress(applicationId);
    setCurrentStep('success');
  };

  const getProgressPercentage = () => {
    switch (currentStep) {
      case 'personal-info': return 10;
      case 'photo-capture': return 20;
      case 'passport-scan': return 30;
      case 'travel-info': return 40;
      case 'documents': return 50;
      case 'payment': return 70;
      case 'review': return 90;
      case 'success': return 100;
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <EVisaHeader 
        nationalityCode={nationalityCode} 
        destinationCode={destinationCode} 
        applicationId={applicationId}
      />
      
      {currentStep !== 'success' && (
        <div className="mb-8">
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className={currentStep === 'personal-info' ? 'text-primary-600 font-medium' : ''}>Personal Info</span>
            <span className={currentStep === 'photo-capture' ? 'text-primary-600 font-medium' : ''}>Photo Capture</span>
            <span className={currentStep === 'passport-scan' ? 'text-primary-600 font-medium' : ''}>Passport Scan</span>
            <span className={currentStep === 'travel-info' ? 'text-primary-600 font-medium' : ''}>Travel Details</span>
            <span className={currentStep === 'documents' ? 'text-primary-600 font-medium' : ''}>Documents</span>
            <span className={currentStep === 'payment' ? 'text-primary-600 font-medium' : ''}>Payment</span>
            <span className={currentStep === 'review' ? 'text-primary-600 font-medium' : ''}>Review</span>
          </div>
        </div>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 'personal-info' && (
            <PersonalInfoForm 
              data={application} 
              onUpdate={updateApplication} 
              onNext={goToNextStep}
              onCancel={onCancel}
            />
          )}
          
          {currentStep === 'photo-capture' && (
            <PhotoCapture 
              onCapture={handlePhotoCapture} 
              onBack={goToPrevStep} 
              initialImage={application.photoSrc}
            />
          )}
          
          {currentStep === 'passport-scan' && (
            <PassportScan 
              onScanComplete={handlePassportScan} 
              onBack={goToPrevStep} 
              initialFile={application.passportFile} 
              initialData={application.extractedPassportData}
            />
          )}
          
          {currentStep === 'travel-info' && (
            <TravelInfoForm 
              data={application} 
              onUpdate={updateApplication} 
              onNext={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {currentStep === 'documents' && (
            <DocumentUploadForm 
              data={application} 
              onUpdate={updateApplication} 
              onNext={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {currentStep === 'payment' && (
            <PaymentForm 
              data={application} 
              onUpdate={updateApplication} 
              onNext={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {currentStep === 'review' && (
            <EVisaReview 
              data={application} 
              onSubmit={goToNextStep}
              onBack={goToPrevStep}
            />
          )}
          
          {currentStep === 'success' && (
            <EVisaSuccess 
              data={application} 
              onFinish={onCancel}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EVisa;