/** Premium visa / entry document types held by the applicant */
export type PremiumVisaType = 'US' | 'UK' | 'SCHENGEN' | 'AU' | 'CA' | 'NZ';

export type CheckoutPipelinePath =
  | 'standard_evisa'
  | 'standard_schengen'
  | 'standard_us'
  | 'residence_unlocked_schengen'
  | 'premium_visa_shortcut_schengen'
  | 'embassy_only';

export type UnlockedStatusType =
  | 'schengen_type_c_standard'
  | 'schengen_residence_permit_route'
  | 'schengen_valid_visa_holder_route'
  | 'evisa_standard'
  | 'us_ds160_standard'
  | 'embassy_traditional'
  | 'morocco_waiver_evisa'
  | 'turkey_waiver_evisa';

/**
 * Form fields that can be waived on wizard steps 3 (Travel) and 4 (Travelers).
 * Keys align with validation paths in schengenVisaSchema and generic travel fields.
 */
export type WaivedFormField =
  | 'travel.accommodation.phone'
  | 'travel.accommodation.email'
  | 'travel.bookingConfirmation'
  | 'travel.schengen.priorSchengenVisa'
  | 'travel.schengen.fingerprints'
  | 'travel.schengen.hostContact'
  | 'travelers.euFamilyExemption'
  | 'travelers.additionalTravelersPrompt';

export interface VisaRoutingRuleBlock {
  unlockedStatusType: UnlockedStatusType;
  maxStayPeriod: string;
  checkoutPath: CheckoutPipelinePath;
  waivedFormFields: WaivedFormField[];
}

export interface PremiumVisaExemptionRule {
  requiredDocumentType: PremiumVisaType;
  unlockedStatusType: UnlockedStatusType;
  maxStayPeriod: string;
  checkoutPath: CheckoutPipelinePath;
  waivedFormFields: WaivedFormField[];
}

export interface DestinationVisaRoutingRule {
  /** Destination ISO code (alpha-2 or alpha-3) or `SCHENGEN` for all Schengen states */
  destinationCode: string;
  /** Passport nationalities this rule applies to (alpha-2 or alpha-3, e.g. PK / PAK) */
  passportNationalities: string[];
  /** Residence_Country column — residence that triggers override (e.g. GBR, USA) */
  residenceCountries: string[];
  baseRuleIfNoMatch: VisaRoutingRuleBlock;
  residenceMatchOverride: VisaRoutingRuleBlock;
  premiumVisaExemptions: PremiumVisaExemptionRule[];
}

export type ResidenceMode = 'home' | 'abroad';

export interface VisaEligibilityInput {
  passportNationality: string;
  residenceCountry: string | null;
  residenceMode: ResidenceMode;
  heldPremiumVisas: PremiumVisaType[];
}

export type RoutingMatchReason =
  | 'base'
  | 'residence_override'
  | 'premium_visa_exemption';

export interface VisaRoutingResult {
  destinationCode: string;
  passportNationality: string;
  residenceCountry: string | null;
  heldPremiumVisas: PremiumVisaType[];
  matchReason: RoutingMatchReason;
  matchedPremiumVisa: PremiumVisaType | null;
  unlockedStatusType: UnlockedStatusType;
  maxStayPeriod: string;
  maxStayDays: number | null;
  checkoutPath: CheckoutPipelinePath;
  waivedFormFields: WaivedFormField[];
  canApplyOnline: boolean;
  visaTypeLabel: string;
  routingNotes: string[];
}

export const VISA_ROUTING_UPDATED_EVENT = 'borderly:visa-routing-updated';

export interface VisaRoutingUpdatedDetail {
  destinationCode: string;
  passportNationality: string;
  result: VisaRoutingResult;
  eligibility: VisaEligibilityInput;
}
