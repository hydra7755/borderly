import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase/client';
import { FaCheckCircle, FaDownload, FaEnvelope } from 'react-icons/fa';

interface VisaConfirmationPageProps {
  isLoggedIn?: boolean;
}

const VisaConfirmationPage: React.FC<VisaConfirmationPageProps> = ({ isLoggedIn }) => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);
  
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!applicationId) {
        setError('Invalid application ID');
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('visa_applications')
          .select('*')
          .eq('id', applicationId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Application not found');
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
  }, [applicationId]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
  
  if (error || !application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-2 text-sm text-red-700">{error || 'Application not found'}</p>
          <button
            onClick={() => navigate('/visa')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Visa Services
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 bg-blue-600 text-white">
            <h1 className="text-2xl font-bold">eVisa Application Confirmation</h1>
            <p className="mt-1">Application ID: {applicationId}</p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-green-100 rounded-full p-3">
                <FaCheckCircle className="text-green-600 text-3xl" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold">Payment Complete</h2>
                <p className="text-gray-600">
                  Your application has been received and is being processed
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Application Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${getStatusColor(application.status)}`}>
                    {getStatusText(application.status)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className={`font-medium ${application.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {application.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium">
                    {formatDate(application.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Processing Time</p>
                  <p className="font-medium">3-5 business days</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-md mb-6">
              <h3 className="text-lg font-semibold mb-4">Applicant Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {application.first_name} {application.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{application.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{application.nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium">{application.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Travel Date</p>
                  <p className="font-medium">
                    {formatDate(application.travel_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Travel Purpose</p>
                  <p className="font-medium capitalize">
                    {application.travel_purpose?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-md mb-6">
              <h3 className="text-lg font-semibold mb-4">What Happens Next?</h3>
              
              <ol className="space-y-4">
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 font-bold text-sm mr-3">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Application Review</p>
                    <p className="text-sm text-gray-600">
                      Our team will review your application and supporting documents
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 font-bold text-sm mr-3">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Processing</p>
                    <p className="text-sm text-gray-600">
                      Your application will be processed by immigration authorities
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 font-bold text-sm mr-3">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Decision</p>
                    <p className="text-sm text-gray-600">
                      You will receive an email notification once a decision has been made
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-200 text-blue-600 font-bold text-sm mr-3">
                    4
                  </div>
                  <div>
                    <p className="font-medium">eVisa Delivery</p>
                    <p className="text-sm text-gray-600">
                      If approved, your eVisa will be sent to your email address
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-600">
                  Questions about your application?
                </p>
                <a 
                  href="mailto:support@travelscore.com" 
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <FaEnvelope className="mr-1" /> Contact Support
                </a>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                >
                  <FaDownload className="mr-2" /> Save Receipt
                </button>
                <Link
                  to="/"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VisaConfirmationPage;
