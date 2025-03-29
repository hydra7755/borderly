import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Document {
  id: string;
  name: string;
  type: string;
  expiryDate?: string;
  createdAt: string;
  fileSize: string;
  content: string; // In a real app, this would be a file reference
}

interface DocumentManagerProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ isLoggedIn, onLoginRequired }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'passport',
    expiryDate: '',
    content: ''
  });
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Document types
  const documentTypes = [
    { id: 'passport', label: 'Passport' },
    { id: 'visa', label: 'Visa' },
    { id: 'insurance', label: 'Travel Insurance' },
    { id: 'id_card', label: 'ID Card' },
    { id: 'vaccine', label: 'Vaccination Certificate' },
    { id: 'other', label: 'Other' }
  ];

  // Load documents from localStorage on component mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('userDocuments');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }
  }, []);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userDocuments', JSON.stringify(documents));
  }, [documents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      expiryDate: formData.expiryDate,
      createdAt: new Date().toISOString(),
      fileSize: '1.2 MB', // Simulated file size
      content: formData.content
    };

    setDocuments([...documents, newDoc]);
    
    // Reset form
    setFormData({
      name: '',
      type: 'passport',
      expiryDate: '',
      content: ''
    });
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
      if (selectedDocId === id) {
        setSelectedDocId(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'passport':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        );
      case 'visa':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m-6-8h6M9 1v16a2 2 0 002 2h2a2 2 0 002-2V1M4 1h16a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V3a2 2 0 012-2z" />
          </svg>
        );
      case 'insurance':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'id_card':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        );
      case 'vaccine':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

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
                Travel Documents
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Store and manage your important travel documents
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
              {showAddForm ? 'Cancel' : 'Add Document'}
            </motion.button>
          </div>

          {/* Add Document Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add New Document
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Document Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., US Passport"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Document Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      {documentTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expiry Date (if applicable)
                    </label>
                    <input
                      type="date"
                      id="expiryDate"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Document
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input 
                              id="file-upload" 
                              name="file-upload" 
                              type="file" 
                              className="sr-only" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={() => {
                                // Simulate file content for demo
                                setFormData(prev => ({
                                  ...prev,
                                  content: 'Sample document content'
                                }));
                              }}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PDF, PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Save Document
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Documents List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No documents found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven't added any travel documents yet. Upload important documents to access them anywhere.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add Your First Document
                </button>
              </div>
            ) : (
              documents.map(doc => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
                    selectedDocId === doc.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedDocId(doc.id === selectedDocId ? null : doc.id)}
                >
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="flex-shrink-0 p-2 rounded-md bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                        {getDocumentIcon(doc.type)}
                      </div>
                      <div className="ml-3 flex-1 overflow-hidden">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white truncate">
                          {doc.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {documentTypes.find(t => t.id === doc.type)?.label}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex justify-between">
                        <span>Added on: {formatDate(doc.createdAt)}</span>
                        <span>{doc.fileSize}</span>
                      </div>
                      {doc.expiryDate && (
                        <div className="mt-1">
                          <span className="font-medium">Expires: {formatDate(doc.expiryDate)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <button
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // In a real app, this would download the document
                          alert(`Downloading ${doc.name}`);
                        }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Document Viewer */}
          {selectedDocId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Document Preview
                </h2>
                <button
                  onClick={() => setSelectedDocId(null)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
                {/* In a real app, this would show an actual document preview */}
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Document preview not available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">In a real application, you would see the document here</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Travel Tip */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-3">
              Travel Tip
            </h2>
            <p className="text-blue-600 dark:text-blue-400 mb-2">
              Always keep digital copies of your important travel documents in case the physical copies are lost or stolen.
            </p>
            <p className="text-blue-600 dark:text-blue-400 mb-2">
              Recommended documents to store:
            </p>
            <ul className="list-disc list-inside text-blue-600 dark:text-blue-400 ml-2 space-y-1">
              <li>Passport (main page)</li>
              <li>Visa documents</li>
              <li>Travel insurance policy</li>
              <li>ID cards</li>
              <li>Vaccination certificates</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentManager; 