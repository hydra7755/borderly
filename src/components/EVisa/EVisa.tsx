import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_COUNTRIES, getFlagUrl } from '../../utils/countries';
import PersonalInfoForm from './PersonalInfoForm';
import TravelInfoForm from './TravelInfoForm';
import DocumentUploadForm from './DocumentUploadForm';
import PaymentForm from './PaymentForm';
import EVisaReview from './EVisaReview';
import EVisaSuccess from './EVisaSuccess';
import EVisaHeader from './EVisaHeader';

// Define step types
type Step = 'personal-info' | 'travel-info' | 'documents' | 'payment' | 'review' | 'success';

interface EVisaProps {
  nationalityCode: string;
  destinationCode: string;
  onCancel: () => void;
}

const EVisa: React.FC<EVisaProps> = ({ nationalityCode, destinationCode, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<Step>('personal-info');
  const [application, setApplication] = useState({
    // Personal Info
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
    
    // Travel Info
    destination: destinationCode,
    purpose: '',
    entryDate: '',
    exitDate: '',
    accommodation: '',
    
    // Documents
    passportScan: null as File | null,
    photoId: null as File | null,
    additionalDocuments: [] as File[],
    
    // Payment
    paymentMethod: '',
    cardholderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    billingAddress: '',
    agreeToTerms: false,
    
    // Status
    status: 'draft',
    applicationId: `EV-${Math.floor(Math.random() * 1000000)}`
  });

  // Get nationality and destination country details
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

  // Update application data
  const updateApplication = (data: Partial<typeof application>) => {
    setApplication(prev => ({ ...prev, ...data }));
  };

  // Handle next step
  const goToNextStep = () => {
    switch (currentStep) {
      case 'personal-info':
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
        // Submit the application
        console.log('Submitting application:', application);
        setApplication(prev => ({ ...prev, status: 'submitted' }));
        setCurrentStep('success');
        break;
    }
  };

  // Handle previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'travel-info':
        setCurrentStep('personal-info');
        break;
      case 'documents':
        setCurrentStep('travel-info');
        break;
      case 'payment':
        setCurrentStep('documents');
        break;
      case 'review':
        setCurrentStep('payment');
        break;
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    switch (currentStep) {
      case 'personal-info': return 20;
      case 'travel-info': return 40;
      case 'documents': return 60;
      case 'payment': return 80;
      case 'review': return 95;
      case 'success': return 100;
    }
  };

  // Page transitions
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header with countries */}
      <EVisaHeader 
        nationalityCode={nationalityCode} 
        destinationCode={destinationCode} 
        applicationId={application.applicationId}
      />
      
      {/* Progress bar */}
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
            <span className={currentStep === 'travel-info' ? 'text-primary-600 font-medium' : ''}>Travel Details</span>
            <span className={currentStep === 'documents' ? 'text-primary-600 font-medium' : ''}>Documents</span>
            <span className={currentStep === 'payment' ? 'text-primary-600 font-medium' : ''}>Payment</span>
            <span className={currentStep === 'review' ? 'text-primary-600 font-medium' : ''}>Review</span>
          </div>
        </div>
      )}
      
      {/* Form Content */}
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
          
          {currentStep === 'travel-info' && (
            <TravelInfoForm 
              data={application} 
              onUpdate={updateApplication} 
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          
          {currentStep === 'documents' && (
            <DocumentUploadForm 
              data={application} 
              onUpdate={updateApplication} 
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          
          {currentStep === 'payment' && (
            <PaymentForm 
              data={application} 
              onUpdate={updateApplication} 
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          
          {currentStep === 'review' && (
            <EVisaReview 
              data={application} 
              onSubmit={goToNextStep}
              onBack={goToPreviousStep}
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