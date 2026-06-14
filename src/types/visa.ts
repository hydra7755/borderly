export type VisaRequirementType = 'visa-free' | 'evisa' | 'visa-required' | 'no-admission' | 'visa-on-arrival' | 'unknown' | 'eta' | 'not-applicable';

export interface VisaRequirement {
  passport: string; // Country code of passport
  destination: string; // Country code of destination
  requirement: VisaRequirementType;
}

export interface VisaApplication {
  id: string;
  user_id: string;
  destination_id?: string;
  destination_code?: string;
  destination_name?: string;
  nationality_code?: string;
  status: 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'processing';
  application_date: string;
  documents_uploaded: boolean;
  payment_status: 'pending' | 'paid' | 'refunded';
  approval_date?: string;
  visa_document_url?: string;
  purpose_of_visit?: string;
  entry_date?: string;
  exit_date?: string;
  application_data?: Record<string, unknown>;
}

// Color mapping for visa requirement types
export const RequirementColors: Record<VisaRequirementType | 'default' | 'own', string> = {
  'visa-free': '#4CAF50',       // Green
  'evisa': '#2196F3',          // Blue
  'visa-on-arrival': '#009688', // Teal
  'visa-required': '#FF9800',   // Orange
  'no-admission': '#B71C1C',    // Dark Red
  'unknown': '#9E9E9E',        // Grey
  'default': '#E0E0E0',        // Light Grey (for unmapped countries)
  'own': '#9C27B0',            // Purple (for user's own country)
  'eta': '#FF5722',            // Orange (for ETA)
  'not-applicable': '#9E9E9E'  // Grey (for not applicable)
};

// Function to convert requirement type to display text
export const requirementToText = (requirement: VisaRequirementType): string => {
  switch (requirement) {
    case 'visa-free': return 'Visa Free';
    case 'evisa': return 'E-Visa';
    case 'visa-on-arrival': return 'Visa on Arrival';
    case 'visa-required': return 'Visa Required';
    case 'no-admission': return 'No Admission';
    case 'unknown': return 'Unknown';
    case 'eta': return 'ETA';
    case 'not-applicable': return 'Not Applicable';
    default: return 'Info unavailable';
  }
};