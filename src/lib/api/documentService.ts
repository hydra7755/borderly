import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';
import userProfileService from './userProfile';

// Mock storage for development
const mockStorage = {
  documents: new Map<string, Blob>(),
  
  // Store a blob and return a URL
  storeBlob(userId: string, file: File, path: string): string {
    const key = `${userId}/${path}`;
    this.documents.set(key, file);
    return URL.createObjectURL(file);
  },
  
  // Delete a blob by URL
  deleteBlob(url: string): boolean {
    try {
      // Revoke the object URL
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('Error revoking URL:', e);
      return false;
    }
  }
};

// Define interface for bucket info
interface StorageBucket {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
}

// Function to ensure the storage bucket exists 
const ensureStorageBucketsExist = () => {
  try {
    // For simplicity, we'll assume the buckets exist or will be created by Supabase automatically
    // This avoids complex type issues with the mock implementation
    console.log("Checking document storage buckets...");
    
    // In a real app with proper permissions, you would create them if they don't exist
    ['user-documents', 'trip-documents'].forEach(bucketName => {
      console.log(`Using bucket: ${bucketName}`);
    });
    
    return true;
  } catch (error) {
    console.error("Error checking storage buckets:", error);
    return false;
  }
};

// Init buckets
ensureStorageBucketsExist();

/**
 * Service for handling trip document operations
 */
export const documentService = {
  /**
   * Upload a document for a specific trip
   * @param tripId - ID of the trip
   * @param userId - ID of the user
   * @param file - File to upload
   * @returns Promise with the document data or error
   */
  async uploadDocument(tripId: string, userId: string, file: File) {
    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/trips/${tripId}/${fileName}`;
      
      // Upload file to storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('trip-documents')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }
      
      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from('trip-documents')
        .getPublicUrl(filePath);
        
      const publicUrl = urlData?.publicUrl;
      
      if (!publicUrl) {
        console.error("Failed to get public URL");
        throw new Error("Failed to get public URL for uploaded file");
      }
      
      // Store document reference in database - separate the insert and select operations
      const { error: insertError } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: tripId,
          user_id: userId,
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          url: publicUrl,
        });
      
      if (insertError) {
        console.error("Error saving document reference:", insertError);
        
        // Attempt to clean up the uploaded file
        await supabase.storage
          .from('trip-documents')
          .remove([filePath]);
          
        throw insertError;
      }
      
      // Get the inserted record
      const { data: docData, error: fetchError } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('file_path', filePath)
        .single();
        
      if (fetchError) {
        console.error("Error fetching inserted document:", fetchError);
      }
      
      return { document: docData || { 
        id: uuidv4(), // Fallback ID if query fails
        trip_id: tripId,
        user_id: userId,
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        url: publicUrl 
      }, error: null };
    } catch (error) {
      console.error("Document upload failed:", error);
      return { document: null, error };
    }
  },
  
  /**
   * Delete a document
   * @param documentId - ID of the document to delete
   * @param userId - ID of the user
   * @returns Promise with success status or error
   */
  async deleteDocument(documentId: string, userId: string) {
    try {
      // Get the document to find the file path
      const { data: document, error: fetchError } = await supabase
        .from('trip_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching document:", fetchError);
        throw fetchError;
      }
      
      if (!document) {
        throw new Error("Document not found");
      }
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('trip-documents')
        .remove([document.file_path]);
      
      if (storageError) {
        console.error("Error deleting file:", storageError);
        throw storageError;
      }
      
      // Delete document reference from database
      const { error: deleteError } = await supabase
        .from('trip_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error("Error deleting document reference:", deleteError);
        throw deleteError;
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error("Document deletion failed:", error);
      return { success: false, error };
    }
  },
  
  /**
   * Get all documents for a trip
   * @param tripId - ID of the trip
   * @param userId - ID of the user
   * @returns Promise with the documents or error
   */
  async getTripDocuments(tripId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', userId);
      
      if (error) {
        console.error("Error fetching trip documents:", error);
        throw error;
      }
      
      return { documents: data, error: null };
    } catch (error) {
      console.error("Failed to get trip documents:", error);
      return { documents: null, error };
    }
  },
  
  /**
   * Upload a user document (not related to a specific trip)
   * @param userId - ID of the user
   * @param file - File to upload
   * @param documentName - Custom name for the document (optional)
   * @param category - Document category (optional)
   * @returns Promise with the document data or error
   */
  async uploadUserDocument(userId: string, file: File, documentName?: string, category: string = 'General') {
    try {
      // 1. Define storage parameters
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const bucketName = 'user-documents'; // Create this bucket in Supabase

      console.log(`Uploading ${file.name} to ${bucketName}/${filePath}...`);

      // 2. Upload file to Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      const publicUrl = urlData?.publicUrl;
      
      if (!publicUrl) {
        console.error('Failed to get public URL');
        // Clean up the uploaded file
        await supabase.storage.from(bucketName).remove([filePath]);
        throw new Error('Failed to get public URL');
      }
      
      // 4. Create document object with the URL
      const newDocument = {
        id: uuidv4(),
        name: documentName || file.name,
        type: file.type.split('/').pop()?.toUpperCase() || fileExt?.toUpperCase() || 'FILE',
        url: publicUrl,
        uploaded: new Date().toISOString(),
        size: file.size,
        category
      };
      
      // 5. Get current user profile
      const { profile, error: profileError } = await userProfileService.getCurrentUserProfile();
      
      if (profileError) {
        console.error("Error getting user profile:", profileError);
        // Clean up
        await supabase.storage.from(bucketName).remove([filePath]);
        throw profileError;
      }
      
      // 6. Update profile with new document
      const currentDocs = profile?.saved_documents || [];
      const updatedDocs = [...currentDocs, newDocument];
      
      const { error: updateError } = await userProfileService.updateProfile({
        saved_documents: updatedDocs
      });
      
      if (updateError) {
        console.error("Error updating profile with document:", updateError);
        // Clean up
        await supabase.storage.from(bucketName).remove([filePath]);
        throw updateError;
      }
      
      console.log("Document uploaded successfully:", newDocument);
      return { document: newDocument, error: null };
      
    } catch (error) {
      console.error("Document upload failed:", error);
      return { document: null, error };
    }
  },
  
  /**
   * Delete a user document
   * @param documentId - ID of the document to delete
   * @returns Promise with success status or error
   */
  async deleteUserDocument(documentId: string) {
    try {
      // 1. Get user profile
      const { profile, error: profileError } = await userProfileService.getCurrentUserProfile();
      
      if (profileError) {
        console.error("Error getting user profile for document deletion:", profileError);
        throw profileError;
      }
      
      if (!profile?.saved_documents) {
        console.warn("No documents found in profile");
        return { success: true, error: null };
      }
      
      // 2. Find the document
      const docToDelete = profile.saved_documents.find((doc) => doc.id === documentId);
      
      if (!docToDelete) {
        console.warn(`Document ${documentId} not found, nothing to delete`);
        return { success: true, error: null };
      }
      
      // 3. Attempt to delete from storage if URL exists
      if (docToDelete.url) {
        try {
          // Extract filename from URL
          // URL format should be https://[supabase-project].supabase.co/storage/v1/object/public/user-documents/[userId]/[filename]
          const urlObj = new URL(docToDelete.url);
          const pathParts = urlObj.pathname.split('/');
          const filename = pathParts[pathParts.length - 1];
          const userId = pathParts[pathParts.length - 2];
          
          if (userId && filename) {
            const filePath = `${userId}/${filename}`;
            const bucketName = 'user-documents';
            
            console.log(`Deleting file from storage: ${bucketName}/${filePath}`);
            
            await supabase.storage
              .from(bucketName)
              .remove([filePath]);
          }
        } catch (storageError) {
          // Log but continue - we still want to remove from profile
          console.error("Could not delete file from storage:", storageError);
        }
      }
      
      // 4. Update profile by filtering out the deleted document
      const updatedDocs = profile.saved_documents.filter((doc) => doc.id !== documentId);
      
      const { error: updateError } = await userProfileService.updateProfile({
        saved_documents: updatedDocs
      });
      
      if (updateError) {
        console.error("Error updating profile after document deletion:", updateError);
        throw updateError;
      }
      
      console.log("Document deleted successfully:", documentId);
      return { success: true, error: null };
      
    } catch (error) {
      console.error("Document deletion failed:", error);
      return { success: false, error };
    }
  },
  
  /**
   * Get all documents for a user
   * @returns Promise with the documents or error
   */
  async getUserDocuments() {
    try {
      // Get current user profile
      const { profile, error: profileError } = await userProfileService.getCurrentUserProfile();
      
      if (profileError) {
        console.error("Error getting user profile for documents:", profileError);
        throw profileError;
      }
      
      return { documents: profile?.saved_documents || [], error: null };
    } catch (error) {
      console.error("Failed to get user documents:", error);
      return { documents: [], error };
    }
  }
};

export default documentService; 