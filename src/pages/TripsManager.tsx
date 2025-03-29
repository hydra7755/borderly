import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getFlagUrl } from '../utils/countries';

interface Trip {
  id: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  purpose: string;
  notes: string;
}

interface TripsManagerProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

const TripsManager: React.FC<TripsManagerProps> = ({ isLoggedIn, onLoginRequired }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Trip, 'id'>>({
    country: '',
    city: '',
    startDate: '',
    endDate: '',
    purpose: 'tourism',
    notes: ''
  });
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Sample country data
  const countries = [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'fr', name: 'France' },
    { code: 'de', name: 'Germany' },
    { code: 'es', name: 'Spain' },
    { code: 'it', name: 'Italy' },
    { code: 'jp', name: 'Japan' },
    { code: 'cn', name: 'China' },
    { code: 'au', name: 'Australia' },
    { code: 'ca', name: 'Canada' },
    { code: 'br', name: 'Brazil' },
    { code: 'in', name: 'India' },
    { code: 'mx', name: 'Mexico' },
    { code: 'sg', name: 'Singapore' },
    { code: 'ae', name: 'United Arab Emirates' },
    { code: 'tr', name: 'Turkey' },
    { code: 'za', name: 'South Africa' },
  ];
  
  // Load trips from localStorage on component mount
  useEffect(() => {
    const savedTrips = localStorage.getItem('userTrips');
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    }
  }, []);

  // Save trips to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userTrips', JSON.stringify(trips));
  }, [trips]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTripId) {
      // Update existing trip
      setTrips(trips.map(trip => 
        trip.id === editingTripId ? { ...formData, id: editingTripId } : trip
      ));
      setEditingTripId(null);
    } else {
      // Add new trip
      const newTrip = {
        ...formData,
        id: `trip-${Date.now()}`
      };
      setTrips([...trips, newTrip]);
    }
    
    // Reset form
    setFormData({
      country: '',
      city: '',
      startDate: '',
      endDate: '',
      purpose: 'tourism',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (trip: Trip) => {
    setFormData({
      country: trip.country,
      city: trip.city,
      startDate: trip.startDate,
      endDate: trip.endDate,
      purpose: trip.purpose,
      notes: trip.notes
    });
    setEditingTripId(trip.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      setTrips(trips.filter(trip => trip.id !== id));
    }
  };

  const handleCancel = () => {
    setFormData({
      country: '',
      city: '',
      startDate: '',
      endDate: '',
      purpose: 'tourism',
      notes: ''
    });
    setEditingTripId(null);
    setShowAddForm(false);
  };

  // Filter trips based on current filter
  const filteredTrips = (() => {
    if (filter === 'all') return trips;
    if (filter === 'upcoming') {
      return trips.filter(trip => {
        const startDate = new Date(trip.startDate);
        return startDate > new Date();
      });
    }
    if (filter === 'past') {
      return trips.filter(trip => {
        const endDate = new Date(trip.endDate);
        return endDate < new Date();
      });
    }
    return trips;
  })();

  // Sort trips by start date (newest first)
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                My Trips
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Track your travel history and manage your future trips
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 md:mt-0 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-md transition-colors flex items-center"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showAddForm ? 'Cancel' : 'Add New Trip'}
            </motion.button>
          </div>

          {/* Add/Edit Trip Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingTripId ? 'Edit Trip' : 'Add New Trip'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a country</option>
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter city name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purpose of Travel
                    </label>
                    <select
                      id="purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="tourism">Tourism</option>
                      <option value="business">Business</option>
                      <option value="education">Education</option>
                      <option value="family">Family Visit</option>
                      <option value="medical">Medical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Add any notes about this trip (optional)"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {editingTripId ? 'Update Trip' : 'Save Trip'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Trips Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All Trips
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'upcoming'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'past'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Past Trips
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {sortedTrips.length} {sortedTrips.length === 1 ? 'trip' : 'trips'} found
            </div>
          </div>

          {/* Trips List */}
          <div className="space-y-4">
            {sortedTrips.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No trips found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'all'
                    ? "You haven't added any trips yet. Start by adding your first trip!"
                    : filter === 'upcoming'
                    ? "You don't have any upcoming trips. Plan your next adventure!"
                    : "You don't have any past trips recorded. Add your travel history!"}
                </p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="mt-4 text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    View all trips
                  </button>
                )}
              </div>
            ) : (
              sortedTrips.map(trip => {
                // Get country data
                const countryData = countries.find(c => c.code === trip.country);
                const countryName = countryData ? countryData.name : trip.country;
                
                // Format dates
                const formatDate = (dateString: string) => {
                  const date = new Date(dateString);
                  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                };
                
                // Determine if trip is upcoming, current, or past
                const now = new Date();
                const startDate = new Date(trip.startDate);
                const endDate = new Date(trip.endDate);
                let status = 'past';
                if (startDate > now) {
                  status = 'upcoming';
                } else if (startDate <= now && endDate >= now) {
                  status = 'current';
                }
                
                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div className="flex items-start mb-4 sm:mb-0">
                          {trip.country && (
                            <img
                              src={getFlagUrl(trip.country)}
                              alt={countryName}
                              className="w-10 h-6 object-cover rounded-sm mr-3 mt-1"
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {countryName} - {trip.city}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                              status === 'upcoming'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : status === 'current'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {status === 'upcoming' ? 'Upcoming' : status === 'current' ? 'Current' : 'Past'}
                          </span>
                          
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                            {trip.purpose.charAt(0).toUpperCase() + trip.purpose.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {trip.notes && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{trip.notes}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(trip)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(trip.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Travel Score Impact */}
          <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-3">
              Impact on Your Travel Score
            </h2>
            <p className="text-primary-600 dark:text-primary-400 mb-4">
              Recording your trips helps boost your TravelScore! Each new country you visit adds points to your travel experience component.
            </p>
            <button 
              onClick={() => window.location.href = '/travel-score'}
              className="text-primary-700 dark:text-primary-300 font-medium hover:underline flex items-center"
            >
              View your TravelScore details
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TripsManager; 