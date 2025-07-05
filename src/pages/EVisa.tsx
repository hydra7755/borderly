import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import EVisaApplication from '../components/EVisa/EVisaApplication';
import EVisaHeader from '../components/EVisa/EVisaHeader';
import { useAuth } from '../contexts/AuthContext';
import { ALL_COUNTRIES } from '../utils/countries';

const EVisa: React.FC = () => {
  const { nationality, destination } = useParams<{ nationality: string; destination: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [applicationId, setApplicationId] = useState<string>('');

  useEffect(() => {
    // Generate a unique application ID
    const generateApplicationId = () => {
      const timestamp = new Date().getTime().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      return `app-${nationality?.substring(0, 2)}-${destination?.substring(0, 2)}-${random}${timestamp.substring(timestamp.length - 4)}`;
    };

    if (nationality && destination) {
      setApplicationId(generateApplicationId());
    }
  }, [nationality, destination]);

  // Validate country codes
  useEffect(() => {
    if (!loading) {
      // Check if nationality and destination are valid
      const isValidNationality = ALL_COUNTRIES.some(c => c.code.toLowerCase() === nationality?.toLowerCase());
      const isValidDestination = ALL_COUNTRIES.some(c => c.code.toLowerCase() === destination?.toLowerCase());

      if (!nationality || !destination || !isValidNationality || !isValidDestination) {
        // Redirect to visa checker if parameters are invalid
        navigate('/visa-checker');
      }
    }
  }, [nationality, destination, loading, navigate]);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { state: { redirect: `/evisa/${nationality}/${destination}` } });
    }
  }, [user, loading, navigate, nationality, destination]);

  if (loading || !nationality || !destination) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            <EVisaApplication 
              userEmail={user?.email}
              nationalityCode={nationality}
              destinationCode={destination}
              applicationId={applicationId}
              onComplete={() => navigate('/dashboard')}
              onViewApplications={() => navigate('/applications')}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EVisa;
