export interface VisaRequirement {
  visaType: 'visa-free' | 'e-visa' | 'visa-required' | 'visa-on-arrival';
  duration: string;
  notes?: string;
}

export interface VisaRequirementMap {
  [countryCode: string]: VisaRequirement;
}

export interface VisaRequirementsData {
  [countryOfOrigin: string]: VisaRequirementMap;
}

// Sample visa requirement data types
export const VisaTypeColors = {
  'visa-free': '#0D9488', // Teal for visa-free access
  'e-visa': '#5EEAD4', // Lighter teal for eVisa
  'visa-required': '#134E4A', // Dark teal for traditional visa
  'visa-on-arrival': '#2DD4BF', // Medium teal for visa on arrival
}; 