import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaPassport, FaIdCard, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getMoroccoWaiverContent } from '../../config/moroccoWaiver';

export interface MoroccoWaiverInfoProps {
  className?: string;
  passportCountryName?: string;
  defaultOpen?: boolean;
  subtitle?: string;
}

const MoroccoWaiverInfo: React.FC<MoroccoWaiverInfoProps> = ({
  className = '',
  passportCountryName = 'your country',
  defaultOpen = false,
  subtitle,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const content = getMoroccoWaiverContent(passportCountryName);

  const collapsedHint =
    subtitle ??
    `Eligibility rules for ${passportCountryName} passport holders with a qualifying visa or residence permit.`;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Morocco e-Visa Waiver Program
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{collapsedHint}</p>
        </div>
        <span className="mt-1 shrink-0 text-gray-500">
          {isOpen ? <FaChevronUp className="h-5 w-5" /> : <FaChevronDown className="h-5 w-5" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-gray-200 px-6 pb-6 pt-5 dark:border-gray-700">
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-900/15">
                <h4 className="font-semibold text-amber-950 dark:text-amber-100">{content.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                  {content.intro}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {content.eligibilityHeading}
                </h4>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {content.eligibilityIntro}
                </p>

                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40">
                    <div className="flex items-start gap-3">
                      <FaPassport className="mt-0.5 shrink-0 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {content.multiEntryVisaLabel}
                        </p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {content.multiEntryVisaCountries}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    OR
                  </p>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40">
                    <div className="flex items-start gap-3">
                      <FaIdCard className="mt-0.5 shrink-0 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {content.residencePermitLabel}
                        </p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {content.residencePermitCountries}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {content.validityHeading}
                </h4>
                <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-green-600" />
                    <span>{content.visaValidityRule}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FaCheckCircle className="mt-0.5 shrink-0 text-green-600" />
                    <span>{content.permitValidityRule}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {content.howToHeading}
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  The process is designed for speed and reliability:
                </p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-300">
                  {content.steps.map((step, index) => (
                    <li key={step}>{`Step ${index + 1}: ${step}`}</li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoroccoWaiverInfo;
