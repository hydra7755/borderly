import React from 'react';
import {
  calculateSchengenTravelInsuranceGbp,
  countTravelDays,
  SCHENGEN_TRAVEL_INSURANCE_BASE_GBP,
  SCHENGEN_TRAVEL_INSURANCE_EXTRA_PER_DAY_GBP,
} from '../../config/schengenPricing';

export interface SchengenTravelInsuranceAddonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  travelDays?: number;
  travelerCount?: number;
  currencySymbol?: string;
  className?: string;
}

const SchengenTravelInsuranceAddon: React.FC<SchengenTravelInsuranceAddonProps> = ({
  checked,
  onChange,
  travelDays = 0,
  travelerCount = 1,
  currencySymbol = '£',
  className = '',
}) => {
  const daysForPricing = travelDays > 0 ? travelDays : 1;
  const perTraveler = calculateSchengenTravelInsuranceGbp(daysForPricing);
  const total = perTraveler * travelerCount;

  return (
    <div
      className={`rounded-lg border border-primary-200 bg-white p-4 dark:border-primary-700 dark:bg-gray-800 ${className}`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div className="flex-1">
          <p className="font-medium text-gray-900 dark:text-white">Add Schengen travel insurance</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            UK residents only. Coverage meets Schengen requirements (minimum €30,000). From{' '}
            {currencySymbol}
            {SCHENGEN_TRAVEL_INSURANCE_BASE_GBP} for trips under 5 days, then +{currencySymbol}
            {SCHENGEN_TRAVEL_INSURANCE_EXTRA_PER_DAY_GBP} per additional day.
          </p>
          {checked && (
            <p className="mt-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
              {travelDays > 0
                ? `${travelDays} day${travelDays === 1 ? '' : 's'} × ${travelerCount} traveler${travelerCount === 1 ? '' : 's'} = ${currencySymbol}${total.toFixed(2)}`
                : `Estimated from ${currencySymbol}${perTraveler.toFixed(2)} per traveler`}
            </p>
          )}
        </div>
      </label>
    </div>
  );
};

export { countTravelDays };
export default SchengenTravelInsuranceAddon;
