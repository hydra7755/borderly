import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * This component handles redirecting from the query parameter format (/evisa?from=XX&to=YY)
 * to the path parameter format (/apply/XX/YY) expected by the EVisaApplication component.
 */
const EVisaRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Parse query parameters
    const searchParams = new URLSearchParams(location.search);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    if (from && to) {
      // Redirect to the path parameter format
      console.log(`Redirecting from query params to path params: /apply/${from}/${to}`);
      navigate(`/apply/${from}/${to}`, { replace: true });
    } else {
      // If parameters are missing, redirect to home
      console.error('Missing from or to parameters in URL');
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);
  
  // Show a loading message while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Preparing your visa application...</p>
      </div>
    </div>
  );
};

export default EVisaRedirect;
