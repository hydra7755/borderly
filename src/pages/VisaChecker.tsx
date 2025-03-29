import React from 'react';
import { useNavigate } from 'react-router-dom';
import SharedVisaChecker from '../components/VisaChecker'; // Corrected import path

// Define props expected by the page wrapper, if any (might need adjustment)
interface VisaCheckerPageProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void; // Optional: Pass down if needed by SharedVisaChecker
  onApplyEVisa?: (nationalityCode: string, destinationCode: string) => void; // Optional: Pass down if needed
}

const VisaCheckerPage: React.FC<VisaCheckerPageProps> = ({
  isLoggedIn,
  onLoginRequired,
  onApplyEVisa 
}) => {
  const navigate = useNavigate();

  // Example handlers if the SharedVisaChecker needs them passed from the page level
  const handleApplyEVisa = (nationalityCode: string, destinationCode: string) => {
    console.log('Apply eVisa initiated from VisaCheckerPage', { nationalityCode, destinationCode });
    // Potentially navigate to an eVisa application flow or call a prop function
    if (onApplyEVisa) {
      onApplyEVisa(nationalityCode, destinationCode);
    } else {
      // Default behavior if no prop is passed, e.g., navigate
      navigate('/evisa', { state: { nationalityCode, destinationCode } });
    }
  };

  const handleLoginRedirect = () => {
    console.log('Login required from VisaCheckerPage');
    if (onLoginRequired) {
      onLoginRequired();
    } else {
      // Default behavior: Redirect to login page, maybe storing current location
      navigate('/login', { state: { from: '/visa-checker' } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Visa Requirement Checker
            </h1>
        <SharedVisaChecker 
          // Pass necessary props down to the shared component
          // Adjust these based on what SharedVisaChecker actually needs
          onApplyEVisa={handleApplyEVisa} 
          // isLoggedIn={isLoggedIn} // Pass if needed
          // onLoginRequired={handleLoginRedirect} // Pass if needed
              />
              </div>
    </div>
  );
};

export default VisaCheckerPage; 