import csvRaw from '../data/visa requirements data.csv?raw';
import { VisaRequirement } from '../lib/api/visaRequirements';

type VisaMatrix = {
  destinations: string[];
  rows: Map<string, string[]>;
};

let matrixCache: VisaMatrix | null = null;

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "cote d ivoire": 'Ivory Coast',
  "côte d'ivoire": 'Ivory Coast',
  eswatini: 'Swaziland',
  'congo (democratic republic)': 'DR Congo',
  'democratic republic of the congo': 'DR Congo',
  'cabo verde': 'Cape Verde',
  'cape verde': 'Cape Verde',
  'united states of america': 'United States',
  'united kingdom of great britain and northern ireland': 'United Kingdom',
  'north macedonia': 'North Macedonia',
  macau: 'Macao',
  'timor leste': 'Timor-Leste',
  'east timor': 'Timor-Leste',
  'saint vincent and the grenadines': 'Saint Vincent and the Grenadines',
  'sao tome and principe': 'Sao Tome and Principe',
  'saint kitts and nevis': 'Saint Kitts and Nevis',
};

export function normalizeCountryKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveCsvCountryName(name: string): string {
  const key = normalizeCountryKey(name);
  return COUNTRY_NAME_ALIASES[key] ?? name.trim();
}

function parseCsvMatrix(): VisaMatrix {
  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const header = lines[0].split(',');
  const destinations = header.slice(1).map((d) => d.trim());

  const rows = new Map<string, string[]>();
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const passport = cells[0]?.trim();
    if (!passport) continue;
    rows.set(normalizeCountryKey(resolveCsvCountryName(passport)), cells.slice(1));
  }

  return { destinations, rows };
}

function getMatrix(): VisaMatrix {
  if (!matrixCache) {
    matrixCache = parseCsvMatrix();
  }
  return matrixCache;
}

function findDestinationIndex(destinations: string[], destination: string): number {
  const resolved = resolveCsvCountryName(destination);
  const targetKey = normalizeCountryKey(resolved);

  let index = destinations.findIndex(
    (d) => normalizeCountryKey(resolveCsvCountryName(d)) === targetKey
  );

  if (index === -1) {
    index = destinations.findIndex((d) => normalizeCountryKey(d) === targetKey);
  }

  return index;
}

function parseCellValue(rawValue: string): Pick<VisaRequirement, 'requirement' | 'stay_duration' | 'notes'> {
  const value = rawValue.trim().toLowerCase();

  if (!value || value === '-1') {
    return {
      requirement: 'not-applicable',
      stay_duration: 0,
      notes: 'No visa required for domestic travel.',
    };
  }

  if (/^\d+$/.test(value)) {
    const days = Number(value);
    return {
      requirement: 'visa-free',
      stay_duration: days,
      notes: `Visa-free travel for up to ${days} days.`,
    };
  }

  if (value.includes('no admission')) {
    return {
      requirement: 'visa-required',
      stay_duration: undefined,
      notes: 'Entry may be restricted. Confirm with the destination embassy.',
    };
  }

  if (value.includes('visa free') || value === 'visa-free') {
    return { requirement: 'visa-free', stay_duration: 90 };
  }

  if (value.includes('visa on arrival') || value.includes('on arrival')) {
    return { requirement: 'visa-on-arrival', stay_duration: 30 };
  }

  if (value.includes('e-visa') || value.includes('evisa')) {
    return { requirement: 'evisa', stay_duration: 30 };
  }

  if (value === 'eta' || value === 'esta') {
    return { requirement: 'eta', stay_duration: 90 };
  }

  if (value.includes('visa required')) {
    return { requirement: 'visa-required' };
  }

  return {
    requirement: 'unknown',
    notes: `Recorded requirement: ${rawValue.trim()}`,
  };
}

export function getVisaRequirementFromCsv(
  nationality: string,
  destination: string
): VisaRequirement | null {
  const matrix = getMatrix();
  const passportKey = normalizeCountryKey(resolveCsvCountryName(nationality));
  const row = matrix.rows.get(passportKey);

  if (!row) {
    return null;
  }

  const destinationIndex = findDestinationIndex(matrix.destinations, destination);
  if (destinationIndex === -1 || destinationIndex >= row.length) {
    return null;
  }

  const cell = row[destinationIndex];
  const parsed = parseCellValue(cell);

  return {
    nationality: resolveCsvCountryName(nationality),
    destination: resolveCsvCountryName(destination),
    ...parsed,
  };
}

export function getVisaRequirementsForNationalityFromCsv(nationality: string): VisaRequirement[] {
  const matrix = getMatrix();
  const passportKey = normalizeCountryKey(resolveCsvCountryName(nationality));
  const row = matrix.rows.get(passportKey);

  if (!row) {
    return [];
  }

  return matrix.destinations
    .map((destination, index) => {
      const cell = row[index];
      if (!cell) return null;
      const parsed = parseCellValue(cell);
      return {
        nationality: resolveCsvCountryName(nationality),
        destination: resolveCsvCountryName(destination),
        ...parsed,
      } satisfies VisaRequirement;
    })
    .filter((item): item is VisaRequirement => item !== null);
}

export interface PassportMobilityStats {
  countryName: string;
  visaFree: number;
  evisa: number;
  traditional: number;
  visaOnArrival: number;
  totalDestinations: number;
}

type MobilityBucket = 'visaFree' | 'evisa' | 'traditional' | 'visaOnArrival' | 'domestic' | 'unknown';

function classifyCellForMobility(rawValue: string): MobilityBucket {
  const value = rawValue.trim().toLowerCase();

  if (!value || value === '-1') return 'domestic';

  if (/^\d+$/.test(value)) return 'visaFree';

  if (value.includes('no admission')) return 'traditional';

  if (value.includes('visa free') || value === 'visa-free') return 'visaFree';

  if (value.includes('visa on arrival') || value.includes('on arrival')) return 'visaOnArrival';

  if (value.includes('e-visa') || value.includes('evisa') || value === 'eta' || value === 'esta') {
    return 'evisa';
  }

  if (value.includes('visa required')) return 'traditional';

  return 'unknown';
}

function emptyStats(countryName: string): PassportMobilityStats {
  return {
    countryName,
    visaFree: 0,
    evisa: 0,
    traditional: 0,
    visaOnArrival: 0,
    totalDestinations: 0,
  };
}

function aggregateRow(passportName: string, row: string[]): PassportMobilityStats {
  const stats = emptyStats(resolveCsvCountryName(passportName));

  for (const cell of row) {
    const bucket = classifyCellForMobility(cell);
    if (bucket === 'domestic') continue;

    stats.totalDestinations += 1;

    switch (bucket) {
      case 'visaFree':
        stats.visaFree += 1;
        break;
      case 'evisa':
        stats.evisa += 1;
        break;
      case 'traditional':
        stats.traditional += 1;
        break;
      case 'visaOnArrival':
        stats.visaOnArrival += 1;
        break;
      default:
        stats.traditional += 1;
        break;
    }
  }

  return stats;
}

let mobilityIndexCache: Map<string, PassportMobilityStats> | null = null;

/** Passport mobility stats keyed by normalized country name. */
export function buildPassportMobilityIndex(): Map<string, PassportMobilityStats> {
  if (mobilityIndexCache) return mobilityIndexCache;

  const index = new Map<string, PassportMobilityStats>();
  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const passport = cells[0]?.trim();
    if (!passport) continue;

    const passportKey = normalizeCountryKey(resolveCsvCountryName(passport));
    index.set(passportKey, aggregateRow(passport, cells.slice(1)));
  }

  mobilityIndexCache = index;
  return index;
}

export function getPassportMobilityStats(countryInput: string): PassportMobilityStats | null {
  if (!countryInput) return null;

  const index = buildPassportMobilityIndex();
  const key = normalizeCountryKey(resolveCsvCountryName(countryInput));
  return index.get(key) ?? null;
}
