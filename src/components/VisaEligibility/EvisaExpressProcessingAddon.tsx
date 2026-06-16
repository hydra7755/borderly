import React from 'react';
import { EVISA_EXPRESS_PROCESSING_FEE_GBP } from '../../config/evisaPricing';

export interface EvisaExpressProcessingAddonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  currencySymbol?: string;
  className?: string;
  compact?: boolean;
}

const EvisaExpressProcessingAddon: React.FC<EvisaExpressProcessingAddonProps> = ({
  checked,
  onChange,
  currencySymbol = '£',
  className = '',
  compact = false,
}) => (
  <div
    className={`rounded-lg border border-primary-200 bg-white dark:border-primary-700 dark:bg-gray-800 ${
      compact ? 'p-3 shadow-sm' : 'p-4'
    } ${className}`}
  >
    <label className={`flex cursor-pointer gap-3 ${compact ? 'items-center' : 'items-start'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${compact ? '' : 'mt-1'}`}
      />
      <div className={`flex-1 ${compact ? 'flex flex-wrap items-center justify-between gap-x-3 gap-y-1' : ''}`}>
        <p className="font-medium text-gray-900 dark:text-white">Express processing (1 business day)</p>
        <p
          className={`font-semibold text-primary-700 dark:text-primary-300 ${
            compact ? 'text-sm' : 'mt-2 text-sm'
          }`}
        >
          +{currencySymbol}
          {EVISA_EXPRESS_PROCESSING_FEE_GBP.toFixed(2)} express fee
        </p>
      </div>
    </label>
  </div>
);

export default EvisaExpressProcessingAddon;
