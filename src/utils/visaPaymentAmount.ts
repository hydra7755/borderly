/** Visa application payment calculation (amounts in GBP). */

import { getVisaFeeForCountryCode, DEFAULT_VISA_FEE_GBP } from '../data/visaFees';
import {
  getDiscountedServiceFeeGbp,
  getServiceFeeDiscountPercent,
} from '../config/visaServiceFee';

/** Main applicant + additional travelers from application stepper data. */
export function getTravelerCount(applicationData?: Record<string, unknown> | null): number {
  const travelers = applicationData?.travelers;
  if (Array.isArray(travelers)) {
    return travelers.length + 1;
  }
  return 1;
}

export function getVisaApplicationTotalGbp(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null
): number {
  const travelerCount = getTravelerCount(applicationData);
  const visaFeePerTraveler = destinationCode
    ? getVisaFeeForCountryCode(destinationCode)
    : DEFAULT_VISA_FEE_GBP;
  const serviceFee = getDiscountedServiceFeeGbp(
    getServiceFeeDiscountPercent(subscriptionTier)
  );
  return Number((visaFeePerTraveler * travelerCount + serviceFee).toFixed(2));
}

/** Total visa application charge in pence (Stripe smallest currency unit). */
export function getVisaApplicationAmountPence(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null
): number {
  return Math.round(
    getVisaApplicationTotalGbp(destinationCode, applicationData, subscriptionTier) * 100
  );
}

export function getVisaApplicationAmountGbp(
  destinationCode?: string | null,
  applicationData?: Record<string, unknown> | null,
  subscriptionTier?: string | null
): number {
  return getVisaApplicationAmountPence(destinationCode, applicationData, subscriptionTier) / 100;
}
