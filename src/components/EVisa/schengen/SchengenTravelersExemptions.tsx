import React from 'react';
import { FormSection, FormInput, FormSelect, ToggleField } from '../forms/FormControls';
import {
  EU_RELATIONSHIP_TYPES,
  isApplicantMinor,
  type SchengenEuFamilyExemption,
  type SchengenGuardianDetails,
} from '../../../types/schengenVisa';
import { SCHENGEN_COUNTRY_OPTIONS } from '../../../utils/schengenCountries';
import type { SchengenValidationErrors } from '../../../validation/schengenVisaSchema';
import type { WaivedFormField } from '../../../types/visaRouting';
import { isFieldWaived } from '../../../engine/visaRoutingEngine';

interface SchengenTravelersExemptionsProps {
  dateOfBirth: string | undefined;
  guardianDetails: SchengenGuardianDetails | null;
  euFamilyExemption: SchengenEuFamilyExemption;
  errors: SchengenValidationErrors;
  waivedFields?: WaivedFormField[];
  onGuardianChange: (details: SchengenGuardianDetails | null) => void;
  onEuFamilyChange: (data: SchengenEuFamilyExemption) => void;
}

export function SchengenTravelersExemptions({
  dateOfBirth,
  guardianDetails,
  euFamilyExemption,
  errors,
  waivedFields = [],
  onGuardianChange,
  onEuFamilyChange,
}: SchengenTravelersExemptionsProps) {
  const isMinor = isApplicantMinor(dateOfBirth);
  const waiveEuFamily = isFieldWaived(waivedFields, 'travelers.euFamilyExemption');
  const guardian = guardianDetails ?? { name: '', address: '', nationality: '' };

  const updateGuardian = (patch: Partial<SchengenGuardianDetails>) =>
    onGuardianChange({ ...guardian, ...patch });

  const updateEu = (patch: Partial<SchengenEuFamilyExemption>) => {
    const next = { ...euFamilyExemption, ...patch };
    if (patch.isEuFamilyMember !== undefined) {
      next.employmentFundingOptional = patch.isEuFamilyMember;
    }
    onEuFamilyChange(next);
  };

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Schengen Exemptions & Declarations</h3>
        <p className="text-sm text-gray-500 mt-1">Additional checks required for Schengen visa applications.</p>
      </div>

      {isMinor && (
        <FormSection title="Parental Authority / Legal Guardian (Required for Minors)">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4">
            Applicant is under 18. Guardian details are mandatory.
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormInput
              label="Guardian Full Name"
              required
              value={guardian.name}
              onChange={(e) => updateGuardian({ name: e.target.value })}
              error={errors['name'] || errors['guardianDetails']}
            />
            <FormInput
              label="Guardian Address"
              required
              value={guardian.address}
              onChange={(e) => updateGuardian({ address: e.target.value })}
              error={errors['address']}
            />
            <FormSelect
              label="Guardian Nationality"
              required
              value={guardian.nationality}
              onChange={(e) => updateGuardian({ nationality: e.target.value })}
              options={SCHENGEN_COUNTRY_OPTIONS.map((c) => ({ value: c.label, label: c.label }))}
              error={errors['nationality']}
            />
          </div>
        </FormSection>
      )}

      {!waiveEuFamily && (
      <FormSection title="EU / EEA / Swiss Family Member Exemption">
        <ToggleField
          label="Are you a close family member of an EU, EEA, or Swiss citizen?"
          description="If yes, employment and funding proof may be waived per Schengen rules."
          checked={euFamilyExemption.isEuFamilyMember}
          onChange={(checked) =>
            updateEu({
              isEuFamilyMember: checked,
              employmentFundingOptional: checked,
              ...(checked
                ? {}
                : {
                    familyMemberName: '',
                    familyMemberNationality: '',
                    relationshipType: '',
                  }),
            })
          }
        />

        {euFamilyExemption.isEuFamilyMember && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Family Member Full Name"
              required
              value={euFamilyExemption.familyMemberName}
              onChange={(e) => updateEu({ familyMemberName: e.target.value })}
              error={errors['familyMemberName']}
            />
            <FormInput
              label="Family Member Nationality"
              required
              value={euFamilyExemption.familyMemberNationality}
              onChange={(e) => updateEu({ familyMemberNationality: e.target.value })}
              placeholder="e.g. German, French, Norwegian"
              error={errors['familyMemberNationality']}
            />
            <div className="md:col-span-2">
              <FormSelect
                label="Relationship Type"
                required
                value={euFamilyExemption.relationshipType}
                onChange={(e) => updateEu({ relationshipType: e.target.value })}
                options={EU_RELATIONSHIP_TYPES.map((r) => ({ value: r, label: r }))}
                error={errors['relationshipType']}
              />
            </div>
            {euFamilyExemption.employmentFundingOptional && (
              <p className="md:col-span-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                Employment and means-of-support documentation flagged as optional for backend processing.
              </p>
            )}
          </div>
        )}
      </FormSection>
      )}
    </div>
  );
}
