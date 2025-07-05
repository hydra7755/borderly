import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaPassport, FaUser, FaCalendarAlt, FaGlobe, FaCamera, FaUpload } from 'react-icons/fa';
import { supabase } from '../../lib/supabase/client';
import { ALL_COUNTRIES } from '../../utils/countries';

interface VisaApplicationFormProps {
  nationality: string;
  destination: string;
  onComplete?: (applicationId: string) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiryDate: string;
  email: string;
  phoneNumber: string;
  travelDate: string;
  travelPurpose: string;
  stayDuration: number;
  passportScan?: File;
  photoScan?: File;
}

const VisaApplicationForm: React.FC<VisaApplicationFormProps> = ({ 
  nationality, 
  destination,
  onComplete 
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    passportNumber: '',
    passportExpiryDate: '',
    email: '',
    phoneNumber: '',
    travelDate: '',
    travelPurpose: 'tourism',
    stayDuration: 30,
  });

  const nationalityName = ALL_COUNTRIES.find(c => c.code === nationality)?.name || nationality;
  const destinationName = ALL_COUNTRIES.find(c => c.code === destination)?.name || destination;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'passportScan' | 'photoScan') => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: e.target.files![0]
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    
    switch (step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
          setError('Please fill in all personal details');
          return false;
        }
        break;
      case 2:
        if (!formData.passportNumber || !formData.passportExpiryDate) {
          setError('Please fill in all passport details');
          return false;
        }
        
        // Check passport expiry date is in the future and at least 6 months from now
        const expiryDate = new Date(formData.passportExpiryDate);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        
        if (expiryDate <= sixMonthsFromNow) {
          setError('Passport must be valid for at least 6 months from today');
          return false;
        }
        break;
      case 3:
        if (!formData.email || !formData.phoneNumber) {
          setError('Please fill in all contact details');
          return false;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        break;
      case 4:
        if (!formData.travelDate || !formData.travelPurpose) {
          setError('Please fill in all travel details');
          return false;
        }
        
        // Check travel date is in the future
        const travelDate = new Date(formData.travelDate);
        const today = new Date();
        
        if (travelDate <= today) {
          setError('Travel date must be in the future');
          return false;
        }
        break;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create application record in Supabase
      const { data, error } = await supabase
        .from('visa_applications')
        .insert([
          {
            nationality,
            destination,
            first_name: formData.firstName,
            last_name: formData.lastName,
            date_of_birth: formData.dateOfBirth,
            passport_number: formData.passportNumber,
            passport_expiry_date: formData.passportExpiryDate,
            email: formData.email,
            phone_number: formData.phoneNumber,
            travel_date: formData.travelDate,
            travel_purpose: formData.travelPurpose,
            stay_duration: formData.stayDuration,
            status: 'pending',
            payment_status: 'pending'
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      const newApplicationId = data[0].id;
      setApplicationId(newApplicationId);
      
      // Upload passport scan if provided
      if (formData.passportScan) {
        const passportFileName = `${newApplicationId}/passport.${formData.passportScan.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('visa_documents')
          .upload(passportFileName, formData.passportScan);
          
        if (uploadError) {
          console.error('Error uploading passport scan:', uploadError);
        }
      }
      
      // Upload photo scan if provided
      if (formData.photoScan) {
        const photoFileName = `${newApplicationId}/photo.${formData.photoScan.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('visa_documents')
          .upload(photoFileName, formData.photoScan);
          
        if (uploadError) {
          console.error('Error uploading photo scan:', uploadError);
        }
      }
      
      setSuccess(true);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(newApplicationId);
      }
      
      // Navigate to payment page
      setTimeout(() => {
        navigate(`/payment/${newApplicationId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting visa application:', error);
      setError('An error occurred while submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Passport Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Passport Expiry Date</label>
                <input
                  type="date"
                  name="passportExpiryDate"
                  value={formData.passportExpiryDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Passport Scan (Optional)</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'passportScan')}
                    className="hidden"
                    id="passportScan"
                  />
                  <label
                    htmlFor="passportScan"
                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FaUpload className="inline mr-2" /> Upload Passport Scan
                  </label>
                  {formData.passportScan && (
                    <span className="ml-3 text-sm text-gray-500">
                      {formData.passportScan.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a clear scan or photo of your passport's information page
                </p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Photo (Optional)</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'photoScan')}
                    className="hidden"
                    id="photoScan"
                  />
                  <label
                    htmlFor="photoScan"
                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FaCamera className="inline mr-2" /> Upload Photo
                  </label>
                  {formData.photoScan && (
                    <span className="ml-3 text-sm text-gray-500">
                      {formData.photoScan.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a recent passport-style photo with white background
                </p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Travel Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Travel Date</label>
                <input
                  type="date"
                  name="travelDate"
                  value={formData.travelDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose of Travel</label>
                <select
                  name="travelPurpose"
                  value={formData.travelPurpose}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="tourism">Tourism</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="medical">Medical</option>
                  <option value="visiting_family">Visiting Family</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Stay Duration (days)</label>
                <input
                  type="number"
                  name="stayDuration"
                  value={formData.stayDuration}
                  onChange={handleInputChange}
                  min={1}
                  max={180}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Review & Submit</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-2">Application Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{nationalityName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium">{destinationName}</p>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium flex items-center"><FaUser className="mr-2" /> Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p>{formData.firstName} {formData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p>{formData.dateOfBirth}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium flex items-center"><FaPassport className="mr-2" /> Passport Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Passport Number</p>
                    <p>{formData.passportNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passport Expiry Date</p>
                    <p>{formData.passportExpiryDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Passport Scan</p>
                    <p>{formData.passportScan ? formData.passportScan.name : 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium flex items-center"><FaGlobe className="mr-2" /> Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p>{formData.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Photo</p>
                    <p>{formData.photoScan ? formData.photoScan.name : 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium flex items-center"><FaCalendarAlt className="mr-2" /> Travel Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-500">Travel Date</p>
                    <p>{formData.travelDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Purpose of Travel</p>
                    <p className="capitalize">{formData.travelPurpose.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stay Duration</p>
                    <p>{formData.stayDuration} days</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-gray-500">
                  By submitting this application, you confirm that all information provided is accurate and complete.
                  After submission, you will be directed to the payment page to complete your application.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Application Submitted Successfully!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your visa application has been submitted. You will be redirected to the payment page shortly.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Application ID: {applicationId}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          eVisa Application for {destinationName}
        </h1>
        <p className="text-gray-600">
          Please complete all steps to submit your visa application
        </p>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-1">
          {[1, 2, 3, 4, 5].map(step => (
            <div 
              key={step} 
              className={`flex flex-col items-center ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  currentStep > step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : currentStep === step 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-gray-300 text-gray-400'
                }`}
              >
                {currentStep > step ? '✓' : step}
              </div>
              <span className="text-xs mt-1 hidden sm:block">
                {step === 1 ? 'Personal' : 
                 step === 2 ? 'Passport' : 
                 step === 3 ? 'Contact' : 
                 step === 4 ? 'Travel' : 'Review'}
              </span>
            </div>
          ))}
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
            style={{ width: `${(currentStep - 1) * 25}%` }}
          ></div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Form Steps */}
      <form onSubmit={handleSubmit}>
        {renderStep()}
        
        <div className="mt-8 flex justify-between">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default VisaApplicationForm;
