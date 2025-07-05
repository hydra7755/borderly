import supabase from '../supabase/client';
import { VisaApplication } from '../../types/visa';

/**
 * Service to handle visa application operations
 */
const visaApplicationsService = {
  /**
   * Get all visa applications for a specific user
   * @param userId - The user ID
   * @returns Promise with the applications or error
   */
  async getUserApplications(userId: string): Promise<{ 
    applications: VisaApplication[] | null; 
    error: Error | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('visa_applications')
        .select('*')
        .eq('user_id', userId)
        .order('application_date', { ascending: false });

      if (error) {
        console.error('Error fetching visa applications:', error);
        return { applications: null, error };
      }

      return { applications: data as VisaApplication[], error: null };
    } catch (error) {
      console.error('Unexpected error fetching visa applications:', error);
      return { applications: null, error: error as Error };
    }
  },

  /**
   * Get a specific visa application
   * @param applicationId - The application ID
   * @returns Promise with the application or error
   */
  async getApplicationById(applicationId: string): Promise<{ 
    application: VisaApplication | null; 
    error: Error | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('visa_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) {
        console.error('Error fetching visa application:', error);
        return { application: null, error };
      }

      return { application: data as VisaApplication, error: null };
    } catch (error) {
      console.error('Unexpected error fetching visa application:', error);
      return { application: null, error: error as Error };
    }
  },

  /**
   * Update the status of a visa application
   * @param applicationId - The application ID
   * @param status - The new status
   * @returns Promise with the updated application or error
   */
  async updateApplicationStatus(
    applicationId: string, 
    status: 'submitted' | 'in_review' | 'approved' | 'rejected'
  ): Promise<{ 
    success: boolean; 
    error: Error | null 
  }> {
    try {
      const { error } = await supabase
        .from('visa_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating visa application status:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error updating visa application status:', error);
      return { success: false, error: error as Error };
    }
  },

  /**
   * Upload a visa document for an approved application
   * @param applicationId - The application ID
   * @param document - The visa document file
   * @returns Promise with the upload status or error
   */
  async uploadVisaDocument(applicationId: string, document: File): Promise<{ 
    url: string | null; 
    error: Error | null 
  }> {
    try {
      // Create a file path for the visa document
      const filePath = `visa_documents/${applicationId}/${document.name}`;
      
      // Upload the document
      const { error: uploadError } = await supabase.storage
        .from('visa_documents')
        .upload(filePath, document);

      if (uploadError) {
        console.error('Error uploading visa document:', uploadError);
        return { url: null, error: uploadError };
      }

      // Get the public URL for the uploaded document
      const { data } = supabase.storage
        .from('visa_documents')
        .getPublicUrl(filePath);

      // Update the application to include the document URL
      const { error: updateError } = await supabase
        .from('visa_applications')
        .update({ 
          visa_document_url: data.publicUrl,
          approval_date: new Date().toISOString() 
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating visa application with document URL:', updateError);
        return { url: null, error: updateError };
      }

      return { url: data.publicUrl, error: null };
    } catch (error) {
      console.error('Unexpected error uploading visa document:', error);
      return { url: null, error: error as Error };
    }
  },

  /**
   * Download a visa document
   * @param url - The visa document URL
   * @returns Promise with the download status or error
   */
  async downloadVisaDocument(url: string): Promise<{ 
    success: boolean; 
    error: Error | null 
  }> {
    try {
      // Create an anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = url.split('/').pop() || 'visa-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error downloading visa document:', error);
      return { success: false, error: error as Error };
    }
  }
};

export default visaApplicationsService; 