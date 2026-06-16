export type MaritalStatus =
  | 'Single'
  | 'Married'
  | 'Registered Partnership'
  | 'Separated'
  | 'Divorced'
  | 'Widowed';

export type SchengenSex = 'Male' | 'Female' | 'Other';

export type EntriesRequested = 'single' | 'two' | 'multiple';

export type PurposeOfVisit =
  | 'tourism'
  | 'business'
  | 'official'
  | 'education'
  | 'medical'
  | 'family'
  | 'other';

export type MeansOfSupportType = 'self' | 'sponsor';

export interface SchengenPassportVerification {
  surnameAtBirth: string;
  nationalIdentityNumber: string;
  birthNationalityDiffers: boolean;
  birthNationality: string;
}

export interface SchengenPersonalProfessional {
  sex: SchengenSex | '';
  maritalStatus: MaritalStatus | '';
  occupation: string;
  employerName: string;
  employerAddress: string;
  employerPhone: string;
  homeStreet: string;
  homeCity: string;
  homePostalCode: string;
  homePhone: string;
  residesOutsideNationality: boolean;
  residencePermitNumber: string;
  residencePermitValidUntil: string;
}

export interface SchengenTravelExtension {
  purposeOfVisit: PurposeOfVisit | '';
  memberStateOfDestination: string;
  memberStateOfFirstEntry: string;
  entriesRequested: EntriesRequested | '';
  schengenVisaPast3Years: boolean;
  schengenVisaDateFrom: string;
  schengenVisaDateTo: string;
  fingerprintsCollectedBefore: boolean;
  fingerprintsCollectionDate: string;
  hostContactPerson: string;
}

export interface SchengenGuardianDetails {
  name: string;
  address: string;
  nationality: string;
}

export interface SchengenEuFamilyExemption {
  isEuFamilyMember: boolean;
  familyMemberName: string;
  familyMemberNationality: string;
  relationshipType: string;
  /** When true, employment/funding fields may be optional on backend */
  employmentFundingOptional: boolean;
}

export interface SchengenMeansOfSupport {
  type: MeansOfSupportType | '';
  selfMethods: string[];
  sponsorCoverage: string[];
}

export interface SchengenDeclarations {
  visDataProcessingAccepted: boolean;
  tmiAcknowledged: boolean;
  signatureType: 'canvas' | 'text';
  signatureData: string;
  typedSignatureName: string;
}

export interface SchengenApplicationData {
  passportVerification: SchengenPassportVerification;
  personalProfessional: SchengenPersonalProfessional;
  travelExtension: SchengenTravelExtension;
  guardianDetails: SchengenGuardianDetails | null;
  euFamilyExemption: SchengenEuFamilyExemption;
  meansOfSupport: SchengenMeansOfSupport;
  declarations: SchengenDeclarations;
}

export const OCCUPATION_OPTIONS = [
  'Employed',
  'Self-Employed',
  'Student',
  'Unemployed',
  'Retired',
  'Homemaker',
  'Other',
] as const;

export const SELF_SUPPORT_METHODS = [
  'Cash',
  'Credit Card',
  'Prepaid Accommodation',
  'Prepaid Transport',
  'Travel Cheques',
  'Other',
] as const;

export const SPONSOR_COVERAGE_OPTIONS = [
  'All expenses covered',
  'Accommodation provided',
  'Transport provided',
  'Daily allowance provided',
] as const;

export const EU_RELATIONSHIP_TYPES = [
  'Spouse',
  'Registered partner',
  'Child under 21',
  'Dependent child',
  'Dependent parent',
  'Other dependent',
] as const;

export function createEmptySchengenData(): SchengenApplicationData {
  return {
    passportVerification: {
      surnameAtBirth: '',
      nationalIdentityNumber: '',
      birthNationalityDiffers: false,
      birthNationality: '',
    },
    personalProfessional: {
      sex: '',
      maritalStatus: '',
      occupation: '',
      employerName: '',
      employerAddress: '',
      employerPhone: '',
      homeStreet: '',
      homeCity: '',
      homePostalCode: '',
      homePhone: '',
      residesOutsideNationality: false,
      residencePermitNumber: '',
      residencePermitValidUntil: '',
    },
    travelExtension: {
      purposeOfVisit: '',
      memberStateOfDestination: '',
      memberStateOfFirstEntry: '',
      entriesRequested: '',
      schengenVisaPast3Years: false,
      schengenVisaDateFrom: '',
      schengenVisaDateTo: '',
      fingerprintsCollectedBefore: false,
      fingerprintsCollectionDate: '',
      hostContactPerson: '',
    },
    guardianDetails: null,
    euFamilyExemption: {
      isEuFamilyMember: false,
      familyMemberName: '',
      familyMemberNationality: '',
      relationshipType: '',
      employmentFundingOptional: false,
    },
    meansOfSupport: {
      type: '',
      selfMethods: [],
      sponsorCoverage: [],
    },
    declarations: {
      visDataProcessingAccepted: false,
      tmiAcknowledged: false,
      signatureType: 'text',
      signatureData: '',
      typedSignatureName: '',
    },
  };
}

export function isApplicantMinor(dateOfBirth: string | undefined): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age < 18;
}

export function occupationRequiresEmployerDetails(occupation: string): boolean {
  return !['Unemployed', 'Retired', ''].includes(occupation);
}
