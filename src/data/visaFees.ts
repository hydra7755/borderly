/**
 * Government / embassy visa fees by destination country.
 * All amounts in GBP (£). Source: Borderly fee schedule (converted dataset).
 */

import { formatGbp } from '../config/visaServiceFee';

export interface CountryVisaFee {
  country: string;
  countryCode: string;
  visaFee: number;
}

export const VISA_FEES: CountryVisaFee[] = [
  { country: 'Algeria', countryCode: 'dz', visaFee: 89.4 },
  { country: 'Australia', countryCode: 'au', visaFee: 100.88 },
  { country: 'Azerbaijan', countryCode: 'az', visaFee: 22.5 },
  { country: 'Bahrain', countryCode: 'bh', visaFee: 19.8 },
  { country: 'Benin', countryCode: 'bj', visaFee: 37.13 },
  { country: 'Bhutan', countryCode: 'bt', visaFee: 148.5 },
  { country: 'Brazil', countryCode: 'br', visaFee: 69.68 },
  { country: 'Cambodia', countryCode: 'kh', visaFee: 22.65 },
  { country: 'Cameroon', countryCode: 'cm', visaFee: 144.23 },
  { country: 'Chile', countryCode: 'cl', visaFee: 111.3 },
  { country: 'China', countryCode: 'cn', visaFee: 61.5 },
  { country: 'Cuba', countryCode: 'cu', visaFee: 40.5 },
  { country: 'Egypt', countryCode: 'eg', visaFee: 18.75 },
  { country: 'Ethiopia', countryCode: 'et', visaFee: 46.13 },
  { country: 'Gabon', countryCode: 'ga', visaFee: 132.0 },
  { country: 'Georgia', countryCode: 'ge', visaFee: 27.0 },
  { country: 'Ghana', countryCode: 'gh', visaFee: 84.75 },
  { country: 'Guinea', countryCode: 'gn', visaFee: 58.5 },
  { country: 'Hong Kong', countryCode: 'hk', visaFee: 0.0 },
  { country: 'Indonesia', countryCode: 'id', visaFee: 24.0 },
  { country: 'Japan', countryCode: 'jp', visaFee: 10.5 },
  { country: 'Jordan', countryCode: 'jo', visaFee: 38.7 },
  { country: 'Kenya', countryCode: 'ke', visaFee: 25.5 },
  { country: 'Laos', countryCode: 'la', visaFee: 37.73 },
  { country: 'Madagascar', countryCode: 'mg', visaFee: 8.25 },
  { country: 'Malaysia', countryCode: 'my', visaFee: 0.0 },
  { country: 'Mongolia', countryCode: 'mn', visaFee: 3.79 },
  { country: 'Morocco', countryCode: 'ma', visaFee: 66.0 },
  { country: 'New Zealand', countryCode: 'nz', visaFee: 190.35 },
  { country: 'Nigeria', countryCode: 'ng', visaFee: 336.0 },
  { country: 'Papua New Guinea', countryCode: 'pg', visaFee: 37.5 },
  { country: 'Philippines', countryCode: 'ph', visaFee: 51.75 },
  { country: 'Russia', countryCode: 'ru', visaFee: 41.25 },
  { country: 'Saudi Arabia', countryCode: 'sa', visaFee: 81.15 },
  { country: 'South Korea', countryCode: 'kr', visaFee: 28.05 },
  { country: 'Sri Lanka', countryCode: 'lk', visaFee: 0.0 },
  { country: 'Taiwan', countryCode: 'tw', visaFee: 0.0 },
  { country: 'Tajikistan', countryCode: 'tj', visaFee: 23.25 },
  { country: 'Tanzania', countryCode: 'tz', visaFee: 37.5 },
  { country: 'Togo', countryCode: 'tg', visaFee: 35.25 },
  { country: 'Turkey', countryCode: 'tr', visaFee: 35.25 },
  { country: 'United Arab Emirates', countryCode: 'ae', visaFee: 56.25 },
  { country: 'Uganda', countryCode: 'ug', visaFee: 38.25 },
  { country: 'United Kingdom', countryCode: 'gb', visaFee: 132.3 },
  { country: 'United States', countryCode: 'us', visaFee: 141.75 },
  { country: 'Uruguay', countryCode: 'uy', visaFee: 28.5 },
  { country: 'Uzbekistan', countryCode: 'uz', visaFee: 16.5 },
  { country: 'Vietnam', countryCode: 'vn', visaFee: 19.8 },
  { country: 'Zambia', countryCode: 'zm', visaFee: 19.5 },
];

/** Fallback when destination is not in the fee table (China mid-range reference). */
export const DEFAULT_VISA_FEE_GBP = 61.5;

export function getVisaFeeForCountry(countryName: string): number {
  const match = VISA_FEES.find(
    (entry) => entry.country.toLowerCase() === countryName.toLowerCase()
  );
  return match?.visaFee ?? DEFAULT_VISA_FEE_GBP;
}

export function getVisaFeeForCountryCode(countryCode: string): number {
  const normalized = countryCode.toLowerCase().trim();
  const byCode = VISA_FEES.find((entry) => entry.countryCode === normalized);
  if (byCode) return byCode.visaFee;

  const byName = VISA_FEES.find(
    (entry) => entry.country.toLowerCase() === normalized
  );
  return byName?.visaFee ?? DEFAULT_VISA_FEE_GBP;
}

export { formatGbp };
