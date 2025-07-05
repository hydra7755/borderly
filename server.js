/**
 * Express server for Google Cloud Vision OCR API
 * 
 * This server handles passport image OCR using Google Cloud Vision API
 */

// Import required packages
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Set up Express app
const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(cors());
app.use(express.json());

// Configure multer for memory storage (files stored as buffers)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Log configuration for debugging
console.log('Google Cloud Vision API Configuration:');
console.log('- Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
console.log('- Credentials Path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Check if credentials file exists
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath || !fs.existsSync(path.resolve(process.cwd(), credentialsPath))) {
  console.error('ERROR: Google Cloud credentials file not found at:', credentialsPath);
  console.error('Please make sure you have added your service account key file and updated the GOOGLE_APPLICATION_CREDENTIALS environment variable.');
}

// Create a Vision API client
const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

/**
 * Performs OCR on an image using Google Cloud Vision API
 * 
 * @param {Buffer} imageBuffer - The image buffer to process
 * @returns {Promise<string>} - The extracted text from the image
 */
async function performOCR(imageBuffer) {
  try {
    console.log('Starting OCR processing with Google Cloud Vision API...');
    
    // Perform text detection on the image
    const [result] = await visionClient.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      console.error('No text detected in the image');
      throw new Error('No text detected in the image');
    }
    
    // The first annotation contains the entire extracted text
    const fullText = detections[0].description;
    console.log('OCR Text extracted successfully');
    
    return fullText;
  } catch (error) {
    console.error('Error performing OCR:', error);
    throw error;
  }
}

/**
 * Extract MRZ lines from OCR text
 * This is a simplified version - your actual implementation in passportOCR.ts is more robust
 */
function extractMRZLines(ocrText) {
  const lines = ocrText.split('\n');
  const mrzLines = [];
  
  for (const line of lines) {
    // Look for lines that match MRZ format (mostly < characters and alphanumeric)
    if (line.includes('<<') && /^[A-Z0-9<]+$/.test(line.trim())) {
      mrzLines.push(line.trim());
    }
  }
  
  return mrzLines;
}

/**
 * Simple passport data extraction
 * This is a simplified version - your actual implementation in passportOCR.ts is more robust
 */
function extractBasicPassportData(ocrText) {
  // Initialize with empty values
  const data = {
    passport_number: null,
    surname: null,
    given_names: null,
    full_name: null,
    date_of_birth: null,
    gender: null,
    nationality: null,
    passport_expiry_date: null,
    issuing_country: null,
    place_of_birth: null
  };
  
  // Extract MRZ lines
  const mrzLines = extractMRZLines(ocrText);
  
  // Try to extract data from MRZ
  if (mrzLines.length >= 2) {
    // Parse first line (document type, country code, name)
    const line1 = mrzLines[0];
    if (line1.length >= 5) {
      data.issuing_country = line1.substring(2, 5).replace(/</g, '');
      
      // Extract name
      const namePart = line1.substring(5);
      const nameParts = namePart.split('<<');
      if (nameParts.length >= 2) {
        data.surname = nameParts[0].replace(/</g, '');
        data.given_names = nameParts[1].replace(/</g, ' ').trim();
        data.full_name = `${data.surname}, ${data.given_names}`;
      }
    }
    
    // Parse second line (passport number, nationality, DOB, gender, expiry date)
    const line2 = mrzLines[1];
    if (line2.length >= 28) {
      data.passport_number = line2.substring(0, 9).replace(/</g, '');
      data.nationality = line2.substring(10, 13).replace(/</g, '');
      
      // Date of birth
      const dobStr = line2.substring(13, 19);
      const dobYear = dobStr.substring(0, 2);
      const dobMonth = dobStr.substring(2, 4);
      const dobDay = dobStr.substring(4, 6);
      data.date_of_birth = `19${dobYear}-${dobMonth}-${dobDay}`;
      
      // Gender
      data.gender = line2.substring(20, 21) === 'M' ? 'Male' : 'Female';
      
      // Expiry date
      const expStr = line2.substring(21, 27);
      const expYear = expStr.substring(0, 2);
      const expMonth = expStr.substring(2, 4);
      const expDay = expStr.substring(4, 6);
      data.passport_expiry_date = `20${expYear}-${expMonth}-${expDay}`;
    }
  }
  
  // Try to extract data from visual inspection zone
  const lines = ocrText.split('\n');
  for (const line of lines) {
    // Look for specific labels in the text
    if (line.includes('Name:')) {
      data.full_name = line.split('Name:')[1].trim();
    } else if (line.includes('Date of Birth:')) {
      data.date_of_birth = line.split('Date of Birth:')[1].trim();
    } else if (line.includes('Place of Birth:')) {
      data.place_of_birth = line.split('Place of Birth:')[1].trim();
    } else if (line.includes('Date of Issue:')) {
      data.issue_date = line.split('Date of Issue:')[1].trim();
    } else if (line.includes('Date of Expiry:')) {
      data.passport_expiry_date = line.split('Date of Expiry:')[1].trim();
    }
  }
  
  return data;
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'OCR service is running' });
});

// OCR endpoint
app.post('/api/ocr/passport', upload.single('image'), async (req, res) => {
  try {
    // Check if image file is provided
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get image buffer from the uploaded file
    const imageBuffer = req.file.buffer;

    // Perform OCR on the image
    const ocrText = await performOCR(imageBuffer);

    // Extract structured data from OCR text
    const passportData = extractBasicPassportData(ocrText);

    // Return both the raw OCR text and structured data
    return res.status(200).json({
      success: true,
      ocrText,
      passportData
    });
  } catch (error) {
    console.error('Error in processPassportImage:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during OCR processing'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`OCR API server running on port ${port}`);
});
