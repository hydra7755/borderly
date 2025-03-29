import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  notes: string;
  flagUrl?: string;
  documents: TripDocument[];
}

interface TripDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
}

interface TripsProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

const Trips: React.FC<TripsProps> = ({ isLoggedIn, onLoginRequired }) => {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTrip, setNewTrip] = useState<Omit<Trip, 'id' | 'documents'>>({
    destination: '',
    startDate: '',
    endDate: '',
    purpose: 'tourism',
    notes: ''
  });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'passport',
    file: null as File | null
  });

  // Navigation handler
  const handleTabChange = (page: string) => {
    setActiveTab(page);
    
    // Handle navigation to different pages
    if (page !== 'trips') {
      // Use window.location.href for proper page navigation
      window.location.href = `/${page}`;
    }
  };

  const handleAddTrip = () => {
    const trip: Trip = {
      ...newTrip,
      id: Date.now().toString(),
      flagUrl: `https://flagcdn.com/${newTrip.destination.toLowerCase().substring(0, 2)}.svg`,
      documents: []
    };
    
    setTrips([...trips, trip]);
    setNewTrip({
      destination: '',
      startDate: '',
      endDate: '',
      purpose: 'tourism',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTrip({ ...newTrip, [name]: value });
  };

  // Handle document upload
  const handleDocumentUpload = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setSelectedTrip(trip);
      setShowDocumentModal(true);
    }
  };

  // Handle document file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDocument({
        ...newDocument,
        file: e.target.files[0]
      });
    }
  };

  // Handle adding document to trip
  const handleAddDocument = () => {
    if (!selectedTrip || !newDocument.name || !newDocument.file) return;
    
    // In a real app, you would upload the file to a server and get a URL back
    // For now, we'll create a fake URL
    const fakeUrl = URL.createObjectURL(newDocument.file);
    
    const newDoc: TripDocument = {
      id: Date.now().toString(),
      name: newDocument.name,
      type: newDocument.type,
      url: fakeUrl,
      uploadDate: new Date().toISOString()
    };
    
    // Update the trip with the new document
    const updatedTrips = trips.map(trip => {
      if (trip.id === selectedTrip.id) {
        return {
          ...trip,
          documents: [...trip.documents, newDoc]
        };
      }
      return trip;
    });
    
    setTrips(updatedTrips);
    setSelectedTrip(null);
    setShowDocumentModal(false);
    setNewDocument({
      name: '',
      type: 'passport',
      file: null
    });
  };

  // Handle document deletion
  const handleDeleteDocument = (tripId: string, docId: string) => {
    const updatedTrips = trips.map(trip => {
      if (trip.id === tripId) {
        return {
          ...trip,
          documents: trip.documents.filter(doc => doc.id !== docId)
        };
      }
      return trip;
    });
    
    setTrips(updatedTrips);
  };

  // Render trip card with documents section
  const renderTripCard = (trip: Trip) => (
    <motion.div 
      key={trip.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {trip.flagUrl && (
              <img 
                src={trip.flagUrl} 
                alt="Country flag" 
                className="w-8 h-6 object-cover rounded-sm mr-3"
              />
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white">{trip.destination}</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => handleDocumentUpload(trip.id)}
              className="p-1 text-teal-600 hover:text-teal-700"
              title="Upload Document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Dates:</span>
            <span className="text-gray-800 dark:text-gray-200">
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Purpose:</span>
            <span className="capitalize text-gray-800 dark:text-gray-200">{trip.purpose}</span>
          </div>
          
          {trip.notes && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Notes:</span>
              <p className="mt-1 text-gray-800 dark:text-gray-200">{trip.notes}</p>
            </div>
          )}
        </div>
        
        {/* Documents Section */}
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Documents</h4>
            <button 
              onClick={() => handleDocumentUpload(trip.id)}
              className="text-xs text-teal-600 hover:text-teal-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Document
            </button>
          </div>
          
          {trip.documents.length > 0 ? (
            <div className="space-y-2">
              {trip.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{doc.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{doc.type}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                    <button 
                      onClick={() => handleDeleteDocument(trip.id, doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-teal-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold">TravelScore Pro</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/dashboard" className="flex items-center gap-2 text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Dashboard
            </a>
            <a href="/trips" className="flex items-center gap-2 px-2 py-1 bg-white text-teal-700 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              My Trips
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col md:flex-row w-full">
        {/* Left Sidebar */}
        <div className="hidden md:block w-64 h-screen">
          <Sidebar 
            onNavigate={handleTabChange} 
            currentTab={activeTab} 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Trips</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Keep track of your travel history, upcoming trips, and travel documents
              </p>
            </div>
            
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Add Trip
            </button>
          </div>

          {/* Trip list or empty state */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {trips.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {trips.map(trip => renderTripCard(trip))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No trips yet</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                  Start adding your travel history and upcoming trips. You can also upload important documents for each trip.
                </p>
                <button
                  onClick={() => setShowAddForm(true)} 
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
                >
                  Add Your First Trip
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      {showDocumentModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Document for {selectedTrip.destination}
              </h3>
            </div>
            
            <div className="p-5">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={newDocument.name}
                    onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                    placeholder="e.g. Passport, Visa, Hotel Booking"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document Type
                  </label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="passport">Passport</option>
                    <option value="visa">Visa</option>
                    <option value="booking">Hotel Booking</option>
                    <option value="ticket">Flight Ticket</option>
                    <option value="insurance">Travel Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Supported formats: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedTrip(null);
                  setShowDocumentModal(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={!newDocument.name || !newDocument.file}
                className={`px-4 py-2 rounded-md text-white ${
                  newDocument.name && newDocument.file 
                    ? 'bg-teal-600 hover:bg-teal-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Upload Document
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Trip Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Trip</h3>
            </div>
            
            <div className="p-5">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={newTrip.destination}
                    onChange={handleInputChange}
                    placeholder="e.g. France, Japan, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={newTrip.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={newTrip.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purpose
                  </label>
                  <select
                    name="purpose"
                    value={newTrip.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="tourism">Tourism</option>
                    <option value="business">Business</option>
                    <option value="family">Family Visit</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={newTrip.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Add any additional details about your trip..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTrip}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm transition-colors"
              >
                Save Trip
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Trips; 