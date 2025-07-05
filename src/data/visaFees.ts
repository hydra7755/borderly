/**
 * Visa fee data for different countries
 * All fees are in GBP (British Pounds)
 */

interface CountryVisaFee {
  country: string;
  visaFee: number; // Fee in GBP
}

export const VISA_FEES: CountryVisaFee[] = [
  { country: "Algeria", visaFee: 96.43 },
  { country: "Antigua And Barbuda", visaFee: 101.19 },
  { country: "Australia", visaFee: 131.95 },
  { country: "Azerbaijan", visaFee: 27.05 },
  { country: "Bahrain", visaFee: 26.56 },
  { country: "Bangladesh", visaFee: 23.21 },
  { country: "Benin", visaFee: 53.57 },
  { country: "Bhutan", visaFee: 214.29 },
  { country: "Brazil", visaFee: 95.24 },
  { country: "Burkina Faso", visaFee: 173.21 },
  { country: "Cambodia", visaFee: 36.90 },
  { country: "Cameroon", visaFee: 166.86 },
  { country: "China", visaFee: 89.29 },
  { country: "Cuba", visaFee: 85.71 },
  { country: "Egypt", visaFee: 25.00 },
  { country: "Ethiopia", visaFee: 63.10 },
  { country: "Gabon", visaFee: 76.36 },
  { country: "Georgia", visaFee: 35.95 },
  { country: "Ghana", visaFee: 122.62 },
  { country: "Guinea", visaFee: 80.44 },
  { country: "Hong Kong", visaFee: 0.00 },
  { country: "Indonesia", visaFee: 31.86 },
  { country: "Japan", visaFee: 5.95 },
  { country: "Jordan", visaFee: 56.45 },
  { country: "Kenya", visaFee: 34.18 },
  { country: "Laos", visaFee: 50.36 },
  { country: "Lebanon", visaFee: 98.21 },
  { country: "Madagascar", visaFee: 9.73 },
  { country: "Malaysia", visaFee: 0.00 },
  { country: "Mongolia", visaFee: 17.26 },
  { country: "Morocco", visaFee: 78.40 },
  { country: "New Zealand", visaFee: 275.00 },
  { country: "Oman", visaFee: 29.76 },
  { country: "Papua New Guinea", visaFee: 50.04 },
  { country: "Philippines", visaFee: 65.36 },
  { country: "Russia", visaFee: 52.96 },
  { country: "Saudi Arabia", visaFee: 101.45 },
  { country: "Singapore", visaFee: 21.43 },
  { country: "South Korea", visaFee: 38.10 },
  { country: "South Sudan", visaFee: 100.08 },
  { country: "Taiwan", visaFee: 0.00 },
  { country: "Tajikistan", visaFee: 50.04 },
  { country: "Tanzania", visaFee: 50.30 },
  { country: "Togo", visaFee: 41.50 },
  { country: "Turkey", visaFee: 50.25 },
  { country: "Uganda", visaFee: 52.38 },
  { country: "United Arab Emirates", visaFee: 74.40 },
  { country: "United Kingdom", visaFee: 152.00 },
  { country: "Uruguay", visaFee: 42.04 },
  { country: "Uzbekistan", visaFee: 20.02 },
  { country: "Vietnam", visaFee: 25.13 },
  { country: "Zambia", visaFee: 26.19 }
];

/**
 * Gets the visa fee for a specific country
 * @param countryName The name of the country
 * @returns The visa fee in GBP or default fee if country not found
 */
export const getVisaFeeForCountry = (countryName: string): number => {
  const DEFAULT_FEE = 123.14; // Default fee if country not found
  
  // Try to find the country in our data (case insensitive)
  const countryData = VISA_FEES.find(
    country => country.country.toLowerCase() === countryName.toLowerCase()
  );
  
  return countryData ? countryData.visaFee : DEFAULT_FEE;
}; 