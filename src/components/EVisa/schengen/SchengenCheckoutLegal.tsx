import React from 'react';
import {
  FormSection,
  RadioCardGroup,
  CheckboxGroup,
} from '../forms/FormControls';
import { DigitalSignature } from '../forms/DigitalSignature';
import {
  SELF_SUPPORT_METHODS,
  SPONSOR_COVERAGE_OPTIONS,
  type SchengenDeclarations,
  type SchengenMeansOfSupport,
} from '../../../types/schengenVisa';
import type { SchengenValidationErrors } from '../../../validation/schengenVisaSchema';

interface SchengenCheckoutLegalProps {
  meansOfSupport: SchengenMeansOfSupport;
  declarations: SchengenDeclarations;
  hostName: string;
  hostAddress: string;
  errors: SchengenValidationErrors;
  onMeansChange: (data: SchengenMeansOfSupport) => void;
  onDeclarationsChange: (data: SchengenDeclarations) => void;
}

const VIS_LEGAL_TEXT = `Schengen Information System (VIS) Data Processing

Your personal data, including biometric data (fingerprints and photograph), will be collected and processed in the Visa Information System (VIS) for the purpose of examining and deciding on your visa application. The data may be shared with Schengen member states and authorized authorities for visa processing, border control, and immigration enforcement.

Data is retained for the period necessary for visa processing and as required by EU regulations. You have the right to access, rectify, or request deletion of your data subject to applicable law.`;

const TMI_LEGAL_TEXT = `Travel Medical Insurance (TMI) Requirement

Applicants for a Schengen visa must hold travel medical insurance valid for the entire Schengen area, covering emergency medical treatment, hospitalisation, and repatriation. Minimum coverage is EUR 30,000. Insurance must be valid for the entire duration of stay and all Schengen member states you intend to visit.`;

export function SchengenCheckoutLegal({
  meansOfSupport,
  declarations,
  hostName,
  hostAddress,
  errors,
  onMeansChange,
  onDeclarationsChange,
}: SchengenCheckoutLegalProps) {
  const updateMeans = (patch: Partial<SchengenMeansOfSupport>) =>
    onMeansChange({ ...meansOfSupport, ...patch });

  const updateDecl = (patch: Partial<SchengenDeclarations>) =>
    onDeclarationsChange({ ...declarations, ...patch });

  return (
    <div className="space-y-6">
      <FormSection title="Means of Support">
        <RadioCardGroup
          label="How are your travel expenses being covered?"
          name="means-of-support"
          value={meansOfSupport.type}
          options={[
            { value: 'self' as const, label: 'Myself', description: 'Self-funded travel' },
            { value: 'sponsor' as const, label: 'A Sponsor / Host', description: 'Third party covers expenses' },
          ]}
          onChange={(v) =>
            updateMeans({
              type: v,
              selfMethods: v === 'self' ? meansOfSupport.selfMethods : [],
              sponsorCoverage: v === 'sponsor' ? meansOfSupport.sponsorCoverage : [],
            })
          }
          error={errors['type']}
          columns={2}
        />

        {meansOfSupport.type === 'self' && (
          <CheckboxGroup
            label="Select all applicable support methods"
            options={[...SELF_SUPPORT_METHODS]}
            selected={meansOfSupport.selfMethods}
            onChange={(selected) => updateMeans({ selfMethods: selected })}
            error={errors['selfMethods']}
          />
        )}

        {meansOfSupport.type === 'sponsor' && (
          <div className="space-y-4">
            {(hostName || hostAddress) && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <p className="font-medium text-gray-800 mb-1">Host details from Travel Details step:</p>
                {hostName && <p className="text-gray-600">{hostName}</p>}
                {hostAddress && <p className="text-gray-600">{hostAddress}</p>}
              </div>
            )}
            <CheckboxGroup
              label="Coverage provided by sponsor/host"
              options={[...SPONSOR_COVERAGE_OPTIONS]}
              selected={meansOfSupport.sponsorCoverage}
              onChange={(selected) => updateMeans({ sponsorCoverage: selected })}
              error={errors['sponsorCoverage']}
            />
          </div>
        )}
      </FormSection>

      <FormSection title="Schengen Declarations & Signature">
        <div className="max-h-48 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 space-y-4 leading-relaxed">
          <div>
            <p className="font-semibold text-gray-900 mb-1">VIS Data Processing</p>
            <p>{VIS_LEGAL_TEXT}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Travel Medical Insurance</p>
            <p>{TMI_LEGAL_TEXT}</p>
          </div>
        </div>

        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={declarations.visDataProcessingAccepted}
            onChange={(e) => updateDecl({ visDataProcessingAccepted: e.target.checked })}
            className="mt-1 h-4 w-4 text-primary-600 rounded"
          />
          <span className="text-sm text-gray-800">
            I accept the processing of my personal data in the Schengen Information System (VIS)
            <span className="text-red-500"> *</span>
          </span>
        </label>
        {errors['visDataProcessingAccepted'] && (
          <p className="text-xs text-red-600">{errors['visDataProcessingAccepted']}</p>
        )}

        <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={declarations.tmiAcknowledged}
            onChange={(e) => updateDecl({ tmiAcknowledged: e.target.checked })}
            className="mt-1 h-4 w-4 text-primary-600 rounded"
          />
          <span className="text-sm text-gray-800">
            I acknowledge the Travel Medical Insurance (TMI) requirement for Schengen visas
            <span className="text-red-500"> *</span>
          </span>
        </label>
        {errors['tmiAcknowledged'] && (
          <p className="text-xs text-red-600">{errors['tmiAcknowledged']}</p>
        )}

        <DigitalSignature
          signatureType={declarations.signatureType}
          signatureData={declarations.signatureData}
          typedSignatureName={declarations.typedSignatureName}
          onSignatureTypeChange={(type) => updateDecl({ signatureType: type })}
          onSignatureDataChange={(data) => updateDecl({ signatureData: data })}
          onTypedNameChange={(name) => updateDecl({ typedSignatureName: name })}
          error={errors['signatureData'] || errors['typedSignatureName']}
        />
      </FormSection>
    </div>
  );
}
