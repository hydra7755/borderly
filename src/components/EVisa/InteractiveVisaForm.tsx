// src/components/EVisa/InteractiveVisaForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCapture from './PhotoCapture';
import PassportScan from './PassportScan';
import { saveApplicationProgress, loadApplicationProgress, clearApplicationProgress } from '../../utils/localStorageHelper';
import EVisaHeader from './EVisaHeader';
import EVisaSuccess from './EVisaSuccess'; // Assuming we still use a success screen
import { ArrowUpIcon, ArrowDownIcon, CheckIcon } from '@heroicons/react/24/outline';

// --- Define Question Types ---
interface BaseQuestion {
  id: string; // Unique ID for the question (maps to state key)
  type: 'photo' | 'passport' | 'text' | 'date' | 'select' | 'email' | 'phone' | 'review' | 'success';
  prompt: string; // The question text
  description?: string; // Optional helper text
}

interface TextQuestion extends BaseQuestion {
  type: 'text' | 'email' | 'phone';
  placeholder?: string;
  validation?: (value: string) => string | null; // Returns error message or null
}

interface DateQuestion extends BaseQuestion {
  type: 'date';
  validation?: (value: string) => string | null;
}

interface SelectQuestion extends BaseQuestion {
  type: 'select';
  options: { value: string; label: string }[];
  validation?: (value: string) => string | null;
}

interface PhotoQuestion extends BaseQuestion {
  type: 'photo';
}

interface PassportQuestion extends BaseQuestion {
  type: 'passport';
}

interface ReviewQuestion extends BaseQuestion {
  type: 'review';
}

interface SuccessQuestion extends BaseQuestion {
  type: 'success';
}

type FormQuestion = TextQuestion | DateQuestion | SelectQuestion | PhotoQuestion | PassportQuestion | ReviewQuestion | SuccessQuestion;

// --- Define the Application State Structure ---
// This will hold the answers, keyed by question ID
interface ApplicationData {
  [key: string]: any; // Allows storing various answer types
  // We can add specific known keys for better type safety if needed
  photoSrc?: string | null;
  passportFile?: File | null;
  extractedPassportData?: any | null;
}

// --- Define Component Props ---
interface InteractiveVisaFormProps {
  nationalityCode: string;
  destinationCode: string;
  onCancel: () => void;
}

// --- Helper to generate a unique ID ---
const generateAppId = (nat: string, dest: string) => `interactive-app-${nat}-${dest}-${Date.now().toString().slice(-6)}`;

// --- The Main Interactive Form Component ---
const InteractiveVisaForm: React.FC<InteractiveVisaFormProps> = ({ nationalityCode, destinationCode, onCancel }) => {
  const [applicationId] = useState(generateAppId(nationalityCode, destinationCode));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // To prevent rendering until loaded

  // --- Define the sequence of questions ---
  // We'll start with KYC and add more based on PersonalInfoForm fields
  const questions: FormQuestion[] = [
    {
      id: 'photoCapture',
      type: 'photo',
      prompt: 'Take Your Photo',
      description: 'Please look directly at the camera. Ensure good lighting and a clear background.',
    },
    {
      id: 'passportScan',
      type: 'passport',
      prompt: 'Scan Your Passport',
      description: 'Upload a clear photo or scan of your passport\'s main information page. We\'ll try to extract the details.',
    },
    // Add other questions based on PersonalInfoForm, TravelInfoForm etc.
    {
      id: 'firstName',
      type: 'text',
      prompt: 'What is your first name?',
      placeholder: 'Enter first name as it appears on your passport',
      validation: (val) => val.trim() ? null : 'First name is required'
    },
    {
      id: 'lastName',
      type: 'text',
      prompt: 'What is your last name?',
      placeholder: 'Enter last name as it appears on your passport',
      validation: (val) => val.trim() ? null : 'Last name is required'
    },
    {
      id: 'dateOfBirth',
      type: 'date',
      prompt: 'What is your date of birth?',
      validation: (val) => val ? null : 'Date of birth is required'
    },
    {
      id: 'email',
      type: 'email',
      prompt: 'What is your email address?',
      placeholder: 'you@example.com',
      validation: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Enter a valid email'
    },
    // ... Add more questions for gender, phone, passport details (if not fully scanned), travel info, etc.
    {
      id: 'review',
      type: 'review',
      prompt: 'Review Your Application',
      description: 'Please check all your details carefully before submitting.'
    },
    {
      id: 'success',
      type: 'success',
      prompt: 'Application Submitted!',
      description: 'Your application has been received. You will receive updates via email.'
    }
  ];

  // --- Load Progress on Mount ---
  useEffect(() => {
    const saved = loadApplicationProgress(applicationId);
    if (saved) {
      setApplicationData(saved.applicationData || {});
      // Ensure index is valid
      const savedIndex = questions.findIndex(q => q.id === saved.currentStep); // Use currentStep
      setCurrentQuestionIndex(savedIndex >= 0 ? savedIndex : 0);
      console.log("Resuming interactive form at step:", saved.currentStep); // Use currentStep
    } else {
      // Pre-fill nationality and destination if starting new
      setApplicationData({
        nationality: nationalityCode,
        destination: destinationCode
      });
    }
    setIsLoaded(true); // Allow rendering now
  }, [applicationId, nationalityCode, destinationCode]); // Added dependencies

  // --- Save Progress on Change ---
  useEffect(() => {
    if (!isLoaded) return; // Don't save before initial load
    const currentQuestionId = questions[currentQuestionIndex]?.id;
    if (currentQuestionId && currentQuestionId !== 'success') {
      saveApplicationProgress(applicationId, { currentStep: currentQuestionId, applicationData }); // Use currentStep
      // console.log(`Interactive form progress saved at step: ${currentQuestionId}`);
    }
  }, [applicationData, currentQuestionIndex, applicationId, isLoaded]);

  // --- Handle Answer Updates ---
  const handleUpdate = useCallback((questionId: string, value: any) => {
    setApplicationData(prev => ({ ...prev, [questionId]: value }));
    setFormError(null); // Clear errors on update
  }, []);

  // --- Navigation Logic ---
  const goToNextQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentValue = applicationData[currentQuestion.id];
    let error: string | null = null;

    // Perform validation if defined for the current question type
    if ('validation' in currentQuestion && currentQuestion.validation) {
      error = currentQuestion.validation(currentValue || '');
    }
    // Specific validation for required steps like photo/passport if needed
    // (though completion handlers mostly cover this)
    if (currentQuestion.type === 'photo' && !applicationData.photoSrc) {
      error = "Please capture your photo before proceeding.";
    }
    if (currentQuestion.type === 'passport' && !applicationData.passportFile) {
      error = "Please upload and confirm your passport scan.";
    }

    if (error) {
      setFormError(error);
      return;
    }

    setFormError(null);
    if (currentQuestionIndex < questions.length - 1) {
      // Special action for review step
      if (currentQuestion.type === 'review') {
        handleSubmit();
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setFormError(null);
    }
  };

  // --- Handle Special Step Completions (Photo/Passport) ---
  const handlePhotoComplete = useCallback((imageSrc: string) => {
    console.log("handlePhotoComplete called with image data", imageSrc.substring(0, 50) + "...");
    try {
      handleUpdate('photoCapture', imageSrc); // Save the data URL
      setApplicationData(prev => ({ ...prev, photoSrc: imageSrc })); // Also save in dedicated field
      console.log("Photo data saved successfully, proceeding to next question");
      goToNextQuestion();
    } catch (error) {
      console.error("Error processing photo data:", error);
      setFormError("There was an error processing your photo. Please try again.");
    }
  }, [handleUpdate, goToNextQuestion]);

  const handlePassportComplete = useCallback((extractedData: any, file: File) => {
    // Basic check: Does extracted data contain expected passport fields?
    const seemsLikePassport = extractedData && extractedData.passportNumber && extractedData.expiryDate;

    if (!seemsLikePassport) {
      setFormError("The document uploaded doesn't appear to be a valid passport scan. Please upload the main page of your passport.");
      // Optionally clear the bad data?
      // handleUpdate('passportScan', null);
      // setApplicationData(prev => ({ ...prev, passportFile: null, extractedPassportData: null }));
      return; // Stay on this step
    }

    setFormError(null);
    handleUpdate('passportScan', { fileName: file.name, size: file.size }); // Store file metadata
    setApplicationData(prev => ({
      ...prev,
      passportFile: file, // Store the actual file (be careful with state size)
      extractedPassportData: extractedData
    }));
    // Auto-fill other fields from extracted data if they aren't already set
    setApplicationData(prev => ({
      ...prev,
      firstName: prev.firstName || extractedData.firstName || '',
      lastName: prev.lastName || extractedData.lastName || '',
      dateOfBirth: prev.dateOfBirth || extractedData.dateOfBirth || '',
      passportNumber: prev.passportNumber || extractedData.passportNumber || '',
      passportIssueDate: prev.passportIssueDate || extractedData.issueDate || '',
      passportExpiryDate: prev.passportExpiryDate || extractedData.expiryDate || '',
      // Consider nationality carefully - might differ
    }));
    goToNextQuestion();
  }, [handleUpdate]);

  const handleSubmit = () => {
    console.log("Submitting Application:", applicationData);
    // --- TODO: Send to backend API ---
    clearApplicationProgress(applicationId);
    // Navigate to success step (which should be the last one)
    const successIndex = questions.findIndex(q => q.type === 'success');
    setCurrentQuestionIndex(successIndex >= 0 ? successIndex : questions.length - 1);
  };

  // --- Render the Current Question ---
  const renderQuestion = (question: FormQuestion) => {
    const commonProps = {
      key: question.id,
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -30 },
      transition: { duration: 0.4 },
      className: "w-full"
    };
    const value = applicationData[question.id] || '';

    switch (question.type) {
      case 'photo':
        return (
          <motion.div {...commonProps}>
            <PhotoCapture
              onCapture={handlePhotoComplete}
              onBack={goToPrevQuestion} // Back won't work on the first question
              initialImage={applicationData.photoSrc}
            />
          </motion.div>
        );
      case 'passport':
        return (
          <motion.div {...commonProps}>
            <PassportScan
              onScanComplete={handlePassportComplete}
              onBack={goToPrevQuestion}
              initialFile={applicationData.passportFile} // Need careful handling
              initialData={applicationData.extractedPassportData}
            />
            {/* Display validation error specific to passport scan */}
            {formError && question.id === 'passportScan' && (
              <p className="mt-2 text-sm text-red-600 text-center">{formError}</p>
            )}
          </motion.div>
        );
      case 'text':
      case 'email':
      case 'phone':
        return (
          <motion.div {...commonProps} className="w-full max-w-lg mx-auto">
            <label htmlFor={question.id} className="block text-lg font-medium text-gray-800 dark:text-gray-100 mb-3 text-center">{question.prompt}</label>
            {question.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">{question.description}</p>}
            <input
              id={question.id}
              type={question.type === 'email' ? 'email' : question.type === 'phone' ? 'tel' : 'text'}
              value={value}
              onChange={(e) => handleUpdate(question.id, e.target.value)}
              placeholder={question.placeholder || ''}
              className={`mt-1 block w-full px-4 py-3 border ${formError && ('validation' in question && question.validation && question.validation(value)) ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
              onKeyDown={(e) => { if (e.key === 'Enter') goToNextQuestion(); }}
              autoFocus
            />
            {formError && ('validation' in question && question.validation && question.validation(value)) && (
              <p className="mt-2 text-sm text-red-600">{formError}</p>
            )}
          </motion.div>
        );
      case 'date':
        return (
          <motion.div {...commonProps} className="w-full max-w-lg mx-auto">
            <label htmlFor={question.id} className="block text-lg font-medium text-gray-800 dark:text-gray-100 mb-3 text-center">{question.prompt}</label>
            {question.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">{question.description}</p>}
            <input
              id={question.id}
              type="date"
              value={value}
              onChange={(e) => handleUpdate(question.id, e.target.value)}
              className={`mt-1 block w-full px-4 py-3 border ${formError && ('validation' in question && question.validation && question.validation(value)) ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              onKeyDown={(e) => { if (e.key === 'Enter') goToNextQuestion(); }}
              autoFocus
            />
            {formError && ('validation' in question && question.validation && question.validation(value)) && (
              <p className="mt-2 text-sm text-red-600">{formError}</p>
            )}
          </motion.div>
        );
      case 'select':
        // Render select input
        return <motion.div {...commonProps}> {/* Placeholder */} </motion.div>;
      case 'review':
        // Render review section summarizing applicationData
        return (
          <motion.div {...commonProps} className="w-full max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-4">{question.prompt}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">{question.description}</p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md shadow space-y-2">
              {Object.entries(applicationData)
                .filter(([key]) => !['passportFile', 'extractedPassportData', 'photoSrc'].includes(key)) // Filter out complex objects for simple review
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-200 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-gray-900 dark:text-white break-all">{typeof val === 'object' ? JSON.stringify(val) : String(val) || '-'}</span>
                  </div>
                ))}
              {/* Optionally add previews for photo/passport */}
              {applicationData.photoSrc && <img src={applicationData.photoSrc} alt="User Photo Preview" className="mt-4 max-h-32 rounded mx-auto" />}
              {/* Passport preview? Difficult without storing preview URL */}
            </div>
          </motion.div>
        );
      case 'success':
        return (
          <motion.div {...commonProps}>
            <EVisaSuccess
              // Construct the data prop as expected by EVisaSuccess
              data={{
                applicationId: applicationId, // Use state variable
                email: applicationData.email || '',
                firstName: applicationData.firstName || '',
                lastName: applicationData.lastName || '',
                status: 'Submitted', // Assuming status is submitted here
                // Add any other fields EVisaSuccess might expect from applicationData
              }}
              onFinish={onCancel} // Use onCancel as the finish handler
            />
          </motion.div>
        );

      default:
        return <motion.div {...commonProps}>Unsupported question type</motion.div>;
    }
  };

  if (!isLoaded) {
    // Optional: Add a loading indicator
    return <div className="p-10 text-center">Loading application...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = (currentQuestionIndex / (questions.length - 2)) * 100; // Exclude review/success from progress calc

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <EVisaHeader
        nationalityCode={nationalityCode}
        destinationCode={destinationCode}
        applicationId={applicationId}
        // Removed onCancel prop as it's not accepted
      />

      {/* Progress Bar */}
      {currentQuestion.type !== 'success' && (
        <div className="my-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
            <motion.div
              className="bg-primary-600 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }} // Ensure it doesn't exceed 100
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Optional: Step name indicator can be added here */}
        </div>
      )}

      <div className="flex-grow flex flex-col items-center justify-center relative w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {renderQuestion(currentQuestion)}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      {currentQuestion.type !== 'success' && (
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-4 w-full max-w-lg mx-auto">
          {/* Display general formError only if not specific to passport scan which is handled separately */}
          {formError && currentQuestion.type !== 'passport' && (
            <p className="text-sm text-red-600 flex-grow text-left">{formError}</p>
          )}
          {currentQuestionIndex > 0 && currentQuestion.type !== 'review' && ( // Show back unless on first step or review
            <button
              onClick={goToPrevQuestion}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Previous Question"
            >
              <ArrowUpIcon className="h-6 w-6" />
            </button>
          )}
          <button
            onClick={goToNextQuestion}
            disabled={false} // Add disabled logic based on validation if needed
            className={`px-6 py-2 rounded-md text-white font-semibold flex items-center space-x-2 transition-colors ${formError ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            <span>{currentQuestion.type === 'review' ? 'Submit Application' : 'OK'}</span>
            <CheckIcon className="h-5 w-5" />
          </button>
          {/* Optional: Down arrow for scrolling or alternative nav */}
          {/* <button onClick={goToNextQuestion} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors" aria-label="Next Question"><ArrowDownIcon className="h-6 w-6"/></button> */}
        </div>
      )}
    </div>
  );
};

export default InteractiveVisaForm;
