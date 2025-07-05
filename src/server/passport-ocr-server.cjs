// src/server/passport-ocr-server.cjs
// This is a simple Express server to handle passport OCR for local development
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

// Configure middleware - enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Allow JSON with increased limit for large requests
app.use(express.json({ limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'passport-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB size limit
});

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check received');
  res.status(200).json({ 
    status: 'healthy', 
    message: 'OCR service is operational',
    timestamp: new Date().toISOString(),
    server: 'passport-ocr-server.cjs',
    routes: [
      { method: 'GET', path: '/api/health', description: 'Health check endpoint' },
      { method: 'POST', path: '/api/passport-ocr', description: 'OCR processing endpoint' }
    ]
  });
});

// Passport OCR endpoint
app.post('/api/passport-ocr', upload.single('file'), async (req, res) => {
  try {
    console.log('Passport OCR request received');
    
    // Check if file was provided
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`Processing file: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log(`File saved to: ${req.file.path}`);
    
    // Use Tesseract.js to perform OCR
    try {
      const worker = await createWorker('eng');
      console.log(`Starting OCR processing of ${req.file.path}`);
      
      const { data } = await worker.recognize(req.file.path);
      await worker.terminate();
      
      // Log a sample of the recognized text (first 100 chars)
      const sampleText = data.text.substring(0, 100).replace(/\n/g, ' ');
      console.log(`OCR completed. Text sample: ${sampleText}...`);
      
      // Clean up the uploaded file
      try {
        fs.unlinkSync(req.file.path);
        console.log(`Cleaned up temporary file: ${req.file.path}`);
      } catch (cleanupError) {
        console.error(`Failed to clean up file ${req.file.path}:`, cleanupError);
      }
      
      // Return the OCR result
      res.status(200).json({ 
        text: data.text,
        confidence: data.confidence,
        source: 'mock-ocr-server'
      });
      
      console.log('OCR processing completed successfully');
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      
      // Try to clean up the file even on error
      try {
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up file on error:', cleanupError);
      }
      
      res.status(500).json({ 
        error: 'Failed to process passport OCR',
        message: ocrError.message
      });
    }
  } catch (error) {
    console.error('General error in passport OCR endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process passport OCR',
      message: error.message 
    });
  }
});

// Base route for testing
app.get('/', (req, res) => {
  res.status(200).send('OCR Server is running. Use /api/health to check service status.');
});

// Add a catch-all route at the end of all routes
app.use('*', (req, res) => {
  console.log(`Received request for unknown route: ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `The requested URL ${req.originalUrl} was not found on this server.`,
    availableRoutes: [
      { method: 'GET', path: '/api/health', description: 'Health check endpoint' },
      { method: 'POST', path: '/api/passport-ocr', description: 'OCR processing endpoint' }
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Passport OCR server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Passport OCR endpoint: http://localhost:${PORT}/api/passport-ocr`);
});

// Export the app for testing
module.exports = app; 