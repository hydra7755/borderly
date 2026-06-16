import React from 'react';
import { FormInput, FormSelect, ToggleField } from '../forms/FormControls';
import type { UsFamilyBackground, UsParentDetails } from '../../../types/usVisa';
import type { UsValidationErrors } from '../../../validation/usVisaSchema';

interface Props {
  data: UsFamilyBackground;
  errors: UsValidationErrors;
  onChange: (data: UsFamilyBackground) => void;
}

const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Registered Partnership'];

function ParentFields({
  label,
  parent,
  onChange,
  errors,
  prefix,
}: {
  label: string;
  parent: UsParentDetails;
  onChange: (p: UsParentDetails) => void;
  errors: UsValidationErrors;
  prefix: string;
}) {
  const u = (patch: Partial<UsParentDetails>) => onChange({ ...parent, ...patch });
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <h4 className="font-medium text-gray-800">{label}</h4>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={parent.doNotKnow} onChange={(e) => u({ doNotKnow: e.target.checked })} className="rounded" />
        Do Not Know (biographical details)
      </label>
      {!parent.doNotKnow && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormInput label="Surname" value={parent.surname} onChange={(e) => u({ surname: e.target.value })} error={errors[`${prefix}.surname`]} />
          <FormInput label="Given Names" value={parent.givenNames} onChange={(e) => u({ givenNames: e.target.value })} />
          <FormInput label="Date of Birth" type="date" value={parent.dateOfBirth} onChange={(e) => u({ dateOfBirth: e.target.value })} />
        </div>
      )}
      <ToggleField label={`Is your ${label.toLowerCase()} in the U.S.?`} checked={parent.isInUs} onChange={(c) => u({ isInUs: c })} />
    </div>
  );
}

export function UsFamilyPanel({ data, errors, onChange }: Props) {
  const update = (patch: Partial<UsFamilyBackground>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Family & Relatives Background</h3>
        <p className="text-sm text-gray-500">DS-160 family biographical information</p>
      </div>

      <ParentFields label="Father" parent={data.father} onChange={(father) => update({ father })} errors={errors} prefix="father" />
      <ParentFields label="Mother" parent={data.mother} onChange={(mother) => update({ mother })} errors={errors} prefix="mother" />

      <ToggleField label="Do you have immediate relatives (not parents) in the U.S.?" description="e.g. fiancé, spouse, child, sibling" checked={data.immediateRelativesInUs} onChange={(c) => update({ immediateRelativesInUs: c })} />
      <ToggleField label="Do you have any other relatives in the United States?" checked={data.otherRelativesInUs} onChange={(c) => update({ otherRelativesInUs: c })} />

      <FormSelect label="Marital Status" value={data.maritalStatus} onChange={(e) => {
        const maritalStatus = e.target.value;
        update({
          maritalStatus,
          spouse: maritalStatus === 'Married' ? (data.spouse ?? { surname: '', givenNames: '', dateOfBirth: '', nationality: '', cityOfBirth: '', countryOfBirth: '' }) : null,
        });
      }} options={MARITAL_OPTIONS.map((m) => ({ value: m, label: m }))} />

      {data.maritalStatus === 'Married' && data.spouse && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium">Spouse Profile</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormInput label="Surname" value={data.spouse.surname} onChange={(e) => update({ spouse: { ...data.spouse!, surname: e.target.value } })} error={errors['spouse.surname']} />
            <FormInput label="Given Names" value={data.spouse.givenNames} onChange={(e) => update({ spouse: { ...data.spouse!, givenNames: e.target.value } })} />
            <FormInput label="Date of Birth" type="date" value={data.spouse.dateOfBirth} onChange={(e) => update({ spouse: { ...data.spouse!, dateOfBirth: e.target.value } })} error={errors['spouse.dateOfBirth']} />
            <FormInput label="Nationality" value={data.spouse.nationality} onChange={(e) => update({ spouse: { ...data.spouse!, nationality: e.target.value } })} />
            <FormInput label="City of Birth" value={data.spouse.cityOfBirth} onChange={(e) => update({ spouse: { ...data.spouse!, cityOfBirth: e.target.value } })} />
            <FormInput label="Country of Birth" value={data.spouse.countryOfBirth} onChange={(e) => update({ spouse: { ...data.spouse!, countryOfBirth: e.target.value } })} />
          </div>
        </div>
      )}
    </div>
  );
}
