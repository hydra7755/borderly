const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create Express app
const app = express();
const PORT = process.env.PORT || 5175;

// Configure middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'passport-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB size limit
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check received');
  res.status(200).json({ status: 'healthy', message: 'OCR service is operational' });
});

// Passport OCR endpoint
app.post('/api/passport-ocr', upload.single('file'), async (req, res) => {
  try {
    // Check if file was provided
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`Processing file: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Use Tesseract.js to perform OCR
    const worker = await createWorker('eng');
    const filePath = req.file.path;
    
    console.log(`Starting OCR processing of ${filePath}`);
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    // Return the OCR result
    res.status(200).json({ 
      text: data.text,
      confidence: data.confidence,
      source: 'mock-ocr-server'
    });
    
    console.log('OCR processing completed successfully');
  } catch (error) {
    console.error('Error processing passport OCR:', error);
    res.status(500).json({ 
      error: 'Failed to process passport OCR',
      message: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Passport OCR server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Passport OCR endpoint: http://localhost:${PORT}/api/passport-ocr`);
});

// Export the app for testing
module.exports = app; 