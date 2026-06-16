import React from 'react';
import {
  DoesNotApplyField,
  FormInput,
  FormSelect,
  FormTextarea,
  TagInput,
  ToggleField,
} from '../forms/FormControls';
import type { UsWorkEducation } from '../../../types/usVisa';
import { US_OCCUPATION_OPTIONS } from '../../../utils/unitedStatesVisa';
import type { UsValidationErrors } from '../../../validation/usVisaSchema';

interface Props {
  data: UsWorkEducation;
  errors: UsValidationErrors;
  onChange: (data: UsWorkEducation) => void;
}

export function UsWorkEducationPanel({ data, errors, onChange }: Props) {
  const update = (patch: Partial<UsWorkEducation>) => onChange({ ...data, ...patch });
  const showEmployer = !['Not Employed', 'Retired', 'Homemaker', ''].includes(data.occupation);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Work, Education & History</h3>
        <p className="text-sm text-gray-500">DS-160 employment, education, and background deep-dive</p>
      </div>

      <FormSelect label="Primary Occupation" required value={data.occupation} onChange={(e) => update({ occupation: e.target.value as UsWorkEducation['occupation'] })} options={US_OCCUPATION_OPTIONS.map((o) => ({ value: o, label: o }))} error={errors['occupation']} />

      {showEmployer && (
        <div className="space-y-3 p-4 border rounded-lg">
          <h4 className="font-medium">Current Employment / Education</h4>
          <FormInput label="Employer / School Name" required value={data.employerSchoolName} onChange={(e) => update({ employerSchoolName: e.target.value })} error={errors['employerSchoolName']} />
          <FormInput label="Address" value={data.employerAddress} onChange={(e) => update({ employerAddress: e.target.value })} />
          <FormInput label="Phone" type="tel" value={data.employerPhone} onChange={(e) => update({ employerPhone: e.target.value })} />
          <FormInput label="Monthly Salary (Local Currency)" value={data.monthlySalaryLocal} onChange={(e) => update({ monthlySalaryLocal: e.target.value })} />
          <FormTextarea label="Briefly Describe your Duties" required value={data.dutiesDescription} onChange={(e) => update({ dutiesDescription: e.target.value })} error={errors['dutiesDescription']} />
        </div>
      )}

      <ToggleField label="Were you previously employed within the past 5 years?" checked={data.previouslyEmployed} onChange={(c) => update({ previouslyEmployed: c, pastEmployments: c && data.pastEmployments.length === 0 ? [{ employerName: '', address: '', jobTitle: '', supervisorName: '', dateFrom: '', dateTo: '' }] : data.pastEmployments })} />
      {data.previouslyEmployed && data.pastEmployments.map((emp, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <FormInput label="Employer Name" value={emp.employerName} onChange={(e) => { const n = [...data.pastEmployments]; n[i] = { ...n[i], employerName: e.target.value }; update({ pastEmployments: n }); }} />
          <FormInput label="Address" value={emp.address} onChange={(e) => { const n = [...data.pastEmployments]; n[i] = { ...n[i], address: e.target.value }; update({ pastEmployments: n }); }} />
          <div className="grid grid-cols-2 gap-2">
            <FormInput label="Job Title" value={emp.jobTitle} onChange={(e) => { const n = [...data.pastEmployments]; n[i] = { ...n[i], jobTitle: e.target.value }; update({ pastEmployments: n }); }} />
            <FormInput label="Supervisor" value={emp.supervisorName} onChange={(e) => { const n = [...data.pastEmployments]; n[i] = { ...n[i], supervisorName: e.target.value }; update({ pastEmployments: n }); }} />
            <FormInput label="From" type="date" value={emp.dateFrom} onChange={(e) => { const n = [...data.pastEmployments]; n[i] = { ...n[i], dateFrom: e.target.value }; update({ pastEmployments: n }); }} />
            <FormInput label="To" type="date" value={emp.dateTo} onChange={(e) => { const n = [...data.pastEmployments]; n[i] = { ...n[i], dateTo: e.target.value }; update({ pastEmployments: n }); }} />
          </div>
        </div>
      ))}
      {data.previouslyEmployed && (
        <button type="button" onClick={() => update({ pastEmployments: [...data.pastEmployments, { employerName: '', address: '', jobTitle: '', supervisorName: '', dateFrom: '', dateTo: '' }] })} className="text-sm text-primary-600">+ Add Past Employment</button>
      )}

      <ToggleField label="Attended secondary level or above (High School/University)?" checked={data.attendedSecondaryOrAbove} onChange={(c) => update({ attendedSecondaryOrAbove: c, educationHistory: c && data.educationHistory.length === 0 ? [{ schoolName: '', address: '', courseOfStudy: '', dateFrom: '', dateTo: '' }] : data.educationHistory })} />
      {data.attendedSecondaryOrAbove && data.educationHistory.map((edu, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <FormInput label="School Name" value={edu.schoolName} onChange={(e) => { const n = [...data.educationHistory]; n[i] = { ...n[i], schoolName: e.target.value }; update({ educationHistory: n }); }} />
          <FormInput label="Address" value={edu.address} onChange={(e) => { const n = [...data.educationHistory]; n[i] = { ...n[i], address: e.target.value }; update({ educationHistory: n }); }} />
          <FormInput label="Course of Study" value={edu.courseOfStudy} onChange={(e) => { const n = [...data.educationHistory]; n[i] = { ...n[i], courseOfStudy: e.target.value }; update({ educationHistory: n }); }} />
          <div className="grid grid-cols-2 gap-2">
            <FormInput label="From" type="date" value={edu.dateFrom} onChange={(e) => { const n = [...data.educationHistory]; n[i] = { ...n[i], dateFrom: e.target.value }; update({ educationHistory: n }); }} />
            <FormInput label="To" type="date" value={edu.dateTo} onChange={(e) => { const n = [...data.educationHistory]; n[i] = { ...n[i], dateTo: e.target.value }; update({ educationHistory: n }); }} />
          </div>
        </div>
      ))}

      <DoesNotApplyField label="Clan or Tribe Name" value={data.clanOrTribeName} onChange={(v) => update({ clanOrTribeName: v })} doesNotApply={data.clanOrTribeDoesNotApply} onDoesNotApplyChange={(c) => update({ clanOrTribeDoesNotApply: c })} />
      <TagInput label="Languages You Speak" tags={data.languagesSpoken} onChange={(languagesSpoken) => update({ languagesSpoken })} error={errors['languagesSpoken']} placeholder="e.g. English" />
      <TagInput label="Countries Visited in Last 5 Years" tags={data.countriesVisitedPast5Years} onChange={(countriesVisitedPast5Years) => update({ countriesVisitedPast5Years })} placeholder="Country name" />

      <ToggleField label="Belonged to or worked for any professional, social, or charitable organization?" checked={data.belongedToOrganization} onChange={(c) => update({ belongedToOrganization: c })} />
      {data.belongedToOrganization && <FormTextarea label="Explain" value={data.organizationExplanation} onChange={(e) => update({ organizationExplanation: e.target.value })} error={errors['organizationExplanation']} />}

      <ToggleField label="Specialized skills (firearms, explosives, nuclear, biological, chemical)?" checked={data.specializedSkills} onChange={(c) => update({ specializedSkills: c })} />
      {data.specializedSkills && <FormTextarea label="Explain" value={data.specializedSkillsExplanation} onChange={(e) => update({ specializedSkillsExplanation: e.target.value })} error={errors['specializedSkillsExplanation']} />}

      <ToggleField label="Have you ever served in the military?" checked={data.servedInMilitary} onChange={(c) => update({ servedInMilitary: c, militaryService: c ? (data.militaryService ?? { country: '', branch: '', rank: '', specialty: '', dateFrom: '', dateTo: '' }) : null })} />
      {data.servedInMilitary && data.militaryService && (
        <div className="grid grid-cols-2 gap-3 p-3 border rounded-lg">
          <FormInput label="Country" value={data.militaryService.country} onChange={(e) => update({ militaryService: { ...data.militaryService!, country: e.target.value } })} />
          <FormInput label="Branch" value={data.militaryService.branch} onChange={(e) => update({ militaryService: { ...data.militaryService!, branch: e.target.value } })} />
          <FormInput label="Rank" value={data.militaryService.rank} onChange={(e) => update({ militaryService: { ...data.militaryService!, rank: e.target.value } })} />
          <FormInput label="Specialty" value={data.militaryService.specialty} onChange={(e) => update({ militaryService: { ...data.militaryService!, specialty: e.target.value } })} />
          <FormInput label="Service From" type="date" value={data.militaryService.dateFrom} onChange={(e) => update({ militaryService: { ...data.militaryService!, dateFrom: e.target.value } })} />
          <FormInput label="Service To" type="date" value={data.militaryService.dateTo} onChange={(e) => update({ militaryService: { ...data.militaryService!, dateTo: e.target.value } })} />
        </div>
      )}

      <ToggleField label="Involved with paramilitary, rebel, or insurgent group?" checked={data.paramilitaryInvolvement} onChange={(c) => update({ paramilitaryInvolvement: c })} />
      {data.paramilitaryInvolvement && <FormTextarea label="Explain" value={data.paramilitaryExplanation} onChange={(e) => update({ paramilitaryExplanation: e.target.value })} error={errors['paramilitaryExplanation']} />}
    </div>
  );
}
