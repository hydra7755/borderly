/**
 * OCR Service for passport image processing
 * This service handles communication with Google Cloud Vision API with Tesseract.js fallback
 */
import axios from 'axios';

// Handle Tesseract import with dynamic import for browser environment
let Tesseract: any = null;

// Use an IIFE to load Tesseract asynchronously
(async () => {
  try {
    // Dynamic ESM import for Tesseract.js
    const TesseractModule = await import('tesseract.js');
    Tesseract = TesseractModule.default || TesseractModule;
    console.log('Tesseract.js loaded successfully');
  } catch (error) {
    console.warn('Tesseract.js not available - client-side OCR will be disabled:', error);
  }
})();

// Environment variables - access via window._env_ (browser environment)
const GOOGLE_CLOUD_VISION_ENABLED = 
  (window as any)._env_?.VITE_GOOGLE_CLOUD_VISION_ENABLED === 'true' || 
  (window as any)._env_?.REACT_APP_GOOGLE_CLOUD_VISION_ENABLED === 'true';

const GOOGLE_CLOUD_VISION_API_KEY = 
  (window as any)._env_?.VITE_GOOGLE_CLOUD_VISION_API_KEY || 
  (window as any)._env_?.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY || '';

const API_BASE_URL = 
  (window as any)._env_?.VITE_API_BASE_URL || 
  (window as any)._env_?.VITE_OCR_API_URL || 
  (window as any)._env_?.REACT_APP_API_BASE_URL || 
  'http://localhost:5175/api';

// Log the OCR configuration
console.log('OCR Service Configuration:', {
  GOOGLE_CLOUD_VISION_ENABLED,
  'GOOGLE_API_KEY_CONFIGURED': GOOGLE_CLOUD_VISION_API_KEY ? 'Yes' : 'No',
  API_BASE_URL
});

interface OCRResult {
  ocrText: string;
  source?: string;
}

/**
 * Checks if the OCR service is available
 * @returns boolean indicating if the service is healthy
 */
export async function checkOCRServiceHealth(): Promise<boolean> {
  console.log('Checking OCR service health...');
  
  // Check environment configuration
  console.log('OCR environment configuration:', {
    GOOGLE_CLOUD_VISION_ENABLED,
    'API_KEY_CONFIGURED': GOOGLE_CLOUD_VISION_API_KEY ? 'Yes' : 'No',
    API_BASE_URL,
    'TESSERACT_AVAILABLE': Tesseract ? 'Yes' : 'No'
  });

  // If Google Cloud Vision is enabled and has an API key, check if it works
  if (GOOGLE_CLOUD_VISION_ENABLED && GOOGLE_CLOUD_VISION_API_KEY) {
    console.log('Google Cloud Vision API is configured. Testing connection...');
    try {
      // Simple test request to Google Vision API to verify the API key works
      const testResponse = await axios.get(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
        { timeout: 5000 }
      );
      // If we get a 400 error, that means the API key is valid but we're missing the request body
      // This is actually good, since it means the API key is working
      console.log('Google Cloud Vision test result:', testResponse.status, testResponse.statusText);
      return true;
    } catch (error: any) {
      // Check for specific errors from Google Cloud API
      if (error.response) {
        // 400 Bad Request means the API key worked but we didn't send proper data
        if (error.response.status === 400) {
          console.log('Google Cloud Vision API key is valid');
          return true;
        } else if (error.response.status === 403) {
          console.error('Google Cloud Vision API key is invalid or unauthorized:', error.response.data);
          return false;
        }
      }
      
      console.warn('Google Cloud Vision API test failed:', error.message);
      console.log('Falling back to local OCR service');
      // Continue checking other services since Google Vision test failed
    }
  } else {
    console.log('Google Cloud Vision API not configured or disabled');
  }

  // Try to connect to the local OCR service
  if (API_BASE_URL) {
    try {
      console.log(`Checking local OCR service at ${API_BASE_URL}/health`);
      const response = await axios.get(`${API_BASE_URL}/health`, { 
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Local OCR service health check response:', {
        status: response.status,
        data: response.data
      });
      
      return response.status === 200;
    } catch (error: any) {
      // Log detailed error information
      if (error.response) {
        console.error('Local OCR health check response error:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('Local OCR health check no response (connection failed)');
      } else {
        console.error('Local OCR health check error:', error.message);
      }
      
      console.log('Local OCR service unavailable');
      
      // Check if Tesseract.js is available as fallback
      if (Tesseract) {
        console.log('Tesseract.js is available as fallback');
        return true;
      }
      
      return false;
    }
  }
  
  // Check if Tesseract.js is available as a last resort
  if (Tesseract) {
    console.log('Tesseract.js is available as fallback OCR service');
    return true;
  }
  
  console.error('No OCR service is available. Please install Tesseract.js or configure Google Cloud Vision API');
  return false;
}

/**
 * Basic validation of image to ensure it resembles a passport
 * @param file The image file to validate
 * @returns Promise resolving to a validation result
 */
export async function validatePassportImage(file: File): Promise<{isValid: boolean, message?: string}> {
  return new Promise((resolve) => {
    // Check file type first
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      resolve({ 
        isValid: false, 
        message: `Unsupported file type: ${file.type}. Please use JPEG, PNG or PDF.`
      });
      return;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      resolve({ 
        isValid: false, 
        message: `File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`
      });
      return;
    }
    
    // Skip dimension checks for PDFs
    if (file.type === 'application/pdf') {
      resolve({ isValid: true });
      return;
    }
    
    // Validate image dimensions and aspect ratio for passport photos
    const img = new Image();
    img.onload = () => {
      // Free memory
      URL.revokeObjectURL(img.src);
      
      // Check minimum resolution (at least 1000px on the long edge)
      if (img.width < 1000 && img.height < 1000) {
        resolve({ 
          isValid: false, 
          message: 'Image resolution is too low. Please provide a clearer image of your passport.'
        });
        return;
      }
      
      // Check aspect ratio - passport pages are typically between 1.3:1 and 1.5:1 (width:height)
      const aspectRatio = img.width / img.height;
      if (aspectRatio < 1.2 || aspectRatio > 1.6) {
        resolve({ 
          isValid: false, 
          message: 'Image proportions do not match standard passport dimensions. Please ensure you are scanning the entire passport information page.'
        });
        return;
      }
      
      resolve({ isValid: true });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ 
        isValid: false, 
        message: 'Unable to process the image. Please try a different image or format.'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process an image using Google Cloud Vision API
 * @param imageBase64 Base64-encoded image
 * @returns OCR text from the image
 */
async function processWithGoogleVision(imageBase64: string): Promise<string> {
  if (!GOOGLE_CLOUD_VISION_API_KEY) {
    throw new Error('Google Cloud Vision API key is not configured');
  }

  // Prepare image data for the API - remove data:image/jpeg;base64, prefix if it exists
  const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  // Prepare the request payload
  const requestData = {
    requests: [
      {
        image: {
          content: base64Image
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 1
          }
        ]
      }
    ]
  };

  try {
    console.log('Sending request to Google Cloud Vision API...');
    // Call the Google Cloud Vision API
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      }
    );

    console.log('Received response from Google Cloud Vision API');
    
    // Extract the text from the response
    if (response.data && 
        response.data.responses && 
        response.data.responses[0] && 
        response.data.responses[0].fullTextAnnotation) {
      console.log('Successfully extracted text from Google Cloud Vision response');
      return response.data.responses[0].fullTextAnnotation.text;
    } else {
      console.error('No text detected in the Google Cloud Vision response:', response.data);
      throw new Error('No text detected in the image by Google Cloud Vision API');
    }
  } catch (error: any) {
    console.error('Google Cloud Vision API error:', error);
    if (error.response && error.response.data) {
      console.error('Google Cloud Vision API error details:', error.response.data);
      throw new Error(`Google Cloud Vision API error: ${error.response.data.error?.message || 'Unknown error'}`);
    }
    throw new Error(`Google Cloud Vision API error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Process a passport image using the local OCR API
 * @param file Passport image file
 * @returns OCR text from the image
 */
async function processWithLocalOCR(file: File): Promise<string> {
  if (!API_BASE_URL) {
    throw new Error('Local OCR API URL is not configured');
  }

  console.log(`Sending file to OCR API at ${API_BASE_URL}/passport-ocr`);
  console.log(`File name: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

  // Create form data for the API request
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Send a preliminary request to check if the service is available
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
      console.log('OCR health check response:', healthCheck.status);
    } catch (healthError) {
      console.error('OCR health check failed:', healthError);
      throw new Error('OCR service is not available. Health check failed.');
    }

    // Call the local OCR API
    const response = await axios.post(
      `${API_BASE_URL}/passport-ocr`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('OCR API response status:', response.status);
    
    if (response.data && response.data.text) {
      const textPreview = response.data.text.substring(0, 50).replace(/\n/g, ' ');
      console.log(`OCR text received (preview): ${textPreview}...`);
      return response.data.text;
    } else {
      console.error('No text in OCR response:', response.data);
      throw new Error('No text returned from OCR service');
    }
  } catch (error: any) {
    // Check for specific error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('OCR API error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      throw new Error(`OCR API error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('OCR API no response:', error.request);
      throw new Error('OCR API no response. The request was made but no response was received.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('OCR API request setup error:', error.message);
      throw new Error(`OCR API request error: ${error.message}`);
    }
  }
}

/**
 * Process a passport image using Tesseract.js (client-side OCR)
 * @param imageUrl URL of the image to process
 * @returns OCR text from the image
 */
async function processWithTesseract(imageUrl: string): Promise<string> {
  try {
    console.log('Processing with Tesseract.js...');
    
    // Check if Tesseract is available - wait up to 3 seconds for it to load
    let attempts = 0;
    while (!Tesseract && attempts < 30) {
      console.log('Waiting for Tesseract.js to load...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      attempts++;
    }
    
    if (!Tesseract) {
      throw new Error('Tesseract.js is not available or failed to load. Please check your internet connection or try again later.');
    }
    
    // Recognize text in the image using Tesseract
    const result = await Tesseract.recognize(
      imageUrl,
      'eng', // English language
      { 
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    if (result && result.data && result.data.text) {
      console.log('Tesseract processing completed');
      return result.data.text;
    } else {
      throw new Error('No text detected in the image by Tesseract');
    }
  } catch (error: any) {
    console.error('Tesseract processing error:', error);
    throw new Error(`Tesseract processing error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Process a passport image and extract OCR text
 * @param file The passport image file to process
 * @returns Promise resolving to the OCR text
 */
export async function processPassportImage(file: File): Promise<OCRResult> {
  // First validate the image
  const validation = await validatePassportImage(file);
  if (!validation.isValid) {
    throw new Error(validation.message || 'Invalid passport image');
  }

  // Check which OCR service to use
  const usingGoogleVision = GOOGLE_CLOUD_VISION_ENABLED && GOOGLE_CLOUD_VISION_API_KEY;
  
  // Try Google Cloud Vision first if enabled
  if (usingGoogleVision) {
    try {
      console.log('Trying to process with Google Cloud Vision API...');
      // Convert file to base64 for Google Cloud Vision
      const base64Image = await fileToBase64(file);
      const ocrText = await processWithGoogleVision(base64Image);
      
      console.log('Successfully processed with Google Cloud Vision API');
      return {
        ocrText,
        source: 'google-cloud-vision'
      };
    } catch (googleError) {
      console.error('Google Vision failed:', googleError);
      // Continue with fallbacks
    }
  } else {
    console.log('Google Cloud Vision API not configured or disabled, skipping...');
  }
  
  // Try the local OCR service as second option
  try {
    console.log('Trying to process with local OCR API...');
    const ocrText = await processWithLocalOCR(file);
    
    console.log('Successfully processed with local OCR API');
    return {
      ocrText,
      source: 'local-ocr'
    };
  } catch (localError) {
    console.error('Local OCR failed:', localError);
    // Try Tesseract.js as a last resort
  }

  // Try Tesseract.js as the final fallback option
  if (Tesseract) {
    try {
      console.log('Trying to process with Tesseract.js in browser...');
      const imageUrl = URL.createObjectURL(file);
      const ocrText = await processWithTesseract(imageUrl);
      
      // Clean up the object URL to avoid memory leaks
      URL.revokeObjectURL(imageUrl);
      
      console.log('Successfully processed with Tesseract.js');
      return {
        ocrText,
        source: 'tesseract-js'
      };
    } catch (tesseractError) {
      console.error('Tesseract.js failed:', tesseractError);
      // All methods have failed, throw a comprehensive error
      throw new Error('All OCR services failed. Unable to process passport image.');
    }
  }
  
  // If we get here, all methods have failed
  throw new Error('OCR service is unavailable. Unable to process passport image.');
}

/**
 * Converts a File object to a base64 string
 * @param file The file to convert
 * @returns Promise resolving to the base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Add a function to directly test the API health 
export function testOcrServiceConnection() {
  console.log('Testing OCR service connection...');
  
  // Test Google Cloud Vision API if configured
  if (GOOGLE_CLOUD_VISION_ENABLED && GOOGLE_CLOUD_VISION_API_KEY) {
    console.log('Testing Google Cloud Vision API...');
    axios.get(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`)
      .then(response => {
        console.log('Google Cloud Vision API test response:', response.status, response.statusText);
      })
      .catch(error => {
        if (error.response && error.response.status === 400) {
          console.log('Google Cloud Vision API key is valid (400 error is expected without request body)');
        } else {
          console.error('Google Cloud Vision API test failed:', error);
        }
      });
  }
  
  // Test local OCR API if configured
  if (API_BASE_URL) {
    console.log('Testing local OCR API...');
    fetch(`${API_BASE_URL}/health`)
      .then(response => {
        console.log('OCR health check response:', response.status, response.statusText);
        return response.json();
      })
      .then(data => {
        console.log('OCR health check data:', data);
      })
      .catch(error => {
        console.error('OCR health check failed:', error);
      });
  }
}
