/**
 * Utility functions for handling country data and Cloudinary images
 */

import { ALL_COUNTRIES } from './countries';

/**
 * Gets country name from a country code
 */
export const getCountryNameFromCode = (code: string): string | null => {
  const country = ALL_COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase());
  return country ? country.name : null;
};

/**
 * Gets region for a country based on its code
 */
export const getCountryRegion = (code: string): string => {
  // This is a simplified mapping - you would replace with actual data
  const regionMap: Record<string, string> = {
    // Europe
    'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
    // North America
    'US': 'North America', 'CA': 'North America', 'MX': 'North America',
    // Asia
    'JP': 'Asia', 'CN': 'Asia', 'IN': 'Asia', 'SG': 'Asia', 'TH': 'Asia',
    // Africa
    'ZA': 'Africa', 'EG': 'Africa', 'NG': 'Africa', 'KE': 'Africa',
    // South America
    'BR': 'South America', 'AR': 'South America', 'CO': 'South America',
    // Oceania
    'AU': 'Oceania', 'NZ': 'Oceania'
  };
  
  return regionMap[code.toUpperCase()] || 'Other';
};

/**
 * Gets a fallback Cloudinary image URL if the main one fails
 */
export const getCloudinaryFallbackUrl = (cloudName: string = 'drdpxs3je'): string => {
  return `https://res.cloudinary.com/${cloudName}/image/upload/v1710823416/default/world-map.jpg`;
};

/**
 * Checks if an image URL is valid (exists on Cloudinary)
 */
export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Format currency amount based on currency code
 */
export const formatCurrency = (amount: number, currencyCode: string = 'GBP'): string => {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode
  });
  
  return formatter.format(amount);
};

export default {
  getCountryNameFromCode,
  getCountryRegion,
  getCloudinaryFallbackUrl,
  checkImageExists,
  formatCurrency
}; 