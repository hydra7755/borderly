import React from 'react';
import { FormInput, ToggleField } from '../forms/FormControls';
import type { UsTravelersCompanions } from '../../../types/usVisa';
import type { UsValidationErrors } from '../../../validation/usVisaSchema';

interface Props {
  data: UsTravelersCompanions;
  errors: UsValidationErrors;
  onChange: (data: UsTravelersCompanions) => void;
}

export function UsTravelersCompanionsPanel({ data, errors, onChange }: Props) {
  const update = (patch: Partial<UsTravelersCompanions>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">Traveling Companions (DS-160)</h3>

      <ToggleField
        label="Are there other persons traveling with you?"
        checked={data.othersTravelingWithYou}
        onChange={(c) => update({ othersTravelingWithYou: c, companions: c ? data.companions : [], travelingAsGroup: false })}
      />

      {data.othersTravelingWithYou && (
        <>
          <ToggleField
            label="Are you traveling as part of a group or organization?"
            checked={data.travelingAsGroup}
            onChange={(c) => update({ travelingAsGroup: c, companions: c ? [] : data.companions })}
          />
          {data.travelingAsGroup ? (
            <FormInput label="Group / Organization Name" required value={data.groupName} onChange={(e) => update({ groupName: e.target.value })} error={errors['groupName']} />
          ) : (
            <div className="space-y-3">
              {data.companions.map((comp, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
                  <FormInput label="Name" value={comp.name} onChange={(e) => { const n = [...data.companions]; n[i] = { ...n[i], name: e.target.value }; update({ companions: n }); }} />
                  <FormInput label="Relationship to You" value={comp.relationship} onChange={(e) => { const n = [...data.companions]; n[i] = { ...n[i], relationship: e.target.value }; update({ companions: n }); }} />
                </div>
              ))}
              <button type="button" onClick={() => update({ companions: [...data.companions, { name: '', relationship: '' }] })} className="text-sm text-primary-600">+ Add Companion</button>
              {errors['companions'] && <p className="text-xs text-red-600">{errors['companions']}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
