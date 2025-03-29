import TravelScoreDisplay from './TravelScoreDisplay';

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  <TravelScoreDisplay 
    score={user?.travel_score || 0} 
    maxScore={100} 
  />
  {/* Other dashboard cards */}
</div> 