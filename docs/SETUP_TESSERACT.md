# Setting Up Tesseract.js for Fallback OCR

This guide explains how to set up Tesseract.js as a fallback OCR service for passport scanning in the Borderly application.

## Overview

Tesseract.js is a pure JavaScript port of the Tesseract OCR engine. It allows us to perform OCR operations directly in the browser without requiring a server-side component. This is used as a fallback when Google Cloud Vision API or your local OCR server is unavailable.

## Step 1: Install Dependencies

The Tesseract.js library and its TypeScript definitions should be installed as dependencies:

```bash
npm install tesseract.js @types/tesseract.js
```

## Step 2: Verify Installation

Ensure that Tesseract.js was correctly installed by checking:

1. The `node_modules/tesseract.js` directory exists
2. The `package.json` contains the Tesseract.js dependency

## Step 3: Configuration

No specific configuration is needed for Tesseract.js to work as a fallback. The system will automatically fall back to Tesseract.js if:

1. Google Cloud Vision API is not configured or fails
2. The local OCR server is not available or fails

## Step 4: Language Support (Optional)

By default, the application uses the English language data for Tesseract.js. If you need additional languages:

1. Update the `processWithTesseract` function in `src/services/ocrService.ts` to include additional languages:

```javascript
const result = await Tesseract.recognize(
  imageUrl,
  'eng+fra+deu', // English + French + German
  { 
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  }
);
```

## Step 5: Performance Considerations

Tesseract.js runs entirely in the browser, which has some implications:

1. **Processing Time**: OCR operations may take longer compared to server-side solutions
2. **Memory Usage**: OCR processing can be memory-intensive
3. **Device Compatibility**: May not perform well on older or less powerful devices

Consider showing a loading indicator and informing users that processing might take a bit longer when using the client-side OCR.

## Troubleshooting

Common issues when using Tesseract.js:

1. **Import Errors**: If you see "Failed to resolve import 'tesseract.js'", check that the package is correctly installed and rebuild your application.

2. **Long Processing Times**: If OCR takes too long, consider:
   - Using smaller images
   - Implementing a timeout mechanism
   - Showing more detailed progress information to users

3. **Low Accuracy**: If the OCR results are poor:
   - Encourage users to upload clearer, higher-resolution images
   - Adjust the image preprocessing in the `processWithTesseract` function
   - Consider using a different OCR engine for better results

## Resources

- [Tesseract.js Documentation](https://github.com/naptha/tesseract.js)
- [Tesseract.js Examples](https://github.com/naptha/tesseract.js-examples) 