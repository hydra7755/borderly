# OCR Issues Fix Guide

This guide will help you resolve issues with the OCR service in the TravelScore application.

## Common Error: "OCR service unavailable. Unable to process passport image."

If you're seeing this error, the following steps will help you fix it:

## Quick Fix Steps

1. **Reset OCR Server**

   ```bash
   npm run reset-ocr
   ```

   This command will kill any existing OCR server processes and start a fresh one.

2. **Restart Frontend (in a separate terminal)**

   ```bash
   npm run dev
   ```

3. **Test OCR API**

   ```bash
   npm run test-ocr-api
   ```

   This will test if the OCR API is responding properly.

4. **Try Using the Application**

   Visit the application in your browser and try scanning a passport again.

## Testing Tools

We've added several tools to help diagnose OCR issues:

1. **Browser Test Page**

   Open `http://localhost:5179/test-ocr.html` in your browser to test the OCR API directly.

2. **API Health Check**

   Check if the OCR API health endpoint is working:

   ```bash
   curl http://localhost:5175/api/health
   ```

3. **Test OCR in Browser**

   The application now has a "Test OCR Service" button on the passport scan page that will check if the OCR service is available.

## Detailed Troubleshooting

If you're still having issues, follow these steps:

### 1. Verify Port and Service Configuration

Make sure port 5175 is available and not being used by another application. You can change the port in the `.env.local` file if needed:

```
PORT=5176
REACT_APP_API_BASE_URL=http://localhost:5176/api
VITE_API_BASE_URL=http://localhost:5176/api
VITE_OCR_API_URL=http://localhost:5176/api
```

Then restart both the OCR server and the frontend.

### 2. Check for Error Messages

Look at your terminal where the OCR server is running for any error messages. Common issues include:

- File permission problems in the uploads directory
- PORT already in use
- Missing dependencies

### 3. Reset Everything

If all else fails, you can try a complete reset:

1. Kill all node processes (Windows):
   ```
   taskkill /F /IM node.exe
   ```

2. Clear browser cache and reload the application

3. Run the setup script:
   ```
   npm run setup-ocr
   ```

4. Start the OCR server:
   ```
   npm run reset-ocr
   ```

5. Start the frontend:
   ```
   npm run dev
   ```

## Common Issues and Solutions

1. **"Failed to resolve import 'tesseract.js'"**
   - Run `npm install tesseract.js @types/tesseract.js`
   - Make sure a try/catch is used when importing Tesseract in the code

2. **"Address already in use"**
   - Another process is using port 5175. Use the reset-ocr script to kill it.

3. **404 Not Found for passport-ocr endpoint**
   - Make sure the OCR server is running on the correct port
   - Check that the API URLs in your code match the server port
   - Verify the server is properly serving the endpoints

4. **CORS errors**
   - The OCR server should have CORS enabled, check for any messages in the console log

## Conclusion

The OCR functionality involves multiple services working together. By following these steps, you should be able to get it working correctly. If you continue to have problems, please provide specific error messages and logs to help diagnose the issue. 