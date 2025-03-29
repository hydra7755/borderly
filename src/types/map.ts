export interface CountryInfo {
  code: string;
  name: string;
  flagUrl: string;
  visaRequirements: string;
  advisoryLevel: 'Low' | 'Medium' | 'High';
  advisoryText: string;
  travelScore?: number;
  languages?: string[];
  currency?: string;
  bestTimeToVisit?: string;
}

export interface CountryData {
  [countryCode: string]: CountryInfo;
} 