import { z } from 'zod';
import {
  isApplicantMinor,
  occupationRequiresEmployerDetails,
  type SchengenApplicationData,
} from '../types/schengenVisa';
import type { WaivedFormField } from '../types/visaRouting';
import { isFieldWaived } from '../engine/visaRoutingEngine';

const passportVerificationSchema = z.object({
  surnameAtBirth: z.string(),
  nationalIdentityNumber: z.string(),
  birthNationalityDiffers: z.boolean(),
  birthNationality: z.string(),
});

const personalProfessionalSchema = z
  .object({
    sex: z.enum(['Male', 'Female', 'Other'], { required_error: 'Sex is required' }),
    maritalStatus: z.enum(
      ['Single', 'Married', 'Registered Partnership', 'Separated', 'Divorced', 'Widowed'],
      { required_error: 'Marital status is required' }
    ),
    occupation: z.string().min(1, 'Occupation is required'),
    employerName: z.string(),
    employerAddress: z.string(),
    employerPhone: z.string(),
    homeStreet: z.string().min(1, 'Street address is required'),
    homeCity: z.string().min(1, 'City is required'),
    homePostalCode: z.string().min(1, 'Postal code is required'),
    homePhone: z.string().min(1, 'Home phone is required'),
    residesOutsideNationality: z.boolean(),
    residencePermitNumber: z.string(),
    residencePermitValidUntil: z.string(),
  })
  .superRefine((data, ctx) => {
    if (occupationRequiresEmployerDetails(data.occupation)) {
      if (!data.employerName.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Employer/institution name is required', path: ['employerName'] });
      }
      if (!data.employerAddress.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Employer/institution address is required', path: ['employerAddress'] });
      }
    }
    if (data.residesOutsideNationality) {
      if (!data.residencePermitNumber.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Residence permit number is required', path: ['residencePermitNumber'] });
      }
      if (!data.residencePermitValidUntil.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Residence permit validity date is required', path: ['residencePermitValidUntil'] });
      }
    }
  });

const travelExtensionSchema = z
  .object({
    purposeOfVisit: z.enum(['tourism', 'business', 'official', 'education', 'medical', 'family', 'other'], {
      required_error: 'Purpose of visit is required',
    }),
    memberStateOfDestination: z.string().min(1, 'Destination member state is required'),
    memberStateOfFirstEntry: z.string().min(1, 'First entry member state is required'),
    entriesRequested: z.enum(['single', 'two', 'multiple'], { required_error: 'Number of entries is required' }),
    schengenVisaPast3Years: z.boolean(),
    schengenVisaDateFrom: z.string(),
    schengenVisaDateTo: z.string(),
    fingerprintsCollectedBefore: z.boolean(),
    fingerprintsCollectionDate: z.string(),
    hostContactPerson: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.schengenVisaPast3Years) {
      if (!data.schengenVisaDateFrom) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Visa start date is required', path: ['schengenVisaDateFrom'] });
      }
      if (!data.schengenVisaDateTo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Visa end date is required', path: ['schengenVisaDateTo'] });
      }
    }
    if (['business', 'official'].includes(data.purposeOfVisit) && !data.hostContactPerson.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Inviting company contact person is required',
        path: ['hostContactPerson'],
      });
    }
  });

const guardianSchema = z.object({
  name: z.string().min(1, 'Guardian name is required'),
  address: z.string().min(1, 'Guardian address is required'),
  nationality: z.string().min(1, 'Guardian nationality is required'),
});

const euFamilySchema = z
  .object({
    isEuFamilyMember: z.boolean(),
    familyMemberName: z.string(),
    familyMemberNationality: z.string(),
    relationshipType: z.string(),
    employmentFundingOptional: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.isEuFamilyMember) {
      if (!data.familyMemberName.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Family member name is required', path: ['familyMemberName'] });
      }
      if (!data.familyMemberNationality.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Family member nationality is required', path: ['familyMemberNationality'] });
      }
      if (!data.relationshipType.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Relationship type is required', path: ['relationshipType'] });
      }
    }
  });

const meansOfSupportSchema = z
  .object({
    type: z.enum(['self', 'sponsor'], { required_error: 'Means of support is required' }),
    selfMethods: z.array(z.string()),
    sponsorCoverage: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'self' && data.selfMethods.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one support method', path: ['selfMethods'] });
    }
    if (data.type === 'sponsor' && data.sponsorCoverage.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one coverage scope', path: ['sponsorCoverage'] });
    }
  });

const declarationsSchema = z
  .object({
    visDataProcessingAccepted: z.literal(true, { errorMap: () => ({ message: 'VIS data processing must be accepted' }) }),
    tmiAcknowledged: z.literal(true, { errorMap: () => ({ message: 'Travel medical insurance must be acknowledged' }) }),
    signatureType: z.enum(['canvas', 'text']),
    signatureData: z.string(),
    typedSignatureName: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.signatureType === 'canvas' && !data.signatureData.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Digital signature is required', path: ['signatureData'] });
    }
    if (data.signatureType === 'text' && !data.typedSignatureName.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Typed signature name is required', path: ['typedSignatureName'] });
    }
  });

export const schengenApplicationSchema = z.object({
  passportVerification: passportVerificationSchema,
  personalProfessional: personalProfessionalSchema,
  travelExtension: travelExtensionSchema,
  guardianDetails: guardianSchema.nullable(),
  euFamilyExemption: euFamilySchema,
  meansOfSupport: meansOfSupportSchema,
  declarations: declarationsSchema,
});

export type SchengenValidationErrors = Record<string, string>;

function flattenZodErrors(error: z.ZodError): SchengenValidationErrors {
  const errors: SchengenValidationErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = issue.message;
  }
  return errors;
}

export function validateSchengenPersonalStep(data: SchengenApplicationData): SchengenValidationErrors {
  const result = personalProfessionalSchema.safeParse(data.personalProfessional);
  return result.success ? {} : flattenZodErrors(result.error);
}

export function validateSchengenTravelStep(
  data: SchengenApplicationData,
  accommodationName: string,
  accommodationAddress: string,
  arrival: string,
  departure: string,
  waivedFields: WaivedFormField[] = []
): SchengenValidationErrors {
  const errors: SchengenValidationErrors = {};
  const travelResult = travelExtensionSchema.safeParse(data.travelExtension);
  if (!travelResult.success) {
    const flat = flattenZodErrors(travelResult.error);
    for (const [key, message] of Object.entries(flat)) {
      if (key === 'schengenVisaDateFrom' || key === 'schengenVisaDateTo') {
        if (isFieldWaived(waivedFields, 'travel.schengen.priorSchengenVisa')) continue;
      }
      if (key === 'fingerprintsCollectionDate') {
        if (isFieldWaived(waivedFields, 'travel.schengen.fingerprints')) continue;
      }
      if (key === 'hostContactPerson') {
        if (isFieldWaived(waivedFields, 'travel.schengen.hostContact')) continue;
      }
      errors[key] = message;
    }
  }
  if (!arrival) errors['travelDates.arrival'] = 'Arrival date is required';
  if (!departure) errors['travelDates.departure'] = 'Departure date is required';
  if (!accommodationName.trim()) errors['accommodation.name'] = 'Accommodation/host name is required';
  if (!accommodationAddress.trim()) errors['accommodation.address'] = 'Accommodation/host address is required';
  return errors;
}

export function validateSchengenTravelersStep(
  data: SchengenApplicationData,
  dateOfBirth: string | undefined,
  waivedFields: WaivedFormField[] = []
): SchengenValidationErrors {
  const errors: SchengenValidationErrors = {};

  if (!isFieldWaived(waivedFields, 'travelers.euFamilyExemption')) {
    const euResult = euFamilySchema.safeParse(data.euFamilyExemption);
    if (!euResult.success) Object.assign(errors, flattenZodErrors(euResult.error));
  }

  if (isApplicantMinor(dateOfBirth)) {
    if (!data.guardianDetails) {
      errors['guardianDetails'] = 'Guardian details are required for minors';
    } else {
      const guardianResult = guardianSchema.safeParse(data.guardianDetails);
      if (!guardianResult.success) Object.assign(errors, flattenZodErrors(guardianResult.error));
    }
  }
  return errors;
}

export function validateSchengenCheckoutStep(data: SchengenApplicationData): SchengenValidationErrors {
  const errors: SchengenValidationErrors = {};
  const supportResult = meansOfSupportSchema.safeParse(data.meansOfSupport);
  if (!supportResult.success) Object.assign(errors, flattenZodErrors(supportResult.error));
  const declResult = declarationsSchema.safeParse(data.declarations);
  if (!declResult.success) Object.assign(errors, flattenZodErrors(declResult.error));
  return errors;
}

export function validateFullSchengenApplication(data: SchengenApplicationData, dateOfBirth?: string): SchengenValidationErrors {
  const result = schengenApplicationSchema.safeParse(data);
  let errors = result.success ? {} : flattenZodErrors(result.error);
  if (isApplicantMinor(dateOfBirth) && !data.guardianDetails) {
    errors['guardianDetails'] = 'Guardian details are required for minors';
  }
  return errors;
}
