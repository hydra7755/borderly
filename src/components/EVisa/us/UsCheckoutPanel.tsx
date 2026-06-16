import React, { useState } from 'react';
import { FormInput, FormSelect, FormTextarea, ToggleField } from '../forms/FormControls';
import type { UsCheckoutCompliance, UsSecurityQuestion } from '../../../types/usVisa';
import { US_SECURITY_QUESTIONS } from '../../../types/usVisa';
import { US_SUBMISSION_LOCATIONS } from '../../../utils/unitedStatesVisa';
import type { UsValidationErrors } from '../../../validation/usVisaSchema';

interface Props {
  data: UsCheckoutCompliance;
  errors: UsValidationErrors;
  onChange: (data: UsCheckoutCompliance) => void;
}

type SecurityTab = 'medicalHealth' | 'criminalHistory' | 'securityTerrorism' | 'immigrationViolations';

const TAB_LABELS: Record<SecurityTab, string> = {
  medicalHealth: 'Part 1: Medical / Health',
  criminalHistory: 'Part 2: Criminal History',
  securityTerrorism: 'Part 3: Security / Terrorism',
  immigrationViolations: 'Part 4: Immigration Violations',
};

function SecuritySection({
  questions,
  answers,
  onChange,
  prefix,
  errors,
}: {
  questions: readonly string[];
  answers: UsSecurityQuestion[];
  onChange: (answers: UsSecurityQuestion[]) => void;
  prefix: string;
  errors: UsValidationErrors;
}) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <p className="text-sm text-gray-800">{q}</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!answers[i]?.answer} onChange={() => { const n = [...answers]; n[i] = { answer: false, explanation: '' }; onChange(n); }} /> No
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={answers[i]?.answer === true} onChange={() => { const n = [...answers]; n[i] = { answer: true, explanation: n[i]?.explanation ?? '' }; onChange(n); }} /> Yes
            </label>
          </div>
          {answers[i]?.answer && (
            <FormTextarea label="Explain (required)" value={answers[i].explanation} onChange={(e) => { const n = [...answers]; n[i] = { ...n[i], explanation: e.target.value }; onChange(n); }} error={errors[`${prefix}.${i}.explanation`]} />
          )}
        </div>
      ))}
    </div>
  );
}

export function UsCheckoutPanel({ data, errors, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<SecurityTab>('medicalHealth');
  const update = (patch: Partial<UsCheckoutCompliance>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">U.S. Visa Admissibility & Compliance</h3>
        <p className="text-sm text-gray-500">Complete all security questionnaires before payment</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {(Object.keys(TAB_LABELS) as SecurityTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg ${activeTab === tab ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <SecuritySection
        questions={US_SECURITY_QUESTIONS[activeTab]}
        answers={data.securityBackground[activeTab]}
        onChange={(section) => update({ securityBackground: { ...data.securityBackground, [activeTab]: section } })}
        prefix={activeTab}
        errors={errors}
      />

      <ToggleField label="Did anyone assist you in filling out this application?" checked={data.preparerAssisted} onChange={(c) => update({ preparerAssisted: c })} />
      {data.preparerAssisted && (
        <FormInput label="Preparer Name" required value={data.preparerName} onChange={(e) => update({ preparerName: e.target.value })} error={errors['preparerName']} />
      )}

      <FormSelect
        label="Embassy / Location Where Application is Submitted"
        required
        value={data.submissionLocation}
        onChange={(e) => update({ submissionLocation: e.target.value })}
        options={US_SUBMISSION_LOCATIONS.map((l) => ({ value: l, label: l }))}
        error={errors['submissionLocation']}
      />

      <label className="flex items-start gap-3 p-4 border rounded-lg">
        <input type="checkbox" checked={data.declarationsAccepted} onChange={(e) => update({ declarationsAccepted: e.target.checked })} className="mt-1 rounded" />
        <span className="text-sm text-gray-800">
          I certify that all information provided is true and complete. I understand that false statements may result in permanent ineligibility for a U.S. visa.
        </span>
      </label>
      {errors['declarationsAccepted'] && <p className="text-xs text-red-600">{errors['declarationsAccepted']}</p>}

      <FormInput label="Type your full legal name as signature" required value={data.signatureName} onChange={(e) => update({ signatureName: e.target.value })} error={errors['signatureName']} />
    </div>
  );
}
