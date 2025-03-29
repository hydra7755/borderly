export type VisaRequirementType = 'visa-free' | 'evisa' | 'visa-required' | 'no-admission';

export interface VisaRequirement {
  passport: string; // Country code of passport
  destination: string; // Country code of destination
  requirement: VisaRequirementType;
}

export interface VisaApplication {
  id: string;
  user_id: string;
  destination_id: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  application_date: string;
  documents_uploaded: boolean;
  payment_status: 'pending' | 'paid' | 'refunded';
  approval_date?: string;
} 