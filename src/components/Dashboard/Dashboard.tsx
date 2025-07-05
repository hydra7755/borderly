import React from 'react';
import TravelScore from './TravelScore';

// Fix user reference by adding props
interface DashboardProps {
  user: {
    travel_score?: number;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return (
    <TravelScore 
      score={user?.travel_score || 0}
      countries={0} 
    />
  );
};

export default Dashboard; 