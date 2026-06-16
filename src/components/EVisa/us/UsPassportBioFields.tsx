import React from 'react';
import {
  DoesNotApplyField,
  FormInput,
  FormTextarea,
  ToggleField,
} from '../forms/FormControls';
import type { UsPassportBio, UsOtherName } from '../../../types/usVisa';
import type { UsValidationErrors } from '../../../validation/usVisaSchema';

interface Props {
  data: UsPassportBio;
  errors: UsValidationErrors;
  onChange: (data: UsPassportBio) => void;
}

export function UsPassportBioFields({ data, errors, onChange }: Props) {
  const update = (patch: Partial<UsPassportBio>) => onChange({ ...data, ...patch });

  const addOtherName = () =>
    update({ otherNames: [...data.otherNames, { surname: '', givenNames: '' }] });

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
      <h4 className="text-base font-semibold text-gray-800">U.S. DS-160 Bio-Data</h4>

      <DoesNotApplyField
        label="Full Name in Native Language"
        value={data.fullNameNativeLanguage}
        onChange={(v) => update({ fullNameNativeLanguage: v })}
        doesNotApply={data.fullNameNativeDoesNotApply}
        onDoesNotApplyChange={(checked) =>
          update({ fullNameNativeDoesNotApply: checked, fullNameNativeLanguage: checked ? '' : data.fullNameNativeLanguage })
        }
        error={errors['fullNameNativeLanguage']}
      />

      <ToggleField
        label="Have you used other names (maiden, religious, aliases, etc.)?"
        checked={data.otherNamesUsed}
        onChange={(checked) =>
          update({
            otherNamesUsed: checked,
            otherNames: checked && data.otherNames.length === 0 ? [{ surname: '', givenNames: '' }] : checked ? data.otherNames : [],
          })
        }
      />
      {data.otherNamesUsed && (
        <div className="space-y-3 pl-2 border-l-2 border-primary-200">
          {data.otherNames.map((name: UsOtherName, i: number) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <FormInput label="Surname" value={name.surname} onChange={(e) => {
                const next = [...data.otherNames];
                next[i] = { ...next[i], surname: e.target.value };
                update({ otherNames: next });
              }} />
              <FormInput label="Given Names" value={name.givenNames} onChange={(e) => {
                const next = [...data.otherNames];
                next[i] = { ...next[i], givenNames: e.target.value };
                update({ otherNames: next });
              }} />
            </div>
          ))}
          <button type="button" onClick={addOtherName} className="text-sm text-primary-600 hover:underline">
            + Add Another Name
          </button>
          {errors['otherNames'] && <p className="text-xs text-red-600">{errors['otherNames']}</p>}
        </div>
      )}

      <ToggleField
        label="Do you have a telecode name?"
        checked={data.telecodeNameUsed}
        onChange={(checked) => update({ telecodeNameUsed: checked, telecodeName: checked ? data.telecodeName : '' })}
      />
      {data.telecodeNameUsed && (
        <FormInput label="Telecode Name" value={data.telecodeName} onChange={(e) => update({ telecodeName: e.target.value })} error={errors['telecodeName']} />
      )}

      <DoesNotApplyField label="National Identification Number" value={data.nationalIdNumber} onChange={(v) => update({ nationalIdNumber: v })} doesNotApply={data.nationalIdDoesNotApply} onDoesNotApplyChange={(c) => update({ nationalIdDoesNotApply: c, nationalIdNumber: c ? '' : data.nationalIdNumber })} error={errors['nationalIdNumber']} />
      <DoesNotApplyField label="U.S. Social Security Number" value={data.usSocialSecurityNumber} onChange={(v) => update({ usSocialSecurityNumber: v })} doesNotApply={data.usSsnDoesNotApply} onDoesNotApplyChange={(c) => update({ usSsnDoesNotApply: c })} />
      <DoesNotApplyField label="U.S. Taxpayer ID Number" value={data.usTaxpayerIdNumber} onChange={(v) => update({ usTaxpayerIdNumber: v })} doesNotApply={data.usTaxIdDoesNotApply} onDoesNotApplyChange={(c) => update({ usTaxIdDoesNotApply: c })} />
      <DoesNotApplyField label="Passport Book Number" value={data.passportBookNumber} onChange={(v) => update({ passportBookNumber: v })} doesNotApply={data.passportBookDoesNotApply} onDoesNotApplyChange={(c) => update({ passportBookDoesNotApply: c })} />

      <FormInput label="City of Issuance" required value={data.cityOfIssuance} onChange={(e) => update({ cityOfIssuance: e.target.value })} error={errors['cityOfIssuance']} />

      <ToggleField
        label="Have you ever lost a passport or had one stolen?"
        checked={data.lostOrStolenPassport}
        onChange={(checked) => update({ lostOrStolenPassport: checked, lostOrStolenDescription: checked ? data.lostOrStolenDescription : '' })}
      />
      {data.lostOrStolenPassport && (
        <FormTextarea label="Describe the loss or theft" required value={data.lostOrStolenDescription} onChange={(e) => update({ lostOrStolenDescription: e.target.value })} error={errors['lostOrStolenDescription']} />
      )}
    </div>
  );
}
