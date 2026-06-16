/** Visa application payment calculation (amounts in GBP). */

import { getVisaFeeForCountryCode, DEFAULT_VISA_FEE_GBP, VISA_FEES } from '../data/visaFees';
import {
  getDiscountedServiceFeeGbp,
  getServiceFeeDiscountPercent,
} from '../config/visaServiceFee';
import { isSchengenCountry } from '../utils/schengenCountries';
import {
  calculateSchengenBorderlyTotalGbp,
  countTravelDays,
  isUkResident,
} from '../config/schengenPricing';
import { EVISA_EXPRESS_PROCESSING_FEE_GBP } from '../config/evisaPricing';
import { parseEligibilityFromSearchParams } from '../engine/visaRoutingEngine';
import { isUnitedStates } from '../utils/unitedStatesVisa';

/** Main applicant + additional travelers from application stepper data. */
export function getTravelerCount(applicationData?: Record<string, unknown> | null): number {
  const travelers = applicationData?.travelers;
  if (Array.isArray(travelers)) {
    return travelers.length + 1;
  }
  return 1;
}

function getEvisaAddons(applicationData?: Record<string, unknown> | null) {
  const addons = applicationData?.evisaAddons as { expressProcessing?: boolean } | undefined;
  return { expressProcessing: Boolean(addons?.expressProcessing) };
}

function getSchengenAddons(applicationData?: Record<string, unknown> | null) {
  const addons = applicationData?.schengenAddons as
    | { travelInsurance?: boolean }
    | undefined;
  return {
    addTravelInsurance: Boolean(addons?.travelInsurance),
  };
}

function isEvisaDestinationCode(destinationCode?: string | null): boolean {
  if (!destinationCode) return false;
  const code = destinationCode.toLowerCase();
  if (isSchengenCountry(code) || isUnitedStates(code)) return false;
  return VISA_FEES.some((entry) => entry.countryCode === code);
}

function getTravelDaysFromApplication(applicationData?: Record<string, unknown> | null): number {
  const travelDates = applicationData?.travelDates as
    | { arrival?: string; departure?: string }
    | undefined;
  if (!travelDates?.arrival || !travelDates?.departure) return 1;
  return countTravelDays(travelDates.arrival, travelDates.departure) || 1;
}

function resolveUkResidentFromApplication(
  applicationData?: Record<string, unknown> | null,
  nationalityCode?: string | null
): boolean {
  const eligibility = applicationData?.eligibility as
    | {
        residenceCountry?: string | null;
        residenceMode?: 'home' | 'abroad';
        passportNationality?: string;
      }
    | undefined;

  if (eligibility) {
    return isUkResident(
      eligibility.residenceCountry ?? null,
      eligibility.residenceMode ?? 'home',
      eligibility.passportNationality || nationalityCode || ''
    );
  }

  if (nationalityCode) {
    return isUkResident(null, 'home', nationalityCode);
  }

  return false;
}

export function getVisaApplicationTotalGbp(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null,
  nationalityCode?: string | null
): number {
  const travelerCount = getTravelerCount(applicationData);
  const discountPercent = getServiceFeeDiscountPercent(subscriptionTier);

  if (destinationCode && isSchengenCountry(destinationCode)) {
    const { addTravelInsurance } = getSchengenAddons(applicationData);
    const travelDays = getTravelDaysFromApplication(applicationData);
    const ukResident = resolveUkResidentFromApplication(applicationData, nationalityCode);

    return calculateSchengenBorderlyTotalGbp({
      travelerCount,
      discountPercent,
      addTravelInsurance,
      travelDays,
      isUkResident: ukResident,
    }).total;
  }

  const visaFeePerTraveler = destinationCode
    ? getVisaFeeForCountryCode(destinationCode)
    : DEFAULT_VISA_FEE_GBP;
  const serviceFee = getDiscountedServiceFeeGbp(discountPercent);
  let total = visaFeePerTraveler * travelerCount + serviceFee;

  const { expressProcessing } = getEvisaAddons(applicationData);
  if (expressProcessing && isEvisaDestinationCode(destinationCode)) {
    total += EVISA_EXPRESS_PROCESSING_FEE_GBP;
  }

  return Number(total.toFixed(2));
}

/** Total visa application charge in pence (Stripe smallest currency unit). */
export function getVisaApplicationAmountPence(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null,
  nationalityCode?: string | null
): number {
  return Math.round(
    getVisaApplicationTotalGbp(
      destinationCode,
      applicationData,
      subscriptionTier,
      nationalityCode
    ) * 100
  );
}

export function getVisaApplicationAmountGbp(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null,
  nationalityCode?: string | null
): number {
  return (
    getVisaApplicationAmountPence(
      destinationCode,
      applicationData,
      subscriptionTier,
      nationalityCode
    ) / 100
  );
}

export function buildApplicationPaymentContext(
  nationalityCode: string,
  searchParams: string,
  schengenAddons?: { travelInsurance?: boolean }
) {
  const eligibility = parseEligibilityFromSearchParams(nationalityCode, searchParams);
  return {
    eligibility,
    schengenAddons: schengenAddons ?? {},
  };
}
