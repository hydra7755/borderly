import { z } from 'zod';
import type { UsApplicationData } from '../types/usVisa';

export type UsValidationErrors = Record<string, string>;

function flattenZodErrors(error: z.ZodError): UsValidationErrors {
  const errors: UsValidationErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) errors[path] = issue.message;
  }
  return errors;
}

const securitySectionSchema = z.array(
  z.object({
    answer: z.boolean(),
    explanation: z.string(),
  }).superRefine((q, ctx) => {
    if (q.answer && !q.explanation.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Explanation required when answering Yes', path: ['explanation'] });
    }
  })
);

export function validateUsPassportBioStep(data: UsApplicationData): UsValidationErrors {
  const errors: UsValidationErrors = {};
  const b = data.passportBio;
  if (!b.fullNameNativeDoesNotApply && !b.fullNameNativeLanguage.trim()) {
    errors['fullNameNativeLanguage'] = 'Required or mark Does Not Apply';
  }
  if (!b.nationalIdDoesNotApply && !b.nationalIdNumber.trim()) {
    errors['nationalIdNumber'] = 'Required or mark Does Not Apply';
  }
  if (!b.cityOfIssuance.trim()) errors['cityOfIssuance'] = 'City of issuance is required';
  if (b.otherNamesUsed && b.otherNames.length === 0) {
    errors['otherNames'] = 'Add at least one other name';
  }
  if (b.telecodeNameUsed && !b.telecodeName.trim()) errors['telecodeName'] = 'Telecode name is required';
  if (b.lostOrStolenPassport && !b.lostOrStolenDescription.trim()) {
    errors['lostOrStolenDescription'] = 'Description is required';
  }
  return errors;
}

export function validateUsContactSocialStep(data: UsApplicationData): UsValidationErrors {
  const errors: UsValidationErrors = {};
  const c = data.contactSocial;
  if (!c.primaryPhone.trim()) errors['primaryPhone'] = 'Primary phone is required';
  const addr = c.mailingSameAsHome ? c.homeAddress : c.mailingAddress;
  if (!addr.street.trim()) errors['mailingAddress.street'] = 'Mailing address street is required';
  if (!addr.city.trim()) errors['mailingAddress.city'] = 'City is required';
  if (!c.homeAddress.street.trim()) errors['homeAddress.street'] = 'Home address street is required';
  const validSocial = c.socialMediaAccounts.filter((a) => a.platform && a.handle.trim());
  if (validSocial.length === 0) errors['socialMediaAccounts'] = 'At least one social media account is required';
  return errors;
}

export function validateUsTravelStep(data: UsApplicationData): UsValidationErrors {
  const errors: UsValidationErrors = {};
  const t = data.travelDetails;
  if (!t.tripFinancer) errors['tripFinancer'] = 'Trip financer is required';
  if (t.specificTravelPlans) {
    if (!t.arrivalDate) errors['arrivalDate'] = 'Arrival date is required';
    if (!t.usCitiesToVisit.trim()) errors['usCitiesToVisit'] = 'U.S. cities to visit are required';
  } else {
    if (!t.intendedArrivalDate) errors['intendedArrivalDate'] = 'Intended arrival date is required';
    if (!t.intendedLengthOfStay.trim()) errors['intendedLengthOfStay'] = 'Intended length of stay is required';
  }
  if (!t.contactPersonName.trim() && !t.organizationName.trim()) {
    errors['contactPersonName'] = 'Contact person or organization name is required';
  }
  if (!t.contactRelationship) errors['contactRelationship'] = 'Relationship is required';
  if (!t.contactUsAddress.street.trim()) errors['contactUsAddress.street'] = 'U.S. contact address is required';
  if (t.refusedUsVisaOrAdmission && !t.refusalExplanation.trim()) {
    errors['refusalExplanation'] = 'Explanation is required';
  }
  if (t.immigrantPetitionFiled && !t.immigrantPetitionExplanation.trim()) {
    errors['immigrantPetitionExplanation'] = 'Explanation is required';
  }
  return errors;
}

export function validateUsFamilyStep(data: UsApplicationData): UsValidationErrors {
  const errors: UsValidationErrors = {};
  const f = data.familyBackground;
  if (!f.father.doNotKnow && !f.father.surname.trim()) errors['father.surname'] = 'Father surname required';
  if (!f.mother.doNotKnow && !f.mother.surname.trim()) errors['mother.surname'] = 'Mother surname required';
  if (f.maritalStatus === 'Married' && f.spouse) {
    if (!f.spouse.surname.trim()) errors['spouse.surname'] = 'Spouse surname required';
    if (!f.spouse.dateOfBirth) errors['spouse.dateOfBirth'] = 'Spouse date of birth required';
  }
  return errors;
}

export function validateUsWorkEducationStep(data: UsApplicationData): UsValidationErrors {
  const errors: UsValidationErrors = {};
  const w = data.workEducation;
  if (!w.occupation) errors['occupation'] = 'Occupation is required';
  if (!['Not Employed', 'Retired', 'Homemaker'].includes(w.occupation)) {
    if (!w.employerSchoolName.trim()) errors['employerSchoolName'] = 'Employer/school name required';
    if (!w.dutiesDescription.trim()) errors['dutiesDescription'] = 'Duties description required';
  }
  if (w.languagesSpoken.length === 0) errors['languagesSpoken'] = 'List at least one language';
  if (w.belongedToOrganization && !w.organizationExplanation.trim()) {
    errors['organizationExplanation'] = 'Explanation required';
  }
  if (w.specializedSkills && !w.specializedSkillsExplanation.trim()) {
    errors['specializedSkillsExplanation'] = 'Explanation required';
  }
  if (w.paramilitaryInvolvement && !w.paramilitaryExplanation.trim()) {
    errors['paramilitaryExplanation'] = 'Explanation required';
  }
  return errors;
}

export function validateUsTravelersStep(data: UsApplicationData): UsValidationErrors {
  const errors: UsValidationErrors = {};
  const tc = data.travelersCompanions;
  if (tc.othersTravelingWithYou && !tc.travelingAsGroup && tc.companions.length === 0) {
    errors['companions'] = 'Add at least one traveling companion';
  }
  if (tc.travelingAsGroup && !tc.groupName.trim()) errors['groupName'] = 'Group name is required';
  return errors;
}

export function validateUsCheckoutStep(data: UsApplicationData): UsValidationErrors {
  const errors: UsValidationErrors = {};
  const c = data.checkoutCompliance;
  if (!c.submissionLocation) errors['submissionLocation'] = 'Submission location is required';
  if (!c.declarationsAccepted) errors['declarationsAccepted'] = 'You must accept the declarations';
  if (!c.signatureName.trim()) errors['signatureName'] = 'Signature name is required';
  if (c.preparerAssisted && !c.preparerName.trim()) errors['preparerName'] = 'Preparer name is required';

  const sections = [
    ['medicalHealth', c.securityBackground.medicalHealth],
    ['criminalHistory', c.securityBackground.criminalHistory],
    ['securityTerrorism', c.securityBackground.securityTerrorism],
    ['immigrationViolations', c.securityBackground.immigrationViolations],
  ] as const;

  for (const [key, section] of sections) {
    const result = securitySectionSchema.safeParse(section);
    if (!result.success) {
      result.error.issues.forEach((issue, idx) => {
        errors[`${key}.${idx}.${issue.path.join('.')}`] = issue.message;
      });
    }
  }
  return errors;
}

export function validateUsSubStep(
  subStep: 'passport' | 'contact' | 'travel' | 'family' | 'work' | 'travelers' | 'checkout',
  data: UsApplicationData
): UsValidationErrors {
  switch (subStep) {
    case 'passport': return validateUsPassportBioStep(data);
    case 'contact': return validateUsContactSocialStep(data);
    case 'travel': return validateUsTravelStep(data);
    case 'family': return validateUsFamilyStep(data);
    case 'work': return validateUsWorkEducationStep(data);
    case 'travelers': return validateUsTravelersStep(data);
    case 'checkout': return validateUsCheckoutStep(data);
    default: return {};
  }
}
