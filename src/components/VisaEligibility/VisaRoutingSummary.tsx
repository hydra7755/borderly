import React from 'react';
import { FaCheckCircle, FaRoute, FaClock, FaPassport } from 'react-icons/fa';
import type { VisaRoutingResult } from '../../types/visaRouting';

export interface VisaRoutingSummaryProps {
  routing: VisaRoutingResult;
  visaFee?: number;
  serviceFee?: number;
  currencySymbol?: string;
  travelerCount?: number;
  className?: string;
  /** When false, routing details only — no fee lines (use Price Breakdown elsewhere). */
  showPricing?: boolean;
  compact?: boolean;
}

const MATCH_LABELS: Record<VisaRoutingResult['matchReason'], string> = {
  base: 'Standard route',
  residence_override: 'Residence permit route',
  premium_visa_exemption: 'Multi-entry visa route',
};

function getMatchLabel(routing: VisaRoutingResult): string {
  if (routing.unlockedStatusType === 'morocco_waiver_evisa') {
    if (routing.matchReason === 'residence_override') {
      return 'Morocco waiver — residence permit';
    }
    if (routing.matchReason === 'premium_visa_exemption') {
      return 'Morocco waiver — supporting visa';
    }
  }
  if (routing.unlockedStatusType === 'turkey_waiver_evisa') {
    if (routing.matchReason === 'residence_override') {
      return 'Turkey route — residence permit';
    }
    if (routing.matchReason === 'premium_visa_exemption') {
      return 'Turkey route — supporting visa';
    }
  }
  return MATCH_LABELS[routing.matchReason];
}

export const VisaRoutingSummary: React.FC<VisaRoutingSummaryProps> = ({
  routing,
  visaFee = 0,
  serviceFee = 0,
  currencySymbol = '£',
  travelerCount = 1,
  className = '',
  showPricing = true,
  compact = false,
}) => {
  const total = (visaFee * travelerCount) + serviceFee;
  const waivedCount = routing.waivedFormFields.length;

  return (
    <div
      className={`rounded-lg border border-primary-100 bg-primary-50/60 dark:border-primary-800/40 dark:bg-primary-900/20 ${
        compact ? 'p-3 shadow-sm' : 'p-4'
      } ${className}`}
    >
      <div className={`flex items-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
        <FaRoute className="text-primary-600" />
        <h4 className={`font-semibold text-primary-800 dark:text-primary-200 ${compact ? 'text-sm' : ''}`}>
          Routing summary
        </h4>
      </div>

      <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="flex items-start gap-2">
          <FaPassport className="mt-0.5 shrink-0 text-primary-500" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{routing.visaTypeLabel}</p>
            <p className="text-xs text-primary-700 dark:text-primary-300">
              {getMatchLabel(routing)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <FaClock className="text-primary-500" />
          <span>Max stay: {routing.maxStayPeriod}</span>
        </div>

        {routing.routingNotes.map((note) => (
          <p key={note} className="text-xs text-gray-600 dark:text-gray-400">
            {note}
          </p>
        ))}

        {waivedCount > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
            <FaCheckCircle />
            {waivedCount} form field{waivedCount === 1 ? '' : 's'} waived in Travel / Travelers steps
          </p>
        )}

        {showPricing && (visaFee > 0 || serviceFee > 0) && (
          <div className="mt-3 border-t border-primary-200/80 pt-3 dark:border-primary-700/50">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Visa fee × {travelerCount}</span>
              <span>{currencySymbol}{(visaFee * travelerCount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Service fee</span>
              <span>{currencySymbol}{serviceFee.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold text-primary-700 dark:text-primary-300">
              <span>Estimated total</span>
              <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisaRoutingSummary;
