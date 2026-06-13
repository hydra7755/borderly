import { supabase } from '../lib/supabase/client';
import { ALL_COUNTRIES } from '../utils/countries';
import { VisaRequirement } from '../lib/api/visaRequirements';
import {
  getVisaRequirementFromCsv,
  getVisaRequirementsForNationalityFromCsv,
} from './visaCsvData';

const CACHE_VERSION = 'v2';

const SPECIAL_COUNTRY_CODES: Record<string, string> = {
  Kosovo: 'xk',
  Palestine: 'ps',
  Taiwan: 'tw',
};

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

function resolveCountryCode(input: string): string | null {
  if (!input) return null;
  if (input.length === 2) return normalizeCode(input);

  const normalizedName = input.toLowerCase();
  for (const [code, name] of Object.entries(SPECIAL_COUNTRY_CODES)) {
    if (name.toLowerCase() === normalizedName || code.toLowerCase() === normalizedName) {
      return normalizeCode(name);
    }
  }

  const country = ALL_COUNTRIES.find((c) => c.name.toLowerCase() === normalizedName);
  return country ? country.code : null;
}

function buildRequirementMessage(
  requirement: VisaRequirement['requirement'],
  passportCountry: string,
  destinationCountry: string,
  stayDuration?: number | null,
  notes?: string
): string {
  let message = '';

  switch (requirement) {
    case 'visa-free':
      message = `Citizens of ${passportCountry} can travel to ${destinationCountry} without a visa.`;
      if (stayDuration) message += ` Maximum stay: ${stayDuration} days.`;
      break;
    case 'visa-on-arrival':
      message = `Citizens of ${passportCountry} can obtain a visa on arrival when traveling to ${destinationCountry}.`;
      if (stayDuration) message += ` Typical stay: up to ${stayDuration} days.`;
      break;
    case 'evisa':
      message = `Citizens of ${passportCountry} can apply for an eVisa online before traveling to ${destinationCountry}.`;
      break;
    case 'eta':
      message = `Citizens of ${passportCountry} need an Electronic Travel Authorization before traveling to ${destinationCountry}.`;
      break;
    case 'visa-required':
      message = `Citizens of ${passportCountry} need a traditional visa from the ${destinationCountry} embassy or consulate before traveling.`;
      break;
    case 'not-applicable':
      message = `No visa is required for domestic travel within ${passportCountry}.`;
      break;
    default:
      message = `Visa requirement information for ${passportCountry} citizens traveling to ${destinationCountry} is unavailable.`;
  }

  if (notes) message += ` ${notes}`;
  return message.trim();
}

class VisaRequirementsService {
  private static instance: VisaRequirementsService;

  private constructor() {}

  public static getInstance(): VisaRequirementsService {
    if (!VisaRequirementsService.instance) {
      VisaRequirementsService.instance = new VisaRequirementsService();
    }
    return VisaRequirementsService.instance;
  }

  public getCountryNameFromCode(countryCode: string | undefined | null): string {
    if (!countryCode) return '';

    const normalizedCode = normalizeCode(countryCode);
    const specialEntry = Object.entries(SPECIAL_COUNTRY_CODES).find(
      ([, code]) => code === normalizedCode
    );
    if (specialEntry) return specialEntry[0];

    const country = ALL_COUNTRIES.find((c) => c.code === normalizedCode);
    return country?.name ?? countryCode;
  }

  public getCountryCodeFromName(countryName: string): string | null {
    return resolveCountryCode(countryName);
  }

  private getSessionCacheKey(nationalityCode: string, destinationCode: string): string {
    return `visa_req_${CACHE_VERSION}_${nationalityCode}_${destinationCode}`;
  }

  public async getVisaRequirement(
    nationalityInput: string,
    destinationInput: string
  ): Promise<VisaRequirement | null> {
    try {
      if (!nationalityInput || !destinationInput) return null;

      const nationalityCode = resolveCountryCode(nationalityInput);
      const destinationCode = resolveCountryCode(destinationInput);

      if (!nationalityCode || !destinationCode) return null;

      if (nationalityCode === destinationCode) {
        const countryName = this.getCountryNameFromCode(nationalityCode);
        return {
          nationality: countryName,
          destination: countryName,
          requirement: 'visa-free',
          stay_duration: 0,
          notes: 'No visa required for travel within the same country.',
        };
      }

      const cacheKey = this.getSessionCacheKey(nationalityCode, destinationCode);
      const cachedResult = sessionStorage.getItem(cacheKey);
      if (cachedResult) {
        try {
          return JSON.parse(cachedResult) as VisaRequirement;
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }

      const passportCountry = this.getCountryNameFromCode(nationalityCode);
      const destinationCountry = this.getCountryNameFromCode(destinationCode);

      // Primary source: Supabase
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .eq('nationality', nationalityCode)
        .eq('destination', destinationCode)
        .maybeSingle();

      if (error) {
        console.error('Supabase visa lookup error:', error);
      }

      if (data) {
        const result: VisaRequirement = {
          nationality: passportCountry,
          destination: destinationCountry,
          requirement: data.requirement as VisaRequirement['requirement'],
          stay_duration: data.stay_duration ?? undefined,
          notes: data.notes ?? undefined,
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
      }

      // Fallback: local CSV
      const csvResult = getVisaRequirementFromCsv(passportCountry, destinationCountry);
      if (csvResult && csvResult.requirement !== 'unknown') {
        sessionStorage.setItem(cacheKey, JSON.stringify(csvResult));
        return csvResult;
      }

      return csvResult;
    } catch (error) {
      console.error('Unexpected error in getVisaRequirement:', error);

      const passportCountry = this.getCountryNameFromCode(nationalityInput);
      const destinationCountry = this.getCountryNameFromCode(destinationInput);
      return getVisaRequirementFromCsv(passportCountry, destinationCountry);
    }
  }

  public async getAllVisaRequirements(
    page: number = 1,
    limit: number = 10
  ): Promise<VisaRequirement[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error || !data?.length) {
      return [];
    }

    return data.map((item) => ({
      nationality: this.getCountryNameFromCode(item.nationality),
      destination: this.getCountryNameFromCode(item.destination),
      requirement: item.requirement as VisaRequirement['requirement'],
      stay_duration: item.stay_duration ?? undefined,
      notes: item.notes ?? undefined,
    }));
  }

  public async getVisaRequirementsForNationality(nationality: string): Promise<VisaRequirement[]> {
    const nationalityCode = resolveCountryCode(nationality);
    if (!nationalityCode) return [];

    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('nationality', nationalityCode);

    if (!error && data?.length) {
      return data.map((item) => ({
        nationality: this.getCountryNameFromCode(item.nationality),
        destination: this.getCountryNameFromCode(item.destination),
        requirement: item.requirement as VisaRequirement['requirement'],
        stay_duration: item.stay_duration ?? undefined,
        notes: item.notes ?? undefined,
      }));
    }

    return getVisaRequirementsForNationalityFromCsv(
      this.getCountryNameFromCode(nationalityCode)
    );
  }

  public async getVisaRequirementsForDestination(destination: string): Promise<VisaRequirement[]> {
    const destinationCode = resolveCountryCode(destination);
    if (!destinationCode) return [];

    const { data, error } = await supabase
      .from('visa_requirements')
      .select('*')
      .eq('destination', destinationCode);

    if (error || !data?.length) return [];

    return data.map((item) => ({
      nationality: this.getCountryNameFromCode(item.nationality),
      destination: this.getCountryNameFromCode(item.destination),
      requirement: item.requirement as VisaRequirement['requirement'],
      stay_duration: item.stay_duration ?? undefined,
      notes: item.notes ?? undefined,
    }));
  }

  public async isVisaTypeAvailable(
    nationality: string,
    destination: string,
    visaType: 'evisa' | 'eta' | 'visa-on-arrival' | 'visa-free'
  ): Promise<boolean> {
    const requirement = await this.getVisaRequirement(nationality, destination);
    return requirement?.requirement === visaType;
  }

  public getVisaStatusText(requirement: string | undefined): string {
    switch (requirement) {
      case 'visa-free':
        return 'Visa-Free';
      case 'visa-on-arrival':
        return 'Visa on Arrival';
      case 'evisa':
        return 'eVisa Available';
      case 'eta':
        return 'Electronic Travel Authorization';
      case 'visa-required':
        return 'Traditional Visa Required';
      default:
        return 'Visa Information Unavailable';
    }
  }

  public buildRequirementMessage = buildRequirementMessage;
}

export const visaRequirementsService = VisaRequirementsService.getInstance();
