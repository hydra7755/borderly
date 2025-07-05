# OCR Troubleshooting Guide

If you're experiencing issues with the passport OCR functionality, follow this troubleshooting guide to identify and fix common problems.

## Common Error Messages and Solutions

### "OCR service endpoint not found. Please ensure the OCR server is running."

This error indicates that the frontend application cannot connect to the OCR server. 

**Solution:**

1. Make sure the OCR server is running by executing either:
   ```
   npm run start-ocr
   ```
   Or the standard command:
   ```
   npm run ocr-server
   ```

2. Verify that the server is running on port 5175. You can check if it's running by visiting:
   ```
   http://localhost:5175/api/health
   ```
   
3. If the server is running but you still get this error, ensure your .env.local file has the correct API URLs:
   ```
   REACT_APP_API_BASE_URL=http://localhost:5175/api
   VITE_API_BASE_URL=http://localhost:5175/api
   VITE_OCR_API_URL=http://localhost:5175/api
   ```

### "No OCR service available. Google Cloud Vision failed, local OCR failed, and Tesseract.js is not available."

This error means that none of the OCR services are available.

**Solution:**

1. Run the OCR setup script to install all necessary dependencies:
   ```
   npm run setup-ocr
   ```

2. Ensure Tesseract.js is properly installed:
   ```
   npm install tesseract.js @types/tesseract.js
   ```

3. Restart both the OCR server and the frontend application.

### "Failed to resolve import 'tesseract.js' from 'src/services/ocrService.ts'"

This error indicates an issue with the Tesseract.js installation.

**Solution:**

1. Make sure Tesseract.js is installed:
   ```
   npm install tesseract.js
   npm install @types/tesseract.js --save-dev
   ```

2. Restart the development server:
   ```
   npm run dev
   ```

## Step-by-Step Diagnosis

If you're still experiencing issues, follow these steps to diagnose and fix the problem:

1. **Check Console Logs**: Open the browser developer tools (F12) and check the console for detailed error messages.

2. **Verify OCR Server Status**: Ensure the OCR server is running and accessible:
   ```
   curl http://localhost:5175/api/health
   ```

3. **Test File Upload**: Try uploading a simple passport image directly to the OCR server:
   ```
   curl -X POST -F "file=@/path/to/your/passport.jpg" http://localhost:5175/api/passport-ocr
   ```

4. **Check Network Requests**: In the browser developer tools, go to the Network tab and examine the requests to the OCR API. Look for any failed requests or error responses.

5. **Restart Everything**: Sometimes a clean restart solves most issues:
   ```
   # Stop any running processes
   # Then start the OCR server
   npm run start-ocr
   
   # In a new terminal, start the frontend
   npm run dev
   ```

## Advanced Troubleshooting

If the basic troubleshooting steps don't resolve your issue, try these advanced solutions:

### Port Conflicts

If port 5175 is already in use, you can change the port:

1. Update the PORT in .env.local:
   ```
   PORT=5176
   ```

2. Update the API URLs in .env.local:
   ```
   REACT_APP_API_BASE_URL=http://localhost:5176/api
   VITE_API_BASE_URL=http://localhost:5176/api
   VITE_OCR_API_URL=http://localhost:5176/api
   ```

3. Run `npm run generate-env` to update the environment config
4. Restart both the OCR server and the frontend application

### CORS Issues

If you're getting CORS errors, ensure the OCR server's CORS settings are correct:

1. Check that the CORS middleware in src/server/passport-ocr-server.cjs includes:
   ```javascript
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

### Debug Mode

To get more detailed logs:

1. Set the log level to debug in the OCR server:
   ```javascript
   // Add near the top of the passport-ocr-server.cjs file
   const DEBUG = true;
   
   // Then use throughout the code:
   if (DEBUG) console.log('Detailed information:', someData);
   ```

## Still Having Issues?

If you've tried all the above solutions and are still experiencing problems:

1. Try using a different passport image - ensure it's clear, well-lit, and focused
2. Ensure all OS updates and Node.js updates are installed
3. Try clearing your browser cache
4. Make sure you have enough disk space for the uploaded files

The most reliable way to use the OCR functionality is to:

1. Run `npm run setup-ocr` to ensure all dependencies are correctly installed
2. Run `npm run start-ocr` in one terminal to start the OCR server
3. Run `npm run dev` in another terminal to start the frontend
4. Upload a high-quality passport image for processing 