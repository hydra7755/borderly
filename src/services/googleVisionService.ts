import axios from 'axios';

/**
 * Service for interacting with Google Cloud Vision API
 * Note: This is a client-side implementation that requires a backend proxy
 * In a production environment, you should handle this on the server side
 */
export class GoogleVisionService {
  private apiKey: string;
  private apiEndpoint: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';
  }
  
  /**
   * Analyze a passport image using Google Cloud Vision OCR
   * @param imageBase64 Base64 encoded image data
   * @returns Extracted text and document data
   */
  async analyzePassport(imageBase64: string): Promise<any> {
    try {
      // Remove data URL prefix if present
      const base64Image = imageBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
      
      // Prepare the request payload
      const requestData = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      };
      
      // Make the API request
      const response = await axios.post(
        `${this.apiEndpoint}?key=${this.apiKey}`,
        requestData
      );
      
      // Process and return the results
      return this.processPassportData(response.data);
    } catch (error) {
      console.error('Error analyzing passport with Google Vision API:', error);
      throw error;
    }
  }
  
  /**
   * Process the raw OCR data to extract structured passport information
   * @param visionResponse Raw response from Google Vision API
   * @returns Structured passport data
   */
  private processPassportData(visionResponse: any): any {
    try {
      // Extract full text from the response
      const textAnnotations = visionResponse.responses[0]?.textAnnotations || [];
      const fullText = textAnnotations[0]?.description || '';
      
      // Parse the text to extract passport information
      const passportData = {
        fullText,
        parsedData: this.parsePassportText(fullText)
      };
      
      return passportData;
    } catch (error) {
      console.error('Error processing passport data:', error);
      return { error: 'Failed to process passport data' };
    }
  }
  
  /**
   * Parse the extracted text to identify passport fields
   * @param text Full text extracted from the passport
   * @returns Structured passport information
   */
  private parsePassportText(text: string): any {
    // Initialize passport data object
    const passportData: any = {};
    
    // Split text into lines for processing
    const lines = text.split('\n');
    
    // Regular expressions for common passport fields
    const patterns = {
      passportNumber: /passport no[.:]\s*([A-Z0-9]+)/i,
      surname: /surname[.:]\s*([A-Za-z\s-]+)/i,
      givenNames: /given names[.:]\s*([A-Za-z\s-]+)/i,
      nationality: /nationality[.:]\s*([A-Za-z\s-]+)/i,
      birthDate: /(birth date|date of birth|dob)[.:]\s*(\d{1,2}\s*[A-Za-z]{3}\s*\d{4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
      gender: /sex[.:]\s*([MF])/i,
      expiryDate: /(expiry date|date of expiry)[.:]\s*(\d{1,2}\s*[A-Za-z]{3}\s*\d{4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
      issueDate: /(date of issue)[.:]\s*(\d{1,2}\s*[A-Za-z]{3}\s*\d{4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
      placeOfBirth: /(place of birth)[.:]\s*([A-Za-z\s-]+)/i,
      authority: /(authority|issuing authority)[.:]\s*([A-Za-z\s-]+)/i,
      // MRZ (Machine Readable Zone) pattern - simplified
      mrz: /([A-Z0-9<]{44})\n([A-Z0-9<]{44})/
    };
    
    // Check each line against the patterns
    for (const line of lines) {
      // Try to match each pattern
      for (const [field, pattern] of Object.entries(patterns)) {
        if (field === 'mrz') continue; // Handle MRZ separately
        
        const match = line.match(pattern);
        if (match && match[1]) {
          passportData[field] = match[1].trim();
        }
      }
    }
    
    // Try to extract MRZ from the full text
    const mrzMatch = text.match(patterns.mrz);
    if (mrzMatch) {
      passportData.mrz = {
        line1: mrzMatch[1],
        line2: mrzMatch[2]
      };
      
      // Extract additional data from MRZ if available
      if (!passportData.passportNumber) {
        // Passport number is typically in positions 1-9 of the second line
        passportData.passportNumber = mrzMatch[2].substring(0, 9).replace(/</g, '');
      }
    }
    
    return passportData;
  }
}

// Create and export a singleton instance
// Note: In a real application, you would get the API key from environment variables
// For demo purposes, we're using a placeholder
const apiKey = 'YOUR_GOOGLE_CLOUD_VISION_API_KEY';
export const googleVisionService = new GoogleVisionService(apiKey);

export default googleVisionService;
