import { SCHENGEN_COUNTRY_CODES } from '../utils/schengenCountries';
import { isUnitedStates } from '../utils/unitedStatesVisa';
import { VISA_ROUTING_RULES } from '../config/visaRoutingRules';
import type {
  DestinationVisaRoutingRule,
  PremiumVisaType,
  VisaEligibilityInput,
  VisaRoutingResult,
  WaivedFormField,
  RoutingMatchReason,
  VisaRoutingRuleBlock,
} from '../types/visaRouting';

const ALPHA3_TO_ALPHA2: Record<string, string> = {
  AFG: 'af', ALB: 'al', DZA: 'dz', AND: 'ad', AGO: 'ao', ATG: 'ag', ARG: 'ar', ARM: 'am',
  AUS: 'au', AUT: 'at', AZE: 'az', BHS: 'bs', BHR: 'bh', BGD: 'bd', BRB: 'bb', BLR: 'by',
  BEL: 'be', BLZ: 'bz', BEN: 'bj', BTN: 'bt', BOL: 'bo', BIH: 'ba', BWA: 'bw', BRA: 'br',
  BRN: 'bn', BGR: 'bg', BFA: 'bf', BDI: 'bi', KHM: 'kh', CMR: 'cm', CAN: 'ca', CPV: 'cv',
  CAF: 'cf', TCD: 'td', CHL: 'cl', CHN: 'cn', COL: 'co', COM: 'km', COG: 'cg', COD: 'cd',
  CRI: 'cr', HRV: 'hr', CUB: 'cu', CYP: 'cy', CZE: 'cz', DNK: 'dk', DJI: 'dj', DMA: 'dm',
  DOM: 'do', ECU: 'ec', EGY: 'eg', SLV: 'sv', GNQ: 'gq', ERI: 'er', EST: 'ee', ETH: 'et',
  FJI: 'fj', FIN: 'fi', FRA: 'fr', GAB: 'ga', GMB: 'gm', GEO: 'ge', DEU: 'de', GHA: 'gh',
  GRC: 'gr', GRD: 'gd', GTM: 'gt', GIN: 'gn', GNB: 'gw', GUY: 'gy', HTI: 'ht', HND: 'hn',
  HUN: 'hu', ISL: 'is', IND: 'in', IDN: 'id', IRN: 'ir', IRQ: 'iq', IRL: 'ie', ISR: 'il',
  ITA: 'it', JAM: 'jm', JPN: 'jp', JOR: 'jo', KAZ: 'kz', KEN: 'ke', KIR: 'ki', PRK: 'kp',
  KOR: 'kr', KWT: 'kw', KGZ: 'kg', LAO: 'la', LVA: 'lv', LBN: 'lb', LSO: 'ls', LBR: 'lr',
  LBY: 'ly', LIE: 'li', LTU: 'lt', LUX: 'lu', MKD: 'mk', MDG: 'mg', MWI: 'mw', MYS: 'my',
  MDV: 'mv', MLI: 'ml', MLT: 'mt', MHL: 'mh', MRT: 'mr', MUS: 'mu', MEX: 'mx', FSM: 'fm',
  MDA: 'md', MCO: 'mc', MNG: 'mn', MNE: 'me', MAR: 'ma', MOZ: 'mz', MMR: 'mm', NAM: 'na',
  NRU: 'nr', NPL: 'np', NLD: 'nl', NZL: 'nz', NIC: 'ni', NER: 'ne', NGA: 'ng', NOR: 'no',
  OMN: 'om', PAK: 'pk', PLW: 'pw', PAN: 'pa', PNG: 'pg', PRY: 'py', PER: 'pe', PHL: 'ph',
  POL: 'pl', PRT: 'pt', QAT: 'qa', ROU: 'ro', RUS: 'ru', RWA: 'rw', KNA: 'kn', LCA: 'lc',
  VCT: 'vc', WSM: 'ws', SMR: 'sm', STP: 'st', SAU: 'sa', SEN: 'sn', SRB: 'rs', SYC: 'sc',
  SLE: 'sl', SGP: 'sg', SVK: 'sk', SVN: 'si', SLB: 'sb', SOM: 'so', ZAF: 'za', SSD: 'ss',
  ESP: 'es', LKA: 'lk', SDN: 'sd', SUR: 'sr', SWZ: 'sz', SWE: 'se', CHE: 'ch', SYR: 'sy',
  TWN: 'tw', TJK: 'tj', TZA: 'tz', THA: 'th', TLS: 'tl', TGO: 'tg', TON: 'to', TTO: 'tt',
  TUN: 'tn', TUR: 'tr', TKM: 'tm', TUV: 'tv', UGA: 'ug', UKR: 'ua', ARE: 'ae', GBR: 'gb',
  USA: 'us', URY: 'uy', UZB: 'uz', VUT: 'vu', VAT: 'va', VEN: 've', VNM: 'vn', YEM: 'ye',
  ZMB: 'zm', ZWE: 'zw',
};

const ALPHA2_TO_ALPHA3: Record<string, string> = Object.fromEntries(
  Object.entries(ALPHA3_TO_ALPHA2).map(([a3, a2]) => [a2, a3])
);

export function normalizeCountryCode(code: string | null | undefined): string {
  if (!code?.trim()) return '';
  const trimmed = code.trim();
  const upper = trimmed.toUpperCase();
  if (upper.length === 3 && ALPHA3_TO_ALPHA2[upper]) {
    return ALPHA3_TO_ALPHA2[upper];
  }
  return trimmed.toLowerCase();
}

export function toAlpha3(code: string | null | undefined): string {
  if (!code?.trim()) return '';
  const normalized = normalizeCountryCode(code);
  if (!normalized) return '';
  if (normalized.length === 2) {
    return ALPHA2_TO_ALPHA3[normalized] ?? normalized.toUpperCase();
  }
  return normalized.toUpperCase();
}

function codesMatch(a: string, b: string): boolean {
  return normalizeCountryCode(a) === normalizeCountryCode(b);
}

function listIncludesCode(list: string[], code: string): boolean {
  const normalized = normalizeCountryCode(code);
  return list.some((item) => normalizeCountryCode(item) === normalized);
}

function parseMaxStayDays(maxStayPeriod: string): number | null {
  const match = maxStayPeriod.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function resolveDestinationRules(destinationCode: string): DestinationVisaRoutingRule[] {
  const dest = normalizeCountryCode(destinationCode);
  const isSchengen = SCHENGEN_COUNTRY_CODES.includes(dest);
  const isUs = isUnitedStates(dest);

  return VISA_ROUTING_RULES.filter((rule) => {
    const ruleDest = rule.destinationCode.toUpperCase();
    if (ruleDest === 'SCHENGEN' && isSchengen) return true;
    if (ruleDest === 'US' && isUs) return true;
    return codesMatch(rule.destinationCode, dest);
  });
}

function isMoroccoRule(rule: DestinationVisaRoutingRule): boolean {
  return codesMatch(rule.destinationCode, 'ma');
}

function isTurkeyRule(rule: DestinationVisaRoutingRule): boolean {
  return codesMatch(rule.destinationCode, 'tr');
}

function pickRuleBlock(
  rule: DestinationVisaRoutingRule,
  input: VisaEligibilityInput
): {
  block: VisaRoutingRuleBlock;
  matchReason: RoutingMatchReason;
  matchedPremiumVisa: PremiumVisaType | null;
  notes: string[];
} | null {
  const passport = normalizeCountryCode(input.passportNationality);
  const appliesToAllPassports =
    rule.passportNationalities.includes('*') ||
    rule.passportNationalities.includes('ALL');

  if (!appliesToAllPassports && !listIncludesCode(rule.passportNationalities, passport)) {
    return null;
  }

  const residence =
    input.residenceMode === 'abroad' && input.residenceCountry
      ? normalizeCountryCode(input.residenceCountry)
      : null;

  if (residence && listIncludesCode(rule.residenceCountries, residence)) {
    if (isMoroccoRule(rule)) {
      return {
        block: rule.residenceMatchOverride,
        matchReason: 'residence_override',
        matchedPremiumVisa: null,
        notes: [
          `Valid residence permit in ${toAlpha3(residence)} qualifies you for the Morocco e-Visa waiver program.`,
          'Your residence permit must be valid for at least 180 days from your arrival in Morocco.',
        ],
      };
    }
    if (isTurkeyRule(rule)) {
      return {
        block: rule.residenceMatchOverride,
        matchReason: 'residence_override',
        matchedPremiumVisa: null,
        notes: [
          `Valid physical residence permit in ${toAlpha3(residence)} qualifies you for the Turkish e-Visa supporting-document route.`,
          'The permit must be a physical card and valid on the day you enter Turkey.',
        ],
      };
    }
    return {
      block: rule.residenceMatchOverride,
      matchReason: 'residence_override',
      matchedPremiumVisa: null,
      notes: [
        `Residence in ${toAlpha3(residence)} unlocks the ${rule.residenceMatchOverride.unlockedStatusType.replace(/_/g, ' ')} route.`,
      ],
    };
  }

  for (const exemption of rule.premiumVisaExemptions) {
    if (input.heldPremiumVisas.includes(exemption.requiredDocumentType)) {
      if (isMoroccoRule(rule)) {
        return {
          block: exemption,
          matchReason: 'premium_visa_exemption',
          matchedPremiumVisa: exemption.requiredDocumentType,
          notes: [
            `Valid ${exemption.requiredDocumentType} multi-entry visa qualifies you for the Morocco e-Visa waiver program.`,
            'Your supporting visa must be valid for at least 90 days from your arrival in Morocco.',
          ],
        };
      }
      if (isTurkeyRule(rule)) {
        return {
          block: exemption,
          matchReason: 'premium_visa_exemption',
          matchedPremiumVisa: exemption.requiredDocumentType,
          notes: [
            `Valid physical ${exemption.requiredDocumentType} sticker visa qualifies you for the Turkish e-Visa supporting-document route.`,
            'Electronic visas are not accepted — the supporting visa must be valid on the day you enter Turkey.',
          ],
        };
      }
      return {
        block: exemption,
        matchReason: 'premium_visa_exemption',
        matchedPremiumVisa: exemption.requiredDocumentType,
        notes: [
          `Valid ${exemption.requiredDocumentType} visa/document detected — simplified application path applied.`,
        ],
      };
    }
  }

  if (isMoroccoRule(rule) || isTurkeyRule(rule)) {
    return {
      block: rule.baseRuleIfNoMatch,
      matchReason: 'base',
      matchedPremiumVisa: null,
      notes: [
        isTurkeyRule(rule)
          ? 'Without a qualifying physical visa or residence permit from the USA, UK, Schengen, or Ireland, a traditional embassy sticker visa is required.'
          : 'Without a qualifying residence permit or multi-entry visa, a traditional embassy sticker visa is required.',
      ],
    };
  }

  return {
    block: rule.baseRuleIfNoMatch,
    matchReason: 'base',
    matchedPremiumVisa: null,
    notes: [],
  };
}

function buildVisaTypeLabel(
  destinationCode: string,
  block: VisaRoutingRuleBlock,
  matchReason: RoutingMatchReason
): string {
  const dest = normalizeCountryCode(destinationCode);
  if (dest === 'ma') {
    if (block.unlockedStatusType === 'morocco_waiver_evisa') {
      return 'Morocco e-Visa (Waiver Program)';
    }
    return 'Traditional Embassy Visa';
  }
  if (dest === 'tr') {
    if (block.unlockedStatusType === 'turkey_waiver_evisa') {
      return 'Turkey e-Visa (Supporting Document Route)';
    }
    return 'Traditional Embassy Visa';
  }
  if (isUnitedStates(dest)) return 'U.S. Visa (DS-160)';
  if (SCHENGEN_COUNTRY_CODES.includes(dest)) {
    if (matchReason === 'residence_override') return 'Schengen Visa (Residence Route)';
    if (matchReason === 'premium_visa_exemption') return 'Schengen Visa (Visa Holder Shortcut)';
    return 'Schengen Visa';
  }
  if (block.checkoutPath === 'standard_evisa') return 'Tourist eVisa';
  return 'Visa Application';
}

function canApplyForCheckoutPath(path: VisaRoutingRuleBlock['checkoutPath']): boolean {
  return path !== 'embassy_only';
}

/** Default routing when no explicit rule matches passport + destination */
function defaultRoutingResult(
  destinationCode: string,
  input: VisaEligibilityInput
): VisaRoutingResult {
  const dest = normalizeCountryCode(destinationCode);
  const isSchengen = SCHENGEN_COUNTRY_CODES.includes(dest);
  const isUs = isUnitedStates(dest);

  const block: VisaRoutingRuleBlock = isUs
    ? {
        unlockedStatusType: 'us_ds160_standard',
        maxStayPeriod: 'As per visa validity',
        checkoutPath: 'standard_us',
        waivedFormFields: [],
      }
    : isSchengen
      ? {
          unlockedStatusType: 'schengen_type_c_standard',
          maxStayPeriod: '90 days',
          checkoutPath: 'standard_schengen',
          waivedFormFields: [],
        }
      : dest === 'ma' || dest === 'tr'
        ? {
            unlockedStatusType: 'embassy_traditional',
            maxStayPeriod: 'Embassy visa — duration set by consulate',
            checkoutPath: 'embassy_only',
            waivedFormFields: [],
          }
        : {
          unlockedStatusType: 'evisa_standard',
          maxStayPeriod: '30 days',
          checkoutPath: 'standard_evisa',
          waivedFormFields: [],
        };

  return {
    destinationCode: dest,
    passportNationality: normalizeCountryCode(input.passportNationality),
    residenceCountry:
      input.residenceMode === 'abroad' && input.residenceCountry
        ? normalizeCountryCode(input.residenceCountry)
        : null,
    heldPremiumVisas: input.heldPremiumVisas,
    matchReason: 'base',
    matchedPremiumVisa: null,
    unlockedStatusType: block.unlockedStatusType,
    maxStayPeriod: block.maxStayPeriod,
    maxStayDays: parseMaxStayDays(block.maxStayPeriod),
    checkoutPath: block.checkoutPath,
    waivedFormFields: block.waivedFormFields,
    canApplyOnline: canApplyForCheckoutPath(block.checkoutPath),
    visaTypeLabel: buildVisaTypeLabel(dest, block, 'base'),
    routingNotes: [],
  };
}

/**
 * Core routing middleware — evaluates residence bypass and premium visa exemptions.
 */
export function evaluateVisaRouting(
  destinationCode: string,
  input: VisaEligibilityInput
): VisaRoutingResult {
  const dest = normalizeCountryCode(destinationCode);
  const matchingRules = resolveDestinationRules(dest);

  if (matchingRules.length === 0) {
    return defaultRoutingResult(dest, input);
  }

  const evaluations = matchingRules
    .map((rule) => pickRuleBlock(rule, input))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (evaluations.length === 0) {
    return defaultRoutingResult(dest, input);
  }

  const priorityRank: Record<RoutingMatchReason, number> = {
    residence_override: 3,
    premium_visa_exemption: 2,
    base: 1,
  };

  const best = evaluations.reduce((winner, current) =>
    priorityRank[current.matchReason] > priorityRank[winner.matchReason] ? current : winner
  );

  const block = best.block;
  const residence =
    input.residenceMode === 'abroad' && input.residenceCountry
      ? normalizeCountryCode(input.residenceCountry)
      : null;

  return {
    destinationCode: dest,
    passportNationality: normalizeCountryCode(input.passportNationality),
    residenceCountry: residence,
    heldPremiumVisas: [...input.heldPremiumVisas],
    matchReason: best.matchReason,
    matchedPremiumVisa: best.matchedPremiumVisa,
    unlockedStatusType: block.unlockedStatusType,
    maxStayPeriod: block.maxStayPeriod,
    maxStayDays: parseMaxStayDays(block.maxStayPeriod),
    checkoutPath: block.checkoutPath,
    waivedFormFields: [...block.waivedFormFields],
    canApplyOnline: canApplyForCheckoutPath(block.checkoutPath),
    visaTypeLabel: buildVisaTypeLabel(dest, block, best.matchReason),
    routingNotes: best.notes,
  };
}

export function isFieldWaived(
  waivedFields: WaivedFormField[] | Set<WaivedFormField> | undefined,
  field: WaivedFormField
): boolean {
  if (!waivedFields) return false;
  if (waivedFields instanceof Set) return waivedFields.has(field);
  return waivedFields.includes(field);
}

export function buildEligibilitySearchParams(input: VisaEligibilityInput): URLSearchParams {
  const params = new URLSearchParams();
  if (input.residenceCountry) {
    params.set('residence', normalizeCountryCode(input.residenceCountry));
  }
  if (input.residenceMode === 'abroad') {
    params.set('residenceMode', 'abroad');
  }
  if (input.heldPremiumVisas.length > 0) {
    params.set('premiumVisas', input.heldPremiumVisas.join(','));
  }
  return params;
}

export function parseEligibilityFromSearchParams(
  passportNationality: string,
  search: string
): VisaEligibilityInput {
  const params = new URLSearchParams(search);
  const residenceCountry = params.get('residence');
  const premiumRaw = params.get('premiumVisas');
  const heldPremiumVisas = (premiumRaw?.split(',') ?? []).filter(Boolean) as PremiumVisaType[];
  const normalizedResidence = residenceCountry ? normalizeCountryCode(residenceCountry) : null;
  const passport = normalizeCountryCode(passportNationality);
  const residenceMode: 'home' | 'abroad' =
    normalizedResidence && normalizedResidence !== passport ? 'abroad' : 'home';

  return {
    passportNationality: passport,
    residenceMode,
    residenceCountry: normalizedResidence,
    heldPremiumVisas,
  };
}
