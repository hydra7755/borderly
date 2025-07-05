import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase/client';
import { FaCheckCircle, FaDownload, FaClock, FaExclamationTriangle } from 'react-icons/fa';

interface PaymentConfirmationProps {
  isLoggedIn?: boolean;
}

const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({ isLoggedIn }) => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }
    
    const fetchApplicationDetails = async () => {
      if (!applicationId) {
        setError('Invalid application ID');
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('visa_applications')
          .select('*, profiles(email, full_name)')
          .eq('id', applicationId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Application not found');
        }
        
        if (data.payment_status !== 'paid') {
          navigate(`/visa/payment/${applicationId}`, { replace: true });
          return;
        }
        
        setApplication(data);
      } catch (error) {
        console.error('Error fetching application:', error);
        setError('Could not load application details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplicationDetails();
  }, [applicationId, isLoggedIn, navigate]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const getStatusIcon = () => {
    switch (application.status) {
      case 'processing':
        return <FaClock className="text-yellow-500 text-3xl" />;
      case 'approved':
        return <FaCheckCircle className="text-green-500 text-3xl" />;
      case 'rejected':
        return <FaExclamationTriangle className="text-red-500 text-3xl" />;
      default:
        return <FaClock className="text-yellow-500 text-3xl" />;
    }
  };
  
  const getStatusText = () => {
    switch (application.status) {
      case 'processing':
        return 'Processing';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };
  
  const getStatusClass = () => {
    switch (application.status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Payment Confirmation</h1>
                <p className="mt-2">Thank you for your payment</p>
              </div>
              <div className="rounded-full bg-white p-3">
                <FaCheckCircle className="text-teal-600 text-3xl" />
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful</h2>
              <p className="text-gray-600">
                Your payment has been successfully processed. We're now handling your visa application.
              </p>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Transaction ID</p>
                  <p className="font-medium">{application.transaction_id || 'TXID-' + applicationId?.substring(0, 8)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Payment Date</p>
                  <p className="font-medium">{formatDate(application.updated_at)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Amount Paid</p>
                  <p className="font-medium">£49.99</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Payment Method</p>
                  <p className="font-medium">Credit Card (Stripe)</p>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2">Visa Application Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-600 text-sm">Application ID</p>
                  <p className="font-medium">{applicationId}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Application Date</p>
                  <p className="font-medium">{formatDate(application.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Visa Type</p>
                  <p className="font-medium">{application.visa_type || 'eVisa'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Destination</p>
                  <p className="font-medium">{application.destination_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <p className="text-gray-600 text-sm">Status:</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}>
                  {getStatusText()}
                </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md flex items-start">
                <div className="mr-4">
                  {getStatusIcon()}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Next Steps</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {application.status === 'processing' ? (
                      <>
                        Your visa application is being processed. This usually takes 3-5 business days.
                        You will receive email notifications about your application status.
                      </>
                    ) : application.status === 'approved' ? (
                      <>
                        Your visa has been approved! You can download your visa document below.
                        Make sure to carry a printed copy during your travel.
                      </>
                    ) : (
                      <>
                        Unfortunately, your visa application has been rejected. Please review the
                        feedback below for more information. You may submit a new application addressing
                        the issues mentioned.
                      </>
                    )}
                  </p>
                  
                  {application.status === 'approved' && (
                    <button className="mt-4 flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                      <FaDownload className="mr-2" />
                      Download Visa
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-6">
              <p className="text-gray-600 text-sm mb-4 sm:mb-0">
                Need help with your application? <a href="/support" className="text-blue-600 hover:underline">Contact our support team</a>
              </p>
              <Link
                to="/dashboard"
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </motion.div>
        
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Thank you for choosing Borderly for your visa services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation; 