import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import TripDetails from './TripDetails';
import * as documentService from '../../lib/api/documentService';

// Define proper interface for document and trip
interface Document {
  id: string;
  filename: string;
  url: string;
  created_at: string;
}

interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  documents: Document[];
}

const TripsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    // Fetch user trips
    const fetchTrips = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        const response = await fetch('/api/trips?userId=' + userId);
        const data = await response.json();
        
        if (response.ok) {
          setTrips(data);
        } else {
          setError(data.message || 'Failed to load trips');
        }
      } catch (err) {
        setError('An error occurred while fetching your trips');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, [userId]);

  const handleUploadDocument = async (tripId: string, file: File) => {
    try {
      const { document, error } = await documentService.uploadDocument(tripId, userId, file);
      
      if (error) throw error;
      
      // Update state with new document
      setTrips(trips.map(trip => {
        if (trip.id === tripId) {
          return {
            ...trip,
            documents: [...trip.documents, document]
          };
        }
        return trip;
      }));
      
      return document;
    } catch (err) {
      console.error('Upload failed:', err);
      throw err;
    }
  };
  
  const handleDeleteDocument = async (tripId: string, docId: string) => {
    try {
      const { success, error } = await documentService.deleteDocument(docId, userId);
      
      if (error) throw error;
      
      // Update state by removing the deleted document
      setTrips(trips.map(trip => {
        if (trip.id === tripId) {
          return {
            ...trip,
            documents: trip.documents.filter(doc => doc.id !== docId)
          };
        }
        return trip;
      }));
      
      return success;
    } catch (err) {
      console.error('Delete failed:', err);
      throw err;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your trips...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-md">
        <p>{error}</p>
        <button 
          className="mt-2 text-sm font-medium text-red-700 dark:text-red-300 underline" 
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h2>
        <button 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <FaPlus className="mr-2 h-4 w-4" /> Add Trip
        </button>
      </div>
      
      {trips.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {trips.map(trip => (
            <TripDetails 
              key={trip.id}
              trip={trip}
              onUploadDocument={handleUploadDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <svg 
            className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No trips yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start by creating your first trip to track your documents and travel details.
          </p>
          <div className="mt-6">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FaPlus className="mr-2 h-4 w-4" /> Add Your First Trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsTab; 