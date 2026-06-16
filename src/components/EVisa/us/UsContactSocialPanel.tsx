import React from 'react';
import {
  FormInput,
  FormSelect,
  ToggleField,
  TagInput,
} from '../forms/FormControls';
import type { UsAddress, UsContactSocial } from '../../../types/usVisa';
import { SOCIAL_MEDIA_PLATFORMS } from '../../../utils/unitedStatesVisa';
import type { UsValidationErrors } from '../../../validation/usVisaSchema';

interface Props {
  data: UsContactSocial;
  errors: UsValidationErrors;
  onChange: (data: UsContactSocial) => void;
}

function AddressFields({
  label,
  address,
  onChange,
  errors,
  prefix,
}: {
  label: string;
  address: UsAddress;
  onChange: (a: UsAddress) => void;
  errors: UsValidationErrors;
  prefix: string;
}) {
  const u = (patch: Partial<UsAddress>) => onChange({ ...address, ...patch });
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-800">{label}</h4>
      <FormInput label="Street" value={address.street} onChange={(e) => u({ street: e.target.value })} error={errors[`${prefix}.street`]} />
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="City" value={address.city} onChange={(e) => u({ city: e.target.value })} error={errors[`${prefix}.city`]} />
        <FormInput label="State/Province" value={address.state} onChange={(e) => u({ state: e.target.value })} />
        <FormInput label="Postal Code" value={address.postalCode} onChange={(e) => u({ postalCode: e.target.value })} />
        <FormInput label="Country" value={address.country} onChange={(e) => u({ country: e.target.value })} />
      </div>
    </div>
  );
}

export function UsContactSocialPanel({ data, errors, onChange }: Props) {
  const update = (patch: Partial<UsContactSocial>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Contact & Social Media</h2>
        <p className="text-sm text-gray-500 mt-1">DS-160 contact information and 5-year social media disclosure</p>
      </div>

      <AddressFields label="Home Address" address={data.homeAddress} onChange={(homeAddress) => update({ homeAddress })} errors={errors} prefix="homeAddress" />

      <ToggleField
        label="Is your Mailing Address the same as your Home Address?"
        checked={data.mailingSameAsHome}
        onChange={(checked) => update({ mailingSameAsHome: checked })}
      />
      {!data.mailingSameAsHome && (
        <AddressFields label="Mailing Address" address={data.mailingAddress} onChange={(mailingAddress) => update({ mailingAddress })} errors={errors} prefix="mailingAddress" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput label="Primary Phone" required type="tel" value={data.primaryPhone} onChange={(e) => update({ primaryPhone: e.target.value })} error={errors['primaryPhone']} />
        <FormInput label="Secondary Phone" type="tel" value={data.secondaryPhone} onChange={(e) => update({ secondaryPhone: e.target.value })} />
        <FormInput label="Work Phone" type="tel" value={data.workPhone} onChange={(e) => update({ workPhone: e.target.value })} />
      </div>

      <ToggleField
        label="Do you have any additional phone numbers used over the past 5 years?"
        checked={data.additionalPhonesPast5Years}
        onChange={(checked) => update({ additionalPhonesPast5Years: checked, additionalPhoneNumbers: checked ? data.additionalPhoneNumbers : [] })}
      />
      {data.additionalPhonesPast5Years && (
        <TagInput label="Additional Phone Numbers" tags={data.additionalPhoneNumbers} onChange={(additionalPhoneNumbers) => update({ additionalPhoneNumbers })} placeholder="Enter phone and press Add" />
      )}

      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">5-Year Social Media Accounts</h4>
        {data.socialMediaAccounts.map((account, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
            <FormSelect
              label="Platform"
              value={account.platform}
              onChange={(e) => {
                const next = [...data.socialMediaAccounts];
                next[i] = { ...next[i], platform: e.target.value };
                update({ socialMediaAccounts: next });
              }}
              options={SOCIAL_MEDIA_PLATFORMS.map((p) => ({ value: p, label: p }))}
              placeholder="Select platform"
            />
            <FormInput
              label="Handle / Identifier"
              value={account.handle}
              onChange={(e) => {
                const next = [...data.socialMediaAccounts];
                next[i] = { ...next[i], handle: e.target.value };
                update({ socialMediaAccounts: next });
              }}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => update({ socialMediaAccounts: [...data.socialMediaAccounts, { platform: '', handle: '' }] })}
          className="text-sm text-primary-600 hover:underline"
        >
          + Add Another Account
        </button>
        {errors['socialMediaAccounts'] && <p className="text-xs text-red-600">{errors['socialMediaAccounts']}</p>}
      </div>
    </div>
  );
}
