import React from 'react';
import CountrySelect from '../CountrySelect';
import type { PremiumVisaType } from '../types/visaRouting';

const PREMIUM_VISA_OPTIONS: { id: PremiumVisaType; label: string; description: string }[] = [
  { id: 'US', label: 'U.S. Visa', description: 'Valid B1/B2 or similar' },
  { id: 'UK', label: 'UK Visa', description: 'Valid UK entry clearance' },
  { id: 'SCHENGEN', label: 'Schengen Visa', description: 'Valid Schengen short-stay visa' },
  { id: 'AU', label: 'Australia Visa', description: 'Valid Australian multi-entry visa' },
  { id: 'CA', label: 'Canada Visa', description: 'Valid Canadian multi-entry visa' },
  { id: 'NZ', label: 'New Zealand Visa', description: 'Valid New Zealand multi-entry visa' },
];

export interface VisaEligibilityInputProps {
  residenceCountry: string | null;
  heldPremiumVisas: PremiumVisaType[];
  onResidenceCountryChange: (code: string) => void;
  onPremiumVisaToggle: (visa: PremiumVisaType) => void;
  className?: string;
}

export const VisaEligibilityInput: React.FC<VisaEligibilityInputProps> = ({
  residenceCountry,
  heldPremiumVisas,
  onResidenceCountryChange,
  onPremiumVisaToggle,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your eligibility context
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Tell us where you live and which visas you hold so we can tailor requirements, stay limits,
          and form fields.
        </p>
      </div>

      <div className="space-y-4">
        <CountrySelect
          id="eligibility-residence"
          label="Country of residence"
          value={residenceCountry ?? ''}
          onChange={onResidenceCountryChange}
          placeholder="Select your country of residence"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Active premium visas you hold
          </p>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Select all that apply — valid multi-entry visas from these regions can unlock simplified
            e-Visa routes even if you live in your home country.
          </p>
          <div className="flex flex-wrap gap-2">
            {PREMIUM_VISA_OPTIONS.map((option) => {
              const selected = heldPremiumVisas.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onPremiumVisaToggle(option.id)}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    selected
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                      : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                  aria-pressed={selected}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaEligibilityInput;
