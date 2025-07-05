/**
 * OCR Controller
 * 
 * Handles API requests for OCR processing
 */

import { performOCR } from './visionService.js';
import { extractPassportData } from '../utils/passportOCR.js';

/**
 * Process an image for passport OCR
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function processPassportImage(req, res) {
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
    const passportData = extractPassportData(ocrText);

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
}
