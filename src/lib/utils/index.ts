// Format a number as a travel score (0-1000)
export const formatScore = (score: number): string => {
  return score.toFixed(0).padStart(4, '0');
};

// Calculate color based on score (for travel score visualization)
export const getScoreColor = (score: number): string => {
  if (score < 200) return '#ef4444'; // Red
  if (score < 400) return '#f97316'; // Orange
  if (score < 600) return '#facc15'; // Yellow
  if (score < 800) return '#84cc16'; // Light Green
  return '#10b981'; // Green
};

// Format a date to a readable string
export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Check if object is empty
export const isEmpty = (obj: Record<string, any>): boolean => {
  return Object.keys(obj).length === 0;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Delay execution (for animations, etc.)
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Format currency
export const formatCurrency = (amount: number, currency = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}; 