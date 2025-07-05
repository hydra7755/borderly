import { ImageAnnotatorClient } from '@google-cloud/vision';
import type { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'HEAD'],
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5177'
});

// Helper method to run middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Initialize the client with credentials from environment variable
const client = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Run the CORS middleware
    await runMiddleware(req, res, cors);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image, 'base64');

    // Perform face detection
    const [result] = await client.faceDetection({
      image: {
        content: imageBuffer
      }
    });

    const faces = result.faceAnnotations || [];
    
    if (faces.length === 0) {
      return res.status(200).json({ 
        hasFace: false,
        multipleFaces: false,
        faceAttributes: null
      });
    }

    // Check if there are multiple faces
    if (faces.length > 1) {
      return res.status(200).json({
        hasFace: true,
        multipleFaces: true,
        faceAttributes: null
      });
    }

    // Get the first (and only) face
    const face = faces[0];

    // Extract relevant attributes
    const faceAttributes = {
      confidence: face.detectionConfidence || 0,
      headwear: face.headwearLikelihood === 'LIKELY' || face.headwearLikelihood === 'VERY_LIKELY',
      blurred: face.blurredLikelihood === 'LIKELY' || face.blurredLikelihood === 'VERY_LIKELY',
      underExposed: face.underExposedLikelihood === 'LIKELY' || face.underExposedLikelihood === 'VERY_LIKELY',
      // Check lighting using underExposedLikelihood
      overExposed: face.underExposedLikelihood === 'UNLIKELY' || face.underExposedLikelihood === 'VERY_UNLIKELY'
    };

    return res.status(200).json({
      hasFace: true,
      multipleFaces: false,
      faceAttributes
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ error: 'Failed to process image' });
  }
} 