import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaPassport } from 'react-icons/fa';
import {
  extractPassportMrzFromFile,
  extractPassportMrzFromVideo,
  MRZ_SCAN_FAILED_MESSAGE,
  terminateMrzWorker,
} from '../../../utils/mrzOcrPipeline';
import {
  EMPTY_PASSPORT_SCAN_FIELDS,
  isPassportScanComplete,
  type PassportScanFields,
} from './types';

export interface PassportScannerPanelProps {
  title?: string;
  passportImage: string | null;
  passportData: PassportScanFields | null;
  isEditingPassportData: boolean;
  onPassportImageChange: (image: string | null) => void;
  onPassportDataChange: (data: PassportScanFields | null) => void;
  onIsEditingChange: (editing: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  children?: React.ReactNode;
}

const PassportScannerPanel: React.FC<PassportScannerPanelProps> = ({
  title = 'Scan Your Passport',
  passportImage,
  passportData,
  isEditingPassportData,
  onPassportImageChange,
  onPassportDataChange,
  onIsEditingChange,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  children,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frameError, setFrameError] = useState<string | null>(null);
  const [enteredManually, setEnteredManually] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      void terminateMrzWorker();
    };
  }, [stopCamera]);

  const applyScanResult = useCallback(
    (imageDataUrl: string, fields: PassportScanFields, file: File) => {
      onPassportImageChange(imageDataUrl);
      onPassportDataChange(fields);
      onIsEditingChange(false);
      setEnteredManually(false);
      setFrameError(null);
      void file;
    },
    [onPassportDataChange, onPassportImageChange, onIsEditingChange]
  );

  const handleFieldEdit = (field: keyof PassportScanFields, value: string) => {
    const base = passportData ?? { ...EMPTY_PASSPORT_SCAN_FIELDS };
    onPassportDataChange({ ...base, [field]: value });
  };

  const startManualEntry = useCallback(() => {
    stopCamera();
    setFrameError(null);
    setEnteredManually(true);
    if (!passportData) {
      onPassportDataChange({ ...EMPTY_PASSPORT_SCAN_FIELDS });
    }
    onIsEditingChange(true);
  }, [onIsEditingChange, onPassportDataChange, passportData, stopCamera]);

  const renderManualEntryForm = (heading: string, description: string) => (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-800">{heading}</h3>
        {!enteredManually && (
          <button
            type="button"
            onClick={() => onIsEditingChange(false)}
            className="text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Done Editing
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(passportData ?? EMPTY_PASSPORT_SCAN_FIELDS) as Array<keyof PassportScanFields>).map(
          (key) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium capitalize text-gray-700">
                {key.replace(/([A-Z])/g, ' $1').trim()}
                <span className="text-red-500"> *</span>
              </label>
              <input
                type={key.includes('Date') || key === 'dateOfBirth' ? 'date' : 'text'}
                value={(passportData ?? EMPTY_PASSPORT_SCAN_FIELDS)[key]}
                onChange={(e) => handleFieldEdit(key, e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )
        )}
      </div>
      {enteredManually && (
        <button
          type="button"
          onClick={() => {
            setEnteredManually(false);
            onIsEditingChange(false);
            onPassportDataChange(null);
          }}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Try scanning again
        </button>
      )}
    </div>
  );

  const renderManualEntryPrompt = () => (
    <div className="mx-auto mt-4 max-w-md text-center">
      <p className="text-sm text-gray-600">
        Scanner not working? You can still continue by entering your passport details manually.
      </p>
      <button
        type="button"
        onClick={startManualEntry}
        disabled={isProcessing}
        className="mt-2 text-sm font-semibold text-primary-600 underline-offset-2 hover:text-primary-700 hover:underline disabled:opacity-50"
      >
        Enter passport details manually
      </button>
    </div>
  );

  const runOcrPipeline = useCallback(
    async (file: File, imageDataUrl: string) => {
      setIsProcessing(true);
      setFrameError(null);

      try {
        const result = await extractPassportMrzFromFile(file);
        applyScanResult(imageDataUrl, { ...EMPTY_PASSPORT_SCAN_FIELDS, ...result.fields }, file);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : MRZ_SCAN_FAILED_MESSAGE;
        setFrameError(message);
        onPassportDataChange(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [applyScanResult, onPassportDataChange]
  );

  const startCamera = async () => {
    setFrameError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser doesn't support camera access.");
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error('Camera preview is not ready.');
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
    } catch (error) {
      let message = 'Unable to access camera. Please use Upload Passport instead.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          message = 'Camera access was denied. Please allow camera permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          message = 'No camera found on this device.';
        } else {
          message = error.message;
        }
      }
      setFrameError(message);
      stopCamera();
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    setFrameError(null);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    try {
      const result = await extractPassportMrzFromVideo(video);
      const blob = await (await fetch(imageDataUrl)).blob();
      const file = new File([blob], 'passport-scan.jpg', { type: 'image/jpeg' });

      stopCamera();
      applyScanResult(imageDataUrl, { ...EMPTY_PASSPORT_SCAN_FIELDS, ...result.fields }, file);
    } catch (error) {
      stopCamera();
      onPassportImageChange(imageDataUrl);
      const message =
        error instanceof Error ? error.message : MRZ_SCAN_FAILED_MESSAGE;
      setFrameError(message);
      onPassportDataChange(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFrameError('Please upload a JPEG or PNG image of your passport page.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const imageDataUrl = reader.result as string;
      onPassportImageChange(imageDataUrl);
      stopCamera();
      await runOcrPipeline(file, imageDataUrl);
    };
    reader.onerror = () => {
      setFrameError('Could not read the uploaded file.');
    };
    reader.readAsDataURL(file);
  };

  const clearScan = () => {
    stopCamera();
    onPassportImageChange(null);
    onPassportDataChange(null);
    onIsEditingChange(false);
    setEnteredManually(false);
    setFrameError(null);
  };

  const showScanner = !isEditingPassportData;

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">{title}</h2>

      {passportData && isEditingPassportData && (
        <div className="mb-6">
          {renderManualEntryForm(
            enteredManually ? 'Enter Passport Details Manually' : 'Edit Passport Data',
            enteredManually
              ? 'Fill in the details from your passport. Your uploaded or captured image will still be saved with the application.'
              : 'All fields remain editable if the scan missed or misread any detail.'
          )}
        </div>
      )}

      {passportData && !isEditingPassportData && (
        <div className="mb-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-800">Passport Data Extracted</h3>
              <button
                type="button"
                onClick={() => onIsEditingChange(true)}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">First Name</p>
                <p className="font-medium">{passportData.firstName || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Name</p>
                <p className="font-medium">{passportData.lastName || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600">Passport Number</p>
                <p className="font-medium">{passportData.passportNumber || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600">Nationality</p>
                <p className="font-medium">{passportData.nationality || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600">Date of Birth</p>
                <p className="font-medium">{passportData.dateOfBirth || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600">Expiry Date</p>
                <p className="font-medium">{passportData.expiryDate || '—'}</p>
              </div>
            </div>
            {!isPassportScanComplete(passportData) && (
              <p className="mt-3 rounded border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800">
                Some required fields are still empty. Click Edit to complete them manually.
              </p>
            )}
          </div>
        </div>
      )}

      {children}

      {showScanner && (
        <>
          <div className="flex flex-col items-center">
            {passportImage ? (
              <div className="relative mb-4 h-64 w-full max-w-md overflow-hidden rounded-lg border-2 border-gray-300">
                <img
                  src={passportImage}
                  alt="Passport scan preview"
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={clearScan}
                  disabled={isProcessing}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 disabled:opacity-50"
                  title="Remove scan"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                id="passport-scanner-container"
                className="relative mb-4 flex aspect-[3/2] w-full max-w-md items-center justify-center overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-50"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 z-10 h-full w-full object-contain ${
                    cameraActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Corner + MRZ alignment overlay */}
                <div className="pointer-events-none absolute inset-2 z-20">
                  <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-white" />
                  <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-white" />
                  <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white" />
                  <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white" />
                  <div className="absolute bottom-1 left-3 right-3 h-8 rounded-sm border border-dashed border-white/70 bg-black/20" />
                </div>

                {!cameraActive && !isProcessing && (
                  <div className="z-0 p-4 text-center">
                    <FaPassport className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Position the full passport page in the frame
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      All corners and both MRZ lines at the bottom must be visible
                    </p>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
                    <div className="text-center text-white">
                      <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <p className="text-sm font-medium">Processing Scan... Please hold still</p>
                    </div>
                  </div>
                )}

                {frameError && !isProcessing && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 p-4">
                    <p className="text-center text-sm font-medium text-red-200">{frameError}</p>
                    <button
                      type="button"
                      onClick={startManualEntry}
                      className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                    >
                      Enter details manually
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-center space-x-4">
            {cameraActive ? (
              <>
                <button
                  type="button"
                  onClick={captureFromCamera}
                  disabled={isProcessing}
                  className="min-w-[140px] rounded-lg bg-primary-600 px-6 py-2.5 text-center text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Capture Passport
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={isProcessing}
                  className="min-w-[120px] rounded-lg bg-gray-100 px-6 py-2.5 text-center text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isProcessing}
                  className="min-w-[140px] rounded-lg bg-primary-600 px-6 py-2.5 text-center text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Scan with Camera
                </button>
                <label
                  className={`min-w-[140px] cursor-pointer rounded-lg bg-gray-100 px-6 py-2.5 text-center text-gray-700 hover:bg-gray-200 ${
                    isProcessing ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  Upload Passport
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>

          {(frameError || (passportImage && !passportData)) &&
            !isProcessing &&
            !isEditingPassportData &&
            renderManualEntryPrompt()}

          {frameError && passportImage && !isProcessing && (
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-red-600">{frameError}</p>
          )}
        </>
      )}

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="rounded-lg bg-gray-100 px-6 py-2.5 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          Back
        </button>
        {passportData && (
          <button
            type="button"
            onClick={onContinue}
            disabled={!isPassportScanComplete(passportData) || isProcessing}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!isPassportScanComplete(passportData) ? 'Complete All Fields' : continueLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default PassportScannerPanel;
