/** Current Schengen Area member states (29 countries, incl. Iceland, Liechtenstein, Norway, Switzerland). */
export const SCHENGEN_COUNTRY_CODES = [
  'at', // Austria
  'be', // Belgium
  'bg', // Bulgaria
  'hr', // Croatia
  'cz', // Czech Republic
  'dk', // Denmark
  'ee', // Estonia
  'fi', // Finland
  'fr', // France
  'de', // Germany
  'gr', // Greece
  'hu', // Hungary
  'is', // Iceland
  'it', // Italy
  'lv', // Latvia
  'li', // Liechtenstein
  'lt', // Lithuania
  'lu', // Luxembourg
  'mt', // Malta
  'nl', // Netherlands
  'no', // Norway
  'pl', // Poland
  'pt', // Portugal
  'ro', // Romania
  'sk', // Slovakia
  'si', // Slovenia
  'es', // Spain
  'se', // Sweden
  'ch', // Switzerland
] as const;

export type SchengenCountryCode = (typeof SCHENGEN_COUNTRY_CODES)[number];

export const SCHENGEN_COUNTRY_NAMES: Record<SchengenCountryCode, string> = {
  at: 'Austria',
  be: 'Belgium',
  bg: 'Bulgaria',
  hr: 'Croatia',
  cz: 'Czech Republic',
  dk: 'Denmark',
  ee: 'Estonia',
  fi: 'Finland',
  fr: 'France',
  de: 'Germany',
  gr: 'Greece',
  hu: 'Hungary',
  is: 'Iceland',
  it: 'Italy',
  lv: 'Latvia',
  li: 'Liechtenstein',
  lt: 'Lithuania',
  lu: 'Luxembourg',
  mt: 'Malta',
  nl: 'Netherlands',
  no: 'Norway',
  pl: 'Poland',
  pt: 'Portugal',
  ro: 'Romania',
  sk: 'Slovakia',
  si: 'Slovenia',
  es: 'Spain',
  se: 'Sweden',
  ch: 'Switzerland',
};

export function isSchengenCountry(countryCode: string | undefined | null): boolean {
  if (!countryCode) return false;
  return SCHENGEN_COUNTRY_CODES.includes(countryCode.toLowerCase() as SchengenCountryCode);
}

import { isUnitedStates } from './unitedStatesVisa';

/**
 * Whether Borderly supports an online application for this route.
 * eVisa/ETA countries always qualify; traditional visa countries qualify for Schengen and U.S.
 */
export function canApplyOnlineForDestination(
  requirement: string,
  destinationCountryCode: string
): boolean {
  if (['evisa', 'eta'].includes(requirement)) return true;
  if (requirement === 'visa-required') {
    return (
      isSchengenCountry(destinationCountryCode) ||
      isUnitedStates(destinationCountryCode)
    );
  }
  return false;
}

export function isSchengenVisaApplication(
  requirement: string,
  destinationCountryCode: string
): boolean {
  return requirement === 'visa-required' && isSchengenCountry(destinationCountryCode);
}

export const SCHENGEN_COUNTRY_OPTIONS = SCHENGEN_COUNTRY_CODES.map((code) => ({
  value: code,
  label: SCHENGEN_COUNTRY_NAMES[code],
}));
