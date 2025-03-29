import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XCircleIcon, DocumentIcon, CheckCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

// Define a type for the application data
type ApplicationData = {
  passportScan: File | null;
  photoId: File | null;
  additionalDocuments: File[];
  [key: string]: any;
};

interface DocumentUploadFormProps {
  data: ApplicationData;
  onUpdate: (data: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  data,
  onUpdate,
  onNext,
  onBack
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationData, string>>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ApplicationData) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (fieldName === 'additionalDocuments') {
      const newDocs = [...data.additionalDocuments, ...Array.from(files)];
      onUpdate({ additionalDocuments: newDocs });
    } else {
      onUpdate({ [fieldName]: files[0] });
    }

    // Clear error when field is changed
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, fieldName: keyof ApplicationData) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    if (fieldName === 'additionalDocuments') {
      const newDocs = [...data.additionalDocuments, ...Array.from(files)];
      onUpdate({ additionalDocuments: newDocs });
    } else {
      onUpdate({ [fieldName]: files[0] });
    }
    
    // Clear error when field is changed
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, fieldName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(fieldName);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const removeFile = (fieldName: keyof ApplicationData, index?: number) => {
    if (fieldName === 'additionalDocuments' && typeof index === 'number') {
      const newDocs = [...data.additionalDocuments];
      newDocs.splice(index, 1);
      onUpdate({ additionalDocuments: newDocs });
    } else {
      onUpdate({ [fieldName]: null });
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ApplicationData, string>> = {};
    
    // Required files
    if (!data.passportScan) newErrors.passportScan = 'Passport scan is required';
    if (!data.photoId) newErrors.photoId = 'Recent photo is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const renderFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={URL.createObjectURL(file)} 
          alt="Preview" 
          className="h-20 w-20 object-cover rounded-md"
        />
      );
    }
    return (
      <div className="flex items-center justify-center h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-md">
        <DocumentIcon className="h-8 w-8 text-gray-400" />
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Document Upload
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Passport Scan Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passport Scan*
          </label>
          
          {data.passportScan ? (
            <div className="flex items-center space-x-4">
              {renderFilePreview(data.passportScan)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.passportScan.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(data.passportScan.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile('passportScan')}
                className="text-red-500 hover:text-red-700"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div
              onDrop={(e) => handleDrop(e, 'passportScan')}
              onDragOver={(e) => handleDragOver(e, 'passportScan')}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer ${
                errors.passportScan
                  ? 'border-red-500'
                  : dragOver === 'passportScan'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
                Drag and drop your passport scan here, or
              </p>
              <div className="relative">
                <label
                  htmlFor="passportScan"
                  className="cursor-pointer text-primary-600 hover:text-primary-500 font-medium"
                >
                  browse files
                </label>
                <input
                  id="passportScan"
                  name="passportScan"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'passportScan')}
                  className="sr-only"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG or PDF, max 5MB
              </p>
            </div>
          )}
          
          {errors.passportScan && (
            <p className="mt-1 text-sm text-red-500">{errors.passportScan}</p>
          )}
        </div>
        
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Photo (Passport-size)*
          </label>
          
          {data.photoId ? (
            <div className="flex items-center space-x-4">
              {renderFilePreview(data.photoId)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.photoId.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(data.photoId.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile('photoId')}
                className="text-red-500 hover:text-red-700"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div
              onDrop={(e) => handleDrop(e, 'photoId')}
              onDragOver={(e) => handleDragOver(e, 'photoId')}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer ${
                errors.photoId
                  ? 'border-red-500'
                  : dragOver === 'photoId'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
                Drag and drop your photo here, or
              </p>
              <div className="relative">
                <label
                  htmlFor="photoId"
                  className="cursor-pointer text-primary-600 hover:text-primary-500 font-medium"
                >
                  browse files
                </label>
                <input
                  id="photoId"
                  name="photoId"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'photoId')}
                  className="sr-only"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG or PNG, max 2MB, white background
              </p>
            </div>
          )}
          
          {errors.photoId && (
            <p className="mt-1 text-sm text-red-500">{errors.photoId}</p>
          )}
        </div>
        
        {/* Supporting Documents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Supporting Documents (Optional)
          </label>
          
          <div
            onDrop={(e) => handleDrop(e, 'additionalDocuments')}
            onDragOver={(e) => handleDragOver(e, 'additionalDocuments')}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer mb-4 ${
              dragOver === 'additionalDocuments'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
              Drag and drop additional documents here, or
            </p>
            <div className="relative">
              <label
                htmlFor="additionalDocuments"
                className="cursor-pointer text-primary-600 hover:text-primary-500 font-medium"
              >
                browse files
              </label>
              <input
                id="additionalDocuments"
                name="additionalDocuments"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => handleFileChange(e, 'additionalDocuments')}
                className="sr-only"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Hotel reservations, invitation letters, etc. (JPG, PNG, PDF, DOC)
            </p>
          </div>
          
          {data.additionalDocuments && data.additionalDocuments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Uploaded Documents ({data.additionalDocuments.length})
              </h4>
              
              {data.additionalDocuments.map((doc, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  {renderFilePreview(doc)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('additionalDocuments', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Info Alert */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Document Requirements</h3>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Passport scan must include all pages with visas and stamps</li>
                  <li>Photo must have a white background and be taken within the last 6 months</li>
                  <li>All documents must be clear and legible</li>
                  <li>Files must not exceed the specified size limits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <motion.button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Previous
          </motion.button>
          
          <motion.button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Next Step
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUploadForm; 