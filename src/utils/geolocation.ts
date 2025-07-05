import axios from 'axios';
import { getLocationThroughProxy } from './corsProxy';

interface GeolocationResponse {
  country_code: string;
  country_name: string;
  city: string;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  ip: string;
  latitude: number;
  longitude: number;
}

// Common currency codes mapped to their symbols
const currencySymbols: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'AUD': 'A$',
  'CAD': 'C$',
  'CHF': 'CHF',
  'CNY': '¥',
  'INR': '₹',
  'PKR': '₨',
  'RUB': '₽',
  'SGD': 'S$',
  'ZAR': 'R'
};

// Default currency to use if geolocation fails
const DEFAULT_CURRENCY = 'USD';

/**
 * Get the user's location based on their IP address
 * @returns Promise with the user's location data
 */
export const getUserLocation = async (): Promise<GeolocationResponse> => {
  try {
    // Using ipapi.co through our CORS proxy
    const data = await getLocationThroughProxy();
    
    // Format the response to match our GeolocationResponse interface
    return {
      country_code: data.country_code,
      country_name: data.country_name,
      city: data.city,
      currency: {
        code: data.currency,
        name: data.currency_name || `${data.currency} Currency`,
        symbol: currencySymbols[data.currency] || data.currency
      },
      ip: data.ip,
      latitude: data.latitude,
      longitude: data.longitude
    };
  } catch (error) {
    console.error('Error fetching user location:', error);
    // Return default values if geolocation fails
    return {
      country_code: 'GB',
      country_name: 'United Kingdom',
      city: 'London',
      currency: {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£'
      },
      ip: '0.0.0.0',
      latitude: 51.5074,
      longitude: 0.1278
    };
  }
};

/**
 * Get the currency code based on the user's location
 * @returns Promise with the currency code
 */
export const getUserCurrency = async (): Promise<{
  code: string;
  symbol: string;
}> => {
  try {
    const location = await getUserLocation();
    const currencyCode = location.currency.code;
    
    return {
      code: currencyCode,
      symbol: currencySymbols[currencyCode] || currencyCode
    };
  } catch (error) {
    console.error('Error getting user currency:', error);
    return {
      code: DEFAULT_CURRENCY,
      symbol: '$'
    };
  }
};
