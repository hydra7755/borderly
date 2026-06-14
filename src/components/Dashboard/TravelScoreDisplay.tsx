import React from 'react';
import { motion } from 'framer-motion';

interface TravelScoreDisplayProps {
  score: number;
  maxScore: number;
  className?: string;
}

// Helper function to determine score gradient
const getScoreGradient = (score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'url(#gradient-excellent)';
  if (percentage >= 60) return 'url(#gradient-good)';
  if (percentage >= 40) return 'url(#gradient-average)';
  return 'url(#gradient-basic)';
};

const TravelScoreDisplay: React.FC<TravelScoreDisplayProps> = ({ 
  score, 
  maxScore, 
  className = '' 
}) => {
  // Calculate percentage
  const percentage = Math.round((score / maxScore) * 100);
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Travel Score</h3>
      
      <div className="flex items-center justify-center mb-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <svg className="w-32 h-32">
            {/* Define gradients */}
            <defs>
              <linearGradient id="gradient-excellent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" /> {/* Emerald-500 */}
                <stop offset="100%" stopColor="#047857" /> {/* Emerald-700 */}
              </linearGradient>
              <linearGradient id="gradient-good" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" /> {/* Teal-500 */}
                <stop offset="100%" stopColor="#0F766E" /> {/* Teal-700 */}
              </linearGradient>
              <linearGradient id="gradient-average" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" /> {/* Cyan-500 */}
                <stop offset="100%" stopColor="#0E7490" /> {/* Cyan-700 */}
              </linearGradient>
              <linearGradient id="gradient-basic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0EA5E9" /> {/* Sky-500 */}
                <stop offset="100%" stopColor="#0284C7" /> {/* Sky-600 */}
              </linearGradient>
            </defs>
            
            {/* Background circle */}
            <circle 
              cx="64" 
              cy="64" 
              r="56" 
              fill="none" 
              stroke="#e0e0e0" 
              strokeWidth="12" 
              className="dark:stroke-gray-700"
            />
            {/* Score circle */}
            <motion.circle 
              cx="64" 
              cy="64" 
              r="56" 
              fill="none" 
              stroke={getScoreGradient(score, maxScore)} 
              strokeWidth="12" 
              strokeDasharray="352" 
              strokeDashoffset="352"
              initial={{ strokeDashoffset: 352 }}
              animate={{ strokeDashoffset: 352 - (352 * percentage / 100) }}
              transition={{ duration: 1, delay: 0.5 }}
              className="transform -rotate-90 origin-center"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                {score}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                /{maxScore}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          Your travel readiness score based on your profile and travel history.
        </p>
        <a 
          href="/questionnaire"
          className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium"
        >
          Update your score →
        </a>
      </div>
    </div>
  );
};

export default TravelScoreDisplay; 