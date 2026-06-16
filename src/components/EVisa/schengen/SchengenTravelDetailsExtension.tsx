import React from 'react';
import {
  FormSection,
  FormInput,
  FormSelect,
  FormTextarea,
  RadioCardGroup,
  ToggleField,
} from '../forms/FormControls';
import type { SchengenTravelExtension, PurposeOfVisit, EntriesRequested } from '../../../types/schengenVisa';
import { SCHENGEN_COUNTRY_OPTIONS } from '../../../utils/schengenCountries';
import type { SchengenValidationErrors } from '../../../validation/schengenVisaSchema';
import type { WaivedFormField } from '../../../types/visaRouting';
import { isFieldWaived } from '../../../engine/visaRoutingEngine';

interface SchengenTravelDetailsExtensionProps {
  data: SchengenTravelExtension;
  errors: SchengenValidationErrors;
  accommodationName: string;
  accommodationAddress: string;
  accommodationPhone: string;
  waivedFields?: WaivedFormField[];
  onTravelChange: (data: SchengenTravelExtension) => void;
  onAccommodationChange: (field: 'name' | 'address' | 'phone', value: string) => void;
}

const PURPOSE_OPTIONS: { value: PurposeOfVisit; label: string }[] = [
  { value: 'tourism', label: 'Tourism' },
  { value: 'business', label: 'Business' },
  { value: 'official', label: 'Official Visit' },
  { value: 'education', label: 'Education' },
  { value: 'medical', label: 'Medical' },
  { value: 'family', label: 'Family Visit' },
  { value: 'other', label: 'Other' },
];

const ENTRIES_OPTIONS: { value: EntriesRequested; label: string; description?: string }[] = [
  { value: 'single', label: 'Single Entry', description: 'One entry into Schengen area' },
  { value: 'two', label: 'Two Entries', description: 'Enter twice during visa validity' },
  { value: 'multiple', label: 'Multiple Entries', description: 'Unlimited entries during validity' },
];

export function SchengenTravelDetailsExtension({
  data,
  errors,
  accommodationName,
  accommodationAddress,
  accommodationPhone,
  waivedFields = [],
  onTravelChange,
  onAccommodationChange,
}: SchengenTravelDetailsExtensionProps) {
  const update = (patch: Partial<SchengenTravelExtension>) =>
    onTravelChange({ ...data, ...patch });

  const isBusinessOrOfficial = data.purposeOfVisit === 'business' || data.purposeOfVisit === 'official';
  const waivePriorVisa = isFieldWaived(waivedFields, 'travel.schengen.priorSchengenVisa');
  const waiveFingerprints = isFieldWaived(waivedFields, 'travel.schengen.fingerprints');
  const waiveHostContact = isFieldWaived(waivedFields, 'travel.schengen.hostContact');
  const waivePhone = isFieldWaived(waivedFields, 'travel.accommodation.phone');

  return (
    <>
      <FormSection title="Itinerary Details">
        <FormSelect
          label="Purpose of Visit"
          required
          value={data.purposeOfVisit}
          onChange={(e) =>
            update({
              purposeOfVisit: e.target.value as PurposeOfVisit,
              hostContactPerson: ['business', 'official'].includes(e.target.value) ? data.hostContactPerson : '',
            })
          }
          options={PURPOSE_OPTIONS}
          error={errors['purposeOfVisit']}
          placeholder="Select purpose"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            label="Member State of Destination"
            required
            value={data.memberStateOfDestination}
            onChange={(e) => update({ memberStateOfDestination: e.target.value })}
            options={SCHENGEN_COUNTRY_OPTIONS}
            error={errors['memberStateOfDestination']}
          />
          <FormSelect
            label="Member State of First Entry"
            required
            value={data.memberStateOfFirstEntry}
            onChange={(e) => update({ memberStateOfFirstEntry: e.target.value })}
            options={SCHENGEN_COUNTRY_OPTIONS}
            error={errors['memberStateOfFirstEntry']}
          />
        </div>

        <RadioCardGroup
          label="Number of Entries Requested"
          name="schengen-entries"
          value={data.entriesRequested}
          options={ENTRIES_OPTIONS}
          onChange={(v) => update({ entriesRequested: v })}
          error={errors['entriesRequested']}
          columns={3}
        />
      </FormSection>

      <FormSection title="Visa History">
        {(!waivePriorVisa || !waiveFingerprints) && (
        <>
        {!waivePriorVisa && (
        <ToggleField
          label="Have you been issued a Schengen visa in the past 3 years?"
          checked={data.schengenVisaPast3Years}
          onChange={(checked) =>
            update({
              schengenVisaPast3Years: checked,
              ...(checked ? {} : { schengenVisaDateFrom: '', schengenVisaDateTo: '' }),
            })
          }
        />
        )}
        {!waivePriorVisa && data.schengenVisaPast3Years && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Previous Visa Valid From"
              required
              type="date"
              value={data.schengenVisaDateFrom}
              onChange={(e) => update({ schengenVisaDateFrom: e.target.value })}
              error={errors['schengenVisaDateFrom']}
            />
            <FormInput
              label="Previous Visa Valid Until"
              required
              type="date"
              value={data.schengenVisaDateTo}
              onChange={(e) => update({ schengenVisaDateTo: e.target.value })}
              error={errors['schengenVisaDateTo']}
            />
          </div>
        )}

        {!waiveFingerprints && (
        <ToggleField
          label="Have your fingerprints been collected for a Schengen visa before?"
          checked={data.fingerprintsCollectedBefore}
          onChange={(checked) =>
            update({
              fingerprintsCollectedBefore: checked,
              ...(checked ? {} : { fingerprintsCollectionDate: '' }),
            })
          }
        />
        )}
        {!waiveFingerprints && data.fingerprintsCollectedBefore && (
          <FormInput
            label="Fingerprint Collection Date (if known)"
            type="date"
            value={data.fingerprintsCollectionDate}
            onChange={(e) => update({ fingerprintsCollectionDate: e.target.value })}
          />
        )}
        </>
        )}
        {waivePriorVisa && waiveFingerprints && (
          <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            Visa history questions waived based on your residence or held visa status.
          </p>
        )}
      </FormSection>

      <FormSection
        title={isBusinessOrOfficial ? 'Inviting Company / Organization' : 'Accommodation & Host Details'}
        description={
          isBusinessOrOfficial
            ? 'Provide details of the inviting company or organization'
            : 'Hotel or accommodation where you will stay'
        }
      >
        <FormInput
          label={isBusinessOrOfficial ? 'Company / Organization Name' : 'Hotel / Accommodation Name'}
          required
          value={accommodationName}
          onChange={(e) => onAccommodationChange('name', e.target.value)}
          error={errors['accommodation.name']}
        />
        <FormTextarea
          label={isBusinessOrOfficial ? 'Company / Organization Address' : 'Accommodation Address'}
          required
          value={accommodationAddress}
          onChange={(e) => onAccommodationChange('address', e.target.value)}
          error={errors['accommodation.address']}
        />
        {!waivePhone && (
        <FormInput
          label={isBusinessOrOfficial ? 'Contact Phone' : 'Accommodation Phone (Optional)'}
          type="tel"
          value={accommodationPhone}
          onChange={(e) => onAccommodationChange('phone', e.target.value)}
        />
        )}
        {isBusinessOrOfficial && !waiveHostContact && (
          <FormInput
            label="Contact Person Details"
            required
            value={data.hostContactPerson}
            onChange={(e) => update({ hostContactPerson: e.target.value })}
            placeholder="Name, role, email or phone of contact person"
            error={errors['hostContactPerson']}
          />
        )}
      </FormSection>
    </>
  );
}
