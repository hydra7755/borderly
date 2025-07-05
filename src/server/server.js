/**
 * Express server for handling OCR API requests
 */

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { processPassportImage } from './ocrController.js';
import path from 'path';

// Load environment variables
dotenv.config();

// Set up Express app
const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

// Configure multer for memory storage (files stored as buffers)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Define API routes
app.post('/api/ocr/passport', upload.single('image'), processPassportImage);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'OCR service is running' });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Face Detection API endpoint (simple mock implementation)
app.post('/api/face-detection', (req, res) => {
  try {
    // Get image data from request
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        error: 'No image provided',
        hasFace: false
      });
    }
    
    // In a real implementation, you would process the image
    // For now, just return a success response
    console.log('Face detection request received');
    
    // Mock success response
    return res.json({
      hasFace: true,
      multipleFaces: false,
      faceAttributes: {
        confidence: 0.95,
        headwear: false,
        blurred: false,
        underExposed: false,
        overExposed: false
      }
    });
    
  } catch (error) {
    console.error('Error in face detection:', error);
    return res.status(500).json({
      error: 'Face detection failed',
      details: error.message,
      hasFace: false
    });
  }
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`OCR API server running on port ${port}`);
  console.log(`Visit: http://localhost:${port}`);
});

export default app;
