import supabase from '../supabase/client';
import { VisaApplication } from '../../types/visa';
import authService from './auth';
import { getCountryNameFromCode } from './visaRequirements';

export interface CreateVisaApplicationInput {
  nationalityCode: string;
  destinationCode: string;
  purposeOfVisit?: string;
  entryDate?: string;
  exitDate?: string;
  applicationData?: Record<string, unknown>;
  paymentStatus?: 'pending' | 'paid';
}

/**
 * Service to handle visa application operations
 */
function isMissingApplicationsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes('visa_applications') ||
    message.includes('does not exist') ||
    message.includes('could not find the table')
  );
}

function mapApplicationRow(row: Record<string, unknown>): VisaApplication {
  const destinationCode = (row.destination_code as string) || (row.destination_id as string) || '';

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    destination_id: destinationCode,
    destination_code: destinationCode,
    destination_name: row.destination_name as string | undefined,
    nationality_code: row.nationality_code as string | undefined,
    status: (row.status as VisaApplication['status']) || 'submitted',
    application_date: (row.application_date as string) || (row.created_at as string),
    documents_uploaded: Boolean(row.documents_uploaded),
    payment_status: (row.payment_status as VisaApplication['payment_status']) || 'pending',
    approval_date: row.approval_date as string | undefined,
    visa_document_url: row.visa_document_url as string | undefined,
    purpose_of_visit: row.purpose_of_visit as string | undefined,
    entry_date: row.entry_date as string | undefined,
    exit_date: row.exit_date as string | undefined,
  };
}

const visaApplicationsService = {
  async createApplication(
    input: CreateVisaApplicationInput
  ): Promise<{ application: VisaApplication | null; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        return { application: null, error: authError || new Error('Not authenticated') };
      }

      const destinationName = getCountryNameFromCode(input.destinationCode);

      const { data, error } = await supabase
        .from('visa_applications')
        .insert({
          user_id: user.id,
          nationality_code: input.nationalityCode.toLowerCase(),
          destination_code: input.destinationCode.toLowerCase(),
          destination_name: destinationName,
          purpose_of_visit: input.purposeOfVisit ?? null,
          entry_date: input.entryDate ?? null,
          exit_date: input.exitDate ?? null,
          application_data: input.applicationData ?? null,
          payment_status: input.paymentStatus ?? 'pending',
          status: 'submitted',
          documents_uploaded: Boolean(input.applicationData),
        })
        .select()
        .single();

      if (error || !data) {
        return { application: null, error: error ?? new Error('Failed to create application') };
      }

      return { application: data as VisaApplication, error: null };
    } catch (error) {
      return { application: null, error: error as Error };
    }
  },

  async markPaymentPaid(
    applicationId: string,
    transactionId?: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('visa_applications')
        .update({
          payment_status: 'paid',
          status: 'processing',
          transaction_id: transactionId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      return { success: !error, error: error ?? null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

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
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingApplicationsTable(error)) {
          console.warn('visa_applications table not available yet — showing empty list');
          return { applications: [], error: null };
        }
        console.error('Error fetching visa applications:', error);
        return { applications: null, error };
      }

      const applications = (data ?? []).map((row) => mapApplicationRow(row as Record<string, unknown>));
      return { applications, error: null };
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