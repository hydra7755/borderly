import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase/client';

interface TripDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  created_at: string;
}

interface Trip {
  id: string;
  country: string;
  startDate: Date;
  endDate: Date;
  purpose: string;
  notes: string;
  documents: TripDocument[];
}

const TripsManager = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentType, setDocumentType] = useState('visa');
  const [uploadError, setUploadError] = useState('');
  
  // Load trips from database
  useEffect(() => {
    const loadTrips = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', user.id)
            .order('start_date', { ascending: false });
            
          if (error) throw error;
          
          // Now load documents for each trip
          const tripsWithDocs = await Promise.all(data.map(async (trip) => {
            const { data: docs, error: docsError } = await supabase
              .from('trip_documents')
              .select('*')
              .eq('trip_id', trip.id);
              
            if (docsError) throw docsError;
            
            return {
              ...trip,
              startDate: new Date(trip.start_date),
              endDate: new Date(trip.end_date),
              documents: docs || []
            };
          }));
          
          setTrips(tripsWithDocs);
        }
      } catch (error) {
        console.error("Error loading trips:", error);
      }
    };
    
    loadTrips();
  }, []);
  
  // File upload functionality
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      if (selectedTrip) {
        handleFileUpload(acceptedFiles[0]);
      }
    }
  });
  
  const handleFileUpload = async (file: File) => {
    if (!selectedTrip) return;
    
    setIsUploadingDocument(true);
    setUploadError('');
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      const fileName = `${user.id}/${selectedTrip.id}/${Date.now()}_${file.name}`;
      
      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('trip-documents')
        .upload(fileName, file);
        
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trip-documents')
        .getPublicUrl(fileName);
      
      // Save document reference in database
      const { data: docData, error: docError } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: selectedTrip.id,
          user_id: user.id,
          name: file.name,
          type: documentType,
          url: urlData.publicUrl,
          size: file.size
        });
        
      if (docError) throw docError;
      
      // Add new document to the selected trip
      const newDoc = {
        id: docData[0].id,
        name: file.name,
        type: documentType,
        url: urlData.publicUrl,
        created_at: new Date().toISOString()
      };
      
      setSelectedTrip({
        ...selectedTrip,
        documents: [...selectedTrip.documents, newDoc]
      });
      
      // Update trips list
      setTrips(trips.map(trip => 
        trip.id === selectedTrip.id 
          ? { ...trip, documents: [...trip.documents, newDoc] }
          : trip
      ));
      
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploadError('Failed to upload document. Please try again.');
    } finally {
      setIsUploadingDocument(false);
    }
  };
  
  const handleDeleteDocument = async (docId: string) => {
    if (!selectedTrip) return;
    
    try {
      const { error } = await supabase
        .from('trip_documents')
        .delete()
        .eq('id', docId);
        
      if (error) throw error;
      
      // Update the selected trip
      setSelectedTrip({
        ...selectedTrip,
        documents: selectedTrip.documents.filter(doc => doc.id !== docId)
      });
      
      // Update the trips list
      setTrips(trips.map(trip => 
        trip.id === selectedTrip.id 
          ? { 
              ...trip, 
              documents: trip.documents.filter(doc => doc.id !== docId) 
            }
          : trip
      ));
      
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };
  
  const renderDocumentIcon = (type: string) => {
    switch(type) {
      case 'visa':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'flight':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'hotel':
        return (
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'insurance':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Trips</h2>
          <button
            onClick={() => setIsAddingTrip(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Trip
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Trip List */}
        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
            {trips.length === 0 ? (
              <li className="p-4 text-center text-gray-500 dark:text-gray-400">
                No trips found. Add a trip to get started.
              </li>
            ) : (
              trips.map(trip => (
                <li 
                  key={trip.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedTrip?.id === trip.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-bold">
                        {trip.country.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{trip.country}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(trip.startDate, 'MMM dd, yyyy')} - {format(trip.endDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100 text-xs px-2 py-1 rounded-full">
                        {trip.documents.length} docs
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        
        {/* Trip Details */}
        <div className="w-full md:w-2/3 p-6">
          {selectedTrip ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Trip to {selectedTrip.country}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dates</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(selectedTrip.startDate, 'MMM dd, yyyy')} - {format(selectedTrip.endDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Purpose</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTrip.purpose || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                {selectedTrip.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedTrip.notes}
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">Trip Documents</h4>
                    <div className="flex items-center space-x-2">
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="text-sm rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="visa">Visa</option>
                        <option value="flight">Flight Ticket</option>
                        <option value="hotel">Hotel Booking</option>
                        <option value="insurance">Insurance</option>
                        <option value="other">Other</option>
                      </select>
                      <div
                        {...getRootProps()}
                        className={`flex items-center justify-center px-3 py-2 border border-dashed rounded-md text-sm cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          isUploadingDocument ? 'opacity-50 cursor-wait' : ''
                        }`}
                      >
                        <input {...getInputProps()} disabled={isUploadingDocument} />
                        {isUploadingDocument ? (
                          <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                        <span className="ml-1 text-gray-500 dark:text-gray-400">Upload</span>
                      </div>
                    </div>
                  </div>
                  
                  {uploadError && (
                    <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                      {uploadError}
                    </div>
                  )}
                  
                  {selectedTrip.documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2">No documents uploaded for this trip.</p>
                      <p className="text-sm">Upload documents to have them all in one place.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTrip.documents.map(doc => (
                        <div key={doc.id} className="flex border rounded-md overflow-hidden">
                          <div className="flex-shrink-0 w-12 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            {renderDocumentIcon(doc.type)}
                          </div>
                          <div className="flex-1 px-4 py-2 truncate">
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary-600 hover:text-primary-500"
                            >
                              {doc.name}
                            </a>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="px-2 text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Trip Selected</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a trip from the list or add a new trip to get started.
              </p>
              <button
                onClick={() => setIsAddingTrip(true)}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Trip
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Trip Modal - You'll need to implement this */}
      {isAddingTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Modal content */}
        </div>
      )}
    </div>
  );
};

export default TripsManager; 