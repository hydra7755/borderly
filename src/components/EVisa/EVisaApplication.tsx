import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PassportScan, { ExtractedPassportData } from './PassportScan';
import VisaApplicationForm, { VisaApplicationData } from './VisaApplicationForm';
import ApplicationReview from './ApplicationReview';

interface EVisaApplicationProps {
  userEmail?: string;
  nationalityCode: string;
  destinationCode: string;
  applicationId: string;
  onComplete?: () => void;
  onViewApplications?: () => void;
}

type ApplicationStep = 'passport' | 'form' | 'review';

const EVisaApplication: React.FC<EVisaApplicationProps> = ({ 
  userEmail = '', 
  nationalityCode,
  destinationCode,
  applicationId,
  onComplete, 
  onViewApplications 
}) => {
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('passport');
  const [passportData, setPassportData] = useState<Partial<ExtractedPassportData> | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [applicationData, setApplicationData] = useState<VisaApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle passport scan completion
  const handlePassportScanComplete = (data: Partial<ExtractedPassportData>, file: File) => {
    setPassportData(data);
    setPassportFile(file);
    setCurrentStep('form');
  };
  
  // Handle application form submission
  const handleApplicationSubmit = (data: VisaApplicationData) => {
    setIsLoading(true);
    
    // Simulate API call to submit application
    setTimeout(() => {
      setApplicationData(data);
      setCurrentStep('review');
      setIsLoading(false);
      
      // Send confirmation email (simulated)
      console.log(`Sending confirmation email to ${data.email}`);
      
      // In a real application, you would make an API call here to submit the application
      // and send a confirmation email to the user
    }, 1500);
  };
  
  // Handle completion of the application process
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };
  
  // Handle viewing all applications
  const handleViewApplications = () => {
    if (onViewApplications) {
      onViewApplications();
    } else {
      handleComplete();
    }
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'passport':
        return (
          <PassportScan 
            onScanComplete={handlePassportScanComplete}
            onBack={() => {
              // Navigate back to visa product page
              window.history.back();
            }}
          />
        );
      case 'form':
        if (passportData && passportFile) {
          return (
            <VisaApplicationForm
              passportData={passportData}
              passportFile={passportFile}
              onBack={() => setCurrentStep('passport')}
              onSubmit={handleApplicationSubmit}
              userEmail={userEmail}
              nationalityCode={nationalityCode}
              destinationCode={destinationCode}
              applicationId={applicationId}
            />
          );
        }
        return null;
      case 'review':
        if (applicationData) {
          return (
            <ApplicationReview
              applicationData={applicationData}
              onClose={handleComplete}
              onViewApplications={handleViewApplications}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };
  
  // Progress indicator
  const renderProgressBar = () => {
    const steps = [
      { id: 'passport', label: 'Passport Scan' },
      { id: 'form', label: 'Application Form' },
      { id: 'review', label: 'Review & Submit' }
    ];
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep === step.id 
                      ? 'border-primary-600 bg-primary-100 text-primary-600' 
                      : steps.indexOf({ id: currentStep } as any) > index 
                        ? 'border-green-600 bg-green-100 text-green-600' 
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {steps.indexOf({ id: currentStep } as any) > index ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`mt-2 text-sm ${
                  currentStep === step.id 
                    ? 'text-primary-600 font-medium' 
                    : steps.indexOf({ id: currentStep } as any) > index 
                      ? 'text-green-600' 
                      : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {/* Connector Line (except after last step) */}
              {index < steps.length - 1 && (
                <div 
                  className={`flex-1 h-0.5 mx-4 ${
                    steps.indexOf({ id: currentStep } as any) > index 
                      ? 'bg-green-600' 
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        eVisa Application
      </h1>
      
      {/* Progress Bar */}
      {renderProgressBar()}
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-md w-full">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Processing Your Application</h3>
              <p className="text-gray-500 dark:text-gray-300 text-center">
                Please wait while we process your visa application...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EVisaApplication;
