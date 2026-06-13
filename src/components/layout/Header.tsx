import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitials } from '../../utils/userDisplay';

interface HeaderProps {
  isLoggedIn: boolean;
  userName?: string;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onLogoutClick: () => void;
  onDashboardClick: () => void;
  onHomeClick: () => void;
  onFeaturesClick: () => void;
  onPricingClick: () => void;
  onContactClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  userName,
  onLoginClick,
  onSignUpClick,
  onLogoutClick,
  onDashboardClick,
  onHomeClick,
  onFeaturesClick,
  onPricingClick,
  onContactClick
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={onHomeClick}
              className="flex items-center"
            >
              <span className="text-2xl font-bold text-primary-600">
                Border<span className="text-gray-800">ly</span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={onHomeClick}
              className="text-gray-700 hover:text-primary-600 text-hover"
            >
              Home
            </button>
            <button 
              onClick={onFeaturesClick}
              className="text-gray-700 hover:text-primary-600 text-hover"
            >
              Features
            </button>
            <button 
              onClick={onPricingClick}
              className="text-gray-700 hover:text-primary-600 text-hover"
            >
              Pricing
            </button>
            <button 
              onClick={onContactClick}
              className="text-gray-700 hover:text-primary-600 text-hover"
            >
              Contact
            </button>
            {isLoggedIn && (
              <button 
                onClick={onDashboardClick}
                className="text-gray-700 hover:text-primary-600 text-hover"
              >
                Dashboard
              </button>
            )}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={onLogoutClick}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  Log out
                </button>
                <div className="relative">
                  <button
                    onClick={onDashboardClick}
                    className="flex items-center space-x-2 bg-white p-2 rounded-full border border-gray-300"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(userName)}
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={onLoginClick}
                  className="text-gray-700 hover:text-primary-600 font-medium text-hover"
                >
                  Log in
                </button>
                <button
                  onClick={onSignUpClick}
                  className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors btn-hover"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:bg-gray-100 p-2 rounded-md"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <button
                onClick={() => {
                  onHomeClick();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Home
              </button>
              <button
                onClick={() => {
                  onFeaturesClick();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Features
              </button>
              <button
                onClick={() => {
                  onPricingClick();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  onContactClick();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Contact
              </button>
              
              {isLoggedIn && (
                <button
                  onClick={() => {
                    onDashboardClick();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </button>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      onLogoutClick();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-3 py-2 bg-gray-100 text-primary-600 font-medium rounded-md hover:bg-gray-200"
                  >
                    Log out
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onLoginClick();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-center rounded-md text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
                    >
                      Log in
                    </button>
                    <button
                      onClick={() => {
                        onSignUpClick();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-center rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700"
                    >
                      Sign up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header; 