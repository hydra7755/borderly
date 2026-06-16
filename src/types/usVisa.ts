import type {
  US_CONTACT_RELATIONSHIP_OPTIONS,
  US_OCCUPATION_OPTIONS,
  US_TRIP_FINANCER_OPTIONS,
} from '../utils/unitedStatesVisa';

export type UsTripFinancer = (typeof US_TRIP_FINANCER_OPTIONS)[number];
export type UsContactRelationship = (typeof US_CONTACT_RELATIONSHIP_OPTIONS)[number];
export type UsOccupation = (typeof US_OCCUPATION_OPTIONS)[number];

export interface UsOtherName {
  surname: string;
  givenNames: string;
}

export interface UsSocialMediaAccount {
  platform: string;
  handle: string;
}

export interface UsAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UsPastUsTrip {
  arrivalDate: string;
  lengthOfStay: string;
}

export interface UsPastEmployment {
  employerName: string;
  address: string;
  jobTitle: string;
  supervisorName: string;
  dateFrom: string;
  dateTo: string;
}

export interface UsEducationEntry {
  schoolName: string;
  address: string;
  courseOfStudy: string;
  dateFrom: string;
  dateTo: string;
}

export interface UsTravelCompanion {
  name: string;
  relationship: string;
}

export interface UsSecurityQuestion {
  answer: boolean;
  explanation: string;
}

export interface UsPassportBio {
  fullNameNativeLanguage: string;
  fullNameNativeDoesNotApply: boolean;
  otherNamesUsed: boolean;
  otherNames: UsOtherName[];
  telecodeNameUsed: boolean;
  telecodeName: string;
  nationalIdNumber: string;
  nationalIdDoesNotApply: boolean;
  usSocialSecurityNumber: string;
  usSsnDoesNotApply: boolean;
  usTaxpayerIdNumber: string;
  usTaxIdDoesNotApply: boolean;
  passportBookNumber: string;
  passportBookDoesNotApply: boolean;
  cityOfIssuance: string;
  lostOrStolenPassport: boolean;
  lostOrStolenDescription: string;
}

export interface UsContactSocial {
  mailingSameAsHome: boolean;
  mailingAddress: UsAddress;
  homeAddress: UsAddress;
  primaryPhone: string;
  secondaryPhone: string;
  workPhone: string;
  additionalPhonesPast5Years: boolean;
  additionalPhoneNumbers: string[];
  socialMediaAccounts: UsSocialMediaAccount[];
}

export interface UsTravelDetails {
  specificTravelPlans: boolean;
  arrivalDate: string;
  departureDate: string;
  flightInfo: string;
  usCitiesToVisit: string;
  intendedArrivalDate: string;
  intendedLengthOfStay: string;
  contactPersonName: string;
  organizationName: string;
  contactRelationship: UsContactRelationship | '';
  contactPhone: string;
  contactEmail: string;
  contactUsAddress: UsAddress;
  tripFinancer: UsTripFinancer | '';
  beenToUsBefore: boolean;
  pastUsTrips: UsPastUsTrip[];
  issuedUsVisaBefore: boolean;
  lastVisaDate: string;
  lastVisaNumber: string;
  applyingSameVisaType: boolean | null;
  applyingSameCountry: boolean | null;
  fingerprintsTakenBefore: boolean | null;
  refusedUsVisaOrAdmission: boolean;
  refusalExplanation: string;
  immigrantPetitionFiled: boolean;
  immigrantPetitionExplanation: string;
}

export interface UsParentDetails {
  surname: string;
  givenNames: string;
  dateOfBirth: string;
  doNotKnow: boolean;
  isInUs: boolean;
}

export interface UsSpouseDetails {
  surname: string;
  givenNames: string;
  dateOfBirth: string;
  nationality: string;
  cityOfBirth: string;
  countryOfBirth: string;
}

export interface UsFamilyBackground {
  father: UsParentDetails;
  mother: UsParentDetails;
  immediateRelativesInUs: boolean;
  otherRelativesInUs: boolean;
  maritalStatus: string;
  spouse: UsSpouseDetails | null;
}

export interface UsMilitaryService {
  country: string;
  branch: string;
  rank: string;
  specialty: string;
  dateFrom: string;
  dateTo: string;
}

export interface UsWorkEducation {
  occupation: UsOccupation | '';
  employerSchoolName: string;
  employerAddress: string;
  employerPhone: string;
  monthlySalaryLocal: string;
  dutiesDescription: string;
  previouslyEmployed: boolean;
  pastEmployments: UsPastEmployment[];
  attendedSecondaryOrAbove: boolean;
  educationHistory: UsEducationEntry[];
  clanOrTribeName: string;
  clanOrTribeDoesNotApply: boolean;
  languagesSpoken: string[];
  countriesVisitedPast5Years: string[];
  belongedToOrganization: boolean;
  organizationExplanation: string;
  specializedSkills: boolean;
  specializedSkillsExplanation: string;
  servedInMilitary: boolean;
  militaryService: UsMilitaryService | null;
  paramilitaryInvolvement: boolean;
  paramilitaryExplanation: string;
}

export interface UsTravelersCompanions {
  othersTravelingWithYou: boolean;
  travelingAsGroup: boolean;
  groupName: string;
  companions: UsTravelCompanion[];
}

export interface UsSecurityBackground {
  medicalHealth: UsSecurityQuestion[];
  criminalHistory: UsSecurityQuestion[];
  securityTerrorism: UsSecurityQuestion[];
  immigrationViolations: UsSecurityQuestion[];
}

export interface UsCheckoutCompliance {
  securityBackground: UsSecurityBackground;
  preparerAssisted: boolean;
  preparerName: string;
  submissionLocation: string;
  declarationsAccepted: boolean;
  signatureName: string;
}

export interface UsApplicationData {
  passportBio: UsPassportBio;
  contactSocial: UsContactSocial;
  travelDetails: UsTravelDetails;
  familyBackground: UsFamilyBackground;
  workEducation: UsWorkEducation;
  travelersCompanions: UsTravelersCompanions;
  checkoutCompliance: UsCheckoutCompliance;
}

export const US_SECURITY_QUESTIONS = {
  medicalHealth: [
    'Do you have a communicable disease of public health significance?',
    'Do you have a mental or physical disorder that poses a threat to yourself or others?',
    'Are you or have you ever been a drug abuser or addict?',
  ],
  criminalHistory: [
    'Have you ever been arrested or convicted for any offense or crime?',
    'Have you ever violated any law related to controlled substances?',
    'Have you ever been involved in prostitution or human trafficking?',
    'Have you ever committed a crime of moral turpitude?',
  ],
  securityTerrorism: [
    'Do you seek to engage in espionage, sabotage, or export control violations?',
    'Do you seek to engage in terrorist activities or have you ever engaged in terrorist activities?',
    'Have you ever provided financial assistance or support to terrorists or terrorist organizations?',
    'Are you a member of a terrorist organization?',
  ],
  immigrationViolations: [
    'Have you ever been unlawfully present, overstayed, or violated the terms of a U.S. visa?',
    'Have you ever been removed or deported from the United States?',
    'Have you ever withheld custody of a U.S. citizen child outside the United States?',
    'Have you ever voted in the United States in violation of any law or regulation?',
  ],
} as const;

function emptySecuritySection(count: number): UsSecurityQuestion[] {
  return Array.from({ length: count }, () => ({ answer: false, explanation: '' }));
}

function emptyAddress(): UsAddress {
  return { street: '', city: '', state: '', postalCode: '', country: '' };
}

function emptyParent(): UsParentDetails {
  return { surname: '', givenNames: '', dateOfBirth: '', doNotKnow: false, isInUs: false };
}

export function createEmptyUsData(): UsApplicationData {
  return {
    passportBio: {
      fullNameNativeLanguage: '',
      fullNameNativeDoesNotApply: false,
      otherNamesUsed: false,
      otherNames: [],
      telecodeNameUsed: false,
      telecodeName: '',
      nationalIdNumber: '',
      nationalIdDoesNotApply: false,
      usSocialSecurityNumber: '',
      usSsnDoesNotApply: false,
      usTaxpayerIdNumber: '',
      usTaxIdDoesNotApply: false,
      passportBookNumber: '',
      passportBookDoesNotApply: false,
      cityOfIssuance: '',
      lostOrStolenPassport: false,
      lostOrStolenDescription: '',
    },
    contactSocial: {
      mailingSameAsHome: true,
      mailingAddress: emptyAddress(),
      homeAddress: emptyAddress(),
      primaryPhone: '',
      secondaryPhone: '',
      workPhone: '',
      additionalPhonesPast5Years: false,
      additionalPhoneNumbers: [],
      socialMediaAccounts: [{ platform: '', handle: '' }],
    },
    travelDetails: {
      specificTravelPlans: false,
      arrivalDate: '',
      departureDate: '',
      flightInfo: '',
      usCitiesToVisit: '',
      intendedArrivalDate: '',
      intendedLengthOfStay: '',
      contactPersonName: '',
      organizationName: '',
      contactRelationship: '',
      contactPhone: '',
      contactEmail: '',
      contactUsAddress: emptyAddress(),
      tripFinancer: '',
      beenToUsBefore: false,
      pastUsTrips: [],
      issuedUsVisaBefore: false,
      lastVisaDate: '',
      lastVisaNumber: '',
      applyingSameVisaType: null,
      applyingSameCountry: null,
      fingerprintsTakenBefore: null,
      refusedUsVisaOrAdmission: false,
      refusalExplanation: '',
      immigrantPetitionFiled: false,
      immigrantPetitionExplanation: '',
    },
    familyBackground: {
      father: emptyParent(),
      mother: emptyParent(),
      immediateRelativesInUs: false,
      otherRelativesInUs: false,
      maritalStatus: '',
      spouse: null,
    },
    workEducation: {
      occupation: '',
      employerSchoolName: '',
      employerAddress: '',
      employerPhone: '',
      monthlySalaryLocal: '',
      dutiesDescription: '',
      previouslyEmployed: false,
      pastEmployments: [],
      attendedSecondaryOrAbove: false,
      educationHistory: [],
      clanOrTribeName: '',
      clanOrTribeDoesNotApply: false,
      languagesSpoken: [],
      countriesVisitedPast5Years: [],
      belongedToOrganization: false,
      organizationExplanation: '',
      specializedSkills: false,
      specializedSkillsExplanation: '',
      servedInMilitary: false,
      militaryService: null,
      paramilitaryInvolvement: false,
      paramilitaryExplanation: '',
    },
    travelersCompanions: {
      othersTravelingWithYou: false,
      travelingAsGroup: false,
      groupName: '',
      companions: [],
    },
    checkoutCompliance: {
      securityBackground: {
        medicalHealth: emptySecuritySection(US_SECURITY_QUESTIONS.medicalHealth.length),
        criminalHistory: emptySecuritySection(US_SECURITY_QUESTIONS.criminalHistory.length),
        securityTerrorism: emptySecuritySection(US_SECURITY_QUESTIONS.securityTerrorism.length),
        immigrationViolations: emptySecuritySection(US_SECURITY_QUESTIONS.immigrationViolations.length),
      },
      preparerAssisted: false,
      preparerName: '',
      submissionLocation: '',
      declarationsAccepted: false,
      signatureName: '',
    },
  };
}
