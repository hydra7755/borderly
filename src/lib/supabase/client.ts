import { createClient } from '@supabase/supabase-js';

// Define environment variables type
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Get environment variables and ensure they're properly formatted
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean the keys in case there are newlines or extra spaces
const cleanedSupabaseUrl = supabaseUrl.trim();
const cleanedSupabaseAnonKey = supabaseAnonKey.trim().replace(/\r?\n|\r/g, '');

// Log connection details for debugging (remove in production)
console.log('Supabase URL:', cleanedSupabaseUrl);
console.log('Supabase Key Length:', cleanedSupabaseAnonKey.length);

if (!cleanedSupabaseUrl || !cleanedSupabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a mock Supabase client for development
const createMockClient = () => {
  console.log("Creating mock Supabase client for development");
  
  const mockData: { [key: string]: { [id: string]: any } } = {
    profiles: {}
  };
  
  // Load any existing data from localStorage
  const localStorageKey = 'travelscore_mock_db';
  const savedData = localStorage.getItem(localStorageKey);
  if (savedData) {
    try {
      Object.assign(mockData, JSON.parse(savedData));
    } catch (e) {
      console.error("Error loading mock data from localStorage:", e);
    }
  }
  
  // Save mock data to localStorage
  const saveMockData = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(mockData));
  };
  
  return {
    from: (table: string) => {
      // Initialize table if it doesn't exist
      if (!mockData[table]) {
        mockData[table] = {};
      }
      
      return {
        select: (columns = '*', options?: { count?: 'exact' }) => {
          let filteredData = Object.values(mockData[table]);
          let equalsFilter: { column: string; value: any } | null = null;
          let count: number | null = null;

          if (options?.count === 'exact') {
            // If count is requested, calculate it
            count = filteredData.length;
            // Return structure for count query
            return Promise.resolve({ data: [{ count }], error: null });
          }

          const queryBuilder = {
            eq: (column: string, value: any) => {
              equalsFilter = { column, value };
              // Filter data based on eq
              filteredData = filteredData.filter((item: any) => item[equalsFilter!.column] === equalsFilter!.value);
              return queryBuilder; // Allow chaining further filters if needed
            },
            single: () => {
              const result = filteredData.length > 0 ? filteredData[0] : null;
              return Promise.resolve({
                data: result,
                error: result ? null : new Error('No matching record found')
              });
            },
            // Add a default promise resolution that returns multiple items
            then: (resolve: (value: { data: any[] | null; error: Error | null }) => void) => {
              resolve({ data: filteredData, error: null });
            }
          };
          // Return the builder for chaining or direct resolution
          // Wrap in a way that it can be awaited directly or chained
          return { 
            ...queryBuilder, 
            // Default resolution returning multiple items if not ended with .single()
            then: (resolve: (value: { data: any[] | null; error: Error | null }) => void) => resolve({ data: filteredData, error: null }) 
          } as any; // Using 'as any' here to simplify complex mock typing
        },
        update: (data: { [key: string]: any }) => {
          let equalsFilter: { column: string; value: any } | null = null;
          
          return {
            eq: (column: string, value: any) => {
              equalsFilter = { column, value };
              return {
                select: () => {
                  const targetIndex = Object.values(mockData[table]).findIndex(
                    (item: any) => item[equalsFilter!.column] === equalsFilter!.value
                  );
                  
                  if (targetIndex >= 0) {
                    // Update existing record
                    const targetKey = Object.keys(mockData[table])[targetIndex];
                    const updatedItem = {
                      ...mockData[table][targetKey],
                      ...data
                    };
                    mockData[table][targetKey] = updatedItem;
                    saveMockData();
                    
                    return {
                      single: () => Promise.resolve({
                        data: updatedItem,
                        error: null
                      })
                    };
                  } else {
                    // Record not found
                    return {
                      single: () => Promise.resolve({
                        data: null,
                        error: new Error('Record not found')
                      })
                    };
                  }
                }
              };
            }
          };
        },
        insert: (data: { [key: string]: any }) => {
          // Simple insert implementation
          const id = data.id || `mock-${Date.now()}`;
          mockData[table][id] = { ...data, id };
          saveMockData();
          
          return Promise.resolve({
            data: mockData[table][id],
            error: null
          });
        },
        // Add delete method
        delete: () => {
          let equalsFilter: { column: string; value: any }[] = [];
          
          return {
            eq: (column: string, value: any) => {
              equalsFilter.push({ column, value });
              return {
                eq: (column: string, value: any) => {
                  equalsFilter.push({ column, value });
                  return {
                    then: (resolve: (value: { data: any; error: null }) => void) => {
                      // Filter records to delete
                      const keysToDelete: string[] = [];
                      
                      Object.entries(mockData[table]).forEach(([key, value]) => {
                        const shouldDelete = equalsFilter.every(filter => 
                          value[filter.column] === filter.value
                        );
                        
                        if (shouldDelete) {
                          keysToDelete.push(key);
                        }
                      });
                      
                      // Remove the records
                      keysToDelete.forEach(key => {
                        delete mockData[table][key];
                      });
                      
                      saveMockData();
                      resolve({ data: { count: keysToDelete.length }, error: null });
                    }
                  };
                },
                then: (resolve: (value: { data: any; error: null }) => void) => {
                  // Same implementation as above, just for a single eq filter
                  const keysToDelete: string[] = [];
                  
                  Object.entries(mockData[table]).forEach(([key, value]) => {
                    const shouldDelete = equalsFilter.every(filter => 
                      value[filter.column] === filter.value
                    );
                    
                    if (shouldDelete) {
                      keysToDelete.push(key);
                    }
                  });
                  
                  keysToDelete.forEach(key => {
                    delete mockData[table][key];
                  });
                  
                  saveMockData();
                  resolve({ data: { count: keysToDelete.length }, error: null });
                }
              };
            }
          };
        }
      };
    },
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'mock-user', email: 'user@example.com' } },
        error: null
      }),
      signInWithPassword: () => Promise.resolve({
        data: { user: { id: 'mock-user', email: 'user@example.com' }, session: { access_token: 'mock-token' } },
        error: null
      }),
      signInWithOAuth: ({ provider, options }: { provider: string; options?: { redirectTo?: string } }) => {
        console.log(`Mock OAuth sign-in with provider: ${provider}, redirectTo: ${options?.redirectTo}`);
        // In a mock environment, just return success
        return Promise.resolve({ 
          data: { provider, url: `https://example.com/oauth/${provider}` }, 
          error: null 
        });
      },
      updateUser: () => Promise.resolve({
        data: { user: { id: 'mock-user', email: 'user@example.com' } },
        error: null
      }),
      signUp: () => Promise.resolve({
        data: { user: { id: 'mock-user', email: 'user@example.com' }, session: null },
        error: null
      }),
      getSession: () => Promise.resolve({
        data: { session: { access_token: 'mock-token' } },
        error: null
      }),
      signOut: () => Promise.resolve({
        error: null
      }),
      // Add mock for resetPasswordForEmail
      resetPasswordForEmail: (email: string, options?: { redirectTo?: string }) => {
        console.log(`Mock: Password reset initiated for ${email}, redirecting to ${options?.redirectTo}`);
        // Simulate success in mock environment
        return Promise.resolve({ data: {}, error: null }); 
      }
    },
    // Add mock storage implementation
    storage: {
      // Store files in-memory
      _files: new Map<string, { data: File; url: string }>(),
      _buckets: new Set<string>(['user-documents', 'trip-documents']), // Default buckets
      
      // Method to list all buckets
      listBuckets: () => {
        // Convert Set to array of bucket objects
        const buckets = Array.from(
          // @ts-ignore - Private API
          this.storage._buckets
        ).map(name => ({ 
          name, 
          id: `mock-${name}`, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        return Promise.resolve({
          data: buckets,
          error: null
        });
      },
      
      // Method to create a new bucket
      createBucket: (name: string, options: { public: boolean }) => {
        console.log(`[Mock Storage] Creating bucket: ${name}, public: ${options.public}`);
        // @ts-ignore - Private API
        this.storage._buckets.add(name);
        
        return Promise.resolve({
          data: { name },
          error: null
        });
      },
      
      from: (bucket: string) => {
        return {
          upload: (path: string, file: File, options?: any) => {
            console.log(`[Mock Storage] Uploading ${file.name} to ${bucket}/${path}`);
            // Create blob URL for local access
            const url = URL.createObjectURL(file);
            // Store file with its path as key
            const key = `${bucket}/${path}`;
            // @ts-ignore - Private API
            this.storage._files.set(key, { data: file, url });
            
            return Promise.resolve({
              data: { path },
              error: null
            });
          },
          
          getPublicUrl: (path: string) => {
            console.log(`[Mock Storage] Getting public URL for ${bucket}/${path}`);
            const key = `${bucket}/${path}`;
            // @ts-ignore - Private API
            const fileEntry = this.storage._files.get(key);
            
            if (fileEntry) {
              return {
                data: {
                  publicUrl: fileEntry.url
                },
                error: null
              };
            }
            
            // For development, just use a fake URL if file not found
            return {
              data: {
                publicUrl: `mock://storage/${bucket}/${path}`
              },
              error: null
            };
          },
          
          remove: (paths: string[]) => {
            console.log(`[Mock Storage] Removing paths: ${paths.join(', ')} from ${bucket}`);
            
            paths.forEach(path => {
              const key = `${bucket}/${path}`;
              // @ts-ignore - Private API
              const fileEntry = this.storage._files.get(key);
              
              if (fileEntry) {
                // Revoke blob URL to prevent memory leaks
                URL.revokeObjectURL(fileEntry.url);
                // @ts-ignore - Private API
                this.storage._files.delete(key);
              }
            });
            
            return Promise.resolve({
              data: { count: paths.length },
              error: null
            });
          }
        };
      }
    }
  };
};

// Check if we're in development mode or if Supabase URL/key are not available
const isDevelopment = import.meta.env.MODE === 'development';
const missingSupabaseConfig = !cleanedSupabaseUrl || !cleanedSupabaseAnonKey;

// Add explicit logging
console.log(`[SupabaseClient] Missing config? ${missingSupabaseConfig}`);
console.log(`[SupabaseClient] Mode: ${import.meta.env.MODE}`);

// Prioritize REAL client if config is present, otherwise use mock (especially in dev without config)
export const supabase = missingSupabaseConfig
  ? (() => { 
      console.log("[SupabaseClient] Using MOCK client because config is missing.");
      return createMockClient(); 
    })()
  : (() => {
      console.log("[SupabaseClient] Using REAL client because config is present.");
      return createClient(cleanedSupabaseUrl, cleanedSupabaseAnonKey);
    })();

// Test the connection on client creation
(async () => {
  try {
    // Use a simple check without aggregate functions
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection successful');
    }
  } catch (err) {
    console.error('Supabase initialization error:', err);
  }
})();

export default supabase; 