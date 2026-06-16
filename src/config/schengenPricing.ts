import { normalizeCountryCode } from '../engine/visaRoutingEngine';

/** Fees collected by Borderly for Schengen applications (GBP). */
export const SCHENGEN_APPOINTMENT_BOOKING_FEE_GBP = 35;
export const SCHENGEN_BORDERLY_SERVICE_FEE_GBP = 90;

export const SCHENGEN_TRAVEL_INSURANCE_BASE_GBP = 20;
export const SCHENGEN_TRAVEL_INSURANCE_EXTRA_PER_DAY_GBP = 10;

/** Paid at the VFS/appointment centre — informational only, not charged by Borderly. */
export interface SchengenEmbassyFeeRow {
  category: string;
  governmentFeeEur: number;
  vfsServiceFeeEur: number;
  routeType: string;
  biometricRequired: boolean;
  notes: string;
}

export const SCHENGEN_EMBASSY_FEE_REFERENCE: SchengenEmbassyFeeRow[] = [
  {
    category: 'Adult (Ages 12+)',
    governmentFeeEur: 90,
    vfsServiceFeeEur: 40,
    routeType: 'BASE_ROUTE',
    biometricRequired: false,
    notes: 'Standard application',
  },
  {
    category: 'Child (Ages 6 to 11)',
    governmentFeeEur: 45,
    vfsServiceFeeEur: 40,
    routeType: 'BASE_ROUTE',
    biometricRequired: false,
    notes: 'Standard application',
  },
  {
    category: 'Minor (Ages 0 to 5)',
    governmentFeeEur: 0,
    vfsServiceFeeEur: 40,
    routeType: 'EXEMPT_GOV_FEE',
    biometricRequired: false,
    notes: 'Government fee automatically waived worldwide',
  },
  {
    category: 'EU Citizen Family',
    governmentFeeEur: 0,
    vfsServiceFeeEur: 40,
    routeType: 'WAIVER_QUALIFIED',
    biometricRequired: false,
    notes: 'Valid proof of relationship to EU/EEA national required',
  },
  {
    category: 'Diplomatic Passport',
    governmentFeeEur: 0,
    vfsServiceFeeEur: 0,
    routeType: 'FULLY_EXEMPT',
    biometricRequired: false,
    notes: 'Official state business / biometric exceptions',
  },
];

export const SCHENGEN_REQUIRED_DOCUMENTS: Array<{ name: string; description: string }> = [
  {
    name: 'Confirmed flight tickets',
    description: 'Return or onward flight booking confirmation showing entry and exit dates.',
  },
  {
    name: 'Hotel reservation',
    description: 'Confirmed accommodation for your entire stay in the Schengen area.',
  },
  {
    name: 'Travel insurance (minimum €30,000 coverage)',
    description:
      'Valid Schengen travel medical insurance covering the full trip with at least €30,000 emergency cover.',
  },
];

export function isUkResident(
  residenceCountry: string | null | undefined,
  residenceMode: 'home' | 'abroad',
  passportNationality: string
): boolean {
  const residence =
    residenceMode === 'abroad' && residenceCountry
      ? normalizeCountryCode(residenceCountry)
      : normalizeCountryCode(passportNationality);
  return residence === 'gb';
}

export function countTravelDays(arrival: string, departure: string): number {
  if (!arrival || !departure) return 0;
  const start = new Date(arrival);
  const end = new Date(departure);
  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diffMs < 0) return 0;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** Base £20 for trips under 5 days; +£10 per day from day 5 onward. */
export function calculateSchengenTravelInsuranceGbp(travelDays: number): number {
  const days = Math.max(travelDays, 1);
  if (days < 5) return SCHENGEN_TRAVEL_INSURANCE_BASE_GBP;
  return (
    SCHENGEN_TRAVEL_INSURANCE_BASE_GBP +
    (days - 4) * SCHENGEN_TRAVEL_INSURANCE_EXTRA_PER_DAY_GBP
  );
}

export function getSchengenBorderlyServiceFeeGbp(discountPercent = 0): number {
  return Number(
    (SCHENGEN_BORDERLY_SERVICE_FEE_GBP * (1 - discountPercent / 100)).toFixed(2)
  );
}

export function calculateSchengenBorderlyTotalGbp(options: {
  travelerCount: number;
  discountPercent?: number;
  addTravelInsurance: boolean;
  travelDays: number;
  isUkResident: boolean;
}): {
  appointmentFee: number;
  serviceFee: number;
  travelInsurance: number;
  travelInsurancePerTraveler: number;
  total: number;
} {
  const travelerCount = Math.max(options.travelerCount, 1);
  const appointmentFee = SCHENGEN_APPOINTMENT_BOOKING_FEE_GBP * travelerCount;
  const serviceFee = getSchengenBorderlyServiceFeeGbp(options.discountPercent ?? 0);
  const travelInsurancePerTraveler =
    options.addTravelInsurance && options.isUkResident
      ? calculateSchengenTravelInsuranceGbp(options.travelDays || 1)
      : 0;
  const travelInsurance = travelInsurancePerTraveler * travelerCount;
  const total = Number((appointmentFee + serviceFee + travelInsurance).toFixed(2));

  return {
    appointmentFee,
    serviceFee,
    travelInsurance,
    travelInsurancePerTraveler,
    total,
  };
}
