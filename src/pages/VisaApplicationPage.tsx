import React from 'react';
import { useNavigate } from 'react-router-dom';
import VisaApplicationStepper from '../components/EVisa/VisaApplicationStepper';

const VisaApplicationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleApplicationComplete = (data: any) => {
    // Handle the completed application data
    console.log('Application completed:', data);
    // Navigate to success page or show confirmation
    navigate('/visa/application/success');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Visa Application</h1>
          <p className="mt-2 text-gray-600">Complete your visa application in 5 easy steps</p>
        </div>

        <VisaApplicationStepper onComplete={handleApplicationComplete} />
      </div>
    </div>
  );
};

export default VisaApplicationPage;
