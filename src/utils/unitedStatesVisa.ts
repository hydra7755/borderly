export const US_COUNTRY_CODE = 'us';

export function isUnitedStates(countryCode: string | undefined | null): boolean {
  if (!countryCode) return false;
  const normalized = countryCode.toLowerCase().trim();
  return normalized === 'us' || normalized === 'usa' || normalized === 'united states';
}

export function isUsVisaApplication(
  requirement: string,
  destinationCountryCode: string
): boolean {
  return requirement === 'visa-required' && isUnitedStates(destinationCountryCode);
}

/** Common U.S. embassy / consulate submission locations */
export const US_SUBMISSION_LOCATIONS = [
  'London, United Kingdom',
  'Paris, France',
  'Frankfurt, Germany',
  'Dubai, United Arab Emirates',
  'Islamabad, Pakistan',
  'New Delhi, India',
  'Beijing, China',
  'Tokyo, Japan',
  'Sydney, Australia',
  'Toronto, Canada',
  'Mexico City, Mexico',
  'São Paulo, Brazil',
  'Johannesburg, South Africa',
  'Other',
] as const;

export const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook',
  'Instagram',
  'X (Twitter)',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'Snapchat',
  'Pinterest',
  'Reddit',
  'WeChat',
  'Other',
] as const;

export const US_TRIP_FINANCER_OPTIONS = [
  'Self',
  'Other Person',
  'Present Employer',
  'Employer in the U.S.',
  'Other Company/Organization',
  'Other',
] as const;

export const US_CONTACT_RELATIONSHIP_OPTIONS = [
  'Employer',
  'Relative',
  'Friend',
  'Business Associate',
  'Hotel',
  'School',
  'Other',
] as const;

export const US_OCCUPATION_OPTIONS = [
  'Agriculture',
  'Artist/Performer',
  'Business',
  'Communications',
  'Computer Science',
  'Culinary/Food Services',
  'Education',
  'Engineering',
  'Government',
  'Homemaker',
  'Legal Profession',
  'Medical/Health',
  'Military',
  'Natural Science',
  'Not Employed',
  'Physical Sciences',
  'Religious Vocation',
  'Research',
  'Retired',
  'Social Science',
  'Student',
  'Other',
] as const;
