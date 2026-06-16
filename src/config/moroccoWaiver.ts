/** Morocco e-Visa waiver program for Pakistani passport holders. */

import type { VisaRoutingResult } from '../types/visaRouting';

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

/** EU member states (ISO alpha-2). */
export const EU_MEMBER_COUNTRY_CODES = [
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it',
  'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se',
] as const;

/** Residence permits from these countries qualify for the Morocco waiver. */
export const MOROCCO_WAIVER_RESIDENCE_COUNTRIES = [
  ...EU_MEMBER_COUNTRY_CODES,
  'us',
  'gb',
  'au',
  'ca',
  'jp',
  'no',
  'ae',
];

export const MOROCCO_DESTINATION_CODE = 'ma';

/** When set on a routing rule, the rule applies to every passport nationality. */
export const ALL_PASSPORT_NATIONALITIES = '*';

export function isMoroccoDestination(destinationCode?: string | null): boolean {
  return normalizeCode(destinationCode ?? '') === MOROCCO_DESTINATION_CODE;
}

/** @deprecated Use isMoroccoDestination + visa requirement check instead */
export function isMoroccoPakistanRoute(
  passportCode?: string | null,
  destinationCode?: string | null
): boolean {
  return isMoroccoDestination(destinationCode);
}

export function isMoroccoWaiverUnlocked(routing: VisaRoutingResult): boolean {
  return (
    isMoroccoDestination(routing.destinationCode) &&
    routing.unlockedStatusType === 'morocco_waiver_evisa' &&
    routing.canApplyOnline
  );
}

export function shouldShowMoroccoWaiverInfo(
  destinationCode?: string | null,
  visaRequirement?: string | null
): boolean {
  if (!isMoroccoDestination(destinationCode)) return false;
  if (!visaRequirement) return true;
  return visaRequirement === 'visa-required';
}

export function getMoroccoWaiverContent(passportCountryName = 'your country') {
  return {
    title: `Simplified Entry for ${passportCountryName}`,
    intro:
      `Typically, citizens of ${passportCountryName} are required to visit an embassy for a sticker visa. However, under the Moroccan Government's waiver program, you are eligible for an e-Visa if you possess EITHER of the following supporting documents:`,
    eligibilityHeading: 'Eligibility Checklist',
    eligibilityIntro:
      `To apply, you must have a valid ordinary passport AND one of these active documents:`,
    multiEntryVisaLabel: 'Valid Multi-Entry Visa',
    multiEntryVisaCountries:
      'From the Schengen Area, USA, United Kingdom, Australia, Canada, or New Zealand.',
    residencePermitLabel: 'Valid Residence Permit',
    residencePermitCountries:
      'From the European Union, USA, United Kingdom, Australia, Canada, Japan, Norway, or UAE.',
    validityHeading: 'Crucial Validity Rules',
    visaValidityRule:
      'If using a Visa: It must be valid for at least 90 days from the date you arrive in Morocco.',
    permitValidityRule:
      'If using a Residence Permit: It must be valid for at least 180 days from your arrival.',
    howToHeading: 'How to Secure Your e-Visa',
    steps: [
      `Prepare a high-quality scan of your ${passportCountryName} passport and your supporting visa/permit.`,
      'Fill in the online form accurately. Any discrepancy with your supporting document could lead to delays.',
      'Select your processing speed (Standard or Urgent) and complete payment.',
      'Receive your official Morocco e-Visa PDF via email within 1-3 business days.',
    ],
  };
}

/** @deprecated Use getMoroccoWaiverContent() */
export const MOROCCO_WAIVER_CONTENT = getMoroccoWaiverContent('Pakistan');
