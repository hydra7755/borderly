import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EVisa from '../components/EVisa/EVisa';

interface EVisaApplicationProps {
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

const EVisaApplication: React.FC<EVisaApplicationProps> = ({ isLoggedIn, onLoginRequired }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [nationalityCode, setNationalityCode] = useState<string>('');
  const [destinationCode, setDestinationCode] = useState<string>('');
  
  useEffect(() => {
    // Parse URL parameters if they exist
    const searchParams = new URLSearchParams(location.search);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (from && to) {
      setNationalityCode(from);
      setDestinationCode(to);
    } else {
      // If no parameters, we could either redirect or show a selection form
      navigate('/visa-checker');
    }
  }, [location.search, navigate]);
  
  // If user is not logged in, prompt for login
  useEffect(() => {
    if (!isLoggedIn) {
      onLoginRequired();
    }
  }, [isLoggedIn, onLoginRequired]);
  
  if (!isLoggedIn) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to continue with your eVisa application.</p>
          <button 
            onClick={onLoginRequired}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }
  
  // If we don't have the required codes, don't render the eVisa component
  if (!nationalityCode || !destinationCode) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading eVisa Application</h2>
          <p className="text-gray-600">Please wait while we prepare your application...</p>
        </div>
      </div>
    );
  }
  
  return (
    <EVisa
      nationalityCode={nationalityCode}
      destinationCode={destinationCode}
      onCancel={() => navigate('/visa-checker')}
    />
  );
};

export default EVisaApplication; 