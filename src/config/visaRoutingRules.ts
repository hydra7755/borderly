import type { DestinationVisaRoutingRule } from '../types/visaRouting';
import { MOROCCO_WAIVER_RESIDENCE_COUNTRIES } from './moroccoWaiver';
import { TURKEY_WAIVER_SUPPORTING_COUNTRIES } from './turkeyWaiver';

const RESIDENCE_WAIVED_TRAVEL: DestinationVisaRoutingRule['residenceMatchOverride']['waivedFormFields'] = [
  'travel.accommodation.phone',
  'travel.accommodation.email',
  'travel.bookingConfirmation',
  'travel.schengen.priorSchengenVisa',
  'travel.schengen.fingerprints',
  'travel.schengen.hostContact',
];

const PREMIUM_UK_WAIVED: DestinationVisaRoutingRule['premiumVisaExemptions'][0]['waivedFormFields'] = [
  'travel.accommodation.phone',
  'travel.bookingConfirmation',
  'travel.schengen.priorSchengenVisa',
  'travel.schengen.hostContact',
  'travelers.additionalTravelersPrompt',
];

const PREMIUM_US_WAIVED: DestinationVisaRoutingRule['premiumVisaExemptions'][0]['waivedFormFields'] = [
  'travel.schengen.fingerprints',
  'travel.schengen.priorSchengenVisa',
  'travel.schengen.hostContact',
  'travelers.euFamilyExemption',
];

const PREMIUM_SCHENGEN_WAIVED: DestinationVisaRoutingRule['premiumVisaExemptions'][0]['waivedFormFields'] = [
  'travel.schengen.priorSchengenVisa',
  'travel.schengen.fingerprints',
  'travel.accommodation.email',
  'travelers.additionalTravelersPrompt',
];

/**
 * Logic matrix — column names mirror the routing specification:
 * Residence_Country, Base_Rule_If_No_Match, Unlocked_Status_Type, Max_Stay_Period,
 * Required_Document_Type, Waived_Form_Fields.
 */
export const VISA_ROUTING_RULES: DestinationVisaRoutingRule[] = [
  {
    destinationCode: 'SCHENGEN',
    passportNationalities: ['PK', 'PAK'],
    residenceCountries: ['GBR', 'GB', 'USA', 'US', 'ARE', 'AE'],
    baseRuleIfNoMatch: {
      unlockedStatusType: 'schengen_type_c_standard',
      maxStayPeriod: '90 days',
      checkoutPath: 'standard_schengen',
      waivedFormFields: [],
    },
    residenceMatchOverride: {
      unlockedStatusType: 'schengen_residence_permit_route',
      maxStayPeriod: '90 days',
      checkoutPath: 'residence_unlocked_schengen',
      waivedFormFields: RESIDENCE_WAIVED_TRAVEL,
    },
    premiumVisaExemptions: [
      {
        requiredDocumentType: 'UK',
        unlockedStatusType: 'schengen_valid_visa_holder_route',
        maxStayPeriod: '90 days',
        checkoutPath: 'premium_visa_shortcut_schengen',
        waivedFormFields: PREMIUM_UK_WAIVED,
      },
      {
        requiredDocumentType: 'US',
        unlockedStatusType: 'schengen_valid_visa_holder_route',
        maxStayPeriod: '90 days',
        checkoutPath: 'premium_visa_shortcut_schengen',
        waivedFormFields: PREMIUM_US_WAIVED,
      },
      {
        requiredDocumentType: 'SCHENGEN',
        unlockedStatusType: 'schengen_valid_visa_holder_route',
        maxStayPeriod: '90 days',
        checkoutPath: 'premium_visa_shortcut_schengen',
        waivedFormFields: PREMIUM_SCHENGEN_WAIVED,
      },
    ],
  },
  {
    destinationCode: 'TR',
    passportNationalities: ['*'],
    residenceCountries: TURKEY_WAIVER_SUPPORTING_COUNTRIES,
    baseRuleIfNoMatch: {
      unlockedStatusType: 'embassy_traditional',
      maxStayPeriod: 'Embassy visa — duration set by consulate',
      checkoutPath: 'embassy_only',
      waivedFormFields: [],
    },
    residenceMatchOverride: {
      unlockedStatusType: 'turkey_waiver_evisa',
      maxStayPeriod: '30 days',
      checkoutPath: 'standard_evisa',
      waivedFormFields: [],
    },
    premiumVisaExemptions: [
      {
        requiredDocumentType: 'US',
        unlockedStatusType: 'turkey_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
      {
        requiredDocumentType: 'UK',
        unlockedStatusType: 'turkey_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
      {
        requiredDocumentType: 'SCHENGEN',
        unlockedStatusType: 'turkey_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
    ],
  },
  {
    destinationCode: 'US',
    passportNationalities: ['PK', 'PAK'],
    residenceCountries: ['GBR', 'GB'],
    baseRuleIfNoMatch: {
      unlockedStatusType: 'us_ds160_standard',
      maxStayPeriod: 'As per visa validity',
      checkoutPath: 'standard_us',
      waivedFormFields: [],
    },
    residenceMatchOverride: {
      unlockedStatusType: 'us_ds160_standard',
      maxStayPeriod: 'As per visa validity',
      checkoutPath: 'standard_us',
      waivedFormFields: ['travelers.additionalTravelersPrompt'],
    },
    premiumVisaExemptions: [
      {
        requiredDocumentType: 'UK',
        unlockedStatusType: 'us_ds160_standard',
        maxStayPeriod: 'As per visa validity',
        checkoutPath: 'standard_us',
        waivedFormFields: ['travelers.euFamilyExemption'],
      },
      {
        requiredDocumentType: 'SCHENGEN',
        unlockedStatusType: 'us_ds160_standard',
        maxStayPeriod: 'As per visa validity',
        checkoutPath: 'standard_us',
        waivedFormFields: ['travel.schengen.priorSchengenVisa'],
      },
    ],
  },
  {
    destinationCode: 'MA',
    passportNationalities: ['*'],
    residenceCountries: MOROCCO_WAIVER_RESIDENCE_COUNTRIES,
    baseRuleIfNoMatch: {
      unlockedStatusType: 'embassy_traditional',
      maxStayPeriod: 'Embassy visa — duration set by consulate',
      checkoutPath: 'embassy_only',
      waivedFormFields: [],
    },
    residenceMatchOverride: {
      unlockedStatusType: 'morocco_waiver_evisa',
      maxStayPeriod: '30 days',
      checkoutPath: 'standard_evisa',
      waivedFormFields: [],
    },
    premiumVisaExemptions: [
      {
        requiredDocumentType: 'SCHENGEN',
        unlockedStatusType: 'morocco_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
      {
        requiredDocumentType: 'US',
        unlockedStatusType: 'morocco_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
      {
        requiredDocumentType: 'UK',
        unlockedStatusType: 'morocco_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
      {
        requiredDocumentType: 'AU',
        unlockedStatusType: 'morocco_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
      {
        requiredDocumentType: 'CA',
        unlockedStatusType: 'morocco_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
      {
        requiredDocumentType: 'NZ',
        unlockedStatusType: 'morocco_waiver_evisa',
        maxStayPeriod: '30 days',
        checkoutPath: 'standard_evisa',
        waivedFormFields: [],
      },
    ],
  },
];
