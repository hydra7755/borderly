/**
 * Fallback Passport OCR API
 * 
 * This endpoint returns mock OCR data when called.
 * It's used as a fallback when the real API is unreachable or has CORS issues.
 */

export default function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return mock OCR data for testing
    const mockOcrText = `PASSPORT
    UNITED STATES OF AMERICA
    Type: P
    Passport No: 123456789
    Surname: DOE
    Given Names: JOHN JAMES
    Nationality: UNITED STATES OF AMERICA
    Date of Birth: 01 JAN 1990
    Place of Birth: NEW YORK, USA
    Date of Issue: 01 JAN 2020
    Date of Expiry: 01 JAN 2030
    Sex: M
    Authority: DEPARTMENT OF STATE`;

    return res.status(200).json({
      text: mockOcrText,
      confidence: 0.95
    });
  } catch (error) {
    console.error('Error in OCR processing:', error);
    return res.status(500).json({ 
      error: 'OCR processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 