import React from 'react';
import LegalPageLayout from '../components/legal/LegalPageLayout';
import { getCompanyEmail } from '../config/companyContact';

const PrivacyPolicy: React.FC = () => {
  const companyEmail = getCompanyEmail();

  return (
  <LegalPageLayout title="Privacy Policy">
    <p>
      At Borderly, accessible from{' '}
      <a href="https://borderly.net" className="text-primary-600 hover:underline">
        borderly.net
      </a>
      , one of our main priorities is the privacy of our visitors. This Privacy Policy document
      contains types of information that is collected and recorded by Borderly and how we use it.
    </p>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        Information We Collect
      </h2>
      <p>
        If you create an account or use our services, we may collect personal identification
        information, including but not limited to your name, email address, and travel details
        (such as boarding pass information or flight statistics).
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        How We Use Your Information
      </h2>
      <p className="mb-3">We use the information we collect in various ways, including to:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Provide, operate, and maintain our website and tracking services.</li>
        <li>Improve, personalize, and expand our website features.</li>
        <li>
          Process your payments and prevent fraudulent transactions through our payment processors.
        </li>
        <li>Communicate with you regarding updates or customer service.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        Data Protection &amp; Security
      </h2>
      <p>
        We take reasonable measures to protect your personal data. We do not store financial or
        credit card information on our servers; all payment processing is handled securely by our
        third-party provider, Stripe.
      </p>
    </section>

    <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
      Questions? Contact us at{' '}
      <a href={`mailto:${companyEmail}`} className="text-primary-600 hover:underline">
        {companyEmail}
      </a>
      .
    </p>
  </LegalPageLayout>
  );
};

export default PrivacyPolicy;
