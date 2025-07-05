import React, { useState } from 'react';

// Add missing interface
interface TravelScoreProps {
  score: number;
  countries: number;
}

const TravelScore = ({ score, countries }: TravelScoreProps) => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      // API call to recalculate travel score
      // This would connect to your backend service
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
      // Refresh the component or page after calculation
      window.location.reload();
    } catch (error) {
      console.error("Error recalculating travel score:", error);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Travel Score</h2>
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="text-primary-600 hover:text-primary-700 flex items-center text-sm font-medium"
        >
          {isRecalculating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Recalculating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Recalculate Score
            </>
          )}
        </button>
      </div>
      
      {/* ... rest of existing component ... */}
    </div>
  );
};

export default TravelScore; 