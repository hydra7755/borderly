import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  lastUpdated = 'June 2026',
  children,
}) => (
  <div className="container mx-auto px-4 py-12 max-w-3xl">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="text-sm text-primary-600 font-medium mb-2">Legal</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last Updated: {lastUpdated}
      </p>

      <div className="prose prose-gray dark:prose-invert max-w-none legal-content space-y-6 text-gray-700 dark:text-gray-300">
        {children}
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-sm">
        <Link to="/privacy" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Privacy Policy
        </Link>
        <Link to="/terms" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Terms of Service
        </Link>
        <Link to="/refunds" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Refund &amp; Cancellation
        </Link>
        <Link to="/contact" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Contact Support
        </Link>
      </div>
    </motion.div>
  </div>
);

export default LegalPageLayout;
