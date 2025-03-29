import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VisaCheck = () => {
  const navigate = useNavigate();
  
  const handleCheckEligibility = () => {
    navigate('/visa-checker');
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Visa Information</h2>
        <button
          onClick={handleCheckEligibility}
          className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          Check Visa Eligibility
        </button>
      </div>
      
      {/* ... rest of existing component ... */}
    </div>
  );
};

export default VisaCheck; 