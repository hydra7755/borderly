import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ALL_COUNTRIES } from '../utils/countries'; 
import InteractiveVisaForm from '../components/EVisa/InteractiveVisaForm'; 
// import LoadingSpinner from '../components/Common/LoadingSpinner'; 
// import NotFoundPage from './NotFoundPage'; 

interface EVisaApplicationProps { 
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

const EVisaApplication: React.FC<EVisaApplicationProps> = ({ isLoggedIn, onLoginRequired }) => {
  const { nationalityCode = '', destinationCode = '' } = useParams<{ nationalityCode: string, destinationCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isValid, setIsValid] = useState<boolean | null>(null); 

  useEffect(() => {
    if (!nationalityCode || !destinationCode) {
      setIsValid(false); 
      return;
    }
    if (ALL_COUNTRIES && ALL_COUNTRIES.length > 0) {
      // Make comparison case-insensitive by converting both sides to uppercase
      const isNationalityValid = ALL_COUNTRIES.some((c: { code: string }) => c.code.toUpperCase() === nationalityCode.toUpperCase());
      const isDestinationValid = ALL_COUNTRIES.some((c: { code: string }) => c.code.toUpperCase() === destinationCode.toUpperCase());
      setIsValid(isNationalityValid && isDestinationValid);
    } else {
      console.warn("Country data not available for validation.");
      setIsValid(false); 
    }
  }, [nationalityCode, destinationCode]);

  const handleCancel = () => {
    console.log('Application cancelled');
    navigate(-1); 
  };

  if (isValid === null) {
    return <div className="p-10 text-center">Verifying application details...</div>; 
  }

  if (!isValid) {
    return (
      <div className="p-10 text-center text-red-600">
        Invalid or missing country selection provided for the e-visa application.
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded">Go Home</button>
      </div>
    ); 
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 min-h-screen">
      <InteractiveVisaForm
        nationalityCode={nationalityCode.toUpperCase()}
        destinationCode={destinationCode.toUpperCase()}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EVisaApplication;