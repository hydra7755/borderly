import { supabase } from '../lib/supabase/client';
import { googleVisionService } from '../services/googleVisionService';

/**
 * API for handling OCR-related operations
 */
export class OcrApi {
  /**
   * Process a passport image using Google Cloud Vision API
   * @param imageBase64 Base64 encoded image data
   * @param userId User ID for storing the results
   * @returns Processed passport data
   */
  async processPassport(imageBase64: string, userId: string): Promise<any> {
    try {
      // Call Google Vision API to analyze the passport
      const ocrResult = await googleVisionService.analyzePassport(imageBase64);
      
      // Store the OCR result in Supabase
      if (ocrResult && !ocrResult.error) {
        await this.storePassportData(userId, ocrResult);
      }
      
      return ocrResult;
    } catch (error) {
      console.error('Error processing passport:', error);
      return { error: 'Failed to process passport' };
    }
  }
  
  /**
   * Store the processed passport data in Supabase
   * @param userId User ID
   * @param passportData Processed passport data
   */
  private async storePassportData(userId: string, passportData: any): Promise<void> {
    try {
      // Check if user already has passport data
      const { data: existingData } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', 'passport')
        .single();
      
      const documentData = {
        user_id: userId,
        document_type: 'passport',
        document_data: passportData.parsedData,
        raw_text: passportData.fullText,
        status: 'verified',
        updated_at: new Date().toISOString()
      };
      
      if (existingData) {
        // Update existing record
        await supabase
          .from('user_documents')
          .update(documentData)
          .eq('id', existingData.id);
      } else {
        // Insert new record
        await supabase
          .from('user_documents')
          .insert({
            ...documentData,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error storing passport data:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const ocrApi = new OcrApi();

export default ocrApi;
