import React, { useState, useCallback, ChangeEvent, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowPathIcon, 
  DocumentArrowUpIcon,
  CheckIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  CameraIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Webcam from 'react-webcam';
import { extractPassportData } from '../../utils/passportOCR';
import { processPassportImage, checkOCRServiceHealth } from '../../services/ocrService';
import { supabase } from '../../lib/supabase/client';

// Define the shape of passport data
export interface ExtractedPassportData {
  passportNumber: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  dateOfBirth: string;
  expiryDate: string;
  issueDate?: string;
  nationality: string;
  gender?: string;
  birthPlace?: string;
  issuingAuthority?: string;
  mrz1?: string;
  mrz2?: string;
}

interface PassportScanProps {
  onScanComplete: (extractedData: Partial<ExtractedPassportData>, passportFile: File) => void;
  onBack: () => void;
  initialFile?: File | null;
  initialData?: Partial<ExtractedPassportData> | null;
}

const PassportScan: React.FC<PassportScanProps> = ({ onScanComplete, onBack, initialFile, initialData }) => {
  const [passportFile, setPassportFile] = useState<File | null>(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialFile ? URL.createObjectURL(initialFile) : null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<ExtractedPassportData> | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ExtractedPassportData> | null>(null);
  const [captureMode, setCaptureMode] = useState<'upload' | 'camera'>('upload');
  const webcamRef = useRef<Webcam>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean>(true);
  const [ocrServiceProvider, setOcrServiceProvider] = useState<string>('fallback');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Check if OCR service is available on component mount
  useEffect(() => {
    const checkService = async () => {
      try {
        console.log("Checking OCR service availability...");
        const isAvailable = await checkOCRServiceHealth();
        setServiceAvailable(isAvailable);
        
        // Check which OCR service will be used
        console.log("Checking OCR service provider...");
        
        // Check Google Cloud Vision API availability
        const hasGoogleVision = 
          ((window as any)._env_?.VITE_GOOGLE_CLOUD_VISION_ENABLED === 'true' || 
           (window as any)._env_?.REACT_APP_GOOGLE_CLOUD_VISION_ENABLED === 'true') 
          && 
          ((window as any)._env_?.VITE_GOOGLE_CLOUD_VISION_API_KEY || 
           (window as any)._env_?.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY);
        
        console.log("Google Vision available:", hasGoogleVision);
        
        // Check API URL for local OCR service
        const apiUrl = (window as any)._env_?.VITE_API_BASE_URL || 
                       (window as any)._env_?.REACT_APP_API_BASE_URL || 
                       (window as any)._env_?.VITE_OCR_API_URL;
        
        console.log("API URL:", apiUrl);
        
        if (hasGoogleVision) {
          // Verify Google Cloud Vision API actually works
          try {
            const testUrl = `https://vision.googleapis.com/v1/images:annotate?key=${
              (window as any)._env_?.VITE_GOOGLE_CLOUD_VISION_API_KEY || 
              (window as any)._env_?.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY
            }`;
            
            const response = await fetch(testUrl, { 
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache'
            });
            
            // If we get a 400 error, that means the API key is valid but missing request body
            // This is actually a good sign - the API key is working
            if (response.status === 400) {
              console.log("Google Cloud Vision API key is valid");
              setOcrServiceProvider('google-cloud-vision');
              console.log("Setting OCR service provider to Google Cloud Vision");
            } else if (response.status === 403) {
              console.error("Google Cloud Vision API key is invalid");
              setOcrServiceProvider('unavailable');
              setServiceAvailable(false);
              setError("Google Cloud Vision API key is invalid. Please check your configuration.");
            } else {
              console.warn("Unexpected response from Google Cloud Vision API:", response.status);
              // Try local OCR service as fallback
              checkLocalOcrService(apiUrl);
            }
          } catch (error) {
            console.error("Error testing Google Cloud Vision API:", error);
            // Try local OCR service as fallback
            checkLocalOcrService(apiUrl);
          }
        } else if (apiUrl) {
          // Try to connect to local OCR service
          checkLocalOcrService(apiUrl);
        } else {
          // No OCR services available
          setServiceAvailable(false);
          setOcrServiceProvider('unavailable');
          setError('No OCR services are available. Please check your configuration.');
        }
        
        if (!isAvailable) {
          console.warn('OCR service is not available.');
          setOcrServiceProvider('unavailable');
          setError('OCR services are unavailable. Please check your configuration.');
        }
      } catch (error) {
        console.error('Error checking OCR service:', error);
        setServiceAvailable(false);
        setOcrServiceProvider('unavailable');
        setError('Error connecting to OCR services. Please check your configuration.');
      }
    };
    
    const checkLocalOcrService = async (apiUrl: string | null | undefined) => {
      if (!apiUrl) {
        setServiceAvailable(false);
        setOcrServiceProvider('unavailable');
        setError('No OCR service is available. Please configure an OCR service.');
        return;
      }
      
      try {
        console.log("Attempting to connect to local OCR service at:", apiUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${apiUrl}/health`, { 
          method: 'GET', 
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log("Local OCR service health check response:", response.status);
        
        if (response.ok) {
          setOcrServiceProvider('local-ocr');
          console.log("Setting OCR service provider to local OCR server");
        } else {
          console.warn("Local OCR service not available");
          setServiceAvailable(false);
          setOcrServiceProvider('unavailable');
          setError('No OCR service is available. Please configure an OCR service.');
        }
      } catch (error) {
        console.warn('Local OCR service unavailable:', error);
        setServiceAvailable(false);
        setOcrServiceProvider('unavailable');
        setError('No OCR service is available. Please configure an OCR service.');
      }
    };
    
    checkService();
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setError('No file selected');
        return;
      }
    
    const file = files[0];
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`,
    });
    
    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!acceptedTypes.includes(file.type)) {
      setError(`File type ${file.type} is not supported. Please upload a JPEG, PNG or PDF file.`);
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
        return;
      }
      
      setPassportFile(file);
      setError(null);
      setExtractedData(null); // Clear previous data on new upload
      setEditedData(null);
      setOcrText(null);
    
    // Revoke previous preview URL if exists
      if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
      }
    
    // Create a new preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    
    // Auto-process the passport if we have a file
      processPassport(file);
  };

  const captureFromCamera = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert data URL to File object
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "passport-photo.jpg", { type: "image/jpeg" });
            setPassportFile(file);
            setPreviewUrl(imageSrc);
            setCameraError(null);
            // Switch back to upload mode to show preview
            setCaptureMode('upload');
            // Process the passport image after a short delay to ensure UI updates first
            setTimeout(() => {
              processPassport(file);
            }, 300);
          })
          .catch(err => {
            console.error("Error creating file from camera:", err);
            setCameraError("Failed to process the captured image.");
          });
      } else {
        setCameraError("Failed to capture image. Please try again.");
      }
    } else {
      setCameraError("Camera not available. Please try uploading a file instead.");
    }
  };

  const handleUserMediaError = (error: any) => {
    console.error("Webcam error:", error);
    if (error.name === 'NotAllowedError') {
      setCameraError("Camera access denied. Please allow camera permissions in your browser settings.");
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      setCameraError("No camera found. Please ensure a camera is connected and enabled.");
    } else {
      setCameraError(`Could not access camera: ${error.message || 'Unknown error'}`);
    }
  };

  // Function to perform OCR on an image file
  const performOCR = async (file: File): Promise<string> => {
    try {
      // Use the OCR service to process the passport image
      const result = await processPassportImage(file);
      console.log('OCR processing completed successfully');
      
      // Log which OCR service was used
      console.log(`OCR processed using: ${result.source || 'unknown service'}`);
      
      // Store OCR result in Supabase if user is logged in
      if (result && result.ocrText) {
        try {
          const user = await supabase.auth.getUser();
          if (user && user.data && user.data.user) {
            await supabase
              .from('ocr_logs')
              .insert({
                user_id: user.data.user.id,
                ocr_text: result.ocrText,
                ocr_source: result.source || 'unknown',
                document_type: 'passport',
                created_at: new Date().toISOString()
              });
          }
        } catch (logError) {
          console.error('Failed to log OCR result:', logError);
          // Non-blocking error - continue even if logging fails
        }
      }
      
      // Return the raw OCR text
      return result.ocrText;
    } catch (error) {
      console.error('OCR API Error:', error);
      // Report the error directly to the user 
      throw error;
    }
  };

  // Add this function to convert the extracted data to the right format
  const formatExtractedData = (data: any): Partial<ExtractedPassportData> => {
    return {
      passportNumber: data.passport_number || '',
      firstName: data.given_names || (data.full_name ? data.full_name.split(' ')[0] : '') || '',
      lastName: data.surname || (data.full_name && data.full_name.includes(' ') ? data.full_name.split(' ').slice(1).join(' ') : ''),
      fullName: data.full_name || '',
      dateOfBirth: data.date_of_birth || '',
      expiryDate: data.passport_expiry_date || '',
      issueDate: data.issue_date || '',
      nationality: data.nationality || '',
      gender: data.gender || '',
      birthPlace: data.place_of_birth || '',
      issuingAuthority: data.issuing_country || '',
      mrz1: data.mrz1 || '',
      mrz2: data.mrz2 || ''
    };
  };

  const processPassport = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    // Reset data
    setExtractedData(null);
    
    if (!file) {
      setError('Please select a passport image file.');
      setIsProcessing(false);
      return;
    }
    
    if (!serviceAvailable || ocrServiceProvider === 'unavailable') {
      setError('Passport scanning is currently unavailable. For security and GDPR compliance reasons, we cannot process your data at this time.');
      setIsProcessing(false);
      return;
    }
    
    console.log('Starting passport processing with file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    console.log('OCR service provider:', ocrServiceProvider);
    
    try {
      setStatusMessage('Scanning passport image...');
      
      // Process the image with OCR service
      console.log('Calling OCR service to process passport image...');
      const ocrResult = await processPassportImage(file);
      
      console.log('OCR service response received:', {
        source: ocrResult.source,
        textLength: ocrResult.ocrText.length
      });
      
      // Save OCR text for debugging
      setOcrText(ocrResult.ocrText);
      
      if (!ocrResult.ocrText) {
        throw new Error('No text was detected in the image. Please try again with a clearer image.');
      }
      
      // Check if OCR text appears to be from a passport
      const containsPassportKeywords = /passport|nationality|birth|expiry|issue|name|document/i.test(ocrResult.ocrText);
      if (!containsPassportKeywords) {
        throw new Error('The image does not appear to be a passport. Please upload a clear image of a passport information page.');
      }
      
      // Log a preview of the OCR text for debugging
      const textPreview = ocrResult.ocrText.substring(0, 100).replace(/\n/g, ' ');
      console.log(`OCR text preview: ${textPreview}...`);
      
      setStatusMessage('Extracting passport information...');
      
      // Extract passport data from OCR text
      console.log('Extracting passport data from OCR text...');
      const passportData = extractPassportData(ocrResult.ocrText);
      const formattedData = formatExtractedData(passportData);
      console.log('Extracted passport data:', formattedData);
      
      // Validate that we have at least some basic passport data
      // We need at least two fields from these essential fields to continue
      const essentialFields = [
        formattedData.passportNumber,
        formattedData.firstName,
        formattedData.lastName,
        formattedData.fullName,
        formattedData.dateOfBirth,
        formattedData.nationality
      ];
      
      const validFields = essentialFields.filter(field => field && field.trim() !== '').length;
      
      if (validFields < 2) {
        throw new Error('Could not extract sufficient passport data. Please ensure you uploaded a clear image of a passport information page.');
      }
      
      setExtractedData(formattedData);
      setStatusMessage('Passport successfully scanned.');
      
      // Update scan data with file information
      const fileData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        ocrEngine: ocrResult.source || 'unknown'
      };
      console.log('Scan complete with file data:', fileData);
      
    } catch (error: any) {
      console.error('Error processing passport:', error);
      
      // Display a user-friendly error message
      if (error.message.includes('API error: 404')) {
        setError('OCR service endpoint not found. Please ensure the OCR server is running.');
      } else if (error.message.includes('Network Error')) {
        setError('Network error while connecting to OCR service. Please check your connection.');
      } else if (error.message.includes('timeout')) {
        setError('OCR service request timed out. Please try again later.');
      } else if (error.message.includes('unable to process')) {
        setError('Unable to process the passport image. The OCR service is currently unavailable.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const confirmScan = () => {
    // Use editedData if available, otherwise use extractedData
    const finalData = editedData || extractedData;
    
    if (!finalData) {
      setError("No passport data available. Please scan your passport first.");
      return;
    }
    
    if (!passportFile) {
      setError("No passport file selected. Please upload a passport scan.");
      return;
    }
    
    // Validate the data before proceeding
    const validationErrors = validatePassportData(finalData);
    const errorKeys = Object.keys(validationErrors);
    
    if (errorKeys.length > 0) {
      // Format validation errors for display
      const errorMessages = errorKeys.map(key => validationErrors[key]);
      setError(`Please correct the following issues: ${errorMessages.join(', ')}`);
      
      // Start editing mode to allow the user to fix the errors
      if (!isEditing) {
        startEditing();
      }
      return;
    }
    
    // Filter out raw MRZ data and any other sensitive or unnecessary data
    const filteredData = { ...finalData };
    
    // Remove sensitive MRZ data
    delete filteredData.mrz1;
    delete filteredData.mrz2;
    
    // Create a clean version of the passport file to avoid storing the full base64 data
    // This is a simplified approach - in a real app, you might want to store the file on a server
    // and just reference it by ID
    const cleanPassportFile = new File(
      [passportFile], 
      passportFile.name, 
      { type: passportFile.type }
    );
    
    // Proceed with the scan completion
    console.log("Confirming scan with filtered data:", filteredData);
    onScanComplete(filteredData, cleanPassportFile);
  };

  const validatePassportData = (data: Partial<ExtractedPassportData>) => {
    const errors: Record<string, string> = {};
    
    // Check required fields
    if (!data.passportNumber) {
      errors.passportNumber = "Passport number is required";
    }
    
    if (!data.firstName && !data.lastName && !data.fullName) {
      errors.name = "Name information is required";
    }
    
    if (!data.nationality) {
      errors.nationality = "Nationality is required";
    }
    
    if (!data.dateOfBirth) {
      errors.dateOfBirth = "Date of birth is required";
    }
    
    if (!data.expiryDate) {
      errors.expiryDate = "Passport expiry date is required";
    } else {
      // Check if passport is expired
      try {
        const expiryDate = new Date(data.expiryDate);
        const today = new Date();
        if (expiryDate < today) {
          errors.expiryDate = "Passport appears to be expired. Please check the expiry date";
        }
      } catch (e) {
        errors.expiryDate = "Invalid expiry date format";
      }
    }
    
    return errors;
  };

  const clearSelection = () => {
      setPassportFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setExtractedData(null);
      setEditedData(null);
      setOcrText(null);
      setIsProcessing(false);
      setError(null);
      setIsEditing(false);
      // Reset the file input visually (important!)
      const fileInput = document.getElementById('passport-file-input') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
      console.log("Cleared passport selection");
  };

  const startEditing = () => {
    // Initialize editedData with current data if it doesn't exist
    if (!editedData && extractedData) {
      console.log("Initializing edit data with:", extractedData);
      setEditedData({...extractedData});
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const saveEdits = () => {
    if (editedData) {
      // If we have first and last name but no full name, create it
      let updatedData = {...editedData};
      
      if (!updatedData.fullName && updatedData.firstName && updatedData.lastName) {
        updatedData.fullName = `${updatedData.firstName} ${updatedData.lastName}`;
      }
      
      // Update the extractedData with the edited values
      setExtractedData(updatedData);
      
      // Log the saved data for debugging
      console.log("Saved edited passport data:", updatedData);
      
      // Exit editing mode
      setIsEditing(false);
    }
  };

  const handleEditField = (field: keyof ExtractedPassportData, value: string) => {
    console.log(`Editing field ${field} with value: ${value}`);
    setEditedData(prev => {
      if (!prev) {
        // If editedData doesn't exist yet, initialize with extractedData
        return {
          ...(extractedData || {}),
          [field]: value
        } as ExtractedPassportData;
      }
      
      // Special handling for name fields to keep them in sync
      const updatedData = {...prev, [field]: value};
      
      // If editing first or last name, update fullName if it exists
      if ((field === 'firstName' || field === 'lastName') && updatedData.firstName && updatedData.lastName) {
        updatedData.fullName = `${updatedData.firstName} ${updatedData.lastName}`;
      }
      
      return updatedData;
    });
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "environment" // Use back camera for passport scanning
  };

  const toggleCaptureMode = () => {
    setCaptureMode(prev => prev === 'upload' ? 'camera' : 'upload');
    setCameraError(null);
  };

  // Reset form function
  const resetForm = () => {
    setPassportFile(null);
    setPreviewUrl(null);
    setError(null);
    setExtractedData(null);
    setEditedData(null);
    setOcrText(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Scan Your Passport</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Upload a clear photo or scan of your passport's main information page.
         The system will attempt to automatically extract the details.
      </p>

      {/* Data Privacy Notice */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center font-medium">
          <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          Data Privacy Notice
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Your passport is processed securely. We adhere strictly to GDPR regulations - your personal data is only stored with your consent, 
          is encrypted, and is never shared with unauthorized parties. You can request deletion of your data at any time.
        </p>
      </div>

      {/* Capture Mode Toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setCaptureMode('upload')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${captureMode === 'upload' 
              ? 'bg-primary-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
          >
            <DocumentArrowUpIcon className="h-5 w-5 inline mr-1" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setCaptureMode('camera')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${captureMode === 'camera' 
              ? 'bg-primary-600 text-white' 
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
          >
            <CameraIcon className="h-5 w-5 inline mr-1" />
            Use Camera
          </button>
        </div>
      </div>

      {/* Upload Mode */}
      {captureMode === 'upload' && (
        <div className="mb-6">
          <label
            htmlFor="passport-file-input"
            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
              border-dashed rounded-lg 
              ${!serviceAvailable 
                ? 'opacity-60 cursor-not-allowed bg-gray-200 dark:bg-gray-800' 
                : 'cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'} 
              transition-colors`}
          >
            {previewUrl && !isProcessing && (
                <img src={previewUrl} alt="Passport Preview" className="absolute inset-0 w-full h-full object-contain rounded-lg z-10" />
            )}
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-800/70 z-20 rounded-lg">
                  <ArrowPathIcon className="h-8 w-8 text-primary-600 animate-spin mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</p>
              </div>
            )}
            {!serviceAvailable && !isProcessing && (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 z-30 absolute inset-0">
                <ExclamationTriangleIcon className="w-10 h-10 mb-3 text-yellow-500" />
                <p className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">
                  Passport Scanning Unavailable
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                  OCR service is currently offline. Please try again later.
                </p>
              </div>
            )}
            {!passportFile && !isProcessing && serviceAvailable && (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 z-0">
                <DocumentArrowUpIcon className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG, or PDF (MAX. 10MB)</p>
              </div>
            )}
            <input
              id="passport-file-input"
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" // Input on top
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              disabled={isProcessing || !serviceAvailable}
            />
          </label>

          {/* Error Message */}
          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-500">
              <ExclamationTriangleIcon className="inline-block h-4 w-4 mr-1" />
              {error}
            </div>
          )}

          {/* "Scan Passport" Button */}
          <div className="w-full flex justify-between mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isProcessing}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                if (passportFile) {
                  processPassport(passportFile);
                }
              }}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                ${(!passportFile || !serviceAvailable || isProcessing) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700'}`}
              disabled={!passportFile || isProcessing || !serviceAvailable}
            >
              {isProcessing ? 'Processing...' : 'Scan Passport'}
            </button>
          </div>
        </div>
      )}

      {/* Camera Mode */}
      {captureMode === 'camera' && (
        <div className="mb-6">
          <div className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
            {cameraError ? (
              <div className="text-center p-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">{cameraError}</p>
                <button
                  onClick={() => setCameraError(null)}
                  className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md text-sm"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover rounded-lg"
                  onUserMediaError={handleUserMediaError}
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={captureFromCamera}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-full shadow-lg"
                  >
                    <CameraIcon className="h-5 w-5 mr-2" />
                    Capture
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Display OCR Text (for debugging) */}
      {ocrText && (
        <div className="mt-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md">
          <details>
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Raw OCR Text (Debug)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
              {ocrText}
            </pre>
          </details>
        </div>
      )}

      {/* Display Extracted Data */}
      {!isEditing && extractedData && !isProcessing && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-medium text-green-800 dark:text-green-200 flex items-center">
              <CheckIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Passport Data Extracted
            </h3>
            <button
              onClick={startEditing}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit Data
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please review the details below. If anything is incorrect, you can correct it by clicking "Edit Data".
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Passport Number */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Passport Number:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.passportNumber || 'N/A'}
              </p>
            </div>

            {/* First Name */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.firstName || 'N/A'}
              </p>
            </div>

            {/* Last Name */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.lastName || 'N/A'}
              </p>
            </div>

            {/* Full Name */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.fullName || (extractedData.firstName && extractedData.lastName ? `${extractedData.firstName} ${extractedData.lastName}` : 'N/A')}
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Of Birth:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.dateOfBirth || 'N/A'}
              </p>
            </div>

            {/* Nationality */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nationality:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.nationality || 'N/A'}
              </p>
            </div>

            {/* Expiry Date */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.expiryDate || 'N/A'}
              </p>
            </div>

            {/* Issue Date */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.issueDate || 'N/A'}
              </p>
            </div>

            {/* Gender */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.gender || 'N/A'}
              </p>
            </div>

            {/* Birth Place */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Birth Place:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.birthPlace || 'N/A'}
              </p>
            </div>

            {/* Issuing Authority */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Issuing Authority:</p>
              <p className="text-gray-900 dark:text-white">
                {extractedData.issuingAuthority || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Editable Data Form */}
      {isEditing && editedData && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 flex items-center">
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Passport Data
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Make corrections to the extracted data below.
          </p>

          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Passport Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passport Number</label>
              <input 
                type="text" 
                value={editedData.passportNumber || ''} 
                onChange={(e) => handleEditField('passportNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <input 
                type="text" 
                value={editedData.firstName || ''} 
                onChange={(e) => handleEditField('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <input 
                type="text" 
                value={editedData.lastName || ''} 
                onChange={(e) => handleEditField('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input 
                type="text" 
                value={editedData.fullName || ''} 
                onChange={(e) => handleEditField('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input 
                type="date" 
                value={editedData.dateOfBirth || ''} 
                onChange={(e) => handleEditField('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nationality</label>
              <input 
                type="text" 
                value={editedData.nationality || ''} 
                onChange={(e) => handleEditField('nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
              <input 
                type="date" 
                value={editedData.expiryDate || ''} 
                onChange={(e) => handleEditField('expiryDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date</label>
              <input 
                type="date" 
                value={editedData.issueDate || ''} 
                onChange={(e) => handleEditField('issueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select
                value={editedData.gender || ''}
                onChange={(e) => handleEditField('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="X">Other</option>
              </select>
            </div>

            {/* Birth Place */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birth Place</label>
              <input 
                type="text" 
                value={editedData.birthPlace || ''} 
                onChange={(e) => handleEditField('birthPlace', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Issuing Authority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuing Authority</label>
              <input 
                type="text" 
                value={editedData.issuingAuthority || ''} 
                onChange={(e) => handleEditField('issuingAuthority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveEdits}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {passportFile && !extractedData && !editedData && !isProcessing && !error && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-200 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
              Passport scan uploaded. Waiting for data extraction. If it doesn't start, try re-uploading.
          </p>
        </div>
      )}

      {/* Display service status warning if OCR service is not available */}
      {!serviceAvailable || ocrServiceProvider === 'unavailable' ? (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-200 flex items-center font-medium">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
              Passport Scanning Unavailable
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            Our passport OCR service is currently unavailable. For security and GDPR compliance, we cannot process passport information at this time. 
            Please check back later or contact support for assistance.
          </p>
        </div>
      ) : null}

      {/* OCR Service Status - Google Cloud Vision */}
      {ocrServiceProvider === 'google-cloud-vision' && serviceAvailable && (
        <div className="my-4 p-4 border-l-4 border-green-400 bg-green-50 text-green-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Using Google Cloud Vision OCR</h3>
              <div className="mt-2 text-sm">
                <p>
                  Connected to Google Cloud Vision for high-quality text recognition. Your data is processed securely.
                </p>
                <p className="mt-1">
                  This service offers professional-level text recognition for accurate passport data extraction.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR Service Status - Local API */}
      {ocrServiceProvider === 'local-ocr' && serviceAvailable && (
        <div className="my-4 p-4 border-l-4 border-blue-400 bg-blue-50 text-blue-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Using Local OCR Service</h3>
              <div className="mt-2 text-sm">
                <p>
                  Connected to local OCR service for text recognition. Data is processed on our secure servers.
                </p>
                <p className="mt-1">
                  Your data is transmitted securely and processed in compliance with GDPR regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className={`flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors`}
        >
           <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        {passportFile && (
          <div className="flex items-center space-x-4">
             <button
              type="button"
              onClick={clearSelection}
              disabled={isProcessing}
              className={`flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors`}
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Change File
            </button>
            <button
              type="button"
              onClick={confirmScan}
              disabled={(!extractedData && !editedData) || isProcessing}
              className={`flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${(!extractedData && !editedData) || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors`}
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Confirm Scan
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-200 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-700 dark:text-red-200 hover:text-red-800 dark:hover:text-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Camera Capture Option */}
      {serviceAvailable && (
        <div className="flex flex-col mt-6 space-y-4">
          <button
            type="button"
            onClick={toggleCaptureMode}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${captureMode === 'camera' ? 'bg-blue-50' : ''}`}
            disabled={isProcessing}
          >
            <CameraIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            {captureMode === 'camera' ? 'Hide Camera' : 'Use Camera'}
          </button>
          
          {captureMode === 'camera' && (
            <div className="mt-3">
              {cameraError ? (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Camera Error: </strong>
                  <span className="block sm:inline">{cameraError}</span>
                  <button onClick={() => setCameraError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    onUserMediaError={handleUserMediaError}
                    className="w-full h-auto rounded-md"
                  />
                  <button
                    onClick={captureFromCamera}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isProcessing}
                  >
                    Capture
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PassportScan;
