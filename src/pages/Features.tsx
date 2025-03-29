import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const Features: React.FC = () => {
  const navigate = useNavigate();
  // Define feature items
  const features = [
    {
      title: 'Visa Eligibility Checker',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      description: 'Check visa requirements for any country in seconds. Get accurate information about visa types, fees, and processing times.',
      linkTo: '/visa-checker',
      details: [
        'Accurate and up-to-date visa requirements',
        'Information on visa fees and processing times',
        'Document requirements checklist',
        'Direct links to official resources'
      ]
    },
    {
      title: 'eVisa Application',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Apply for eVisas directly through our platform. Simple, streamlined application process with status tracking.',
      linkTo: '/visa-checker',
      details: [
        'Streamlined application process',
        'Document upload capability',
        'Secure payment processing',
        'Real-time application status tracking',
        'Email notifications at each step'
      ]
    },
    {
      title: 'Travel Score Calculator',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      description: 'Get your personalized travel score based on passport strength, travel history, and residency. Discover how to improve your global mobility.',
      linkTo: '/questionnaire',
      details: [
        'Personalized travel score from 0-1000',
        'Analysis of passport strength',
        'Travel history impact assessment',
        'Residency benefits calculation',
        'Recommendations for score improvement'
      ]
    },
    {
      title: 'Interactive World Map',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Explore visa requirements visually with our interactive 3D globe. Click on countries to see entry requirements based on your nationality.',
      linkTo: '/world-map',
      details: [
        '3D interactive globe visualization',
        'Color-coded visa requirements',
        'Detailed country information on click',
        'Personalized view based on your nationality',
        'Save favorite destinations'
      ]
    },
    {
      title: 'Travel History Management',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Keep track of your travel history in one secure place. Document past trips and use them for future visa applications.',
      linkTo: '/dashboard',
      details: [
        'Secure storage of travel records',
        'Easy entry of past and planned trips',
        'Visual timeline of your travels',
        'Exportable reports for visa applications',
        'Travel patterns analysis'
      ]
    },
    {
      title: 'AI Travel Assistant',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      description: 'Get personalized travel advice and recommendations from our AI assistant. Ask questions about visa requirements, travel restrictions, and more.',
      linkTo: '/assistant',
      details: [
        'Instant answers to travel questions',
        'Personalized recommendations',
        'Visa requirement explanations',
        'Document checklist guidance',
        'Travel tips based on destination'
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.03,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        duration: 0.2
      }
    }
  };

  const [expandedFeature, setExpandedFeature] = React.useState<number | null>(null);

  // Function to handle click on a feature
  const handleFeatureClick = (index: number) => {
    if (expandedFeature === index) {
      setExpandedFeature(null);
    } else {
      setExpandedFeature(index);
    }
  };

  // Function to navigate to feature page
  const navigateToFeature = (path: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl"
          >
            Our <span className="text-primary-600 dark:text-primary-500">Features</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xl mt-5 mx-auto text-xl text-gray-600 dark:text-gray-400"
          >
            Discover the powerful tools and services we offer to make your travel planning easier and more efficient.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={featureVariants}
              whileHover="hover"
              className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden 
                ${expandedFeature === index ? 'sm:col-span-2 lg:col-span-3 cursor-default' : 'cursor-pointer'}`}
              onClick={() => handleFeatureClick(index)}
            >
              <div className="p-6">
                {expandedFeature === index ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="text-primary-600 dark:text-primary-500 mr-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{feature.description}</p>
                    
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Benefits:</h4>
                      <ul className="space-y-2">
                        {feature.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start">
                            <svg className="h-5 w-5 text-primary-500 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <button
                        onClick={(e) => navigateToFeature(feature.linkTo, e)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Try it now
                        <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                      
                      <button 
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedFeature(null);
                        }}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="text-primary-600 dark:text-primary-500 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    <button 
                      onClick={(e) => navigateToFeature(feature.linkTo, e)}
                      className="mt-4 text-primary-600 dark:text-primary-400 font-medium flex items-center"
                    >
                      <span>Learn more</span>
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Join thousands of travelers who are using our tools to simplify their visa application process and explore the world with confidence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:text-lg"
            >
              Sign up for free
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 md:text-lg"
            >
              View pricing
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Features; 