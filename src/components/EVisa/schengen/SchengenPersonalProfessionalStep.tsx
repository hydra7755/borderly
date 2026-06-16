import React from 'react';
import {
  FormSection,
  FormInput,
  FormSelect,
  RadioCardGroup,
  ToggleField,
} from '../forms/FormControls';
import {
  OCCUPATION_OPTIONS,
  occupationRequiresEmployerDetails,
  type MaritalStatus,
  type SchengenPersonalProfessional,
  type SchengenSex,
} from '../../../types/schengenVisa';
import type { SchengenValidationErrors } from '../../../validation/schengenVisaSchema';

interface SchengenPersonalProfessionalStepProps {
  data: SchengenPersonalProfessional;
  errors: SchengenValidationErrors;
  onChange: (data: SchengenPersonalProfessional) => void;
  onBack: () => void;
  onNext: () => void;
}

const SEX_OPTIONS: { value: SchengenSex; label: string }[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const MARITAL_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Registered Partnership', label: 'Registered Partnership' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
];

export function SchengenPersonalProfessionalStep({
  data,
  errors,
  onChange,
  onBack,
  onNext,
}: SchengenPersonalProfessionalStepProps) {
  const update = (patch: Partial<SchengenPersonalProfessional>) =>
    onChange({ ...data, ...patch });

  const showEmployer = occupationRequiresEmployerDetails(data.occupation);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Personal & Professional Life</h2>
        <p className="text-sm text-gray-500 mt-1">
          Required socio-economic and demographic information for Schengen visa applications.
        </p>
      </div>

      <FormSection title="Personal Details">
        <RadioCardGroup
          label="Sex"
          name="schengen-sex"
          value={data.sex}
          options={SEX_OPTIONS}
          onChange={(v) => update({ sex: v })}
          error={errors['sex']}
          columns={3}
        />
        <RadioCardGroup
          label="Marital Status"
          name="schengen-marital"
          value={data.maritalStatus}
          options={MARITAL_OPTIONS}
          onChange={(v) => update({ maritalStatus: v })}
          error={errors['maritalStatus']}
          columns={3}
        />
      </FormSection>

      <FormSection title="Occupation & Employer">
        <FormSelect
          label="Current Occupation"
          required
          value={data.occupation}
          onChange={(e) =>
            update({
              occupation: e.target.value,
              ...(e.target.value === 'Unemployed' || e.target.value === 'Retired'
                ? { employerName: '', employerAddress: '', employerPhone: '' }
                : {}),
            })
          }
          options={OCCUPATION_OPTIONS.map((o) => ({ value: o, label: o }))}
          error={errors['occupation']}
        />

        {showEmployer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Employer / Educational Institution Name"
              required
              value={data.employerName}
              onChange={(e) => update({ employerName: e.target.value })}
              error={errors['employerName']}
            />
            <FormInput
              label="Employer Phone"
              type="tel"
              value={data.employerPhone}
              onChange={(e) => update({ employerPhone: e.target.value })}
            />
            <div className="md:col-span-2">
              <FormInput
                label="Employer / Institution Address"
                required
                value={data.employerAddress}
                onChange={(e) => update({ employerAddress: e.target.value })}
                error={errors['employerAddress']}
              />
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Current Home Address">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormInput
              label="Street Address"
              required
              value={data.homeStreet}
              onChange={(e) => update({ homeStreet: e.target.value })}
              error={errors['homeStreet']}
            />
          </div>
          <FormInput
            label="City"
            required
            value={data.homeCity}
            onChange={(e) => update({ homeCity: e.target.value })}
            error={errors['homeCity']}
          />
          <FormInput
            label="Postal Code"
            required
            value={data.homePostalCode}
            onChange={(e) => update({ homePostalCode: e.target.value })}
            error={errors['homePostalCode']}
          />
          <FormInput
            label="Phone Number"
            required
            type="tel"
            value={data.homePhone}
            onChange={(e) => update({ homePhone: e.target.value })}
            error={errors['homePhone']}
          />
        </div>
      </FormSection>

      <FormSection title="Residency">
        <ToggleField
          label="Do you legally reside in a country other than your current nationality?"
          checked={data.residesOutsideNationality}
          onChange={(checked) =>
            update({
              residesOutsideNationality: checked,
              ...(checked ? {} : { residencePermitNumber: '', residencePermitValidUntil: '' }),
            })
          }
        />
        {data.residesOutsideNationality && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
            <FormInput
              label="Residence Permit Number"
              required
              value={data.residencePermitNumber}
              onChange={(e) => update({ residencePermitNumber: e.target.value })}
              error={errors['residencePermitNumber']}
            />
            <FormInput
              label="Permit Valid Until"
              required
              type="date"
              value={data.residencePermitValidUntil}
              onChange={(e) => update({ residencePermitValidUntil: e.target.value })}
              error={errors['residencePermitValidUntil']}
            />
          </div>
        )}
      </FormSection>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
