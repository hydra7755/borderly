import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VisaApplication } from '../../types/visa';
import visaApplicationsService from '../../lib/api/visaApplications';
import { getCountryName } from '../../data/countryCodes';

interface VisaApplicationsProps {
  applications: VisaApplication[];
  isAdmin?: boolean;
  onRefresh: () => void;
}

const VisaApplications: React.FC<VisaApplicationsProps> = ({ 
  applications, 
  isAdmin = false,
  onRefresh 
}) => {
  const [uploadingApp, setUploadingApp] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Application Submitted';
      case 'in_review':
        return 'Application In Review';
      case 'approved':
        return 'Visa Approved';
      case 'rejected':
        return 'Application Rejected';
      default:
        return 'Pending';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadDocument = async (applicationId: string) => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const { url, error } = await visaApplicationsService.uploadVisaDocument(
        applicationId,
        selectedFile
      );

      if (error) {
        setUploadError(`Error uploading document: ${error.message}`);
      } else if (url) {
        setUploadSuccess('Document uploaded successfully');
        setSelectedFile(null);
        setUploadingApp(null);
        
        // Update application status to approved
        await visaApplicationsService.updateApplicationStatus(applicationId, 'approved');
        
        // Refresh the applications list
        onRefresh();
      }
    } catch (error: any) {
      setUploadError(`Error uploading document: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDocument = async (url: string) => {
    const { success, error } = await visaApplicationsService.downloadVisaDocument(url);
    
    if (!success) {
      console.error('Error downloading document:', error);
    }
  };

  const handleUpdateStatus = async (applicationId: string, status: 'submitted' | 'in_review' | 'approved' | 'rejected') => {
    try {
      const { success, error } = await visaApplicationsService.updateApplicationStatus(applicationId, status);
      
      if (success) {
        onRefresh();
      } else if (error) {
        console.error('Error updating application status:', error);
      }
    } catch (error) {
      console.error('Unexpected error updating application status:', error);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow text-center">
        <p className="text-gray-600">No visa applications found.</p>
        <p className="text-gray-500 mt-2">
          Applications you submit through our website will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {applications.map((application) => (
        <motion.div
          key={application.id}
          className="bg-white rounded-lg shadow overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {application.destination_name || getCountryName(application.destination_id)}
                </h3>
                <p className="text-sm text-gray-500">
                  Application ID: {application.id}
                </p>
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(application.application_date).toLocaleDateString()}
                </p>
                {application.purpose_of_visit && (
                  <p className="text-sm text-gray-600 mt-2">
                    Purpose: {application.purpose_of_visit}
                  </p>
                )}
                {application.entry_date && application.exit_date && (
                  <p className="text-sm text-gray-600">
                    Travel dates: {new Date(application.entry_date).toLocaleDateString()} - {new Date(application.exit_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(application.status)}`}>
                  {getStatusText(application.status)}
                </span>
                {application.approval_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Approved on: {new Date(application.approval_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Status progress bar */}
            <div className="mt-6">
              <div className="relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div 
                    className={`${
                      application.status === 'submitted' 
                        ? 'w-1/3 bg-blue-500' 
                        : application.status === 'in_review' 
                        ? 'w-2/3 bg-amber-500' 
                        : application.status === 'approved' 
                        ? 'w-full bg-green-500' 
                        : 'w-0 bg-gray-500'
                    } shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500`}
                  />
                </div>
                <div className="flex text-xs mt-1 justify-between">
                  <span className={application.status === 'submitted' || application.status === 'in_review' || application.status === 'approved' ? 'font-medium text-blue-600' : 'text-gray-500'}>
                    Submitted
                  </span>
                  <span className={application.status === 'in_review' || application.status === 'approved' ? 'font-medium text-amber-600' : 'text-gray-500'}>
                    In Review
                  </span>
                  <span className={application.status === 'approved' ? 'font-medium text-green-600' : 'text-gray-500'}>
                    Approved
                  </span>
                </div>
              </div>
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Controls</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus(application.id, 'submitted')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium hover:bg-blue-200"
                  >
                    Mark as Submitted
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(application.id, 'in_review')}
                    className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-medium hover:bg-amber-200"
                  >
                    Mark as In Review
                  </button>
                  {application.status !== 'approved' && (
                    <button
                      onClick={() => setUploadingApp(application.id)}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium hover:bg-green-200"
                    >
                      Approve & Upload Visa
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(application.id, 'rejected')}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium hover:bg-red-200"
                  >
                    Reject Application
                  </button>
                </div>

                {uploadingApp === application.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload eVisa Document
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                                file:rounded-full file:border-0 file:text-sm file:font-semibold
                                file:bg-primary-50 file:text-primary-700
                                hover:file:bg-primary-100"
                      />
                      <button
                        onClick={() => handleUploadDocument(application.id)}
                        disabled={isUploading || !selectedFile}
                        className={`px-4 py-2 text-white text-sm font-medium rounded-md ${
                          isUploading || !selectedFile
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                    {uploadError && (
                      <p className="mt-1 text-xs text-red-600">{uploadError}</p>
                    )}
                    {uploadSuccess && (
                      <p className="mt-1 text-xs text-green-600">{uploadSuccess}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User document download section */}
            {application.status === 'approved' && application.visa_document_url && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">eVisa Document</h4>
                    <p className="text-xs text-gray-500">
                      Your approved eVisa document is ready for download
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument(application.visa_document_url!)}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download eVisa
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default VisaApplications; 