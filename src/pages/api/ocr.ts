import { ImageAnnotatorClient } from '@google-cloud/vision';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize the client with credentials from environment variable
const client = new ImageAnnotatorClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image, 'base64');

    // Perform OCR
    const [result] = await client.textDetection({
      image: {
        content: imageBuffer
      }
    });

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return res.status(400).json({ error: 'No text detected in image' });
    }

    // The first annotation contains the entire text
    const fullText = detections[0].description;

    return res.status(200).json({ text: fullText });
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ error: 'Failed to process image' });
  }
} 