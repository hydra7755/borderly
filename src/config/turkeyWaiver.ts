/** Turkey e-Visa supporting-document waiver program. */

import { SCHENGEN_COUNTRY_CODES } from '../utils/schengenCountries';
import type { VisaRoutingResult } from '../types/visaRouting';

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

/** USA, UK, Ireland, and Schengen member states — the only issuers that unlock the Turkish e-Visa route. */
export const TURKEY_WAIVER_SUPPORTING_COUNTRIES = [
  'us',
  'gb',
  'ie',
  ...SCHENGEN_COUNTRY_CODES,
];

export const TURKEY_DESTINATION_CODE = 'tr';

export function isTurkeyDestination(destinationCode?: string | null): boolean {
  return normalizeCode(destinationCode ?? '') === TURKEY_DESTINATION_CODE;
}

export function isTurkeyWaiverUnlocked(routing: VisaRoutingResult): boolean {
  return (
    isTurkeyDestination(routing.destinationCode) &&
    routing.unlockedStatusType === 'turkey_waiver_evisa' &&
    routing.canApplyOnline
  );
}

export function shouldShowTurkeyWaiverInfo(
  destinationCode?: string | null,
  visaRequirement?: string | null
): boolean {
  if (!isTurkeyDestination(destinationCode)) return false;
  if (!visaRequirement) return true;
  return visaRequirement === 'visa-required';
}

export function getTurkeyWaiverContent(passportCountryName = 'your country') {
  return {
    title: `Simplified Entry for ${passportCountryName}`,
    intro:
      `Typically, citizens of ${passportCountryName} are required to visit an embassy for a sticker visa. However, you may be eligible for a Turkish e-Visa if you hold an active, unexpired physical visa or residence permit issued by one of the supporting countries below.`,
    eligibilityHeading: 'Supporting Documents That Unlock the Turkish e-Visa',
    eligibilityIntro:
      'You must have a valid ordinary passport AND one of these active physical documents:',
    visaOrPermitLabel: 'Valid Visa or Residence Permit',
    visaOrPermitCountries:
      'United States (e.g. B1/B2 tourist visa or Green Card), United Kingdom, any Schengen Area member state (France, Germany, Italy, Spain, etc.), or Ireland.',
    importantHeading: 'Critical Requirements',
    importantRules: [
      {
        title: 'Sticker / physical only',
        body: 'The supporting document must be a physical sticker visa stamped in your passport or a physical residence permit card. Turkish immigration does not accept electronic visas (e-Visas) or electronic residence permits from the US, UK, or Schengen as valid backup documents.',
      },
      {
        title: 'Validity on arrival day',
        body: 'The supporting visa or residence permit must be completely valid on the exact day you cross the border into Turkey. If it expires even one day before arrival, the e-Visa becomes legally void.',
      },
      {
        title: 'Prior entry not required',
        body: 'Turkey does not require that you have previously used your US, UK, Schengen, or Irish visa. A brand-new, unused single- or multiple-entry sticker visa is acceptable if validity covers your arrival date.',
      },
      {
        title: 'Baseline prerequisites',
        body: 'Even with the e-Visa unlocked, you must hold a return ticket, a hotel reservation, and proof of financial sufficiency (customarily estimated at $50 USD per day of stay).',
      },
    ],
    howToHeading: 'How to Apply Through Borderly',
    steps: [
      `Prepare scans of your ${passportCountryName} passport and your physical supporting visa or residence permit.`,
      'Complete the online application accurately — details must match your supporting document exactly.',
      'Pay the government visa fee and Borderly service fee, then submit for processing.',
      'Receive your Turkish e-Visa approval electronically before you travel.',
    ],
  };
}
