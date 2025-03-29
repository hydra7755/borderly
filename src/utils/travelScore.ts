interface TravelHistory {
  country_id: string;
  visit_date: string;
  duration_days: number;
  purpose: string;
}

interface UserProfile {
  nationality: string;
  residency: string;
  travel_history: TravelHistory[];
}

// Weights for different components
const WEIGHTS = {
  PASSPORT_STRENGTH: 0.6,    // 60% of total score
  TRAVEL_HISTORY: 0.3,      // 30% of total score
  RESIDENCY_BONUS: 0.1      // 10% of total score
};

// Maximum possible values
const MAX_VALUES = {
  PASSPORT_STRENGTH: 1000,    // Maximum passport strength score
  COUNTRIES_VISITED: 195,    // Total number of countries in the world
  TRAVEL_YEARS: 10,         // Maximum years of travel history considered
  RESIDENCY_BONUS: 100      // Maximum residency bonus points
};

export const calculateTravelScore = (userProfile: UserProfile, passportStrengthData: any): number => {
  // 1. Passport Strength Component (based on passport index)
  const passportStrength = passportStrengthData * WEIGHTS.PASSPORT_STRENGTH;

  // 2. Travel History Component
  const travelHistoryScore = calculateTravelHistoryScore(userProfile.travel_history);
  const normalizedTravelScore = travelHistoryScore * WEIGHTS.TRAVEL_HISTORY * 1000;

  // 3. Residency Bonus (if residency is different from nationality)
  let residencyBonus = 0;
  if (userProfile.residency && userProfile.residency !== userProfile.nationality) {
    residencyBonus = (passportStrengthData[userProfile.residency] || 0) * WEIGHTS.RESIDENCY_BONUS;
  }

  // Calculate total score (0-1000)
  const totalScore = Math.round(passportStrength + normalizedTravelScore + residencyBonus);

  // Ensure score is between 0 and 1000
  return Math.max(0, Math.min(1000, totalScore));
};

const calculateTravelHistoryScore = (travelHistory: TravelHistory[]): number => {
  if (!travelHistory || !travelHistory.length) return 0;

  // Get unique countries visited
  const uniqueCountries = new Set(travelHistory.map(entry => entry.country_id));
  const countriesVisited = uniqueCountries.size;

  // Calculate frequency and recency
  const now = new Date();
  
  // Check if visit_date exists in all entries
  const hasValidDates = travelHistory.every(entry => entry.visit_date);
  
  let yearsOfHistory = 1; // Default to 1 year if dates are not available
  
  if (hasValidDates) {
    const oldestTrip = new Date(Math.min(...travelHistory.map(entry => new Date(entry.visit_date).getTime())));
    yearsOfHistory = Math.max(1, (now.getTime() - oldestTrip.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  // Calculate average trips per year
  const tripsPerYear = travelHistory.length / Math.min(yearsOfHistory, MAX_VALUES.TRAVEL_YEARS);

  // Normalize scores
  const countryScore = countriesVisited / MAX_VALUES.COUNTRIES_VISITED;
  const frequencyScore = Math.min(tripsPerYear / 12, 1); // Cap at 12 trips per year

  // Weighted combination
  return (countryScore * 0.7 + frequencyScore * 0.3);
};

export const getTravelScoreLevel = (score: number): string => {
  if (score >= 900) return 'Elite Traveler';
  if (score >= 800) return 'Globetrotter';
  if (score >= 700) return 'Explorer';
  if (score >= 600) return 'Adventurer';
  if (score >= 500) return 'Voyager';
  if (score >= 400) return 'Journeyman';
  if (score >= 300) return 'Wanderer';
  if (score >= 200) return 'Novice';
  return 'Beginner';
};

export const getScoreBreakdown = (
  userProfile: UserProfile, 
  passportStrengthData: any
): { 
  passportComponent: number;
  historyComponent: number;
  residencyComponent: number;
} => {
  // 1. Passport Strength Component
  const passportStrength = passportStrengthData * WEIGHTS.PASSPORT_STRENGTH;

  // 2. Travel History Component
  const travelHistoryScore = calculateTravelHistoryScore(userProfile.travel_history);
  const normalizedTravelScore = travelHistoryScore * WEIGHTS.TRAVEL_HISTORY * 1000;

  // 3. Residency Bonus
  let residencyBonus = 0;
  if (userProfile.residency && userProfile.residency !== userProfile.nationality) {
    residencyBonus = (passportStrengthData[userProfile.residency] || 0) * WEIGHTS.RESIDENCY_BONUS;
  }

  return {
    passportComponent: Math.round(passportStrength),
    historyComponent: Math.round(normalizedTravelScore),
    residencyComponent: Math.round(residencyBonus)
  };
}; 