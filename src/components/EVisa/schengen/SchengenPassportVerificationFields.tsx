import React from 'react';
import { ToggleField, FormInput, FormSelect } from '../forms/FormControls';
import type { SchengenPassportVerification } from '../../../types/schengenVisa';
import { SCHENGEN_COUNTRY_OPTIONS } from '../../../utils/schengenCountries';

interface SchengenPassportVerificationFieldsProps {
  data: SchengenPassportVerification;
  currentNationality: string;
  onChange: (data: SchengenPassportVerification) => void;
}

export function SchengenPassportVerificationFields({
  data,
  currentNationality,
  onChange,
}: SchengenPassportVerificationFieldsProps) {
  const update = (patch: Partial<SchengenPassportVerification>) =>
    onChange({ ...data, ...patch });

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
      <h4 className="text-base font-semibold text-gray-800">Additional Schengen Verification</h4>
      <p className="text-sm text-gray-500">
        Optional fields below help complete your Schengen application. Birth nationality is required only if it differs from your current nationality.
      </p>

      <FormInput
        label="Surname at birth (Former family name)"
        value={data.surnameAtBirth}
        onChange={(e) => update({ surnameAtBirth: e.target.value })}
        placeholder="Leave blank if unchanged"
      />

      <FormInput
        label="National Identity Number"
        value={data.nationalIdentityNumber}
        onChange={(e) => update({ nationalIdentityNumber: e.target.value })}
        placeholder="National ID / citizen number (if applicable)"
      />

      <ToggleField
        label="Birth nationality differs from current nationality"
        description={`Current nationality on passport: ${currentNationality || 'Not set'}`}
        checked={data.birthNationalityDiffers}
        onChange={(checked) =>
          update({
            birthNationalityDiffers: checked,
            birthNationality: checked ? data.birthNationality : '',
          })
        }
      />

      {data.birthNationalityDiffers && (
        <FormSelect
          label="Birth Nationality"
          required
          value={data.birthNationality}
          onChange={(e) => update({ birthNationality: e.target.value })}
          options={SCHENGEN_COUNTRY_OPTIONS.map((c) => ({ value: c.label, label: c.label }))}
          placeholder="Select birth nationality"
        />
      )}
    </div>
  );
}
