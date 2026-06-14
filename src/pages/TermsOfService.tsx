import React from 'react';
import LegalPageLayout from '../components/legal/LegalPageLayout';
import { getCompanyEmail } from '../config/companyContact';

const TermsOfService: React.FC = () => {
  const companyEmail = getCompanyEmail();

  return (
  <LegalPageLayout title="Terms of Service">
    <p>
      Welcome to Borderly! These terms and conditions outline the rules and regulations for the use
      of Borderly&apos;s Website, located at{' '}
      <a href="https://borderly.net" className="text-primary-600 hover:underline">
        borderly.net
      </a>
      . By accessing this website, we assume you accept these terms and conditions.
    </p>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        Intellectual Property
      </h2>
      <p>
        Unless otherwise stated, Borderly and/or its licensors own the intellectual property rights
        for all material on Borderly. All intellectual property rights are reserved.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        User Accounts
      </h2>
      <p>
        When you create an account with us, you must provide accurate, complete, and current
        information. You are responsible for safeguarding your password and account activities.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        Billing and Subscriptions
      </h2>
      <p>
        Some parts of our service are billed on a subscription basis. You will be billed in advance
        on a recurring and periodic cycle (such as monthly or annually). A valid payment method is
        required to process payment through Stripe.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
        Limitation of Liability
      </h2>
      <p>
        In no event shall Borderly, nor any of its officers or employees, be held liable for
        anything arising out of or in any way connected with your use of this website.
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

export default TermsOfService;
