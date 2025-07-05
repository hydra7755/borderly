/**
 * Google Cloud Vision API service for OCR processing
 * 
 * This service handles passport image OCR using Google Cloud Vision API
 */

import vision from '@google-cloud/vision';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

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

// Create a client
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

/**
 * Performs OCR on an image using Google Cloud Vision API
 * 
 * @param {Buffer} imageBuffer - The image buffer to process
 * @returns {Promise<string>} - The extracted text from the image
 */
export async function performOCR(imageBuffer) {
  try {
    console.log('Starting OCR processing with Google Cloud Vision API...');
    
    // Perform text detection on the image
    const [result] = await client.textDetection(imageBuffer);
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

export { performOCR };
