import React from 'react';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  ToggleField,
} from '../forms/FormControls';
import type { UsAddress, UsContactSocial, UsTravelDetails } from '../../../types/usVisa';
import {
  US_CONTACT_RELATIONSHIP_OPTIONS,
  US_TRIP_FINANCER_OPTIONS,
} from '../../../utils/unitedStatesVisa';
import type { UsValidationErrors } from '../../../validation/usVisaSchema';

interface Props {
  data: UsTravelDetails;
  errors: UsValidationErrors;
  onChange: (data: UsTravelDetails) => void;
}

function UsAddressFields({ address, onChange, prefix, errors }: { address: UsAddress; onChange: (a: UsAddress) => void; prefix: string; errors: UsValidationErrors }) {
  const u = (patch: Partial<UsAddress>) => onChange({ ...address, ...patch });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <FormInput label="U.S. Street Address" value={address.street} onChange={(e) => u({ street: e.target.value })} error={errors[`${prefix}.street`]} />
      </div>
      <FormInput label="City" value={address.city} onChange={(e) => u({ city: e.target.value })} />
      <FormInput label="State" value={address.state} onChange={(e) => u({ state: e.target.value })} />
      <FormInput label="ZIP Code" value={address.postalCode} onChange={(e) => u({ postalCode: e.target.value })} />
    </div>
  );
}

export function UsTravelPanel({ data, errors, onChange }: Props) {
  const update = (patch: Partial<UsTravelDetails>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">U.S. Travel & Past Interactions</h3>
        <p className="text-sm text-gray-500">DS-160 travel specifics and U.S. history</p>
      </div>

      <ToggleField
        label="Have you made specific travel plans?"
        checked={data.specificTravelPlans}
        onChange={(checked) => update({ specificTravelPlans: checked })}
      />
      {data.specificTravelPlans ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Arrival Date" type="date" value={data.arrivalDate} onChange={(e) => update({ arrivalDate: e.target.value })} error={errors['arrivalDate']} />
          <FormInput label="Departure Date" type="date" value={data.departureDate} onChange={(e) => update({ departureDate: e.target.value })} />
          <FormInput label="Flight Information" value={data.flightInfo} onChange={(e) => update({ flightInfo: e.target.value })} />
          <FormInput label="U.S. Cities to Visit" required value={data.usCitiesToVisit} onChange={(e) => update({ usCitiesToVisit: e.target.value })} error={errors['usCitiesToVisit']} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Intended Date of Arrival" type="date" value={data.intendedArrivalDate} onChange={(e) => update({ intendedArrivalDate: e.target.value })} error={errors['intendedArrivalDate']} />
          <FormInput label="Intended Length of Stay" value={data.intendedLengthOfStay} onChange={(e) => update({ intendedLengthOfStay: e.target.value })} error={errors['intendedLengthOfStay']} placeholder="e.g. 2 weeks" />
        </div>
      )}

      <div className="pt-4 border-t space-y-4">
        <h4 className="font-medium">U.S. Point of Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Contact Person Name" value={data.contactPersonName} onChange={(e) => update({ contactPersonName: e.target.value })} error={errors['contactPersonName']} />
          <FormInput label="Organization Name" value={data.organizationName} onChange={(e) => update({ organizationName: e.target.value })} />
          <FormSelect label="Relationship" required value={data.contactRelationship} onChange={(e) => update({ contactRelationship: e.target.value as UsTravelDetails['contactRelationship'] })} options={US_CONTACT_RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r }))} error={errors['contactRelationship']} />
          <FormInput label="Phone" type="tel" value={data.contactPhone} onChange={(e) => update({ contactPhone: e.target.value })} />
          <FormInput label="Email" type="email" value={data.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} />
        </div>
        <UsAddressFields address={data.contactUsAddress} onChange={(contactUsAddress) => update({ contactUsAddress })} prefix="contactUsAddress" errors={errors} />
      </div>

      <FormSelect label="Who is paying for your trip?" required value={data.tripFinancer} onChange={(e) => update({ tripFinancer: e.target.value as UsTravelDetails['tripFinancer'] })} options={US_TRIP_FINANCER_OPTIONS.map((f) => ({ value: f, label: f }))} error={errors['tripFinancer']} />

      <ToggleField label="Have you ever been to the U.S. before?" checked={data.beenToUsBefore} onChange={(checked) => update({ beenToUsBefore: checked, pastUsTrips: checked && data.pastUsTrips.length === 0 ? [{ arrivalDate: '', lengthOfStay: '' }] : data.pastUsTrips })} />
      {data.beenToUsBefore && data.pastUsTrips.map((trip, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
          <FormInput label="Date of Arrival" type="date" value={trip.arrivalDate} onChange={(e) => { const next = [...data.pastUsTrips]; next[i] = { ...next[i], arrivalDate: e.target.value }; update({ pastUsTrips: next }); }} />
          <FormInput label="Length of Stay" value={trip.lengthOfStay} onChange={(e) => { const next = [...data.pastUsTrips]; next[i] = { ...next[i], lengthOfStay: e.target.value }; update({ pastUsTrips: next }); }} />
        </div>
      ))}

      <ToggleField label="Have you ever been issued a U.S. Visa?" checked={data.issuedUsVisaBefore} onChange={(checked) => update({ issuedUsVisaBefore: checked })} />
      {data.issuedUsVisaBefore && (
        <div className="space-y-3 pl-2 border-l-2 border-primary-200">
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Date of Last Visa" type="date" value={data.lastVisaDate} onChange={(e) => update({ lastVisaDate: e.target.value })} />
            <FormInput label="Visa Number" value={data.lastVisaNumber} onChange={(e) => update({ lastVisaNumber: e.target.value })} />
          </div>
          <ToggleField label="Are you applying for the same type of visa?" checked={data.applyingSameVisaType === true} onChange={(c) => update({ applyingSameVisaType: c })} />
          <ToggleField label="Are you applying in the same country?" checked={data.applyingSameCountry === true} onChange={(c) => update({ applyingSameCountry: c })} />
          <ToggleField label="Have you been fingerprinted?" checked={data.fingerprintsTakenBefore === true} onChange={(c) => update({ fingerprintsTakenBefore: c })} />
        </div>
      )}

      <ToggleField label="Have you ever been refused a U.S. Visa or admission to the US?" checked={data.refusedUsVisaOrAdmission} onChange={(checked) => update({ refusedUsVisaOrAdmission: checked })} />
      {data.refusedUsVisaOrAdmission && (
        <FormTextarea label="Explain" required value={data.refusalExplanation} onChange={(e) => update({ refusalExplanation: e.target.value })} error={errors['refusalExplanation']} />
      )}

      <ToggleField label="Has anyone ever filed an immigrant petition on your behalf with USCIS?" checked={data.immigrantPetitionFiled} onChange={(checked) => update({ immigrantPetitionFiled: checked })} />
      {data.immigrantPetitionFiled && (
        <FormTextarea label="Explain" required value={data.immigrantPetitionExplanation} onChange={(e) => update({ immigrantPetitionExplanation: e.target.value })} error={errors['immigrantPetitionExplanation']} />
      )}
    </div>
  );
}
