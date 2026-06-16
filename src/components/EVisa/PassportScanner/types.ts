/** Passport fields used by the visa application wizard. */
export interface PassportScanFields {
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  placeOfBirth: string;
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  sex: string;
  issuingAuthority: string;
}

export const EMPTY_PASSPORT_SCAN_FIELDS: PassportScanFields = {
  firstName: '',
  lastName: '',
  nationality: '',
  dateOfBirth: '',
  placeOfBirth: '',
  passportNumber: '',
  issueDate: '',
  expiryDate: '',
  sex: '',
  issuingAuthority: '',
};

export function isPassportScanComplete(data: PassportScanFields | null): boolean {
  if (!data) return false;

  const required: (keyof PassportScanFields)[] = [
    'firstName',
    'lastName',
    'nationality',
    'dateOfBirth',
    'placeOfBirth',
    'passportNumber',
    'issueDate',
    'expiryDate',
    'sex',
    'issuingAuthority',
  ];

  return required.every((field) => data[field].trim() !== '');
}
