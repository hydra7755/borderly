import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlane, FaPassport, FaHotel, FaFileUpload, FaFileAlt, FaTrash, FaDownload } from 'react-icons/fa';

// Define interfaces for our data structure
interface TripDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
  size: number;
}

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  documents: TripDocument[];
}

interface TripDetailsProps {
  trip: Trip;
  onUploadDocument: (tripId: string, file: File) => Promise<void>;
  onDeleteDocument: (tripId: string, docId: string) => Promise<void>;
}

const TripDetails: React.FC<TripDetailsProps> = ({ 
  trip, 
  onUploadDocument, 
  onDeleteDocument 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'documents'

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      await onUploadDocument(trip.id, file);
      setUploadProgress(100);
      
      // Reset after short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Trip header */}
      <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold">{trip.destination}</h3>
            <p className="text-primary-100">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </p>
          </div>
          <div className="bg-white bg-opacity-25 rounded-full p-3">
            <FaPlane className="h-6 w-6" />
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={`${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
          >
            Trip Details
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`${
              activeTab === 'documents'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
          >
            Documents ({trip.documents.length})
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="flex items-center">
              <FaPassport className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Purpose</p>
                <p className="text-base text-gray-900 dark:text-white">{trip.purpose}</p>
              </div>
            </div>
            <div className="flex items-center">
              <FaHotel className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                <p className="text-base text-gray-900 dark:text-white">
                  {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
            {/* Add more trip details here */}
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div>
            {/* Upload section */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload New Document
              </label>
              <div className="flex items-center">
                <label className="cursor-pointer flex-1">
                  <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    <FaFileUpload className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {isUploading ? 'Uploading...' : 'Click to select a file'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </div>
                </label>
              </div>
              
              {/* Upload progress bar */}
              {isUploading && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-primary-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {uploadProgress}% uploaded
                  </p>
                </div>
              )}
            </div>
            
            {/* Document list */}
            {trip.documents.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {trip.documents.map(doc => (
                  <li key={doc.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaFileAlt className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(doc.size)} • Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={doc.url}
                          download
                          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Download"
                        >
                          <FaDownload className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => onDeleteDocument(trip.id, doc.id)}
                          className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <FaFileAlt className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No documents uploaded yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Upload travel documents like visas, hotel bookings and tickets
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetails; 