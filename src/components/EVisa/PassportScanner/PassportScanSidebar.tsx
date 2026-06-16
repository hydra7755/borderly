import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const SCANNING_INSTRUCTIONS = [
  'Place passport on a flat surface',
  'Ensure good lighting',
  'Include entire passport page with all four corners visible',
  'Both MRZ lines at the bottom must be clearly visible',
  'Avoid glare or shadows',
];

/**
 * Left-column helper cards: scanning instructions + sample framing guide.
 */
const PassportScanSidebar: React.FC = () => (
  <>
    <div className="flex-1 rounded-xl bg-white p-5 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold">Scanning Instructions</h3>
      <div className="rounded-lg bg-primary-50 p-4">
        <ul className="space-y-3">
          {SCANNING_INSTRUCTIONS.map((instruction) => (
            <li key={instruction} className="flex items-start">
              <FaCheckCircle className="mr-2 mt-1 flex-shrink-0 text-primary-600" />
              <span className="text-sm text-gray-700">{instruction}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="rounded-xl bg-white p-5 shadow-lg">
      <h3 className="mb-3 text-center text-lg font-semibold">Sample Scan</h3>
      <div className="relative aspect-[3/2] overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 p-2">
        <img
          src="/images/passport.png"
          alt="Sample passport scan with full page and MRZ lines visible"
          className="h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute inset-2 rounded-sm">
          <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-primary-600" />
          <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-primary-600" />
          <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-primary-600" />
          <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-primary-600" />
          <div className="absolute bottom-1 left-2 right-2 h-6 rounded-sm border border-dashed border-primary-500/60 bg-primary-500/10" />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">
        Match this framing: full page in frame, both bottom MRZ lines visible
      </p>
    </div>
  </>
);

export default PassportScanSidebar;
