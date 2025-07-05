import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { CameraIcon, ArrowPathIcon, CheckIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

interface PhotoCaptureProps {
  onCapture: (imageSrc: string) => void;
  onBack: () => void;
  initialImage?: string | null; // Allow pre-filling an image if resuming
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onCapture, onBack, initialImage }) => {
  const webcamRef = useRef<Webcam>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const capturedImage = webcamRef.current.getScreenshot();
      setImageSrc(capturedImage);
      console.log("Photo captured");
    } else {
      console.error("Webcam reference not available.");
      setCameraError("Could not access the camera.");
    }
  }, [webcamRef]);

  const retake = () => {
    setImageSrc(null);
    setCameraError(null);
    console.log("Retaking photo");
  };

  const confirmPhoto = () => {
    if (imageSrc) {
      console.log("Photo confirmed, sending to parent component", "Image data available but not logged for privacy");
      try {
        onCapture(imageSrc);
        console.log("Photo capture callback completed successfully");
      } catch (error) {
        console.error("Error in photo capture callback:", error);
      }
    } else {
      console.error("No image source available to confirm");
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

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user" // Prioritize front camera
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Take Your Photo</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Please look directly at the camera. Ensure good lighting and a clear background.
      </p>

      <div className="relative flex justify-center items-center w-full max-w-md mx-auto aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden mb-4">
        {cameraError && !imageSrc && (
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
             <p className="text-red-600 font-medium">{cameraError}</p>
             <p className="text-sm text-gray-500 mt-2">Check your browser settings and ensure a camera is connected.</p>
          </div>
        )}
        {!imageSrc && !cameraError && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
            onUserMediaError={handleUserMediaError}
            mirrored={true} // Mirror selfie view
          />
        )}
        {imageSrc && (
          <img src={imageSrc} alt="Captured" className="w-full h-full object-cover" />
        )}
         {/* Overlay to guide face positioning (optional) */}
         {!imageSrc && !cameraError && (
           <div className="absolute inset-0 border-2 border-dashed border-primary-500 rounded-md opacity-50 pointer-events-none" style={{ margin: '10%' }}>
             {/* You could add more sophisticated guides here */}
           </div>
         )}
      </div>

      <div className="flex justify-between items-center mt-6 space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
           <ArrowUturnLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        {!imageSrc ? (
          <button
            type="button"
            onClick={capture}
            disabled={!!cameraError}
            className={`flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${cameraError ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors`}
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Take Photo
          </button>
        ) : (
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={retake}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retake
            </button>
            <button
              type="button"
              onClick={confirmPhoto}
              className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
               <CheckIcon className="h-5 w-5 mr-2" />
              Confirm Photo
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PhotoCapture;
