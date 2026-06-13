import { createClient } from '@supabase/supabase-js';

// Define environment variables type
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Singleton instance
let supabaseInstance: any = null;

/**
 * Get Supabase client - implements singleton pattern to prevent multiple instances
 */
const getSupabaseClient = () => {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // For development, always use a mock client
  if (import.meta.env.DEV) {
    console.log("🔧 Development mode detected: Using mock Supabase client");
    supabaseInstance = createMockClient();
    return supabaseInstance;
  }

  // Get environment variables with multiple fallback sources
  const getEnvVar = (key: string, fallback: string = ''): string => {
    // Try Vite environment variables first
    const viteEnv = import.meta.env[key];
    if (viteEnv) return viteEnv;
    
    // Try window._env_ (loaded from env-config.js)
    const windowEnv = (window as any)?._env_?.[key];
    if (windowEnv) return windowEnv;
    
    // Try alternative key naming
    const altKey = key.replace('VITE_', 'REACT_APP_');
    const altEnv = (window as any)?._env_?.[altKey];
    if (altEnv) return altEnv;
    
    return fallback;
  };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

  // Clean the keys in case there are newlines or extra spaces
  const cleanedSupabaseUrl = supabaseUrl.trim();
  const cleanedSupabaseAnonKey = supabaseAnonKey.trim().replace(/\r?\n|\r/g, '');

  // Log connection details for debugging
  console.log('🔧 Supabase Configuration:');
  console.log('URL:', cleanedSupabaseUrl);
  console.log('Key Length:', cleanedSupabaseAnonKey.length);

  // Check if we have valid Supabase configuration
  const hasValidConfig = cleanedSupabaseUrl && cleanedSupabaseAnonKey;

  if (!hasValidConfig) {
    console.error("🚫 CRITICAL ERROR: Missing Supabase configuration!");
    console.error("Using mock client for development");
    
    // Create a basic mock client for development
    supabaseInstance = createMockClient();
    return supabaseInstance;
  }

  console.log("[SupabaseClient] Creating REAL client with URL:", cleanedSupabaseUrl.substring(0, 30) + "...");
  try {
    // Create the real Supabase client with enhanced auth options
    supabaseInstance = createClient(cleanedSupabaseUrl, cleanedSupabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
    
    console.log("✅ Supabase client created successfully");
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    console.warn("Falling back to mock client");
    supabaseInstance = createMockClient();
  }

  return supabaseInstance;
};

// Create a mock client for when Supabase is not configured
const createMockClient = () => {
  console.warn("⚠️ USING MOCK SUPABASE CLIENT - authentication will be simulated ⚠️");
  
  const mockData: { [key: string]: { [id: string]: any } } = {
    profiles: {},
    users: {}
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
  
  // Save data to localStorage
  const saveData = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(mockData));
  };

  // Mock client implementation
  return {
    auth: {
      signUp: async ({ email, password, options = {} }: { email: string; password: string; options?: any }) => {
        console.log("MOCK: Sign up", { email, options });
        
        // Check if user already exists
        const existingUser = Object.values(mockData.users).find((u: any) => u.email === email);
        if (existingUser) {
          return { 
            data: { user: null, session: null }, 
            error: { message: "User already exists", status: 400 } 
          };
        }
        
        // Create new user
        const userId = `mock-user-${Date.now()}`;
        const user = {
          id: userId,
          email,
          created_at: new Date().toISOString(),
          user_metadata: options?.data || {},
          app_metadata: {},
          aud: "authenticated"
        };
        
        // Store user
        mockData.users[userId] = user;
        
        // Create profile
        mockData.profiles[userId] = {
          id: userId,
          user_id: userId,
          full_name: options?.data?.full_name || "",
          nationality: options?.data?.nationality || "",
          residency: options?.data?.residency || "",
          created_at: new Date().toISOString(),
          subscription_tier: "free"
        };
        
        saveData();
        
        // Return success
        return {
          data: {
            user,
            session: {
              access_token: `mock-token-${userId}`,
              refresh_token: `mock-refresh-${userId}`,
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: "bearer",
              user
            }
          },
          error: null
        };
      },
      
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log("MOCK: Sign in with password", { email });
        
        // Find user
        const user = Object.values(mockData.users).find((u: any) => u.email === email);
        if (!user) {
          return { 
            data: { user: null, session: null }, 
            error: { message: "Invalid login credentials", status: 400 } 
          };
        }
        
        // Return success
        return {
          data: {
            user,
            session: {
              access_token: `mock-token-${user.id}`,
              refresh_token: `mock-refresh-${user.id}`,
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: "bearer",
              user
            }
          },
          error: null
        };
      },
      
      signOut: async () => {
        console.log("MOCK: Sign out");
        return { error: null };
      },
      
      getSession: async () => {
        console.log("MOCK: Get session");
        return { data: { session: null }, error: null };
      },
      
      onAuthStateChange: (callback: any) => {
        console.log("MOCK: Auth state change listener registered");
        return { data: { subscription: { unsubscribe: () => {} } }, error: null };
      },
      
      // Add other auth methods as needed
      signInWithOAuth: async (params: any) => {
        console.log("MOCK: Sign in with OAuth", params);
        return { error: { message: "OAuth not supported in mock mode", status: 400 } };
      }
    },
    from: (table: string) => ({
      select: () => ({
        eq: (field: string, value: any) => ({
          single: async () => {
            console.log(`MOCK: Select from ${table} where ${field} = ${value}`);
            const items = mockData[table] || {};
            const result = Object.values(items).find((item: any) => item[field] === value);
            return { data: result || null, error: null };
          },
          
          // Add other query methods as needed
          execute: async () => {
            console.log(`MOCK: Select from ${table} where ${field} = ${value}`);
            const items = mockData[table] || {};
            const results = Object.values(items).filter((item: any) => item[field] === value);
            return { data: results, error: null };
          }
        })
      }),
      
      insert: (data: any) => ({
        execute: async () => {
          console.log(`MOCK: Insert into ${table}`, data);
          const id = data.id || `mock-${table}-${Date.now()}`;
          if (!mockData[table]) mockData[table] = {};
          mockData[table][id] = { ...data, id };
          saveData();
          return { data: mockData[table][id], error: null };
        }
      }),
      
      update: (data: any) => ({
        eq: (field: string, value: any) => ({
          execute: async () => {
            console.log(`MOCK: Update ${table} where ${field} = ${value}`, data);
            const items = mockData[table] || {};
            const updatedItems: any[] = [];
            
            Object.keys(items).forEach(key => {
              if (items[key][field] === value) {
                items[key] = { ...items[key], ...data };
                updatedItems.push(items[key]);
              }
            });
            
            saveData();
            return { data: updatedItems, error: null };
          }
        })
      }),
      
      delete: () => ({
        eq: (field: string, value: any) => ({
          execute: async () => {
            console.log(`MOCK: Delete from ${table} where ${field} = ${value}`);
            const items = mockData[table] || {};
            const deletedItems: any[] = [];
            
            Object.keys(items).forEach(key => {
              if (items[key][field] === value) {
                deletedItems.push(items[key]);
                delete items[key];
              }
            });
            
            saveData();
            return { data: deletedItems, error: null };
          }
        })
      })
    })
  };
};

// Export the Supabase client
const supabase = getSupabaseClient();
export { supabase };
export default supabase; 