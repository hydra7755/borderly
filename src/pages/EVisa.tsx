import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import VisaApplicationStepper from '../components/EVisa/VisaApplicationStepper';
import EVisaHeader from '../components/EVisa/EVisaHeader';

const EVisa: React.FC = () => {
  const { nationality, destination } = useParams<{ nationality: string; destination: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [applicationId] = useState(() => `evisa-${nationality}-${destination}-${Date.now()}`);

  // Validate params
  useEffect(() => {
    if (!nationality || !destination) {
      navigate('/visa-checker');
    }
  }, [nationality, destination, navigate]);

  if (!nationality || !destination) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleApplicationComplete = (travelers: any[]) => {
    console.log('Application completed with travelers:', travelers);
    navigate('/dashboard');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
        >
          {/* Header with flags and application ID */}
          <EVisaHeader 
            nationalityCode={nationality} 
            destinationCode={destination}
            applicationId={applicationId}
          />

          {/* Main application component */}
          <div className="p-6">
            <VisaApplicationStepper 
              onComplete={handleApplicationComplete}
              destinationCode={destination}
              nationalityCode={nationality}
              searchParams={location.search}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EVisa;
