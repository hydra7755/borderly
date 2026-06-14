import React from 'react';
import LegalPageLayout from '../components/legal/LegalPageLayout';
import { getCompanyEmail } from '../config/companyContact';

const RefundPolicy: React.FC = () => {
  const companyEmail = getCompanyEmail();

  return (
  <LegalPageLayout title="Refund and Cancellation Policy">
    <p>
      Thank you for choosing Borderly. We want to ensure you have a great experience tracking your
      global travels.
    </p>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        Cancellations
      </h2>
      <p>
        You can cancel your premium Borderly subscription at any time directly through your account
        dashboard settings or by contacting our support team at{' '}
        <a href={`mailto:${companyEmail}`} className="text-primary-600 hover:underline">
          {companyEmail}
        </a>
        . Upon cancellation, you will retain access to your premium features until the end of your
        current paid billing period.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        Refunds
      </h2>
      <p className="mb-3">
        Because Borderly provides instant digital access to premium statistics, leaderboards, and
        features upon upgrade:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Subscription Purchases:</strong> We offer a 14-day money-back guarantee if you are
          unsatisfied with the service. If you are past this window, all payments are non-refundable.
        </li>
        <li>
          <strong>One-Time Fees:</strong> All one-time data processing or premium generation
          purchases are final and non-refundable.
        </li>
      </ul>
    </section>

    <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
      For refund requests within the 14-day window, email{' '}
      <a href={`mailto:${companyEmail}`} className="text-primary-600 hover:underline">
        {companyEmail}
      </a>{' '}
      with your account email and purchase details.
    </p>
  </LegalPageLayout>
  );
};

export default RefundPolicy;
