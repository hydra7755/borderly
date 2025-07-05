# OCR Services Setup Guide

This guide explains how to properly set up and configure the OCR services for the TravelScore application.

## Overview

The TravelScore application uses a tiered approach to OCR (Optical Character Recognition) for passport scanning:

1. **Google Cloud Vision API** (Primary service)
2. **Local OCR Server** (Secondary service)
3. **Tesseract.js** (Fallback service)

The system automatically falls back to the next service in the hierarchy if the previous one is unavailable.

## Quick Setup

For the fastest setup, follow these steps:

1. Start the local OCR server:
   ```
   npm run ocr-server
   ```

2. In a separate terminal, start the application:
   ```
   npm run dev
   ```

3. Access the application at http://localhost:5173 (or whatever port Vite assigns)

## Detailed Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
# Google Cloud Vision API Configuration
REACT_APP_GOOGLE_CLOUD_VISION_ENABLED=true
REACT_APP_GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
VITE_GOOGLE_CLOUD_VISION_ENABLED=true
VITE_GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here

# API Base URL - Local OCR server endpoint
REACT_APP_API_BASE_URL=http://localhost:5175/api
VITE_API_BASE_URL=http://localhost:5175/api
VITE_OCR_API_URL=http://localhost:5175/api

# Port for local OCR server
PORT=5175
```

### Google Cloud Vision API Setup

1. Create a Google Cloud project
2. Enable the Vision API
3. Create an API key
4. Add the API key to your `.env.local` file

For detailed instructions, see [Google Cloud Vision API Setup](./SETUP_GOOGLE_VISION.md).

### Local OCR Server Setup

The local OCR server is built with Express and uses Tesseract.js for OCR processing.

1. Install dependencies:
   ```
   npm install express cors multer tesseract.js
   ```

2. Start the server:
   ```
   npm run ocr-server
   ```

3. Verify the server is running by accessing:
   http://localhost:5175/api/health

### Tesseract.js Fallback

Tesseract.js is used as a fallback when other services are unavailable:

1. Install Tesseract.js:
   ```
   npm install tesseract.js @types/tesseract.js
   ```

2. The application will automatically use Tesseract.js if other services fail.

## Troubleshooting

### 404 Not Found Errors

If you see a 404 error when accessing the OCR API:

1. Make sure the OCR server is running (`npm run ocr-server`)
2. Check that the API URL in your `.env.local` file matches the port where the server is running
3. Verify that you're using the correct API endpoint path (`/api/passport-ocr`)

### Import Error for Tesseract.js

If you see an error like "Failed to resolve import 'tesseract.js'":

1. Make sure Tesseract.js is installed:
   ```
   npm install tesseract.js @types/tesseract.js
   ```
2. Restart the development server (`npm run dev`)

### Google Cloud Vision API Not Working

If the Google Cloud Vision API is not working:

1. Check that you've properly set up your API key in the `.env.local` file
2. Verify that the API is enabled in your Google Cloud Console
3. Check if there are any billing issues with your Google Cloud account

### General Issues

If you're still having problems:

1. Check browser console for detailed error messages
2. Verify that all environment variables are correctly set
3. Restart both the OCR server and the development server
4. Clear your browser cache

## Testing

To test if your OCR setup is working correctly:

1. Start both the OCR server and the application
2. Navigate to the passport scan page
3. Upload a test passport image
4. Check the browser console for logs showing which OCR service is being used
5. Verify that the extracted data is shown on the screen

## References

- [Tesseract.js Documentation](https://github.com/naptha/tesseract.js)
- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [Express.js Documentation](https://expressjs.com/) 